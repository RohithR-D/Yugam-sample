import {
  flexPOItemsTable,
  flexPurchaseOrdersTable,
  goodsReceiptsTable,
  grnItemsTable,
  insertFlexPOItemSchema,
  insertFlexPOSchema,
  insertGoodsReceiptSchema,
  insertGrnItemSchema,
  insertMaterialRequestSchema,
  insertPurchaseRequestSchema,
  insertPurchaseReturnSchema,
  insertPurchaseInvoiceSchema,
  insertPurchaseOrderSchema,
  insertPurchaseRequestSchema as insertPurchaseRequestSchemaAlias,
  insertRfqBidSchema,
  insertRfqSchema,
  materialRequestsTable,
  purchaseInvoicesTable,
  purchaseRequestsTable,
  purchaseReturnsTable,
  purchaseOrdersTable,
  rfqBidsTable,
  rfqTable,
} from "@workspace/db/schema";
import { triggerGrnAccepted } from "../routes/procurementAutomation";

export const getPurchaseOrders = async () => purchaseOrdersTable.find().sort({ createdAt: -1 }).lean();

export const createPurchaseOrder = async (data: any) => {
  const order = await purchaseOrdersTable.create(data);
  return order.toObject();
};

export const getMaterialRequests = async () => materialRequestsTable.find().sort({ createdAt: -1 }).lean();

export const createMaterialRequest = async (data: any) => {
  const row = await materialRequestsTable.create(data);
  return row.toObject();
};

export const updateMaterialRequest = async (id: number, updates: any) => {
  const allowedStatuses = ["Pending", "Approved", "Rejected"];
  const patch: Record<string, any> = {};
  if (updates.status && allowedStatuses.includes(updates.status)) patch.status = updates.status;
  if (updates.notes !== undefined) patch.notes = updates.notes;
  return await materialRequestsTable.findOneAndUpdate({ id }, { $set: patch }, { new: true }).lean();
};

export const deleteMaterialRequest = async (id: number) => {
  return await materialRequestsTable.findOneAndDelete({ id }).lean();
};

export const getPurchaseRequests = async () => purchaseRequestsTable.find().sort({ createdAt: -1 }).lean();

export const createPurchaseRequest = async (data: any) => {
  const row = await purchaseRequestsTable.create(data);
  return row.toObject();
};

export const updatePurchaseRequest = async (id: number, updates: any) => {
  const allowedStatuses = ["Pending", "Approved", "Rejected", "Converted"];
  const patch: Record<string, any> = {};
  if (updates.status && allowedStatuses.includes(updates.status)) patch.status = updates.status;
  if (updates.notes !== undefined) patch.notes = updates.notes;
  return await purchaseRequestsTable.findOneAndUpdate({ id }, { $set: patch }, { new: true }).lean();
};

export const deletePurchaseRequest = async (id: number) => {
  return await purchaseRequestsTable.findOneAndDelete({ id }).lean();
};

export const getRfqs = async () => rfqTable.find().sort({ createdAt: -1 }).lean();

export const createRfq = async (data: any) => {
  const row = await rfqTable.create(data);
  return row.toObject();
};

export const updateRfq = async (id: number, updates: any) => {
  const patch: Record<string, any> = {};
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.vendors !== undefined) patch.vendors = updates.vendors;
  return await rfqTable.findOneAndUpdate({ id }, { $set: patch }, { new: true }).lean();
};

export const getRfqBids = async (rfqId?: number) => {
  const filter: any = {};
  if (rfqId) filter.rfqId = rfqId;
  return rfqBidsTable.find(filter).sort({ createdAt: -1 }).lean();
};

export const createRfqBid = async (data: any) => {
  const row = await rfqBidsTable.create(data);
  return row.toObject();
};

export const selectRfqBid = async (id: number) => {
  const bid = await rfqBidsTable.findOne({ id }).lean();
  if (!bid) return null;
  await rfqBidsTable.updateMany({ rfqId: bid.rfqId }, { $set: { selected: "No" } });
  return await rfqBidsTable.findOneAndUpdate({ id }, { $set: { selected: "Yes" } }, { new: true }).lean();
};

export const getFlexPurchaseOrders = async () => flexPurchaseOrdersTable.find().sort({ createdAt: -1 }).lean();

export const getFlexPurchaseOrderById = async (id: number) => {
  const po = await flexPurchaseOrdersTable.findOne({ id }).lean();
  if (!po) return null;
  const items = await flexPOItemsTable.find({ poId: id }).lean();
  return { ...po, items };
};

export const createFlexPurchaseOrder = async (data: any, items: any[]) => {
  const po = await flexPurchaseOrdersTable.create(data);
  const poObj = po.toObject();
  if (items.length > 0) {
    const itemRows = items.map((item, index) => ({ ...item, poId: poObj.id }));
    await flexPOItemsTable.insertMany(itemRows);
  }
  const poItems = await flexPOItemsTable.find({ poId: poObj.id }).lean();
  return { ...poObj, items: poItems };
};

export const updateFlexPurchaseOrder = async (id: number, updates: any) => {
  const allowed = [
    "status", "terms", "vendorName", "poDate", "deliveryDate", "subtotal",
    "cgstTotal", "sgstTotal", "igstTotal", "grandTotal",
  ];
  const patched: Record<string, any> = {};
  for (const field of allowed) {
    if (updates[field] !== undefined) {
      if ((field === "poDate" || field === "deliveryDate") && typeof updates[field] === "string") {
        patched[field] = new Date(updates[field]);
      } else {
        patched[field] = updates[field];
      }
    }
  }
  return await flexPurchaseOrdersTable.findOneAndUpdate({ id }, { $set: patched }, { new: true }).lean();
};

export const deleteFlexPurchaseOrder = async (id: number) => {
  await flexPOItemsTable.deleteMany({ poId: id });
  return await flexPurchaseOrdersTable.findOneAndDelete({ id }).lean();
};

export const getGoodsReceipts = async () => goodsReceiptsTable.find().sort({ createdAt: -1 }).lean();

export const getGoodsReceiptById = async (id: number) => {
  const grn = await goodsReceiptsTable.findOne({ id }).lean();
  if (!grn) return null;
  const items = await grnItemsTable.find({ grnId: id }).lean();
  return { ...grn, items };
};

export const createGoodsReceipt = async (data: any, items: any[]) => {
  const grn = await goodsReceiptsTable.create(data);
  const grnObj = grn.toObject();
  if (items.length > 0) {
    const itemRows = items.map((item, index) => ({ ...item, grnId: grnObj.id }));
    await grnItemsTable.insertMany(itemRows);
  }
  const grnItems = await grnItemsTable.find({ grnId: grnObj.id }).lean();
  return { ...grnObj, items: grnItems };
};

export const updateGoodsReceipt = async (id: number, updates: any) => {
  const existing = await goodsReceiptsTable.findOne({ id }).lean();
  if (!existing) return null;
  const previousStatus = (existing as any).status;
  const validStatuses = ["Pending", "Partial", "Complete"];
  const patch: Record<string, any> = {};
  if (updates.status && validStatuses.includes(updates.status)) patch.status = updates.status;
  if (updates.notes !== undefined) patch.notes = updates.notes;
  if (updates.receivedBy !== undefined) patch.receivedBy = updates.receivedBy;
  if (updates.receivedAtLocationId !== undefined) patch.receivedAtLocationId = updates.receivedAtLocationId;

  const updated = await goodsReceiptsTable.findOneAndUpdate({ id }, { $set: patch }, { new: true }).lean();
  if (!updated) return null;

  if ((updated as any).status === "Complete" || (updated as any).status === "Partial") {
    await triggerGrnAccepted(id);
  }
  return updated;
};

export const deleteGoodsReceipt = async (id: number) => {
  await grnItemsTable.deleteMany({ grnId: id });
  return await goodsReceiptsTable.findOneAndDelete({ id }).lean();
};
