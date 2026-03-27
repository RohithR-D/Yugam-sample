import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  inventoryCatalogTable, insertInventoryCatalogSchema,
  inventoryLocationsTable, insertInventoryLocationSchema,
  stockLedgerTable,
  stockMovementsTable, insertStockMovementSchema,
  materialIndentsTable, insertMaterialIndentSchema,
  assetsTable, insertAssetSchema,
} from "@workspace/db/schema";
import { desc, eq, sql } from "drizzle-orm";

const vaultRouter = Router();

vaultRouter.get("/vault/catalog", async (_req: Request, res: Response) => {
  const items = await db.select().from(inventoryCatalogTable).orderBy(desc(inventoryCatalogTable.createdAt));
  res.json(items);
});

vaultRouter.post("/vault/catalog", async (req: Request, res: Response) => {
  const parsed = insertInventoryCatalogSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [item] = await db.insert(inventoryCatalogTable).values(parsed.data).returning();
  res.status(201).json(item);
});

vaultRouter.delete("/vault/catalog/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(inventoryCatalogTable).where(eq(inventoryCatalogTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

vaultRouter.get("/vault/locations", async (_req: Request, res: Response) => {
  const locations = await db.select().from(inventoryLocationsTable).orderBy(desc(inventoryLocationsTable.createdAt));
  res.json(locations);
});

vaultRouter.post("/vault/locations", async (req: Request, res: Response) => {
  const parsed = insertInventoryLocationSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [loc] = await db.insert(inventoryLocationsTable).values(parsed.data).returning();
  res.status(201).json(loc);
});

vaultRouter.delete("/vault/locations/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(inventoryLocationsTable).where(eq(inventoryLocationsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

vaultRouter.get("/vault/stock-ledger", async (_req: Request, res: Response) => {
  const ledger = await db.select().from(stockLedgerTable);
  res.json(ledger);
});

vaultRouter.get("/vault/movements", async (_req: Request, res: Response) => {
  const movements = await db.select().from(stockMovementsTable).orderBy(desc(stockMovementsTable.createdAt));
  res.json(movements);
});

vaultRouter.post("/vault/movements", async (req: Request, res: Response) => {
  const parsed = insertStockMovementSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const { movementType, quantity, fromLocationId, toLocationId } = parsed.data;
  if (!quantity || quantity <= 0) { res.status(400).json({ error: "Quantity must be greater than 0" }); return; }
  if (movementType === "Inward" && !toLocationId) { res.status(400).json({ error: "Inward movement requires a destination location" }); return; }
  if (movementType === "Outward" && !fromLocationId) { res.status(400).json({ error: "Outward movement requires a source location" }); return; }
  if (movementType === "Transfer" && (!fromLocationId || !toLocationId)) { res.status(400).json({ error: "Transfer requires both source and destination locations" }); return; }
  if (movementType === "Adjustment" && !toLocationId) { res.status(400).json({ error: "Adjustment requires a target location" }); return; }
  try {
    const result = await db.transaction(async (tx) => {
      const [mv] = await tx.insert(stockMovementsTable).values(parsed.data).returning();
      const { itemId } = mv;
      if (movementType === "Inward") {
        await upsertStockLedger(tx, itemId, toLocationId!, quantity);
        await updateGlobalStock(tx, itemId, quantity);
      } else if (movementType === "Outward") {
        await upsertStockLedger(tx, itemId, fromLocationId!, -quantity);
        await updateGlobalStock(tx, itemId, -quantity);
      } else if (movementType === "Transfer") {
        await upsertStockLedger(tx, itemId, fromLocationId!, -quantity);
        await upsertStockLedger(tx, itemId, toLocationId!, quantity);
      } else if (movementType === "Adjustment") {
        const [existing] = await tx.select().from(stockLedgerTable)
          .where(sql`${stockLedgerTable.itemId} = ${itemId} AND ${stockLedgerTable.locationId} = ${toLocationId}`);
        const oldQty = existing?.quantity || 0;
        const diff = quantity - oldQty;
        await upsertStockLedgerAbsolute(tx, itemId, toLocationId!, quantity);
        await updateGlobalStock(tx, itemId, diff);
      }
      return mv;
    });
    res.status(201).json(result);
  } catch (err: any) {
    console.error("Stock movement error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function upsertStockLedger(tx: any, itemId: number, locationId: number, qtyDelta: number) {
  const [existing] = await tx.select().from(stockLedgerTable)
    .where(sql`${stockLedgerTable.itemId} = ${itemId} AND ${stockLedgerTable.locationId} = ${locationId}`);
  if (existing) {
    await tx.update(stockLedgerTable).set({ quantity: existing.quantity + qtyDelta, updatedAt: new Date() })
      .where(eq(stockLedgerTable.id, existing.id));
  } else {
    await tx.insert(stockLedgerTable).values({ itemId, locationId, quantity: Math.max(0, qtyDelta) });
  }
}

async function upsertStockLedgerAbsolute(tx: any, itemId: number, locationId: number, qty: number) {
  const [existing] = await tx.select().from(stockLedgerTable)
    .where(sql`${stockLedgerTable.itemId} = ${itemId} AND ${stockLedgerTable.locationId} = ${locationId}`);
  if (existing) {
    await tx.update(stockLedgerTable).set({ quantity: qty, updatedAt: new Date() })
      .where(eq(stockLedgerTable.id, existing.id));
  } else {
    await tx.insert(stockLedgerTable).values({ itemId, locationId, quantity: qty });
  }
}

async function updateGlobalStock(tx: any, itemId: number, qtyDelta: number) {
  await tx.update(inventoryCatalogTable)
    .set({ globalStock: sql`GREATEST(0, ${inventoryCatalogTable.globalStock} + ${qtyDelta})` })
    .where(eq(inventoryCatalogTable.id, itemId));
}

vaultRouter.get("/vault/indents", async (_req: Request, res: Response) => {
  const indents = await db.select().from(materialIndentsTable).orderBy(desc(materialIndentsTable.createdAt));
  res.json(indents);
});

vaultRouter.post("/vault/indents", async (req: Request, res: Response) => {
  const parsed = insertMaterialIndentSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [indent] = await db.insert(materialIndentsTable).values(parsed.data).returning();
  res.status(201).json(indent);
});

vaultRouter.patch("/vault/indents/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [existing] = await db.select().from(materialIndentsTable).where(eq(materialIndentsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const updates: Record<string, any> = {};
  const allowed = ["approvedQty", "issuedFromLocationId", "status", "issueDate"];
  const validStatuses = ["Pending", "Approved", "Issued", "Rejected"];
  for (const f of allowed) {
    if (req.body[f] !== undefined) {
      if (f === "status" && !validStatuses.includes(req.body[f])) continue;
      if (f === "issueDate" && typeof req.body[f] === "string") {
        const d = new Date(req.body[f]);
        if (isNaN(d.getTime())) continue;
        updates[f] = d;
      } else {
        updates[f] = req.body[f];
      }
    }
  }
  const [updated] = await db.update(materialIndentsTable).set(updates).where(eq(materialIndentsTable.id, id)).returning();
  res.json(updated);
});

vaultRouter.post("/vault/indents/:id/issue", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { approvedQty, issuedFromLocationId } = req.body;
  if (!approvedQty || approvedQty <= 0) { res.status(400).json({ error: "Approved quantity must be > 0" }); return; }
  if (!issuedFromLocationId) { res.status(400).json({ error: "Issue location required" }); return; }
  try {
    const result = await db.transaction(async (tx) => {
      const [indent] = await tx.select().from(materialIndentsTable).where(eq(materialIndentsTable.id, id));
      if (!indent) throw new Error("Indent not found");
      if (indent.status === "Issued") throw new Error("Already issued");
      const [updated] = await tx.update(materialIndentsTable).set({ status: "Issued", approvedQty, issuedFromLocationId, issueDate: new Date() }).where(eq(materialIndentsTable.id, id)).returning();
      const [mv] = await tx.insert(stockMovementsTable).values({ itemId: indent.itemId, movementType: "Outward", quantity: approvedQty, fromLocationId: issuedFromLocationId, referenceNumber: `INDENT-${id}`, performedBy: "System", notes: `Material issue for indent #${id}` }).returning();
      await upsertStockLedger(tx, indent.itemId, issuedFromLocationId, -approvedQty);
      await updateGlobalStock(tx, indent.itemId, -approvedQty);
      return { indent: updated, movement: mv };
    });
    res.json(result);
  } catch (err: any) {
    if (err.message === "Indent not found") { res.status(404).json({ error: err.message }); return; }
    if (err.message === "Already issued") { res.status(400).json({ error: err.message }); return; }
    console.error("Issue error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

vaultRouter.get("/vault/assets", async (_req: Request, res: Response) => {
  const assets = await db.select().from(assetsTable).orderBy(desc(assetsTable.createdAt));
  res.json(assets);
});

vaultRouter.post("/vault/assets", async (req: Request, res: Response) => {
  const parsed = insertAssetSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [asset] = await db.insert(assetsTable).values(parsed.data).returning();
  res.status(201).json(asset);
});

vaultRouter.patch("/vault/assets/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [existing] = await db.select().from(assetsTable).where(eq(assetsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const updates: Record<string, any> = {};
  const allowed = ["assetName", "serialNumber", "category", "status", "assignedTo", "purchaseValue", "maintenanceNotes"];
  const validStatuses = ["Active", "Allocated", "Maintenance", "Sold"];
  for (const f of allowed) {
    if (req.body[f] !== undefined) {
      if (f === "status" && !validStatuses.includes(req.body[f])) continue;
      updates[f] = req.body[f];
    }
  }
  const [updated] = await db.update(assetsTable).set(updates).where(eq(assetsTable.id, id)).returning();
  res.json(updated);
});

vaultRouter.delete("/vault/assets/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(assetsTable).where(eq(assetsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

vaultRouter.get("/vault/dashboard-summary", async (_req: Request, res: Response) => {
  const [catalogCount] = await db.select({ count: sql<number>`count(*)::int` }).from(inventoryCatalogTable);
  const [locationCount] = await db.select({ count: sql<number>`count(*)::int` }).from(inventoryLocationsTable).where(eq(inventoryLocationsTable.locationType, "Warehouse"));
  const [pendingIndents] = await db.select({ count: sql<number>`count(*)::int` }).from(materialIndentsTable).where(eq(materialIndentsTable.status, "Pending"));
  const catalogItems = await db.select().from(inventoryCatalogTable);
  const totalValue = catalogItems.reduce((s, item) => s + (parseFloat(item.unitPrice as string) || 0) * (item.globalStock || 0), 0);
  const categoryBreakdown = catalogItems.reduce((acc, item) => {
    const cat = item.category || "Other";
    const val = (parseFloat(item.unitPrice as string) || 0) * (item.globalStock || 0);
    acc[cat] = (acc[cat] || 0) + val;
    return acc;
  }, {} as Record<string, number>);
  const recentMovements = await db.select().from(stockMovementsTable).orderBy(desc(stockMovementsTable.createdAt)).limit(10);
  res.json({
    totalItems: catalogCount?.count || 0,
    totalValue,
    activeWarehouses: locationCount?.count || 0,
    pendingIndents: pendingIndents?.count || 0,
    categoryBreakdown,
    recentMovements,
  });
});

export default vaultRouter;
