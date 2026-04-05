import { db } from "@workspace/db";
import {
  deliveryChallansTable,
  deliveryChallanItemsTable,
  salesOrdersTable,
  salesOrderItemsTable,
  salesReturnsTable,
  salesReturnItemsTable,
  stockMovementsTable,
  stockLedgerTable,
  inventoryCatalogTable,
} from "@workspace/db/schema";
import { eq, sql, and } from "drizzle-orm";

type TxOrDb = typeof db;

export async function triggerChallanDispatched(
  challanId: number,
  externalTx?: TxOrDb,
): Promise<{
  stockUpdates: number;
  soUpdated: boolean;
  lowStockWarnings: string[];
} | null> {
  const run = async (tx: TxOrDb) => {
    const [challan] = await tx.select().from(deliveryChallansTable).where(eq(deliveryChallansTable.id, challanId));
    if (!challan) throw new Error("Challan not found");
    if (challan.status !== "Dispatched") return null;

    const existingMovements = await tx.select().from(stockMovementsTable)
      .where(eq(stockMovementsTable.referenceNumber, challan.challanNumber));
    if (existingMovements.length > 0) {
      console.log(`[AUTO:INVENTORY] Challan ${challan.challanNumber}: already processed (idempotency guard)`);
      return null;
    }

    const items = await tx.select().from(deliveryChallanItemsTable).where(eq(deliveryChallanItemsTable.challanId, challanId));
    const inventoryItems = items.filter((item) => item.itemId != null);

    if (inventoryItems.length === 0) {
      console.log(`[AUTO:INVENTORY] Challan ${challan.challanNumber}: no inventory items to dispatch`);
    }

    const locationId = challan.dispatchLocationId;
    let stockUpdates = 0;
    const lowStockWarnings: string[] = [];

    for (const item of inventoryItems) {
      const qty = Math.round(parseFloat(item.dispatchedQty?.toString() || "0"));
      if (qty <= 0) continue;

      if (locationId) {
        const ledgerRows = await tx.execute(
          sql`SELECT id, quantity FROM stock_ledger WHERE item_id = ${item.itemId!} AND location_id = ${locationId} FOR UPDATE`
        );
        const ledger = (ledgerRows as any).rows?.[0] || (ledgerRows as any)[0];
        const available = ledger?.quantity ?? 0;

        if (available < qty) {
          const [catalogItem] = await tx.select().from(inventoryCatalogTable).where(eq(inventoryCatalogTable.id, item.itemId!));
          throw new Error(`Insufficient stock for ${catalogItem?.name || `item #${item.itemId}`}. Available: ${available}, Requested: ${qty}`);
        }

        await tx.update(stockLedgerTable).set({
          quantity: sql`${stockLedgerTable.quantity} - ${qty}`,
          updatedAt: new Date(),
        }).where(and(
          eq(stockLedgerTable.itemId, item.itemId!),
          eq(stockLedgerTable.locationId, locationId),
        ));
      } else {
        const [catalogItem] = await tx.select().from(inventoryCatalogTable).where(eq(inventoryCatalogTable.id, item.itemId!));
        if (catalogItem && catalogItem.globalStock < qty) {
          throw new Error(`Insufficient stock for ${catalogItem.name}. Available (global): ${catalogItem.globalStock}, Requested: ${qty}`);
        }
      }

      await tx.update(inventoryCatalogTable).set({
        globalStock: sql`${inventoryCatalogTable.globalStock} - ${qty}`,
      }).where(eq(inventoryCatalogTable.id, item.itemId!));

      await tx.insert(stockMovementsTable).values({
        itemId: item.itemId!,
        movementType: "Outward",
        quantity: qty,
        fromLocationId: locationId || undefined,
        toLocationId: undefined,
        referenceNumber: challan.challanNumber,
        notes: `Dispatched via ${challan.challanNumber} to ${challan.clientName}`,
        performedBy: `User #${challan.createdBy}`,
        movementDate: new Date(),
      });

      stockUpdates++;

      const [updatedItem] = await tx.select().from(inventoryCatalogTable).where(eq(inventoryCatalogTable.id, item.itemId!));
      if (updatedItem && updatedItem.globalStock <= updatedItem.reorderLevel) {
        const warning = `LOW STOCK: ${updatedItem.name} (SKU: ${updatedItem.sku}) — Stock: ${updatedItem.globalStock}, Reorder Level: ${updatedItem.reorderLevel}`;
        lowStockWarnings.push(warning);
        console.warn(`[AUTO:INVENTORY] ${warning}`);
      }
    }

    let soUpdated = false;
    if (challan.sourceSalesOrderId) {
      soUpdated = await updateSalesOrderDelivery(tx, challan.sourceSalesOrderId, items);
    }

    console.log(`[AUTO:INVENTORY] Challan ${challan.challanNumber} dispatched → ${stockUpdates} stock update(s), SO updated: ${soUpdated}`);
    return { stockUpdates, soUpdated, lowStockWarnings };
  };

  if (externalTx) {
    return await run(externalTx);
  }
  return await db.transaction(async (tx) => run(tx as any));
}

async function updateSalesOrderDelivery(
  tx: TxOrDb,
  salesOrderId: number,
  challanItems: any[],
): Promise<boolean> {
  const soItems = await tx.select().from(salesOrderItemsTable).where(eq(salesOrderItemsTable.salesOrderId, salesOrderId));
  if (soItems.length === 0) return false;

  for (const challanItem of challanItems) {
    if (!challanItem.soItemId) continue;
    const qty = parseFloat(challanItem.dispatchedQty?.toString() || "0");
    if (qty <= 0) continue;

    await tx.update(salesOrderItemsTable).set({
      deliveredQty: sql`COALESCE(${salesOrderItemsTable.deliveredQty}, 0) + ${qty}`,
    }).where(eq(salesOrderItemsTable.id, challanItem.soItemId));
  }

  const updatedSoItems = await tx.select().from(salesOrderItemsTable).where(eq(salesOrderItemsTable.salesOrderId, salesOrderId));

  let allDelivered = true;
  let anyDelivered = false;

  for (const soItem of updatedSoItems) {
    const ordered = parseFloat(soItem.quantity?.toString() || "0");
    const delivered = parseFloat(soItem.deliveredQty?.toString() || "0");
    if (delivered >= ordered) {
      anyDelivered = true;
    } else if (delivered > 0) {
      anyDelivered = true;
      allDelivered = false;
    } else {
      allDelivered = false;
    }
  }

  let deliveryStatus: string;
  if (allDelivered && anyDelivered) {
    deliveryStatus = "Delivered";
  } else if (anyDelivered) {
    deliveryStatus = "Partial";
  } else {
    deliveryStatus = "Pending";
  }

  await tx.update(salesOrdersTable).set({
    deliveryStatus,
    updatedAt: new Date(),
  }).where(eq(salesOrdersTable.id, salesOrderId));

  return true;
}

export async function triggerReturnRestock(
  returnId: number,
  externalTx?: TxOrDb,
): Promise<{ stockUpdates: number } | null> {
  const run = async (tx: TxOrDb) => {
    const [ret] = await tx.select().from(salesReturnsTable).where(eq(salesReturnsTable.id, returnId));
    if (!ret) throw new Error("Sales return not found");

    if (ret.status !== "Goods Received") return null;
    if (!ret.restock) return null;

    const refNum = ret.returnNumber || `RTN-${returnId}`;
    const existingMovements = await tx.select().from(stockMovementsTable)
      .where(eq(stockMovementsTable.referenceNumber, refNum));
    if (existingMovements.length > 0) {
      console.log(`[AUTO:INVENTORY] Return ${refNum}: already processed (idempotency guard)`);
      return null;
    }

    const locationId = ret.restockLocationId;
    const items = await tx.select().from(salesReturnItemsTable).where(eq(salesReturnItemsTable.returnId, returnId));
    const inventoryItems = items.filter((item) => item.itemId != null);

    if (inventoryItems.length === 0) {
      console.log(`[AUTO:INVENTORY] Return ${ret.returnNumber}: no inventory items to restock`);
      return { stockUpdates: 0 };
    }

    let stockUpdates = 0;

    for (const item of inventoryItems) {
      const qty = Math.round(parseFloat(item.returnedQty?.toString() || "0"));
      if (qty <= 0) continue;

      if (locationId) {
        const ledgerRows = await tx.execute(
          sql`SELECT id, quantity FROM stock_ledger WHERE item_id = ${item.itemId!} AND location_id = ${locationId} FOR UPDATE`
        );
        const ledger = (ledgerRows as any).rows?.[0] || (ledgerRows as any)[0];

        if (ledger) {
          await tx.update(stockLedgerTable).set({
            quantity: sql`${stockLedgerTable.quantity} + ${qty}`,
            updatedAt: new Date(),
          }).where(eq(stockLedgerTable.id, ledger.id));
        } else {
          await tx.insert(stockLedgerTable).values({
            itemId: item.itemId!,
            locationId,
            quantity: qty,
          });
        }
      }

      await tx.update(inventoryCatalogTable).set({
        globalStock: sql`${inventoryCatalogTable.globalStock} + ${qty}`,
      }).where(eq(inventoryCatalogTable.id, item.itemId!));

      await tx.insert(stockMovementsTable).values({
        itemId: item.itemId!,
        movementType: "Inward",
        quantity: qty,
        fromLocationId: undefined,
        toLocationId: locationId || undefined,
        referenceNumber: refNum,
        notes: `Restocked from sales return ${ret.returnNumber}`,
        performedBy: `User #${ret.createdBy}`,
        movementDate: new Date(),
      });

      stockUpdates++;
    }

    console.log(`[AUTO:INVENTORY] Return ${ret.returnNumber} restocked → ${stockUpdates} item(s)`);
    return { stockUpdates };
  };

  if (externalTx) {
    return await run(externalTx);
  }
  return await db.transaction(async (tx) => run(tx as any));
}
