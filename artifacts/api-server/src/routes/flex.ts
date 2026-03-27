import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  materialRequestsTable, insertMaterialRequestSchema,
  purchaseRequestsTable, insertPurchaseRequestSchema,
  rfqTable, insertRfqSchema,
  rfqBidsTable, insertRfqBidSchema,
  flexPurchaseOrdersTable, insertFlexPOSchema,
  flexPOItemsTable, insertFlexPOItemSchema,
  goodsReceiptsTable, insertGoodsReceiptSchema,
  grnItemsTable, insertGrnItemSchema,
  purchaseInvoicesTable, insertPurchaseInvoiceSchema,
  purchaseReturnsTable, insertPurchaseReturnSchema,
} from "@workspace/db/schema";
import { desc, eq, sql } from "drizzle-orm";

const flexRouter = Router();

flexRouter.get("/flex/material-requests", async (_req: Request, res: Response) => {
  const rows = await db.select().from(materialRequestsTable).orderBy(desc(materialRequestsTable.createdAt));
  res.json(rows);
});

flexRouter.post("/flex/material-requests", async (req: Request, res: Response) => {
  const parsed = insertMaterialRequestSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(materialRequestsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

flexRouter.patch("/flex/material-requests/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const validStatuses = ["Pending", "Approved", "Rejected"];
  if (req.body.status && !validStatuses.includes(req.body.status)) { res.status(400).json({ error: "Invalid status" }); return; }
  const updates: Record<string, any> = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  const [updated] = await db.update(materialRequestsTable).set(updates).where(eq(materialRequestsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

flexRouter.delete("/flex/material-requests/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(materialRequestsTable).where(eq(materialRequestsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

flexRouter.get("/flex/purchase-requests", async (_req: Request, res: Response) => {
  const rows = await db.select().from(purchaseRequestsTable).orderBy(desc(purchaseRequestsTable.createdAt));
  res.json(rows);
});

flexRouter.post("/flex/purchase-requests", async (req: Request, res: Response) => {
  const parsed = insertPurchaseRequestSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(purchaseRequestsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

flexRouter.patch("/flex/purchase-requests/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const validStatuses = ["Pending", "Approved", "Rejected", "Converted"];
  if (req.body.status && !validStatuses.includes(req.body.status)) { res.status(400).json({ error: "Invalid status" }); return; }
  const updates: Record<string, any> = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  const [updated] = await db.update(purchaseRequestsTable).set(updates).where(eq(purchaseRequestsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

flexRouter.delete("/flex/purchase-requests/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(purchaseRequestsTable).where(eq(purchaseRequestsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

flexRouter.get("/flex/rfqs", async (_req: Request, res: Response) => {
  const rows = await db.select().from(rfqTable).orderBy(desc(rfqTable.createdAt));
  res.json(rows);
});

flexRouter.post("/flex/rfqs", async (req: Request, res: Response) => {
  const parsed = insertRfqSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(rfqTable).values(parsed.data).returning();
  res.status(201).json(row);
});

flexRouter.patch("/flex/rfqs/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const updates: Record<string, any> = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.vendors) updates.vendors = req.body.vendors;
  const [updated] = await db.update(rfqTable).set(updates).where(eq(rfqTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

flexRouter.get("/flex/rfq-bids", async (req: Request, res: Response) => {
  const rfqId = req.query.rfqId ? parseInt(req.query.rfqId as string) : undefined;
  let query = db.select().from(rfqBidsTable);
  if (rfqId) {
    const rows = await db.select().from(rfqBidsTable).where(eq(rfqBidsTable.rfqId, rfqId)).orderBy(desc(rfqBidsTable.createdAt));
    res.json(rows); return;
  }
  const rows = await db.select().from(rfqBidsTable).orderBy(desc(rfqBidsTable.createdAt));
  res.json(rows);
});

flexRouter.post("/flex/rfq-bids", async (req: Request, res: Response) => {
  const parsed = insertRfqBidSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(rfqBidsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

flexRouter.patch("/flex/rfq-bids/:id/select", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [bid] = await db.select().from(rfqBidsTable).where(eq(rfqBidsTable.id, id));
  if (!bid) { res.status(404).json({ error: "Not found" }); return; }
  await db.update(rfqBidsTable).set({ selected: "No" }).where(eq(rfqBidsTable.rfqId, bid.rfqId));
  const [updated] = await db.update(rfqBidsTable).set({ selected: "Yes" }).where(eq(rfqBidsTable.id, id)).returning();
  res.json(updated);
});

flexRouter.get("/flex/purchase-orders", async (_req: Request, res: Response) => {
  const rows = await db.select().from(flexPurchaseOrdersTable).orderBy(desc(flexPurchaseOrdersTable.createdAt));
  res.json(rows);
});

flexRouter.get("/flex/purchase-orders/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [po] = await db.select().from(flexPurchaseOrdersTable).where(eq(flexPurchaseOrdersTable.id, id));
  if (!po) { res.status(404).json({ error: "Not found" }); return; }
  const items = await db.select().from(flexPOItemsTable).where(eq(flexPOItemsTable.poId, id));
  res.json({ ...po, items });
});

flexRouter.post("/flex/purchase-orders", async (req: Request, res: Response) => {
  const { items, ...poData } = req.body;
  const parsed = insertFlexPOSchema.safeParse(poData);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  if (!items || !Array.isArray(items) || items.length === 0) { res.status(400).json({ error: "At least one line item required" }); return; }
  try {
    const result = await db.transaction(async (tx) => {
      const [po] = await tx.insert(flexPurchaseOrdersTable).values(parsed.data).returning();
      for (const item of items) {
        const itemParsed = insertFlexPOItemSchema.safeParse({ ...item, poId: po.id });
        if (!itemParsed.success) throw new Error(`Invalid line item: ${itemParsed.error.issues.map(i => i.message).join(", ")}`);
        await tx.insert(flexPOItemsTable).values(itemParsed.data);
      }
      const poItems = await tx.select().from(flexPOItemsTable).where(eq(flexPOItemsTable.poId, po.id));
      return { ...po, items: poItems };
    });
    res.status(201).json(result);
  } catch (err: any) {
    console.error("Flex PO error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

flexRouter.patch("/flex/purchase-orders/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const updates: Record<string, any> = {};
  const allowed = ["status", "terms", "vendorName", "poDate", "deliveryDate", "subtotal", "cgstTotal", "sgstTotal", "igstTotal", "grandTotal"];
  for (const f of allowed) {
    if (req.body[f] !== undefined) {
      if ((f === "poDate" || f === "deliveryDate") && typeof req.body[f] === "string") {
        updates[f] = new Date(req.body[f]);
      } else {
        updates[f] = req.body[f];
      }
    }
  }
  const [updated] = await db.update(flexPurchaseOrdersTable).set(updates).where(eq(flexPurchaseOrdersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

flexRouter.delete("/flex/purchase-orders/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(flexPOItemsTable).where(eq(flexPOItemsTable.poId, id));
  const [deleted] = await db.delete(flexPurchaseOrdersTable).where(eq(flexPurchaseOrdersTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

flexRouter.get("/flex/goods-receipts", async (_req: Request, res: Response) => {
  const rows = await db.select().from(goodsReceiptsTable).orderBy(desc(goodsReceiptsTable.createdAt));
  res.json(rows);
});

flexRouter.get("/flex/goods-receipts/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [grn] = await db.select().from(goodsReceiptsTable).where(eq(goodsReceiptsTable.id, id));
  if (!grn) { res.status(404).json({ error: "Not found" }); return; }
  const items = await db.select().from(grnItemsTable).where(eq(grnItemsTable.grnId, id));
  res.json({ ...grn, items });
});

flexRouter.post("/flex/goods-receipts", async (req: Request, res: Response) => {
  const { items, ...grnData } = req.body;
  const parsed = insertGoodsReceiptSchema.safeParse(grnData);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  try {
    const result = await db.transaction(async (tx) => {
      const [grn] = await tx.insert(goodsReceiptsTable).values(parsed.data).returning();
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const itemParsed = insertGrnItemSchema.safeParse({ ...item, grnId: grn.id });
          if (!itemParsed.success) throw new Error(`Invalid GRN item: ${itemParsed.error.issues.map(i => i.message).join(", ")}`);
          await tx.insert(grnItemsTable).values(itemParsed.data);
        }
      }
      const grnItems = await tx.select().from(grnItemsTable).where(eq(grnItemsTable.grnId, grn.id));
      return { ...grn, items: grnItems };
    });
    res.status(201).json(result);
  } catch (err: any) {
    console.error("GRN error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

flexRouter.patch("/flex/goods-receipts/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const validStatuses = ["Pending", "Partial", "Complete"];
  if (req.body.status && !validStatuses.includes(req.body.status)) { res.status(400).json({ error: "Invalid status" }); return; }
  const updates: Record<string, any> = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  if (req.body.receivedBy !== undefined) updates.receivedBy = req.body.receivedBy;
  const [updated] = await db.update(goodsReceiptsTable).set(updates).where(eq(goodsReceiptsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

flexRouter.get("/flex/purchase-invoices", async (_req: Request, res: Response) => {
  const rows = await db.select().from(purchaseInvoicesTable).orderBy(desc(purchaseInvoicesTable.createdAt));
  res.json(rows);
});

flexRouter.post("/flex/purchase-invoices", async (req: Request, res: Response) => {
  const parsed = insertPurchaseInvoiceSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(purchaseInvoicesTable).values(parsed.data).returning();
  res.status(201).json(row);
});

flexRouter.patch("/flex/purchase-invoices/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const updates: Record<string, any> = {};
  if (req.body.matchStatus) updates.matchStatus = req.body.matchStatus;
  if (req.body.paymentStatus) updates.paymentStatus = req.body.paymentStatus;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  const [updated] = await db.update(purchaseInvoicesTable).set(updates).where(eq(purchaseInvoicesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

flexRouter.get("/flex/purchase-returns", async (_req: Request, res: Response) => {
  const rows = await db.select().from(purchaseReturnsTable).orderBy(desc(purchaseReturnsTable.createdAt));
  res.json(rows);
});

flexRouter.post("/flex/purchase-returns", async (req: Request, res: Response) => {
  const parsed = insertPurchaseReturnSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(purchaseReturnsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

flexRouter.patch("/flex/purchase-returns/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const updates: Record<string, any> = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  const [updated] = await db.update(purchaseReturnsTable).set(updates).where(eq(purchaseReturnsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

export default flexRouter;
