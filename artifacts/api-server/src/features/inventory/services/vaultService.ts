import { runMongoTransaction } from "@workspace/db";
import {
  inventoryCatalogTable,
  inventoryLocationsTable,
  stockLedgerTable,
  stockMovementsTable,
  materialIndentsTable,
  assetsTable,
} from "@workspace/db/schema";

async function upsertStockLedger(itemId: number, locationId: number, qtyDelta: number, session: any) {
  const existing = await stockLedgerTable.findOne({ itemId, locationId }).session(session).lean();
  if (existing) {
    const newQty = ((existing as any).quantity || 0) + qtyDelta;
    await stockLedgerTable.findOneAndUpdate(
      { itemId, locationId },
      { $set: { quantity: newQty, updatedAt: new Date() } },
      { session },
    );
  } else {
    await stockLedgerTable.create([{ itemId, locationId, quantity: Math.max(0, qtyDelta) }], { session });
  }
}

async function upsertStockLedgerAbsolute(itemId: number, locationId: number, quantity: number, session: any) {
  const existing = await stockLedgerTable.findOne({ itemId, locationId }).session(session).lean();
  if (existing) {
    await stockLedgerTable.findOneAndUpdate(
      { itemId, locationId },
      { $set: { quantity, updatedAt: new Date() } },
      { session },
    );
  } else {
    await stockLedgerTable.create([{ itemId, locationId, quantity }], { session });
  }
}

async function updateGlobalStock(itemId: number, qtyDelta: number, session: any) {
  const item = await inventoryCatalogTable.findOne({ id: itemId }).session(session).lean();
  const current = ((item as any)?.globalStock || 0) as number;
  const newStock = Math.max(0, current + qtyDelta);
  await inventoryCatalogTable.findOneAndUpdate(
    { id: itemId },
    { $set: { globalStock: newStock } },
    { session },
  );
}

export const getVaultCatalog = async () => {
  return await inventoryCatalogTable.find().sort({ createdAt: -1 }).lean();
};

export const createVaultCatalogItem = async (data: any) => {
  const item = await inventoryCatalogTable.create(data);
  return item.toObject();
};

export const deleteVaultCatalogItem = async (id: number) => {
  return await inventoryCatalogTable.findOneAndDelete({ id }).lean();
};

export const getVaultLocations = async () => {
  return await inventoryLocationsTable.find().sort({ createdAt: -1 }).lean();
};

export const createVaultLocation = async (data: any) => {
  const loc = await inventoryLocationsTable.create(data);
  return loc.toObject();
};

export const deleteVaultLocation = async (id: number) => {
  return await inventoryLocationsTable.findOneAndDelete({ id }).lean();
};

export const getStockLedger = async () => {
  return await stockLedgerTable.find().lean();
};

export const getStockMovements = async () => {
  return await stockMovementsTable.find().sort({ createdAt: -1 }).lean();
};

export const createStockMovement = async (data: any) => {
  return await runMongoTransaction(async (session) => {
    const movement = await stockMovementsTable.create(data, { session });
    const { movementType, quantity, itemId, fromLocationId, toLocationId } = movement as any;

    if (movementType === "Inward") {
      await upsertStockLedger(itemId, toLocationId, quantity, session);
      await updateGlobalStock(itemId, quantity, session);
    } else if (movementType === "Outward") {
      await upsertStockLedger(itemId, fromLocationId, -quantity, session);
      await updateGlobalStock(itemId, -quantity, session);
    } else if (movementType === "Transfer") {
      await upsertStockLedger(itemId, fromLocationId, -quantity, session);
      await upsertStockLedger(itemId, toLocationId, quantity, session);
    } else if (movementType === "Adjustment") {
      const existing = await stockLedgerTable.findOne({ itemId, locationId: toLocationId }).session(session).lean();
      const oldQty = ((existing as any)?.quantity || 0) as number;
      const diff = quantity - oldQty;
      await upsertStockLedgerAbsolute(itemId, toLocationId, quantity, session);
      await updateGlobalStock(itemId, diff, session);
    }

    return (movement as any).toObject();
  });
};

export const getMaterialIndents = async () => {
  return await materialIndentsTable.find().sort({ createdAt: -1 }).lean();
};

export const createMaterialIndent = async (data: any) => {
  const indent = await materialIndentsTable.create(data);
  return indent.toObject();
};

export const updateMaterialIndent = async (id: number, updates: Record<string, any>) => {
  return await materialIndentsTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
};

export const issueMaterialIndent = async (id: number, approvedQty: number, issuedFromLocationId: number) => {
  return await runMongoTransaction(async (session) => {
    const indent = await materialIndentsTable.findOne({ id }).session(session).lean();
    if (!indent) {
      throw new Error("Indent not found");
    }
    if ((indent as any).status === "Issued") {
      throw new Error("Already issued");
    }

    const updated = await materialIndentsTable
      .findOneAndUpdate(
        { id },
        {
          $set: {
            status: "Issued",
            approvedQty,
            issuedFromLocationId,
            issueDate: new Date(),
          },
        },
        { new: true, session },
      )
      .lean();

    const movement = await stockMovementsTable.create(
      {
        itemId: (indent as any).itemId,
        movementType: "Outward",
        quantity: approvedQty,
        fromLocationId: issuedFromLocationId,
        referenceNumber: `INDENT-${id}`,
        performedBy: "System",
        notes: `Material issue for indent #${id}`,
      },
      { session },
    );

    await upsertStockLedger((indent as any).itemId, issuedFromLocationId, -approvedQty, session);
    await updateGlobalStock((indent as any).itemId, -approvedQty, session);

    return { indent: updated, movement: (movement as any).toObject() };
  });
};

export const getAssets = async () => {
  return await assetsTable.find().sort({ createdAt: -1 }).lean();
};

export const createAsset = async (data: any) => {
  const asset = await assetsTable.create(data);
  return asset.toObject();
};

export const updateAsset = async (id: number, updates: Record<string, any>) => {
  return await assetsTable.findOneAndUpdate({ id }, updates, { new: true }).lean();
};

export const deleteAsset = async (id: number) => {
  return await assetsTable.findOneAndDelete({ id }).lean();
};

export const getVaultDashboardSummary = async () => {
  const catalogCount = await inventoryCatalogTable.countDocuments();
  const activeWarehouseCount = await inventoryLocationsTable.countDocuments({ locationType: "Warehouse" });
  const pendingIndentCount = await materialIndentsTable.countDocuments({ status: "Pending" });
  const catalogItems = await inventoryCatalogTable.find().lean();
  const totalValue = catalogItems.reduce((sum: number, item: any) => sum + (parseFloat(item.unitPrice) || 0) * ((item.globalStock || 0) as number), 0);
  const categoryBreakdown = catalogItems.reduce((acc: Record<string, number>, item: any) => {
    const cat = item.category || "Other";
    const val = (parseFloat(item.unitPrice) || 0) * ((item.globalStock || 0) as number);
    acc[cat] = (acc[cat] || 0) + val;
    return acc;
  }, {});
  const recentMovements = await stockMovementsTable.find().sort({ createdAt: -1 }).limit(10).lean();

  return {
    totalItems: catalogCount,
    totalValue,
    activeWarehouses: activeWarehouseCount,
    pendingIndents: pendingIndentCount,
    categoryBreakdown,
    recentMovements,
  };
};
