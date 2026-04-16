import { type Request, type Response } from "express";
import {
  createFlexPurchaseOrder,
  createGoodsReceipt,
  createMaterialRequest,
  createPurchaseOrder,
  createPurchaseRequest,
  createRfq,
  createRfqBid,
  deleteFlexPurchaseOrder,
  deleteGoodsReceipt,
  deleteMaterialRequest,
  deletePurchaseRequest,
  getFlexPurchaseOrderById,
  getFlexPurchaseOrders,
  getGoodsReceiptById,
  getGoodsReceipts,
  getMaterialRequests,
  getPurchaseOrders,
  getPurchaseRequests,
  getRfqs,
  getRfqBids,
  selectRfqBid,
  updateFlexPurchaseOrder,
  updateGoodsReceipt,
  updateMaterialRequest,
  updatePurchaseRequest,
  updateRfq,
} from "../services/procurementService";
import {
  insertFlexPOItemSchema,
  insertFlexPOSchema,
  insertGoodsReceiptSchema,
  insertGrnItemSchema,
  insertMaterialRequestSchema,
  insertPurchaseOrderSchema,
  insertPurchaseRequestSchema,
  insertRfqBidSchema,
  insertRfqSchema,
} from "@workspace/db/schema";

export const handleGetPurchaseOrders = async (_req: Request, res: Response) => {
  res.json(await getPurchaseOrders());
};

export const handleCreatePurchaseOrder = async (req: Request, res: Response) => {
  const parsed = insertPurchaseOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const order = await createPurchaseOrder(parsed.data);
    res.status(201).json(order);
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ error: "A purchase order with this PO number already exists" });
      return;
    }
    console.error("Purchase order create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetMaterialRequests = async (_req: Request, res: Response) => {
  res.json(await getMaterialRequests());
};

export const handleCreateMaterialRequest = async (req: Request, res: Response) => {
  const parsed = insertMaterialRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const row = await createMaterialRequest(parsed.data);
  res.status(201).json(row);
};

export const handleUpdateMaterialRequest = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const updated = await updateMaterialRequest(id, req.body);
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
};

export const handleDeleteMaterialRequest = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await deleteMaterialRequest(id);
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
};

export const handleGetPurchaseRequests = async (_req: Request, res: Response) => {
  res.json(await getPurchaseRequests());
};

export const handleCreatePurchaseRequest = async (req: Request, res: Response) => {
  const parsed = insertPurchaseRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const row = await createPurchaseRequest(parsed.data);
  res.status(201).json(row);
};

export const handleUpdatePurchaseRequest = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const updated = await updatePurchaseRequest(id, req.body);
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
};

export const handleDeletePurchaseRequest = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await deletePurchaseRequest(id);
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
};

export const handleGetRfqs = async (_req: Request, res: Response) => {
  res.json(await getRfqs());
};

export const handleCreateRfq = async (req: Request, res: Response) => {
  const parsed = insertRfqSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const row = await createRfq(parsed.data);
  res.status(201).json(row);
};

export const handleUpdateRfq = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const updated = await updateRfq(id, req.body);
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
};

export const handleGetRfqBids = async (req: Request, res: Response) => {
  const rfqId = req.query.rfqId ? parseInt(req.query.rfqId as string) : undefined;
  res.json(await getRfqBids(rfqId));
};

export const handleCreateRfqBid = async (req: Request, res: Response) => {
  const parsed = insertRfqBidSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const row = await createRfqBid(parsed.data);
  res.status(201).json(row);
};

export const handleSelectRfqBid = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const updated = await selectRfqBid(id);
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
};

export const handleGetFlexPurchaseOrders = async (_req: Request, res: Response) => {
  res.json(await getFlexPurchaseOrders());
};

export const handleGetFlexPurchaseOrderById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const po = await getFlexPurchaseOrderById(id);
  if (!po) { res.status(404).json({ error: "Not found" }); return; }
  res.json(po);
};

export const handleCreateFlexPurchaseOrder = async (req: Request, res: Response) => {
  const { items, ...poData } = req.body;
  const parsed = insertFlexPOSchema.safeParse(poData);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "At least one line item required" });
    return;
  }
  try {
    const po = await createFlexPurchaseOrder(parsed.data, items);
    res.status(201).json(po);
  } catch (err: any) {
    console.error("Flex PO create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateFlexPurchaseOrder = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const updated = await updateFlexPurchaseOrder(id, req.body);
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
};

export const handleDeleteFlexPurchaseOrder = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await deleteFlexPurchaseOrder(id);
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
};

export const handleGetGoodsReceipts = async (_req: Request, res: Response) => {
  res.json(await getGoodsReceipts());
};

export const handleGetGoodsReceiptById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const grn = await getGoodsReceiptById(id);
  if (!grn) { res.status(404).json({ error: "Not found" }); return; }
  res.json(grn);
};

export const handleCreateGoodsReceipt = async (req: Request, res: Response) => {
  const { items, ...grnData } = req.body;
  const parsed = insertGoodsReceiptSchema.safeParse(grnData);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const grn = await createGoodsReceipt(parsed.data, Array.isArray(items) ? items : []);
    res.status(201).json(grn);
  } catch (err: any) {
    console.error("GRN create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateGoodsReceipt = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const updated = await updateGoodsReceipt(id, req.body);
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err: any) {
    if (err.message?.startsWith("Insufficient stock")) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error("GRN update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteGoodsReceipt = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await deleteGoodsReceipt(id);
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
};
