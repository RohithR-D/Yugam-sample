import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const MaterialRequestSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  itemName: { type: String, required: true },
  itemId: { type: Number },
  requestedQty: { type: Number, default: 1 },
  requiredByDate: { type: Date },
  department: { type: String, default: "" },
  project: { type: String, default: "" },
  requestedBy: { type: String, default: "" },
  status: { type: String, default: "Pending" },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(MaterialRequestSchema, "material_requests");
export const materialRequestsTable = mongoose.models.MaterialRequest || mongoose.model("MaterialRequest", MaterialRequestSchema);

export const insertMaterialRequestSchema = z.object({
  itemName: z.string().min(1),
  itemId: z.coerce.number().optional(),
  requestedQty: z.coerce.number().default(1),
  requiredByDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  department: z.string().default("").optional(),
  project: z.string().default("").optional(),
  requestedBy: z.string().default("").optional(),
  status: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
  notes: z.string().default("").optional(),
});

const PurchaseRequestSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  materialRequestId: { type: Number },
  itemName: { type: String, required: true },
  itemId: { type: Number },
  requestedQty: { type: Number, default: 1 },
  estimatedUnitPrice: { type: Number, default: 0 },
  requiredByDate: { type: Date },
  department: { type: String, default: "" },
  project: { type: String, default: "" },
  requestedBy: { type: String, default: "" },
  status: { type: String, default: "Pending" },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(PurchaseRequestSchema, "purchase_requests");
export const purchaseRequestsTable = mongoose.models.PurchaseRequest || mongoose.model("PurchaseRequest", PurchaseRequestSchema);

export const insertPurchaseRequestSchema = z.object({
  materialRequestId: z.coerce.number().optional(),
  itemName: z.string().min(1),
  itemId: z.coerce.number().optional(),
  requestedQty: z.coerce.number().default(1),
  estimatedUnitPrice: z.coerce.number().default(0),
  requiredByDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  department: z.string().default("").optional(),
  project: z.string().default("").optional(),
  requestedBy: z.string().default("").optional(),
  status: z.enum(["Pending", "Approved", "Rejected", "Converted"]).default("Pending"),
  notes: z.string().default("").optional(),
});

const RfqSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  purchaseRequestId: { type: Number },
  rfqNumber: { type: String, required: true },
  itemName: { type: String, required: true },
  itemId: { type: Number },
  quantity: { type: Number, default: 1 },
  vendors: { type: String, default: "[]" },
  status: { type: String, default: "Open" },
  requiredByDate: { type: Date },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(RfqSchema, "rfq_requests");
export const rfqTable = mongoose.models.Rfq || mongoose.model("Rfq", RfqSchema);

export const insertRfqSchema = z.object({
  purchaseRequestId: z.coerce.number().optional(),
  rfqNumber: z.string().min(1),
  itemName: z.string().min(1),
  itemId: z.coerce.number().optional(),
  quantity: z.coerce.number().default(1),
  vendors: z.string().default("[]").optional(),
  status: z.enum(["Open", "Received", "Closed"]).default("Open"),
  requiredByDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  notes: z.string().default("").optional(),
});

const RfqBidSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  rfqId: { type: Number, required: true },
  vendorName: { type: String, required: true },
  unitPrice: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 0 },
  leadTimeDays: { type: Number, default: 0 },
  notes: { type: String, default: "" },
  selected: { type: String, default: "No" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(RfqBidSchema, "rfq_bids");
export const rfqBidsTable = mongoose.models.RfqBid || mongoose.model("RfqBid", RfqBidSchema);

export const insertRfqBidSchema = z.object({
  rfqId: z.coerce.number(),
  vendorName: z.string().min(1),
  unitPrice: z.coerce.number().default(0),
  taxPercent: z.coerce.number().default(0),
  leadTimeDays: z.coerce.number().default(0),
  notes: z.string().default("").optional(),
  selected: z.string().default("No").optional(),
});

const FlexPurchaseOrderSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  poNumber: { type: String, required: true },
  vendorName: { type: String, required: true },
  rfqId: { type: Number },
  poDate: { type: Date },
  deliveryDate: { type: Date },
  subtotal: { type: Number, default: 0 },
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  terms: { type: String, default: "" },
  status: { type: String, default: "Draft" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(FlexPurchaseOrderSchema, "flex_purchase_orders");
export const flexPurchaseOrdersTable = mongoose.models.FlexPurchaseOrder || mongoose.model("FlexPurchaseOrder", FlexPurchaseOrderSchema);

export const insertFlexPOSchema = z.object({
  poNumber: z.string().min(1),
  vendorName: z.string().min(1),
  rfqId: z.coerce.number().optional(),
  poDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  deliveryDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  subtotal: z.coerce.number().default(0),
  cgstTotal: z.coerce.number().default(0),
  sgstTotal: z.coerce.number().default(0),
  igstTotal: z.coerce.number().default(0),
  grandTotal: z.coerce.number().default(0),
  terms: z.string().default("").optional(),
  status: z.enum(["Draft", "Sent", "Acknowledged", "Closed"]).default("Draft"),
});

const FlexPOItemSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  poId: { type: Number, required: true },
  itemId: { type: Number },
  description: { type: String, required: true },
  hsnSac: { type: String, default: "" },
  qty: { type: Number, default: 1 },
  rate: { type: Number, default: 0 },
  cgstPercent: { type: Number, default: 0 },
  sgstPercent: { type: Number, default: 0 },
  igstPercent: { type: Number, default: 0 },
  lineTotal: { type: Number, default: 0 },
});

autoIncrementId(FlexPOItemSchema, "flex_po_items");
export const flexPOItemsTable = mongoose.models.FlexPOItem || mongoose.model("FlexPOItem", FlexPOItemSchema);

export const insertFlexPOItemSchema = z.object({
  poId: z.coerce.number(),
  itemId: z.coerce.number().optional(),
  description: z.string().min(1),
  hsnSac: z.string().default("").optional(),
  qty: z.coerce.number().default(1),
  rate: z.coerce.number().default(0),
  cgstPercent: z.coerce.number().default(0),
  sgstPercent: z.coerce.number().default(0),
  igstPercent: z.coerce.number().default(0),
  lineTotal: z.coerce.number().default(0),
});

const GoodsReceiptSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  grnNumber: { type: String, required: true },
  poId: { type: Number, required: true },
  vendorName: { type: String, default: "" },
  receivedDate: { type: Date },
  receivedBy: { type: String, default: "" },
  receivedAtLocationId: { type: Number },
  notes: { type: String, default: "" },
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(GoodsReceiptSchema, "goods_receipts");
export const goodsReceiptsTable = mongoose.models.GoodsReceipt || mongoose.model("GoodsReceipt", GoodsReceiptSchema);

export const insertGoodsReceiptSchema = z.object({
  grnNumber: z.string().min(1),
  poId: z.coerce.number(),
  vendorName: z.string().default("").optional(),
  receivedDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  receivedBy: z.string().default("").optional(),
  receivedAtLocationId: z.coerce.number().optional(),
  notes: z.string().default("").optional(),
  status: z.enum(["Pending", "Partial", "Complete"]).default("Pending"),
});

const GrnItemSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  grnId: { type: Number, required: true },
  itemId: { type: Number },
  poItemId: { type: Number },
  description: { type: String, required: true },
  orderedQty: { type: Number, default: 0 },
  receivedQty: { type: Number, default: 0 },
  acceptedQty: { type: Number, default: 0 },
  rejectedQty: { type: Number, default: 0 },
});

autoIncrementId(GrnItemSchema, "grn_items");
export const grnItemsTable = mongoose.models.GrnItem || mongoose.model("GrnItem", GrnItemSchema);

export const insertGrnItemSchema = z.object({
  grnId: z.coerce.number(),
  itemId: z.coerce.number().optional(),
  poItemId: z.coerce.number().optional(),
  description: z.string().min(1),
  orderedQty: z.coerce.number().default(0),
  receivedQty: z.coerce.number().default(0),
  acceptedQty: z.coerce.number().default(0),
  rejectedQty: z.coerce.number().default(0),
});

const PurchaseInvoiceSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  invoiceNumber: { type: String, required: true },
  vendorName: { type: String, required: true },
  poId: { type: Number },
  grnId: { type: Number },
  invoiceDate: { type: Date },
  paymentDueDays: { type: Number, default: 30 },
  invoiceAmount: { type: Number, default: 0 },
  taxableAmount: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  poAmount: { type: Number, default: 0 },
  grnAmount: { type: Number, default: 0 },
  matchStatus: { type: String, default: "Pending" },
  paymentStatus: { type: String, default: "Unpaid" },
  journalEntryId: { type: Number },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(PurchaseInvoiceSchema, "purchase_invoices");
export const purchaseInvoicesTable = mongoose.models.PurchaseInvoice || mongoose.model("PurchaseInvoice", PurchaseInvoiceSchema);

export const insertPurchaseInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  vendorName: z.string().min(1),
  poId: z.coerce.number().optional(),
  grnId: z.coerce.number().optional(),
  invoiceDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  paymentDueDays: z.coerce.number().default(30),
  invoiceAmount: z.coerce.number().default(0),
  taxableAmount: z.coerce.number().default(0),
  cgstAmount: z.coerce.number().default(0),
  sgstAmount: z.coerce.number().default(0),
  igstAmount: z.coerce.number().default(0),
  poAmount: z.coerce.number().default(0),
  grnAmount: z.coerce.number().default(0),
  matchStatus: z.enum(["Pending", "Matched", "Mismatch"]).default("Pending"),
  paymentStatus: z.enum(["Unpaid", "Approved", "Paid"]).default("Unpaid"),
  notes: z.string().default("").optional(),
});

const PurchaseReturnSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  returnNumber: { type: String, required: true },
  vendorName: { type: String, required: true },
  poId: { type: Number },
  grnId: { type: Number },
  itemId: { type: Number },
  locationId: { type: Number },
  itemName: { type: String, required: true },
  returnedQty: { type: Number, default: 0 },
  returnAmount: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  reason: { type: String, default: "Damage" },
  notes: { type: String, default: "" },
  returnDate: { type: Date },
  journalEntryId: { type: Number },
  status: { type: String, default: "Initiated" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(PurchaseReturnSchema, "purchase_returns");
export const purchaseReturnsTable = mongoose.models.PurchaseReturn || mongoose.model("PurchaseReturn", PurchaseReturnSchema);

export const insertPurchaseReturnSchema = z.object({
  returnNumber: z.string().min(1),
  vendorName: z.string().min(1),
  poId: z.coerce.number().optional(),
  grnId: z.coerce.number().optional(),
  itemId: z.coerce.number().optional(),
  locationId: z.coerce.number().optional(),
  itemName: z.string().min(1),
  returnedQty: z.coerce.number().default(0),
  returnAmount: z.coerce.number().default(0),
  cgstAmount: z.coerce.number().default(0),
  sgstAmount: z.coerce.number().default(0),
  igstAmount: z.coerce.number().default(0),
  reason: z.enum(["Damage", "Wrong Item", "Quality Issue", "Excess Quantity"]).default("Damage"),
  notes: z.string().default("").optional(),
  returnDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  status: z.enum(["Initiated", "Sent", "Credited"]).default("Initiated"),
});

export type MaterialRequest = mongoose.InferSchemaType<typeof MaterialRequestSchema>;
export type PurchaseRequest = mongoose.InferSchemaType<typeof PurchaseRequestSchema>;
export type Rfq = mongoose.InferSchemaType<typeof RfqSchema>;
export type RfqBid = mongoose.InferSchemaType<typeof RfqBidSchema>;
export type FlexPurchaseOrder = mongoose.InferSchemaType<typeof FlexPurchaseOrderSchema>;
export type FlexPOItem = mongoose.InferSchemaType<typeof FlexPOItemSchema>;
export type GoodsReceipt = mongoose.InferSchemaType<typeof GoodsReceiptSchema>;
export type GrnItem = mongoose.InferSchemaType<typeof GrnItemSchema>;
export type PurchaseInvoice = mongoose.InferSchemaType<typeof PurchaseInvoiceSchema>;
export type PurchaseReturn = mongoose.InferSchemaType<typeof PurchaseReturnSchema>;
