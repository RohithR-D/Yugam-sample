import { db } from "@workspace/db";
import {
  forgeWorkOrdersTable,
  forgeBOMTable,
  forgeBOMMaterialsTable,
  forgeQualityControlTable,
  stockMovementsTable,
  stockLedgerTable,
  inventoryCatalogTable,
} from "@workspace/db/schema";
import { eq, sql, and } from "drizzle-orm";

type TxOrDb = typeof db;

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
      console.log(`[AUTO:PRODUCTION] WO ${wo.woNumber}: no inventory-linked materials in BOM`);
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
        shortages.push({
          itemName: mat.itemName,
          required: requiredQty,
          available,
        });
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

      materialsConsumed++;
    }

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

    if (wo.status !== "Completed") return null;

    const completionRef = `${wo.woNumber}-FG`;
    const existingMovements = await tx.select().from(stockMovementsTable)
      .where(eq(stockMovementsTable.referenceNumber, completionRef));
    if (existingMovements.length > 0) {
      console.log(`[AUTO:PRODUCTION] WO ${wo.woNumber}: finished goods already added (idempotency guard)`);
      return null;
    }

    const productItemId = wo.productItemId;
    if (!productItemId) {
      console.log(`[AUTO:PRODUCTION] WO ${wo.woNumber}: no productItemId, skipping finished goods`);
      return { finishedGoodsAdded: 0, scrapLogged: false };
    }

    const producedQty = wo.producedQty;
    if (producedQty <= 0) {
      console.log(`[AUTO:PRODUCTION] WO ${wo.woNumber}: producedQty is 0, skipping`);
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
      movementDate: wo.endDate || new Date(),
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
        movementDate: wo.endDate || new Date(),
      });
      scrapLogged = true;
    }

    console.log(`[AUTO:PRODUCTION] WO ${wo.woNumber} completed → ${producedQty} finished goods added, scrap: ${wo.scrapQty}`);
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
    if (existingMovements.length > 0) {
      console.log(`[AUTO:PRODUCTION] QC #${qc.id}: adjustment already logged (idempotency guard)`);
      return null;
    }

    const [wo] = await tx.select().from(forgeWorkOrdersTable).where(eq(forgeWorkOrdersTable.id, qc.workOrderId));
    if (!wo) throw new Error(`Work order #${qc.workOrderId} not found for QC`);

    const productItemId = wo.productItemId;
    if (!productItemId) {
      console.log(`[AUTO:PRODUCTION] QC #${qc.id}: WO ${wo.woNumber} has no productItemId, skipping stock adjustment`);
      return { adjustmentLogged: false };
    }

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

    console.log(`[AUTO:PRODUCTION] QC #${qc.id} on WO ${qc.woNumber} → ${qc.rejectedQty} units rejected, stock adjusted`);
    return { adjustmentLogged: true };
  };

  if (externalTx) return await run(externalTx);
  return await db.transaction(async (tx) => run(tx as any));
}
