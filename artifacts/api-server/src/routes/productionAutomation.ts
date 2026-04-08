import { db } from "@workspace/db";
import {
  forgeWorkOrdersTable,
  forgeBOMTable,
  forgeBOMMaterialsTable,
  forgeBOMRoutingTable,
  forgeQualityControlTable,
  forgeWorkOrderUnitsTable,
  forgeProductionLogTable,
  forgeMaterialConsumptionTable,
  forgeWorkstationsTable,
  forgeDowntimeLogsTable,
  stockMovementsTable,
  stockLedgerTable,
  inventoryCatalogTable,
} from "@workspace/db/schema";
import { eq, sql, and } from "drizzle-orm";

type TxOrDb = typeof db;

export async function triggerWorkOrderCreated(
  woId: number,
  externalTx?: TxOrDb,
): Promise<{ unitsCreated: number; materialsTracked: number }> {
  const run = async (tx: TxOrDb) => {
    await tx.execute(sql`SELECT id FROM forge_work_orders WHERE id = ${woId} FOR UPDATE`);
    const [wo] = await tx.select().from(forgeWorkOrdersTable).where(eq(forgeWorkOrdersTable.id, woId));
    if (!wo) throw new Error("Work order not found");
    if (!wo.bomId) throw new Error("Work order must have a linked BOM");

    const existingUnits = await tx.select({ id: forgeWorkOrderUnitsTable.id }).from(forgeWorkOrderUnitsTable)
      .where(eq(forgeWorkOrderUnitsTable.workOrderId, woId)).limit(1);
    if (existingUnits.length > 0) {
      console.log(`[AUTO:PRODUCTION] WO #${woId}: units already created (idempotency guard)`);
      return { unitsCreated: 0, materialsTracked: 0 };
    }

    const [bom] = await tx.select().from(forgeBOMTable).where(eq(forgeBOMTable.id, wo.bomId));
    if (!bom) throw new Error(`BOM #${wo.bomId} not found`);

    const routing = await tx.select().from(forgeBOMRoutingTable)
      .where(eq(forgeBOMRoutingTable.bomId, wo.bomId))
      .orderBy(forgeBOMRoutingTable.sequenceNo);

    await tx.update(forgeWorkOrdersTable).set({
      totalRoutingSteps: routing.length,
      productName: bom.productName,
      productItemId: bom.productItemId,
    }).where(eq(forgeWorkOrdersTable.id, woId));

    let unitsCreated = 0;
    if (wo.trackIndividualUnits && wo.targetQty > 0) {
      for (let i = 1; i <= wo.targetQty; i++) {
        await tx.insert(forgeWorkOrderUnitsTable).values({
          workOrderId: woId,
          unitNumber: i,
          unitIdentifier: `${bom.productName} #${i}`,
          currentStepSequence: 0,
          status: "Queued",
        });
        unitsCreated++;
      }
    }

    const materials = await tx.select().from(forgeBOMMaterialsTable)
      .where(eq(forgeBOMMaterialsTable.bomId, wo.bomId));

    const outputQty = bom.outputQty || 1;
    let materialsTracked = 0;

    for (const mat of materials) {
      if (!mat.itemId) continue;
      const baseQty = (parseFloat(mat.qty?.toString() || "1") * wo.targetQty) / outputQty;
      const wastage = parseFloat(mat.wastagePercent?.toString() || "0");
      const bomEstimatedQty = baseQty * (1 + wastage / 100);

      const [catalogItem] = await tx.select().from(inventoryCatalogTable)
        .where(eq(inventoryCatalogTable.id, mat.itemId));

      await tx.insert(forgeMaterialConsumptionTable).values({
        workOrderId: woId,
        itemId: mat.itemId,
        itemName: mat.itemName,
        bomEstimatedQty: bomEstimatedQty.toFixed(3),
        uom: mat.uom,
        unitCost: catalogItem?.unitPrice?.toString() || "0",
      });
      materialsTracked++;
    }

    if (wo.startDate && routing.length > 0) {
      const totalMinutes = routing.reduce((sum, r) =>
        sum + (r.estimatedMinutes || 0) + (r.setupTimeMinutes || 0), 0);
      const totalProductionMinutes = totalMinutes * wo.targetQty;
      const workingDays = Math.ceil(totalProductionMinutes / (8 * 60));
      const expectedEnd = new Date(wo.startDate);
      expectedEnd.setDate(expectedEnd.getDate() + workingDays);
      await tx.update(forgeWorkOrdersTable).set({
        expectedEndDate: expectedEnd,
      }).where(eq(forgeWorkOrdersTable.id, woId));
    }

    console.log(`[AUTO:PRODUCTION] WO #${woId} created → ${unitsCreated} units, ${materialsTracked} material tracking records`);
    return { unitsCreated, materialsTracked };
  };

  if (externalTx) return await run(externalTx);
  return await db.transaction(async (tx) => run(tx as any));
}

export async function triggerUnitAdvance(
  unitId: number,
  operatorName?: string,
  externalTx?: TxOrDb,
): Promise<{ newStep: number; completed: boolean; qcPending: boolean }> {
  const run = async (tx: TxOrDb) => {
    await tx.execute(sql`SELECT id FROM forge_work_order_units WHERE id = ${unitId} FOR UPDATE`);
    const [unit] = await tx.select().from(forgeWorkOrderUnitsTable)
      .where(eq(forgeWorkOrderUnitsTable.id, unitId));
    if (!unit) throw new Error("Unit not found");
    if (unit.status === "Completed" || unit.status === "Scrapped") throw new Error("Unit is already finalized");

    await tx.execute(sql`SELECT id FROM forge_work_orders WHERE id = ${unit.workOrderId} FOR UPDATE`);
    const [wo] = await tx.select().from(forgeWorkOrdersTable)
      .where(eq(forgeWorkOrdersTable.id, unit.workOrderId));
    if (!wo) throw new Error("Work order not found");
    if (!wo.bomId) throw new Error("Work order has no BOM");

    const routing = await tx.select().from(forgeBOMRoutingTable)
      .where(eq(forgeBOMRoutingTable.bomId, wo.bomId))
      .orderBy(forgeBOMRoutingTable.sequenceNo);

    if (routing.length === 0) throw new Error("No routing steps defined");

    const currentSeq = unit.currentStepSequence;

    if (currentSeq > 0) {
      const currentStep = routing.find(r => r.sequenceNo === currentSeq);
      if (currentStep) {
        await tx.update(forgeProductionLogTable).set({
          status: "Completed",
          endTime: new Date(),
          actualMinutes: sql`EXTRACT(EPOCH FROM (NOW() - start_time)) / 60`,
          updatedAt: new Date(),
        }).where(and(
          eq(forgeProductionLogTable.unitId, unitId),
          eq(forgeProductionLogTable.routingStepId, currentStep.id),
          eq(forgeProductionLogTable.status, "In Progress"),
        ));

        if (currentStep.hasQcCheck) {
          await tx.update(forgeWorkOrderUnitsTable).set({
            status: "QC Pending",
            updatedAt: new Date(),
          }).where(eq(forgeWorkOrderUnitsTable.id, unitId));

          await tx.update(forgeProductionLogTable).set({
            qcStatus: "Pending",
            updatedAt: new Date(),
          }).where(and(
            eq(forgeProductionLogTable.unitId, unitId),
            eq(forgeProductionLogTable.routingStepId, currentStep.id),
          ));

          return { newStep: currentSeq, completed: false, qcPending: true };
        }
      }
    }

    const nextSeq = currentSeq + 1;
    const nextStep = routing.find(r => r.sequenceNo === nextSeq);

    if (!nextStep) {
      await tx.update(forgeWorkOrderUnitsTable).set({
        status: "Completed",
        completedAt: new Date(),
        currentStepSequence: currentSeq,
        updatedAt: new Date(),
      }).where(eq(forgeWorkOrderUnitsTable.id, unitId));

      await tx.update(forgeWorkOrdersTable).set({
        producedQty: sql`${forgeWorkOrdersTable.producedQty} + 1`,
      }).where(eq(forgeWorkOrdersTable.id, wo.id));

      await checkWorkOrderCompletion(wo.id, tx);

      return { newStep: currentSeq, completed: true, qcPending: false };
    }

    await tx.insert(forgeProductionLogTable).values({
      workOrderId: wo.id,
      unitId: unitId,
      routingStepId: nextStep.id,
      sequenceNo: nextStep.sequenceNo,
      workstationId: nextStep.workstationId,
      operatorName: operatorName || null,
      status: "In Progress",
      startTime: new Date(),
      qcRequired: nextStep.hasQcCheck,
      qcStatus: nextStep.hasQcCheck ? "Pending" : "Not Required",
    });

    await tx.update(forgeWorkOrderUnitsTable).set({
      currentStepSequence: nextSeq,
      currentStepName: nextStep.operationName,
      status: "In Progress",
      startedAt: unit.startedAt || new Date(),
      updatedAt: new Date(),
    }).where(eq(forgeWorkOrderUnitsTable.id, unitId));

    const allUnits = await tx.select().from(forgeWorkOrderUnitsTable)
      .where(eq(forgeWorkOrderUnitsTable.workOrderId, wo.id));
    const maxStep = Math.max(...allUnits.map(u => u.currentStepSequence));
    await tx.update(forgeWorkOrdersTable).set({
      currentRoutingStep: maxStep,
    }).where(eq(forgeWorkOrdersTable.id, wo.id));

    return { newStep: nextSeq, completed: false, qcPending: false };
  };

  if (externalTx) return await run(externalTx);
  return await db.transaction(async (tx) => run(tx as any));
}

export async function triggerQcLogged(
  qcId: number,
  externalTx?: TxOrDb,
): Promise<{ unitUpdated: boolean; advanced: boolean; scrapped: boolean }> {
  const run = async (tx: TxOrDb) => {
    const [qc] = await tx.select().from(forgeQualityControlTable)
      .where(eq(forgeQualityControlTable.id, qcId));
    if (!qc) throw new Error("QC record not found");

    if (qc.unitId) {
      await tx.execute(sql`SELECT id FROM forge_work_order_units WHERE id = ${qc.unitId} FOR UPDATE`);
    }
    await tx.execute(sql`SELECT id FROM forge_work_orders WHERE id = ${qc.workOrderId} FOR UPDATE`);
    const [wo] = await tx.select().from(forgeWorkOrdersTable)
      .where(eq(forgeWorkOrdersTable.id, qc.workOrderId));
    if (!wo) throw new Error("Work order not found");

    if (!qc.unitIdentifier) {
      return { unitUpdated: false, advanced: false, scrapped: false };
    }

    const units = await tx.select().from(forgeWorkOrderUnitsTable)
      .where(and(
        eq(forgeWorkOrderUnitsTable.workOrderId, qc.workOrderId),
        eq(forgeWorkOrderUnitsTable.unitIdentifier, qc.unitIdentifier),
      ));
    const unit = units[0];
    if (!unit) return { unitUpdated: false, advanced: false, scrapped: false };

    if (qc.routingStepId) {
      await tx.update(forgeProductionLogTable).set({
        qcStatus: qc.result === "Passed" || qc.result === "Conditional" ? "Passed" : "Failed",
        qcRecordId: qc.id,
        updatedAt: new Date(),
      }).where(and(
        eq(forgeProductionLogTable.unitId, unit.id),
        eq(forgeProductionLogTable.routingStepId, qc.routingStepId),
      ));
    }

    if (qc.result === "Passed" || qc.result === "Conditional") {
      await tx.update(forgeWorkOrderUnitsTable).set({
        status: "QC Passed",
        updatedAt: new Date(),
      }).where(eq(forgeWorkOrderUnitsTable.id, unit.id));

      const advanceResult = await triggerUnitAdvance(unit.id, undefined, tx);
      return { unitUpdated: true, advanced: true, scrapped: false };
    }

    if (qc.result === "Failed") {
      if (qc.reworkRequired) {
        const currentStep = unit.currentStepSequence;
        await tx.update(forgeWorkOrderUnitsTable).set({
          status: "Rework",
          updatedAt: new Date(),
        }).where(eq(forgeWorkOrderUnitsTable.id, unit.id));

        if (qc.routingStepId) {
          await tx.insert(forgeProductionLogTable).values({
            workOrderId: wo.id,
            unitId: unit.id,
            routingStepId: qc.routingStepId,
            sequenceNo: currentStep,
            workstationId: null,
            operatorName: null,
            status: "In Progress",
            startTime: new Date(),
            qcRequired: true,
            qcStatus: "Pending",
            notes: `Rework: ${qc.reworkInstructions || "See QC record"}`,
          });
        }

        return { unitUpdated: true, advanced: false, scrapped: false };
      } else {
        await tx.update(forgeWorkOrderUnitsTable).set({
          status: "Scrapped",
          completedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(forgeWorkOrderUnitsTable.id, unit.id));

        await tx.update(forgeWorkOrdersTable).set({
          scrapQty: sql`${forgeWorkOrdersTable.scrapQty} + 1`,
        }).where(eq(forgeWorkOrdersTable.id, wo.id));

        await checkWorkOrderCompletion(wo.id, tx);

        return { unitUpdated: true, advanced: false, scrapped: true };
      }
    }

    return { unitUpdated: false, advanced: false, scrapped: false };
  };

  if (externalTx) return await run(externalTx);
  return await db.transaction(async (tx) => run(tx as any));
}

async function checkWorkOrderCompletion(woId: number, tx: TxOrDb) {
  const units = await tx.select().from(forgeWorkOrderUnitsTable)
    .where(eq(forgeWorkOrderUnitsTable.workOrderId, woId));

  if (units.length === 0) return;

  const allDone = units.every(u => u.status === "Completed" || u.status === "Scrapped");
  if (!allDone) return;

  await triggerWorkOrderCompleted(woId, tx);
}

export async function triggerWorkOrderStarted(
  woId: number,
  externalTx?: TxOrDb,
): Promise<{ materialsConsumed: number; shortages: { itemName: string; required: number; available: number }[] } | null> {
  const run = async (tx: TxOrDb) => {
    const [wo] = await tx.select().from(forgeWorkOrdersTable).where(eq(forgeWorkOrdersTable.id, woId));
    if (!wo) throw new Error("Work order not found");

    if (wo.status !== "In Progress") return null;
    if (!wo.bomId) {
      console.log(`[AUTO:PRODUCTION] WO ${wo.woNumber}: no BOM linked, skipping material reservation`);
      return { materialsConsumed: 0, shortages: [] };
    }

    const existingMovements = await tx.select().from(stockMovementsTable)
      .where(eq(stockMovementsTable.referenceNumber, wo.woNumber));
    if (existingMovements.length > 0) {
      console.log(`[AUTO:PRODUCTION] WO ${wo.woNumber}: materials already consumed (idempotency guard)`);
      return null;
    }

    const [bom] = await tx.select().from(forgeBOMTable).where(eq(forgeBOMTable.id, wo.bomId));
    if (!bom) throw new Error(`BOM #${wo.bomId} not found for WO ${wo.woNumber}`);

    const materials = await tx.select().from(forgeBOMMaterialsTable).where(eq(forgeBOMMaterialsTable.bomId, wo.bomId));
    const inventoryMaterials = materials.filter((m) => m.itemId != null);

    if (inventoryMaterials.length === 0) {
      return { materialsConsumed: 0, shortages: [] };
    }

    const outputQty = bom.outputQty || 1;
    const locationId = wo.productionLocationId;
    const shortages: { itemName: string; required: number; available: number }[] = [];

    for (const mat of inventoryMaterials) {
      const baseQty = (parseFloat(mat.qty?.toString() || "1") * wo.targetQty) / outputQty;
      const wastage = parseFloat(mat.wastagePercent?.toString() || "0");
      const requiredQty = Math.ceil(baseQty * (1 + wastage / 100));

      let available = 0;
      if (locationId) {
        const ledgerRows = await tx.execute(
          sql`SELECT id, quantity FROM stock_ledger WHERE item_id = ${mat.itemId!} AND location_id = ${locationId} FOR UPDATE`
        );
        const ledger = (ledgerRows as any).rows?.[0] || (ledgerRows as any)[0];
        available = Number(ledger?.quantity ?? 0);
      } else {
        const [catalogItem] = await tx.select().from(inventoryCatalogTable).where(eq(inventoryCatalogTable.id, mat.itemId!));
        available = Number(catalogItem?.globalStock ?? 0);
      }

      if (available < requiredQty) {
        shortages.push({ itemName: mat.itemName, required: requiredQty, available });
      }
    }

    if (shortages.length > 0) {
      const shortageList = shortages.map((s) => `${s.itemName}: need ${s.required}, have ${s.available}`).join("; ");
      throw Object.assign(
        new Error(`Insufficient materials for WO ${wo.woNumber}: ${shortageList}`),
        { statusCode: 409, shortages }
      );
    }

    let materialsConsumed = 0;
    for (const mat of inventoryMaterials) {
      const baseQty = (parseFloat(mat.qty?.toString() || "1") * wo.targetQty) / outputQty;
      const wastage = parseFloat(mat.wastagePercent?.toString() || "0");
      const requiredQty = Math.ceil(baseQty * (1 + wastage / 100));

      if (locationId) {
        await tx.update(stockLedgerTable).set({
          quantity: sql`${stockLedgerTable.quantity} - ${requiredQty}`,
          updatedAt: new Date(),
        }).where(and(
          eq(stockLedgerTable.itemId, mat.itemId!),
          eq(stockLedgerTable.locationId, locationId),
        ));
      }

      await tx.update(inventoryCatalogTable).set({
        globalStock: sql`${inventoryCatalogTable.globalStock} - ${requiredQty}`,
      }).where(eq(inventoryCatalogTable.id, mat.itemId!));

      await tx.insert(stockMovementsTable).values({
        itemId: mat.itemId!,
        movementType: "Outward",
        quantity: requiredQty,
        fromLocationId: locationId || undefined,
        toLocationId: undefined,
        referenceNumber: wo.woNumber,
        notes: `BOM material consumed for WO ${wo.woNumber} (${wo.productName}): ${mat.itemName}`,
        performedBy: "System",
        movementDate: new Date(),
      });

      const consumptions = await tx.select().from(forgeMaterialConsumptionTable)
        .where(and(
          eq(forgeMaterialConsumptionTable.workOrderId, woId),
          eq(forgeMaterialConsumptionTable.itemId, mat.itemId!),
        ));
      if (consumptions.length > 0) {
        const unitCost = parseFloat(consumptions[0].unitCost?.toString() || "0");
        await tx.update(forgeMaterialConsumptionTable).set({
          actualQtyIssued: sql`${forgeMaterialConsumptionTable.actualQtyIssued} + ${requiredQty}`,
          actualQtyConsumed: sql`${forgeMaterialConsumptionTable.actualQtyConsumed} + ${requiredQty}`,
          issuedFromLocationId: locationId || undefined,
          issuedDate: new Date(),
          issuedBy: "System",
          totalCost: (requiredQty * unitCost).toFixed(2),
          updatedAt: new Date(),
        }).where(eq(forgeMaterialConsumptionTable.id, consumptions[0].id));
      }

      materialsConsumed++;
    }

    const totalMaterialsCost = await tx.select({
      total: sql<string>`COALESCE(SUM(total_cost), 0)`,
    }).from(forgeMaterialConsumptionTable).where(eq(forgeMaterialConsumptionTable.workOrderId, woId));

    await tx.update(forgeWorkOrdersTable).set({
      materialsCost: totalMaterialsCost[0]?.total || "0",
    }).where(eq(forgeWorkOrdersTable.id, woId));

    console.log(`[AUTO:PRODUCTION] WO ${wo.woNumber} started → ${materialsConsumed} material(s) consumed`);
    return { materialsConsumed, shortages: [] };
  };

  if (externalTx) return await run(externalTx);
  return await db.transaction(async (tx) => run(tx as any));
}

export async function triggerWorkOrderCompleted(
  woId: number,
  externalTx?: TxOrDb,
): Promise<{ finishedGoodsAdded: number; scrapLogged: boolean } | null> {
  const run = async (tx: TxOrDb) => {
    const [wo] = await tx.select().from(forgeWorkOrdersTable).where(eq(forgeWorkOrdersTable.id, woId));
    if (!wo) throw new Error("Work order not found");

    const completionRef = `${wo.woNumber}-FG`;
    const existingMovements = await tx.select().from(stockMovementsTable)
      .where(eq(stockMovementsTable.referenceNumber, completionRef));
    if (existingMovements.length > 0) {
      console.log(`[AUTO:PRODUCTION] WO ${wo.woNumber}: finished goods already added (idempotency guard)`);
      return null;
    }

    const materialsCostRows = await tx.select({
      total: sql<string>`COALESCE(SUM(total_cost), 0)`,
    }).from(forgeMaterialConsumptionTable).where(eq(forgeMaterialConsumptionTable.workOrderId, woId));
    const materialsCost = parseFloat(materialsCostRows[0]?.total || "0");

    const laborCostRows = await tx.execute(sql`
      SELECT COALESCE(SUM(
        COALESCE(pl.actual_minutes, 0)::numeric / 60.0 * COALESCE(ws.cost_per_hour, 0)
      ), 0) as total
      FROM forge_production_log pl
      LEFT JOIN forge_workstations ws ON ws.id = pl.workstation_id
      WHERE pl.work_order_id = ${woId} AND pl.status = 'Completed'
    `);
    const laborCost = parseFloat(((laborCostRows as any).rows?.[0] || (laborCostRows as any)[0])?.total || "0");

    const overheadCost = parseFloat(wo.overheadCost?.toString() || "0");
    const totalCost = materialsCost + laborCost + overheadCost;
    const producedQty = wo.producedQty || 0;
    const costPerUnit = producedQty > 0 ? totalCost / producedQty : 0;

    await tx.update(forgeWorkOrdersTable).set({
      status: "Completed",
      actualEndDate: new Date(),
      materialsCost: materialsCost.toFixed(2),
      laborCost: laborCost.toFixed(2),
      totalCost: totalCost.toFixed(2),
      costPerUnit: costPerUnit.toFixed(2),
    }).where(eq(forgeWorkOrdersTable.id, woId));

    const productItemId = wo.productItemId;
    if (!productItemId || producedQty <= 0) {
      console.log(`[AUTO:PRODUCTION] WO ${wo.woNumber}: no productItemId or producedQty=0, skipping FG`);
      return { finishedGoodsAdded: 0, scrapLogged: false };
    }

    const locationId = wo.productionLocationId;

    if (locationId) {
      const ledgerRows = await tx.execute(
        sql`SELECT id, quantity FROM stock_ledger WHERE item_id = ${productItemId} AND location_id = ${locationId} FOR UPDATE`
      );
      const ledger = (ledgerRows as any).rows?.[0] || (ledgerRows as any)[0];

      if (ledger) {
        await tx.update(stockLedgerTable).set({
          quantity: sql`${stockLedgerTable.quantity} + ${producedQty}`,
          updatedAt: new Date(),
        }).where(eq(stockLedgerTable.id, ledger.id));
      } else {
        await tx.insert(stockLedgerTable).values({
          itemId: productItemId,
          locationId,
          quantity: producedQty,
        });
      }
    }

    await tx.update(inventoryCatalogTable).set({
      globalStock: sql`${inventoryCatalogTable.globalStock} + ${producedQty}`,
    }).where(eq(inventoryCatalogTable.id, productItemId));

    await tx.insert(stockMovementsTable).values({
      itemId: productItemId,
      movementType: "Inward",
      quantity: producedQty,
      fromLocationId: undefined,
      toLocationId: locationId || undefined,
      referenceNumber: completionRef,
      notes: `Finished goods from WO ${wo.woNumber}: ${wo.productName} (${producedQty} units)`,
      performedBy: "System",
      movementDate: new Date(),
    });

    let scrapLogged = false;
    if (wo.scrapQty > 0) {
      await tx.insert(stockMovementsTable).values({
        itemId: productItemId,
        movementType: "Adjustment",
        quantity: wo.scrapQty,
        fromLocationId: locationId || undefined,
        toLocationId: undefined,
        referenceNumber: `${wo.woNumber}-SCRAP`,
        notes: `Scrap/wastage from WO ${wo.woNumber}: ${wo.productName} (${wo.scrapQty} units)`,
        performedBy: "System",
        movementDate: new Date(),
      });
      scrapLogged = true;
    }

    if (wo.projectId && wo.taskId) {
      try {
        const completionPct = Math.round((producedQty / wo.targetQty) * 100);
        await tx.execute(sql`UPDATE tasks SET status = 'In Progress' WHERE id = ${wo.taskId}`);
        console.log(`[AUTO:PRODUCTION] Task #${wo.taskId} updated to ${completionPct}% completion`);
      } catch (e) {
        console.log(`[AUTO:PRODUCTION] Could not update task: ${e}`);
      }
    }

    console.log(`[AUTO:PRODUCTION] WO ${wo.woNumber} completed → ${producedQty} FG added, cost: ${totalCost.toFixed(2)}`);
    return { finishedGoodsAdded: producedQty, scrapLogged };
  };

  if (externalTx) return await run(externalTx);
  return await db.transaction(async (tx) => run(tx as any));
}

export async function triggerQualityRejection(
  qcId: number,
  externalTx?: TxOrDb,
): Promise<{ adjustmentLogged: boolean } | null> {
  const run = async (tx: TxOrDb) => {
    const [qc] = await tx.select().from(forgeQualityControlTable).where(eq(forgeQualityControlTable.id, qcId));
    if (!qc) throw new Error("QC record not found");

    if (qc.rejectedQty <= 0) return null;

    const qcRef = `QC-${qc.id}-${qc.woNumber}`;
    const existingMovements = await tx.select().from(stockMovementsTable)
      .where(eq(stockMovementsTable.referenceNumber, qcRef));
    if (existingMovements.length > 0) return null;

    const [wo] = await tx.select().from(forgeWorkOrdersTable).where(eq(forgeWorkOrdersTable.id, qc.workOrderId));
    if (!wo) throw new Error(`Work order #${qc.workOrderId} not found for QC`);

    const productItemId = wo.productItemId;
    if (!productItemId) return { adjustmentLogged: false };

    const locationId = wo.productionLocationId;

    if (locationId) {
      const ledgerRows = await tx.execute(
        sql`SELECT id, quantity FROM stock_ledger WHERE item_id = ${productItemId} AND location_id = ${locationId} FOR UPDATE`
      );
      const ledger = (ledgerRows as any).rows?.[0] || (ledgerRows as any)[0];
      const available = Number(ledger?.quantity ?? 0);

      if (available < qc.rejectedQty) {
        throw new Error(`Insufficient stock to adjust for QC rejection: available ${available}, rejecting ${qc.rejectedQty}`);
      }

      if (ledger) {
        await tx.update(stockLedgerTable).set({
          quantity: sql`${stockLedgerTable.quantity} - ${qc.rejectedQty}`,
          updatedAt: new Date(),
        }).where(eq(stockLedgerTable.id, ledger.id));
      }
    } else {
      const [catalogItem] = await tx.select().from(inventoryCatalogTable).where(eq(inventoryCatalogTable.id, productItemId));
      const available = Number(catalogItem?.globalStock ?? 0);
      if (available < qc.rejectedQty) {
        throw new Error(`Insufficient stock to adjust for QC rejection: available ${available}, rejecting ${qc.rejectedQty}`);
      }
    }

    await tx.update(inventoryCatalogTable).set({
      globalStock: sql`${inventoryCatalogTable.globalStock} - ${qc.rejectedQty}`,
    }).where(eq(inventoryCatalogTable.id, productItemId));

    await tx.insert(stockMovementsTable).values({
      itemId: productItemId,
      movementType: "Adjustment",
      quantity: -qc.rejectedQty,
      fromLocationId: locationId || undefined,
      toLocationId: undefined,
      referenceNumber: qcRef,
      notes: `QC rejection on WO ${qc.woNumber}: ${qc.rejectedQty} units rejected (${qc.rejectionReason || "No reason"})`,
      performedBy: qc.inspectedBy || "System",
      movementDate: qc.inspectionDate || new Date(),
    });

    return { adjustmentLogged: true };
  };

  if (externalTx) return await run(externalTx);
  return await db.transaction(async (tx) => run(tx as any));
}

export async function triggerDowntimeLogged(
  downtimeId: number,
  externalTx?: TxOrDb,
): Promise<{ costImpact: number }> {
  const run = async (tx: TxOrDb) => {
    const [dt] = await tx.select().from(forgeDowntimeLogsTable)
      .where(eq(forgeDowntimeLogsTable.id, downtimeId));
    if (!dt) throw new Error("Downtime log not found");

    await tx.execute(sql`SELECT id FROM forge_workstations WHERE id = ${dt.workstationId} FOR UPDATE`);
    const [ws] = await tx.select().from(forgeWorkstationsTable)
      .where(eq(forgeWorkstationsTable.id, dt.workstationId));

    const costPerHour = parseFloat(ws?.costPerHour?.toString() || "0");
    const minutesLost = dt.totalMinutesLost || 0;
    const costImpact = (minutesLost / 60) * costPerHour;

    await tx.update(forgeDowntimeLogsTable).set({
      costImpact: costImpact.toFixed(2),
      category: dt.reason,
    }).where(eq(forgeDowntimeLogsTable.id, downtimeId));

    if (dt.workOrderId) {
      await tx.update(forgeWorkOrdersTable).set({
        overheadCost: sql`${forgeWorkOrdersTable.overheadCost} + ${costImpact.toFixed(2)}::numeric`,
        totalCost: sql`${forgeWorkOrdersTable.totalCost} + ${costImpact.toFixed(2)}::numeric`,
      }).where(eq(forgeWorkOrdersTable.id, dt.workOrderId));
    }

    if (!dt.endTime) {
      const breakdownReasons = ["Mechanical Failure", "Electrical Failure", "Power Outage"];
      const maintenanceReasons = ["Scheduled Maintenance"];
      let newStatus = "Breakdown";
      if (maintenanceReasons.includes(dt.reason)) newStatus = "Maintenance";
      else if (!breakdownReasons.includes(dt.reason)) newStatus = "Idle";

      await tx.update(forgeWorkstationsTable).set({
        currentStatus: newStatus,
      }).where(eq(forgeWorkstationsTable.id, dt.workstationId));
    } else {
      await tx.update(forgeWorkstationsTable).set({
        currentStatus: "Active",
      }).where(eq(forgeWorkstationsTable.id, dt.workstationId));
    }

    return { costImpact };
  };

  if (externalTx) return await run(externalTx);
  return await db.transaction(async (tx) => run(tx as any));
}
