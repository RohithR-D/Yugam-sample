import { Router, type Request, type Response } from "express";
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
import { triggerGrnAccepted, triggerInvoiceMatched, triggerPurchaseReturn } from "./procurementAutomation";

const flexRouter = Router();

flexRouter.get("/flex/material-requests", async (_req: Request, res: Response) => {
  const rows = await materialRequestsTable.find().sort({ createdAt: -1 }).lean();
  res.json(rows);
});

flexRouter.post("/flex/material-requests", async (req: Request, res: Response) => {
  const parsed = insertMaterialRequestSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const row = await materialRequestsTable.create(parsed.data);
  res.status(201).json(row.toObject());
});

flexRouter.patch("/flex/material-requests/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const validStatuses = ["Pending", "Approved", "Rejected"];
  if (req.body.status && !validStatuses.includes(req.body.status)) { res.status(400).json({ error: "Invalid status" }); return; }
  const updates: Record<string, any> = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  const updated = await materialRequestsTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

flexRouter.delete("/flex/material-requests/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await materialRequestsTable.findOneAndDelete({ id }).lean();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

flexRouter.get("/flex/purchase-requests", async (_req: Request, res: Response) => {
  const rows = await purchaseRequestsTable.find().sort({ createdAt: -1 }).lean();
  res.json(rows);
});

flexRouter.post("/flex/purchase-requests", async (req: Request, res: Response) => {
  const parsed = insertPurchaseRequestSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const row = await purchaseRequestsTable.create(parsed.data);
  res.status(201).json(row.toObject());
});

flexRouter.patch("/flex/purchase-requests/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const validStatuses = ["Pending", "Approved", "Rejected", "Converted"];
  if (req.body.status && !validStatuses.includes(req.body.status)) { res.status(400).json({ error: "Invalid status" }); return; }
  const updates: Record<string, any> = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  const updated = await purchaseRequestsTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

flexRouter.delete("/flex/purchase-requests/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await purchaseRequestsTable.findOneAndDelete({ id }).lean();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

flexRouter.get("/flex/rfqs", async (_req: Request, res: Response) => {
  const rows = await rfqTable.find().sort({ createdAt: -1 }).lean();
  res.json(rows);
});

flexRouter.post("/flex/rfqs", async (req: Request, res: Response) => {
  const parsed = insertRfqSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const row = await rfqTable.create(parsed.data);
  res.status(201).json(row.toObject());
});

flexRouter.patch("/flex/rfqs/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const updates: Record<string, any> = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.vendors) updates.vendors = req.body.vendors;
  const updated = await rfqTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

flexRouter.get("/flex/rfq-bids", async (req: Request, res: Response) => {
  const rfqId = req.query.rfqId ? parseInt(req.query.rfqId as string) : undefined;
  const filter: any = {};
  if (rfqId) filter.rfqId = rfqId;
  const rows = await rfqBidsTable.find(filter).sort({ createdAt: -1 }).lean();
  res.json(rows);
});

flexRouter.post("/flex/rfq-bids", async (req: Request, res: Response) => {
  const parsed = insertRfqBidSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const row = await rfqBidsTable.create(parsed.data);
  res.status(201).json(row.toObject());
});

flexRouter.patch("/flex/rfq-bids/:id/select", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const bid = await rfqBidsTable.findOne({ id }).lean();
  if (!bid) { res.status(404).json({ error: "Not found" }); return; }
  await rfqBidsTable.updateMany({ rfqId: bid.rfqId }, { $set: { selected: "No" } });
  const updated = await rfqBidsTable.findOneAndUpdate({ id }, { $set: { selected: "Yes" } }, { new: true }).lean();
  res.json(updated);
});

flexRouter.get("/flex/purchase-orders", async (_req: Request, res: Response) => {
  const rows = await flexPurchaseOrdersTable.find().sort({ createdAt: -1 }).lean();
  res.json(rows);
});

flexRouter.get("/flex/purchase-orders/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const po = await flexPurchaseOrdersTable.findOne({ id }).lean();
  if (!po) { res.status(404).json({ error: "Not found" }); return; }
  const items = await flexPOItemsTable.find({ poId: id }).lean();
  res.json({ ...po, items });
});

flexRouter.post("/flex/purchase-orders", async (req: Request, res: Response) => {
  const { items, ...poData } = req.body;
  const parsed = insertFlexPOSchema.safeParse(poData);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  if (!items || !Array.isArray(items) || items.length === 0) { res.status(400).json({ error: "At least one line item required" }); return; }
  try {
    const po = await flexPurchaseOrdersTable.create(parsed.data);
    const poObj = po.toObject();
    for (const item of items) {
      const itemParsed = insertFlexPOItemSchema.safeParse({ ...item, poId: poObj.id });
      if (!itemParsed.success) throw new Error(`Invalid line item: ${itemParsed.error.issues.map((i: any) => i.message).join(", ")}`);
      await flexPOItemsTable.create(itemParsed.data);
    }
    const poItems = await flexPOItemsTable.find({ poId: poObj.id }).lean();
    res.status(201).json({ ...poObj, items: poItems });
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
  const updated = await flexPurchaseOrdersTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

flexRouter.delete("/flex/purchase-orders/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await flexPOItemsTable.deleteMany({ poId: id });
  const deleted = await flexPurchaseOrdersTable.findOneAndDelete({ id }).lean();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

flexRouter.get("/flex/goods-receipts", async (_req: Request, res: Response) => {
  const rows = await goodsReceiptsTable.find().sort({ createdAt: -1 }).lean();
  res.json(rows);
});

flexRouter.get("/flex/goods-receipts/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const grn = await goodsReceiptsTable.findOne({ id }).lean();
  if (!grn) { res.status(404).json({ error: "Not found" }); return; }
  const items = await grnItemsTable.find({ grnId: id }).lean();
  res.json({ ...grn, items });
});

flexRouter.post("/flex/goods-receipts", async (req: Request, res: Response) => {
  const { items, ...grnData } = req.body;
  const parsed = insertGoodsReceiptSchema.safeParse(grnData);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  try {
    const grn = await goodsReceiptsTable.create(parsed.data);
    const grnObj = grn.toObject();
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const itemParsed = insertGrnItemSchema.safeParse({ ...item, grnId: grnObj.id });
        if (!itemParsed.success) throw new Error(`Invalid GRN item: ${itemParsed.error.issues.map((i: any) => i.message).join(", ")}`);
        await grnItemsTable.create(itemParsed.data);
      }
    }
    const grnItems = await grnItemsTable.find({ grnId: grnObj.id }).lean();
    res.status(201).json({ ...grnObj, items: grnItems });
  } catch (err: any) {
    console.error("GRN error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

flexRouter.patch("/flex/goods-receipts/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const validStatuses = ["Pending", "Partial", "Complete"];
    if (req.body.status && !validStatuses.includes(req.body.status)) { res.status(400).json({ error: "Invalid status" }); return; }

    const prev = await goodsReceiptsTable.findOne({ id }).lean();
    if (!prev) { res.status(404).json({ error: "Not found" }); return; }
    const previousStatus = (prev as any).status;

    const updates: Record<string, any> = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    if (req.body.receivedBy !== undefined) updates.receivedBy = req.body.receivedBy;
    if (req.body.receivedAtLocationId !== undefined) updates.receivedAtLocationId = req.body.receivedAtLocationId;

    const updated = await goodsReceiptsTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
    const newStatus = (updated as any).status;
    let automationResult = null;
    if (["Complete", "Partial"].includes(newStatus) && !["Complete", "Partial"].includes(previousStatus)) {
      automationResult = await triggerGrnAccepted(id);
    }

    res.json({ ...updated, automationResult });
  } catch (err: any) {
    console.error("GRN PATCH error:", err);
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

flexRouter.get("/flex/purchase-invoices", async (_req: Request, res: Response) => {
  const rows = await purchaseInvoicesTable.find().sort({ createdAt: -1 }).lean();
  res.json(rows);
});

flexRouter.post("/flex/purchase-invoices", async (req: Request, res: Response) => {
  const parsed = insertPurchaseInvoiceSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const row = await purchaseInvoicesTable.create(parsed.data);
  res.status(201).json(row.toObject());
});

flexRouter.patch("/flex/purchase-invoices/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    const prev = await purchaseInvoicesTable.findOne({ id }).lean();
    if (!prev) { res.status(404).json({ error: "Not found" }); return; }
    const previousMatchStatus = (prev as any).matchStatus;

    const updates: Record<string, any> = {};
    if (req.body.matchStatus) updates.matchStatus = req.body.matchStatus;
    if (req.body.paymentStatus) updates.paymentStatus = req.body.paymentStatus;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    if (req.body.taxableAmount !== undefined) updates.taxableAmount = req.body.taxableAmount;
    if (req.body.cgstAmount !== undefined) updates.cgstAmount = req.body.cgstAmount;
    if (req.body.sgstAmount !== undefined) updates.sgstAmount = req.body.sgstAmount;
    if (req.body.igstAmount !== undefined) updates.igstAmount = req.body.igstAmount;
    if (req.body.paymentDueDays !== undefined) updates.paymentDueDays = req.body.paymentDueDays;

    const updated = await purchaseInvoicesTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
    const newMatchStatus = (updated as any).matchStatus;
    let automationResult = null;
    if (newMatchStatus === "Matched" && previousMatchStatus !== "Matched") {
      automationResult = await triggerInvoiceMatched(id);
    }

    res.json({ ...updated, automationResult });
  } catch (err: any) {
    console.error("Purchase Invoice PATCH error:", err);
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

flexRouter.get("/flex/purchase-returns", async (_req: Request, res: Response) => {
  const rows = await purchaseReturnsTable.find().sort({ createdAt: -1 }).lean();
  res.json(rows);
});

flexRouter.post("/flex/purchase-returns", async (req: Request, res: Response) => {
  const parsed = insertPurchaseReturnSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const row = await purchaseReturnsTable.create(parsed.data);
  res.status(201).json(row.toObject());
});

flexRouter.patch("/flex/purchase-returns/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    const prev = await purchaseReturnsTable.findOne({ id }).lean();
    if (!prev) { res.status(404).json({ error: "Not found" }); return; }
    const previousStatus = (prev as any).status;

    const updates: Record<string, any> = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    if (req.body.itemId !== undefined) updates.itemId = req.body.itemId;
    if (req.body.locationId !== undefined) updates.locationId = req.body.locationId;
    if (req.body.returnAmount !== undefined) updates.returnAmount = req.body.returnAmount;
    if (req.body.cgstAmount !== undefined) updates.cgstAmount = req.body.cgstAmount;
    if (req.body.sgstAmount !== undefined) updates.sgstAmount = req.body.sgstAmount;
    if (req.body.igstAmount !== undefined) updates.igstAmount = req.body.igstAmount;

    const updated = await purchaseReturnsTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
    const newStatus = (updated as any).status;
    let automationResult = null;
    if (newStatus === "Sent" && previousStatus !== "Sent") {
      automationResult = await triggerPurchaseReturn(id);
    }

    res.json({ ...updated, automationResult });
  } catch (err: any) {
    console.error("Purchase Return PATCH error:", err);
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

export default flexRouter;
