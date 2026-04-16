import mongoose from "mongoose";
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

const withSession = <T extends mongoose.Query<any, any>>(query: T, session?: mongoose.ClientSession): T => {
  return session ? query.session(session) : query;
};

const sessionOptions = (session?: mongoose.ClientSession) => ({ session });

export async function triggerWorkOrderCreated(
  woId: number,
  session?: mongoose.ClientSession,
): Promise<{ unitsCreated: number; materialsTracked: number }> {
  const wo = await withSession(forgeWorkOrdersTable.findOne({ id: woId }), session).lean();
  if (!wo) throw new Error("Work order not found");
  if (!wo.bomId) throw new Error("Work order must have a linked BOM");

  const existingUnit = await withSession(forgeWorkOrderUnitsTable.findOne({ workOrderId: woId }), session).lean();
  if (existingUnit) {
    return { unitsCreated: 0, materialsTracked: 0 };
  }

  const bom = await withSession(forgeBOMTable.findOne({ id: wo.bomId }), session).lean();
  if (!bom) throw new Error(`BOM #${wo.bomId} not found`);

  const routing = await withSession(forgeBOMRoutingTable.find({ bomId: wo.bomId }).sort({ sequenceNo: 1 }), session).lean();

  await forgeWorkOrdersTable.findOneAndUpdate(
    { id: woId },
    { $set: { totalRoutingSteps: routing.length, productName: bom.productName, productItemId: bom.productItemId } },
    sessionOptions(session),
  );

  let unitsCreated = 0;
  if (wo.trackIndividualUnits && wo.targetQty > 0) {
    for (let i = 1; i <= wo.targetQty; i++) {
      const unitDoc: any = {
        workOrderId: woId,
        unitNumber: i,
        unitIdentifier: `${bom.productName} #${i}`,
        currentStepSequence: 0,
        status: "Queued",
      };
      await forgeWorkOrderUnitsTable.create([unitDoc], sessionOptions(session));
      unitsCreated++;
    }
  }

  const materials = await withSession(forgeBOMMaterialsTable.find({ bomId: wo.bomId }), session).lean();
  const outputQty = bom.outputQty || 1;
  let materialsTracked = 0;

  for (const mat of materials) {
    if (!mat.itemId) continue;
    const baseQty = (parseFloat(String(mat.qty || "1")) * wo.targetQty) / outputQty;
    const wastage = parseFloat(String(mat.wastagePercent || "0"));
    const bomEstimatedQty = baseQty * (1 + wastage / 100);
    const catalogItem = await withSession(inventoryCatalogTable.findOne({ id: mat.itemId }), session).lean();
    await forgeMaterialConsumptionTable.create([
      {
        workOrderId: woId,
        itemId: mat.itemId,
        itemName: mat.itemName,
        bomEstimatedQty: bomEstimatedQty.toFixed(3),
        uom: mat.uom,
        unitCost: String(catalogItem?.unitPrice || "0"),
      },
    ], sessionOptions(session));
    materialsTracked++;
  }

  if (wo.startDate && routing.length > 0) {
    const totalMinutes = routing.reduce((sum: number, r: any) =>
      sum + (r.estimatedMinutes || 0) + (r.setupTimeMinutes || 0), 0);
    const totalProductionMinutes = totalMinutes * wo.targetQty;
    const workingDays = Math.ceil(totalProductionMinutes / (8 * 60));
    const expectedEnd = new Date(wo.startDate);
    expectedEnd.setDate(expectedEnd.getDate() + workingDays);
    await forgeWorkOrdersTable.findOneAndUpdate(
      { id: woId },
      { $set: { expectedEndDate: expectedEnd } },
      sessionOptions(session),
    );
  }

  return { unitsCreated, materialsTracked };
}

export async function triggerUnitAdvance(
  unitId: number,
  operatorName?: string,
  session?: mongoose.ClientSession,
): Promise<{ newStep: number; completed: boolean; qcPending: boolean }> {
  const unit = await withSession(forgeWorkOrderUnitsTable.findOne({ id: unitId }), session).lean();
  if (!unit) throw new Error("Unit not found");
  if (unit.status === "Completed" || unit.status === "Scrapped") throw new Error("Unit is already finalized");

  const wo = await withSession(forgeWorkOrdersTable.findOne({ id: unit.workOrderId }), session).lean();
  if (!wo) throw new Error("Work order not found");
  if (!wo.bomId) throw new Error("Work order has no BOM");

  const routing = await withSession(forgeBOMRoutingTable.find({ bomId: wo.bomId }).sort({ sequenceNo: 1 }), session).lean();
  if (routing.length === 0) throw new Error("No routing steps defined");

  const currentSeq = unit.currentStepSequence;

  if (currentSeq > 0) {
    const currentStep = routing.find((r: any) => r.sequenceNo === currentSeq);
    if (currentStep) {
      await forgeProductionLogTable.findOneAndUpdate(
        { unitId, routingStepId: currentStep.id, status: "In Progress" },
        { $set: { status: "Completed", endTime: new Date(), updatedAt: new Date() } },
        sessionOptions(session),
      );

      if (currentStep.hasQcCheck) {
        await forgeWorkOrderUnitsTable.findOneAndUpdate(
          { id: unitId },
          { $set: { status: "QC Pending", updatedAt: new Date() } },
          sessionOptions(session),
        );
        await forgeProductionLogTable.findOneAndUpdate(
          { unitId, routingStepId: currentStep.id },
          { $set: { qcStatus: "Pending", updatedAt: new Date() } },
          sessionOptions(session),
        );
        return { newStep: currentSeq, completed: false, qcPending: true };
      }
    }
  }

  const nextSeq = currentSeq + 1;
  const nextStep = routing.find((r: any) => r.sequenceNo === nextSeq);

  if (!nextStep) {
    await forgeWorkOrderUnitsTable.findOneAndUpdate(
      { id: unitId },
      { $set: { status: "Completed", completedAt: new Date(), currentStepSequence: currentSeq, updatedAt: new Date() } },
      sessionOptions(session),
    );
    await forgeWorkOrdersTable.findOneAndUpdate(
      { id: wo.id },
      { $inc: { producedQty: 1 } },
      sessionOptions(session),
    );
    await checkWorkOrderCompletion(wo.id, session);
    return { newStep: currentSeq, completed: true, qcPending: false };
  }

  await forgeProductionLogTable.create([
    {
      workOrderId: wo.id,
      unitId,
      routingStepId: nextStep.id,
      sequenceNo: nextStep.sequenceNo,
      workstationId: nextStep.workstationId || null,
      operatorName: operatorName || null,
      status: "In Progress",
      startTime: new Date(),
      qcRequired: nextStep.hasQcCheck,
      qcStatus: nextStep.hasQcCheck ? "Pending" : "Not Required",
    },
  ], sessionOptions(session));

  await forgeWorkOrderUnitsTable.findOneAndUpdate(
    { id: unitId },
    {
      $set: {
        currentStepSequence: nextSeq,
        currentStepName: nextStep.operationName,
        status: "In Progress",
        startedAt: unit.startedAt || new Date(),
        updatedAt: new Date(),
      },
    },
    sessionOptions(session),
  );

  const allUnits = await withSession(forgeWorkOrderUnitsTable.find({ workOrderId: wo.id }), session).lean();
  const maxStep = Math.max(...allUnits.map((u: any) => u.currentStepSequence));
  await forgeWorkOrdersTable.findOneAndUpdate(
    { id: wo.id },
    { $set: { currentRoutingStep: maxStep } },
    sessionOptions(session),
  );

  return { newStep: nextSeq, completed: false, qcPending: false };
}

export async function triggerQcLogged(
  qcId: number,
  session?: mongoose.ClientSession,
): Promise<{ unitUpdated: boolean; advanced: boolean; scrapped: boolean }> {
  const qc = await withSession(forgeQualityControlTable.findOne({ id: qcId }), session).lean();
  if (!qc) throw new Error("QC record not found");

  const wo = await withSession(forgeWorkOrdersTable.findOne({ id: qc.workOrderId }), session).lean();
  if (!wo) throw new Error("Work order not found");

  if (!qc.unitIdentifier) return { unitUpdated: false, advanced: false, scrapped: false };

  const unit = await withSession(
    forgeWorkOrderUnitsTable.findOne({ workOrderId: qc.workOrderId, unitIdentifier: qc.unitIdentifier }),
    session,
  ).lean();
  if (!unit) return { unitUpdated: false, advanced: false, scrapped: false };

  if (qc.routingStepId) {
    await forgeProductionLogTable.findOneAndUpdate(
      { unitId: unit.id, routingStepId: qc.routingStepId },
      {
        $set: {
          qcStatus: qc.result === "Passed" || qc.result === "Conditional" ? "Passed" : "Failed",
          qcRecordId: qc.id,
          updatedAt: new Date(),
        },
      },
      sessionOptions(session),
    );
  }

  if (qc.result === "Passed" || qc.result === "Conditional") {
    await forgeWorkOrderUnitsTable.findOneAndUpdate(
      { id: unit.id },
      { $set: { status: "QC Passed", updatedAt: new Date() } },
      sessionOptions(session),
    );
    await triggerUnitAdvance(unit.id, undefined, session);
    return { unitUpdated: true, advanced: true, scrapped: false };
  }

  if (qc.result === "Failed") {
    if (qc.reworkRequired) {
      const currentStep = unit.currentStepSequence;
      await forgeWorkOrderUnitsTable.findOneAndUpdate(
        { id: unit.id },
        { $set: { status: "Rework", updatedAt: new Date() } },
        sessionOptions(session),
      );
      if (qc.routingStepId) {
        await forgeProductionLogTable.create([
          {
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
          },
        ], sessionOptions(session));
      }
      return { unitUpdated: true, advanced: false, scrapped: false };
    } else {
      await forgeWorkOrderUnitsTable.findOneAndUpdate(
        { id: unit.id },
        { $set: { status: "Scrapped", completedAt: new Date(), updatedAt: new Date() } },
        sessionOptions(session),
      );
      await forgeWorkOrdersTable.findOneAndUpdate(
        { id: wo.id },
        { $inc: { scrapQty: 1 } },
        sessionOptions(session),
      );
      await checkWorkOrderCompletion(wo.id, session);
      return { unitUpdated: true, advanced: false, scrapped: true };
    }
  }

  return { unitUpdated: false, advanced: false, scrapped: false };
}

async function checkWorkOrderCompletion(woId: number, session?: mongoose.ClientSession) {
  const units = await withSession(forgeWorkOrderUnitsTable.find({ workOrderId: woId }), session).lean();
  if (units.length === 0) return;
  const allDone = units.every((u: any) => u.status === "Completed" || u.status === "Scrapped");
  if (!allDone) return;
  await triggerWorkOrderCompleted(woId, session);
}

export async function triggerWorkOrderStarted(
  woId: number,
  session?: mongoose.ClientSession,
): Promise<{ materialsConsumed: number; shortages: { itemName: string; required: number; available: number }[] } | null> {
  const wo = await withSession(forgeWorkOrdersTable.findOne({ id: woId }), session).lean();
  if (!wo) throw new Error("Work order not found");
  if (wo.status !== "In Progress") return null;
  if (!wo.bomId) {
    return { materialsConsumed: 0, shortages: [] };
  }

  const existingMovement = await withSession(stockMovementsTable.findOne({ referenceNumber: wo.woNumber }), session).lean();
  if (existingMovement) {
    return null;
  }

  const bom = await withSession(forgeBOMTable.findOne({ id: wo.bomId }), session).lean();
  if (!bom) throw new Error(`BOM #${wo.bomId} not found for WO ${wo.woNumber}`);

  const materials = await withSession(forgeBOMMaterialsTable.find({ bomId: wo.bomId }), session).lean();
  const inventoryMaterials = materials.filter((m: any) => m.itemId != null);
  if (inventoryMaterials.length === 0) return { materialsConsumed: 0, shortages: [] };

  const outputQty = bom.outputQty || 1;
  const locationId = wo.productionLocationId;
  const shortages: { itemName: string; required: number; available: number }[] = [];

  for (const mat of inventoryMaterials) {
    const baseQty = (parseFloat(String(mat.qty || "1")) * wo.targetQty) / outputQty;
    const wastage = parseFloat(String(mat.wastagePercent || "0"));
    const requiredQty = Math.ceil(baseQty * (1 + wastage / 100));

    let available = 0;
    if (locationId) {
      const ledger = await withSession(stockLedgerTable.findOne({ itemId: mat.itemId, locationId }), session).lean();
      available = Number(ledger?.quantity ?? 0);
    } else {
      const catalogItem = await withSession(inventoryCatalogTable.findOne({ id: mat.itemId }), session).lean();
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
      { statusCode: 409, shortages },
    );
  }

  let materialsConsumed = 0;
  for (const mat of inventoryMaterials) {
    const baseQty = (parseFloat(String(mat.qty || "1")) * wo.targetQty) / outputQty;
    const wastage = parseFloat(String(mat.wastagePercent || "0"));
    const requiredQty = Math.ceil(baseQty * (1 + wastage / 100));

    if (locationId) {
      await stockLedgerTable.findOneAndUpdate(
        { itemId: mat.itemId, locationId },
        { $inc: { quantity: -requiredQty }, $set: { updatedAt: new Date() } },
        sessionOptions(session),
      );
    }

    await inventoryCatalogTable.findOneAndUpdate(
      { id: mat.itemId },
      { $inc: { globalStock: -requiredQty } },
      sessionOptions(session),
    );

    await stockMovementsTable.create([
      {
        itemId: mat.itemId,
        movementType: "Outward",
        quantity: requiredQty,
        fromLocationId: locationId || undefined,
        referenceNumber: wo.woNumber,
        notes: `BOM material consumed for WO ${wo.woNumber} (${wo.productName}): ${mat.itemName}`,
        performedBy: "System",
        movementDate: new Date(),
      },
    ], sessionOptions(session));

    const consumption = await withSession(
      forgeMaterialConsumptionTable.findOne({ workOrderId: woId, itemId: mat.itemId }),
      session,
    ).lean();
    if (consumption) {
      const unitCost = parseFloat(String(consumption.unitCost || "0"));
      const newIssued = parseFloat(String(consumption.actualQtyIssued || "0")) + requiredQty;
      const newConsumed = parseFloat(String(consumption.actualQtyConsumed || "0")) + requiredQty;
      await forgeMaterialConsumptionTable.findOneAndUpdate(
        { id: consumption.id },
        {
          $set: {
            actualQtyIssued: newIssued.toFixed(3),
            actualQtyConsumed: newConsumed.toFixed(3),
            issuedFromLocationId: locationId || undefined,
            issuedDate: new Date(),
            issuedBy: "System",
            totalCost: (requiredQty * unitCost).toFixed(2),
            updatedAt: new Date(),
          },
        },
        sessionOptions(session),
      );
    }
    materialsConsumed++;
  }

  const consumptionAgg = await forgeMaterialConsumptionTable.aggregate([
    { $match: { workOrderId: woId } },
    { $group: { _id: null, total: { $sum: { $toDouble: "$totalCost" } } } },
  ]).session(session);
  const materialsCostTotal = consumptionAgg[0]?.total || 0;
  await forgeWorkOrdersTable.findOneAndUpdate(
    { id: woId },
    { $set: { materialsCost: materialsCostTotal.toFixed(2) } },
    sessionOptions(session),
  );

  console.log(`[AUTO:PRODUCTION] WO ${wo.woNumber} started ? ${materialsConsumed} material(s) consumed`);
  return { materialsConsumed, shortages: [] };
}

export async function triggerWorkOrderCompleted(
  woId: number,
  session?: mongoose.ClientSession,
): Promise<{ finishedGoodsAdded: number; scrapLogged: boolean } | null> {
  const wo = await withSession(forgeWorkOrdersTable.findOne({ id: woId }), session).lean();
  if (!wo) throw new Error("Work order not found");

  const completionRef = `${wo.woNumber}-FG`;
  const existingMovement = await withSession(stockMovementsTable.findOne({ referenceNumber: completionRef }), session).lean();
  if (existingMovement) {
    console.log(`[AUTO:PRODUCTION] WO ${wo.woNumber}: finished goods already added (idempotency guard)`);
    return null;
  }

  const consumptionAgg = await forgeMaterialConsumptionTable.aggregate([
    { $match: { workOrderId: woId } },
    { $group: { _id: null, total: { $sum: { $toDouble: "$totalCost" } } } },
  ]).session(session);
  const materialsCost = consumptionAgg[0]?.total || 0;

  const logAgg = await forgeProductionLogTable.aggregate([
    { $match: { workOrderId: woId, status: "Completed" } },
    {
      $lookup: {
        from: "forgeworkstations",
        let: { wsId: "$workstationId" },
        pipeline: [{ $match: { $expr: { $eq: ["$id", "$$wsId"] } } }],
        as: "ws",
      },
    },
    { $unwind: { path: "$ws", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $multiply: [
              { $divide: [{ $ifNull: ["$actualMinutes", 0] }, 60] },
              { $ifNull: ["$ws.costPerHour", 0] },
            ],
          },
        },
      },
    },
  ]).session(session);
  const laborCost = logAgg[0]?.total || 0;

  const overheadCost = parseFloat(String(wo.overheadCost || "0"));
  const totalCost = materialsCost + laborCost + overheadCost;
  const producedQty = wo.producedQty || 0;
  const costPerUnit = producedQty > 0 ? totalCost / producedQty : 0;

  await forgeWorkOrdersTable.findOneAndUpdate(
    { id: woId },
    {
      $set: {
        status: "Completed",
        actualEndDate: new Date(),
        materialsCost: materialsCost.toFixed(2),
        laborCost: laborCost.toFixed(2),
        totalCost: totalCost.toFixed(2),
        costPerUnit: costPerUnit.toFixed(2),
      },
    },
    sessionOptions(session),
  );

  const productItemId = wo.productItemId;
  if (!productItemId || producedQty <= 0) {
    console.log(`[AUTO:PRODUCTION] WO ${wo.woNumber}: no productItemId or producedQty=0, skipping FG`);
    return { finishedGoodsAdded: 0, scrapLogged: false };
  }

  const locationId = wo.productionLocationId;

  if (locationId) {
    const ledger = await withSession(stockLedgerTable.findOne({ itemId: productItemId, locationId }), session).lean();
    if (ledger) {
      await stockLedgerTable.findOneAndUpdate(
        { id: ledger.id },
        { $inc: { quantity: producedQty }, $set: { updatedAt: new Date() } },
        sessionOptions(session),
      );
    } else {
      await stockLedgerTable.create([
        { itemId: productItemId, locationId, quantity: producedQty },
      ], sessionOptions(session));
    }
  }

  await inventoryCatalogTable.findOneAndUpdate(
    { id: productItemId },
    { $inc: { globalStock: producedQty } },
    sessionOptions(session),
  );

  await stockMovementsTable.create([
    {
      itemId: productItemId,
      movementType: "Inward",
      quantity: producedQty,
      toLocationId: locationId || undefined,
      referenceNumber: completionRef,
      notes: `Finished goods from WO ${wo.woNumber}: ${wo.productName} (${producedQty} units)`,
      performedBy: "System",
      movementDate: new Date(),
    },
  ], sessionOptions(session));

  let scrapLogged = false;
  if (wo.scrapQty > 0) {
    await stockMovementsTable.create([
      {
        itemId: productItemId,
        movementType: "Adjustment",
        quantity: wo.scrapQty,
        fromLocationId: locationId || undefined,
        referenceNumber: `${wo.woNumber}-SCRAP`,
        notes: `Scrap/wastage from WO ${wo.woNumber}: ${wo.productName} (${wo.scrapQty} units)`,
        performedBy: "System",
        movementDate: new Date(),
      },
    ], sessionOptions(session));
    scrapLogged = true;
  }

  if (wo.projectId && wo.taskId) {
    try {
      const { default: Tasks } = await import("@workspace/db/schema").then((m) => ({ default: m.tasksTable }));
      await Tasks.findOneAndUpdate(
        { id: wo.taskId },
        { $set: { status: "In Progress" } },
        sessionOptions(session),
      );
      console.log(`[AUTO:PRODUCTION] Task #${wo.taskId} updated to In Progress`);
    } catch (e) {
      console.log(`[AUTO:PRODUCTION] Could not update task: ${e}`);
    }
  }

  console.log(`[AUTO:PRODUCTION] WO ${wo.woNumber} completed ? ${producedQty} FG added, cost: ${totalCost.toFixed(2)}`);
  return { finishedGoodsAdded: producedQty, scrapLogged };
}

export async function triggerQualityRejection(
  qcId: number,
  session?: mongoose.ClientSession,
): Promise<{ adjustmentLogged: boolean } | null> {
  const qc = await withSession(forgeQualityControlTable.findOne({ id: qcId }), session).lean();
  if (!qc) throw new Error("QC record not found");

  if (qc.rejectedQty <= 0) return null;

  const qcRef = `QC-${qc.id}-${qc.woNumber}`;
  const existingMovement = await withSession(stockMovementsTable.findOne({ referenceNumber: qcRef }), session).lean();
  if (existingMovement) return null;

  const wo = await withSession(forgeWorkOrdersTable.findOne({ id: qc.workOrderId }), session).lean();
  if (!wo) throw new Error(`Work order #${qc.workOrderId} not found for QC`);

  const productItemId = wo.productItemId;
  if (!productItemId) return { adjustmentLogged: false };

  const locationId = wo.productionLocationId;

  if (locationId) {
    const ledger = await withSession(stockLedgerTable.findOne({ itemId: productItemId, locationId }), session).lean();
    const available = Number(ledger?.quantity ?? 0);
    if (available < qc.rejectedQty) {
      throw new Error(`Insufficient stock to adjust for QC rejection: available ${available}, rejecting ${qc.rejectedQty}`);
    }
    if (ledger) {
      await stockLedgerTable.findOneAndUpdate(
        { id: ledger.id },
        { $inc: { quantity: -qc.rejectedQty }, $set: { updatedAt: new Date() } },
        sessionOptions(session),
      );
    }
  } else {
    const catalogItem = await withSession(inventoryCatalogTable.findOne({ id: productItemId }), session).lean();
    const available = Number(catalogItem?.globalStock ?? 0);
    if (available < qc.rejectedQty) {
      throw new Error(`Insufficient stock to adjust for QC rejection: available ${available}, rejecting ${qc.rejectedQty}`);
    }
  }

  await inventoryCatalogTable.findOneAndUpdate(
    { id: productItemId },
    { $inc: { globalStock: -qc.rejectedQty } },
    sessionOptions(session),
  );

  await stockMovementsTable.create([
    {
      itemId: productItemId,
      movementType: "Adjustment",
      quantity: -qc.rejectedQty,
      fromLocationId: locationId || undefined,
      referenceNumber: qcRef,
      notes: `QC rejection on WO ${qc.woNumber}: ${qc.rejectedQty} units rejected (${qc.rejectionReason || "No reason"})`,
      performedBy: qc.inspectedBy || "System",
      movementDate: qc.inspectionDate || new Date(),
    },
  ], sessionOptions(session));

  return { adjustmentLogged: true };
}

export async function triggerDowntimeLogged(
  downtimeId: number,
  session?: mongoose.ClientSession,
): Promise<{ costImpact: number }> {
  const dt = await withSession(forgeDowntimeLogsTable.findOne({ id: downtimeId }), session).lean();
  if (!dt) throw new Error("Downtime log not found");

  const ws = await withSession(forgeWorkstationsTable.findOne({ id: dt.workstationId }), session).lean();
  const costPerHour = parseFloat(String(ws?.costPerHour || "0"));
  const minutesLost = dt.totalMinutesLost || 0;
  const costImpact = (minutesLost / 60) * costPerHour;

  await forgeDowntimeLogsTable.findOneAndUpdate(
    { id: downtimeId },
    { $set: { costImpact: costImpact.toFixed(2), category: dt.reason } },
    sessionOptions(session),
  );

  if (dt.workOrderId) {
    await forgeWorkOrdersTable.findOneAndUpdate(
      { id: dt.workOrderId },
      { $inc: { overheadCost: costImpact, totalCost: costImpact } },
      sessionOptions(session),
    );
  }

  if (!dt.endTime) {
    const breakdownReasons = ["Mechanical Failure", "Electrical Failure", "Power Outage"];
    const maintenanceReasons = ["Scheduled Maintenance"];
    let newStatus = "Breakdown";
    if (maintenanceReasons.includes(dt.reason)) newStatus = "Maintenance";
    else if (!breakdownReasons.includes(dt.reason)) newStatus = "Idle";
    await forgeWorkstationsTable.findOneAndUpdate(
      { id: dt.workstationId },
      { $set: { currentStatus: newStatus } },
      sessionOptions(session),
    );
  } else {
    await forgeWorkstationsTable.findOneAndUpdate(
      { id: dt.workstationId },
      { $set: { currentStatus: "Active" } },
      sessionOptions(session),
    );
  }

  return { costImpact };
}
