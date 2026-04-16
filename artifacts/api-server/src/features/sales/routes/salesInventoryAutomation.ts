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

export async function triggerChallanDispatched(
  challanId: number,
): Promise<{
  stockUpdates: number;
  soUpdated: boolean;
  lowStockWarnings: string[];
} | null> {
  const challan = await deliveryChallansTable.findOne({ id: challanId }).lean();
  if (!challan) throw new Error("Challan not found");
  if (challan.status !== "Dispatched") return null;

  const existingMovement = await stockMovementsTable.findOne({ referenceNumber: challan.challanNumber }).lean();
  if (existingMovement) {
    console.log(`[AUTO:INVENTORY] Challan ${challan.challanNumber}: already processed (idempotency guard)`);
    return null;
  }

  const items = await deliveryChallanItemsTable.find({ challanId }).lean();
  const inventoryItems = items.filter((item: any) => item.itemId != null);

  if (inventoryItems.length === 0) {
    console.log(`[AUTO:INVENTORY] Challan ${challan.challanNumber}: no inventory items to dispatch`);
  }

  const locationId = challan.dispatchLocationId;
  let stockUpdates = 0;
  const lowStockWarnings: string[] = [];

  for (const item of inventoryItems) {
    const qty = Math.round(parseFloat(String(item.dispatchedQty || "0")));
    if (qty <= 0) continue;

    if (locationId) {
      const ledger = await stockLedgerTable.findOne({ itemId: item.itemId, locationId }).lean();
      const available = ledger?.quantity ?? 0;
      if (available < qty) {
        const catalogItem = await inventoryCatalogTable.findOne({ id: item.itemId }).lean();
        throw new Error(`Insufficient stock for ${catalogItem?.name || `item #${item.itemId}`}. Available: ${available}, Requested: ${qty}`);
      }
      await stockLedgerTable.findOneAndUpdate(
        { itemId: item.itemId, locationId },
        { $inc: { quantity: -qty }, $set: { updatedAt: new Date() } },
      );
    } else {
      const catalogItem = await inventoryCatalogTable.findOne({ id: item.itemId }).lean();
      if (catalogItem && catalogItem.globalStock < qty) {
        throw new Error(`Insufficient stock for ${catalogItem.name}. Available (global): ${catalogItem.globalStock}, Requested: ${qty}`);
      }
    }

    await inventoryCatalogTable.findOneAndUpdate(
      { id: item.itemId },
      { $inc: { globalStock: -qty } },
    );

    await stockMovementsTable.create({
      itemId: item.itemId,
      movementType: "Outward",
      quantity: qty,
      fromLocationId: locationId || undefined,
      referenceNumber: challan.challanNumber,
      notes: `Dispatched via ${challan.challanNumber} to ${challan.clientName}`,
      performedBy: `User #${challan.createdBy}`,
      movementDate: new Date(),
    });

    stockUpdates++;

    const updatedItem = await inventoryCatalogTable.findOne({ id: item.itemId }).lean();
    if (updatedItem && updatedItem.globalStock <= updatedItem.reorderLevel) {
      const warning = `LOW STOCK: ${updatedItem.name} (SKU: ${updatedItem.sku}) — Stock: ${updatedItem.globalStock}, Reorder Level: ${updatedItem.reorderLevel}`;
      lowStockWarnings.push(warning);
      console.warn(`[AUTO:INVENTORY] ${warning}`);
    }
  }

  let soUpdated = false;
  if (challan.sourceSalesOrderId) {
    soUpdated = await updateSalesOrderDelivery(challan.sourceSalesOrderId, items);
  }

  console.log(`[AUTO:INVENTORY] Challan ${challan.challanNumber} dispatched ? ${stockUpdates} stock update(s), SO updated: ${soUpdated}`);
  return { stockUpdates, soUpdated, lowStockWarnings };
}

async function updateSalesOrderDelivery(salesOrderId: number, challanItems: any[]): Promise<boolean> {
  const soItems = await salesOrderItemsTable.find({ salesOrderId }).lean();
  if (soItems.length === 0) return false;

  for (const challanItem of challanItems) {
    if (!challanItem.soItemId) continue;
    const qty = parseFloat(String(challanItem.dispatchedQty || "0"));
    if (qty <= 0) continue;
    await salesOrderItemsTable.findOneAndUpdate(
      { id: challanItem.soItemId },
      { $inc: { deliveredQty: qty } },
    );
  }

  const updatedSoItems = await salesOrderItemsTable.find({ salesOrderId }).lean();

  let allDelivered = true;
  let anyDelivered = false;

  for (const soItem of updatedSoItems) {
    const ordered = parseFloat(String(soItem.quantity || "0"));
    const delivered = parseFloat(String(soItem.deliveredQty || "0"));
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

  await salesOrdersTable.findOneAndUpdate(
    { id: salesOrderId },
    { $set: { deliveryStatus, updatedAt: new Date() } },
  );
  return true;
}

export async function triggerReturnRestock(
  returnId: number,
): Promise<{ stockUpdates: number } | null> {
  const ret = await salesReturnsTable.findOne({ id: returnId }).lean();
  if (!ret) throw new Error("Sales return not found");
  if (ret.status !== "Goods Received") return null;
  if (!ret.restock) return null;

  const refNum = ret.returnNumber || `RTN-${returnId}`;
  const existingMovement = await stockMovementsTable.findOne({ referenceNumber: refNum }).lean();
  if (existingMovement) {
    console.log(`[AUTO:INVENTORY] Return ${refNum}: already processed (idempotency guard)`);
    return null;
  }

  const locationId = ret.restockLocationId;
  const items = await salesReturnItemsTable.find({ returnId }).lean();
  const inventoryItems = items.filter((item: any) => item.itemId != null);

  if (inventoryItems.length === 0) {
    console.log(`[AUTO:INVENTORY] Return ${ret.returnNumber}: no inventory items to restock`);
    return { stockUpdates: 0 };
  }

  let stockUpdates = 0;

  for (const item of inventoryItems) {
    const qty = Math.round(parseFloat(String(item.returnedQty || "0")));
    if (qty <= 0) continue;

    if (locationId) {
      const ledger = await stockLedgerTable.findOne({ itemId: item.itemId, locationId }).lean();
      if (ledger) {
        await stockLedgerTable.findOneAndUpdate(
          { id: ledger.id },
          { $inc: { quantity: qty }, $set: { updatedAt: new Date() } },
        );
      } else {
        await stockLedgerTable.create({ itemId: item.itemId, locationId, quantity: qty });
      }
    }

    await inventoryCatalogTable.findOneAndUpdate(
      { id: item.itemId },
      { $inc: { globalStock: qty } },
    );

    await stockMovementsTable.create({
      itemId: item.itemId,
      movementType: "Inward",
      quantity: qty,
      toLocationId: locationId || undefined,
      referenceNumber: refNum,
      notes: `Restocked from sales return ${ret.returnNumber}`,
      performedBy: `User #${ret.createdBy}`,
      movementDate: new Date(),
    });

    stockUpdates++;
  }

  console.log(`[AUTO:INVENTORY] Return ${ret.returnNumber} restocked ? ${stockUpdates} item(s)`);
  return { stockUpdates };
}
