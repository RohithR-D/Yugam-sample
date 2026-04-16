import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const DocumentSequenceSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  prefix: { type: String, required: true },
  lastNumber: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

autoIncrementId(DocumentSequenceSchema, "document_sequences");
export const documentSequencesTable = mongoose.models.DocumentSequence || mongoose.model("DocumentSequence", DocumentSequenceSchema);

const ClientAddressSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  clientId: { type: Number, required: true },
  addressType: { type: String, default: "Billing" },
  addressLine1: { type: String, default: "" },
  addressLine2: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  pincode: { type: String, default: "" },
  country: { type: String, default: "India" },
  gstin: { type: String, default: "" },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ClientAddressSchema, "client_addresses");
export const clientAddressesTable = mongoose.models.ClientAddress || mongoose.model("ClientAddress", ClientAddressSchema);

export const insertClientAddressSchema = z.object({
  clientId: z.coerce.number(),
  addressType: z.enum(["Billing", "Shipping"]).default("Billing"),
  addressLine1: z.string().default("").optional(),
  addressLine2: z.string().default("").optional(),
  city: z.string().default("").optional(),
  state: z.string().default("").optional(),
  pincode: z.string().default("").optional(),
  country: z.string().default("India").optional(),
  gstin: z.string().default("").optional(),
  isDefault: z.boolean().default(false).optional(),
});

const QuotationSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  quoteNumber: { type: String, required: true },
  clientId: { type: Number, required: true },
  validityDays: { type: Number, default: 30 },
  quoteDate: { type: Date },
  billingAddressId: { type: Number },
  shippingAddressId: { type: Number },
  subtotal: { type: Number, default: 0 },
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  terms: { type: String, default: "" },
  notes: { type: String, default: "" },
  status: { type: String, default: "Draft" },
  createdBy: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(QuotationSchema, "quotations");
export const quotationsTable = mongoose.models.Quotation || mongoose.model("Quotation", QuotationSchema);

export const insertQuotationSchema = z.object({
  quoteNumber: z.string().min(1),
  clientId: z.coerce.number(),
  validityDays: z.coerce.number().default(30),
  quoteDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  billingAddressId: z.coerce.number().optional(),
  shippingAddressId: z.coerce.number().optional(),
  subtotal: z.coerce.number().default(0),
  cgstTotal: z.coerce.number().default(0),
  sgstTotal: z.coerce.number().default(0),
  igstTotal: z.coerce.number().default(0),
  grandTotal: z.coerce.number().default(0),
  discountAmount: z.coerce.number().default(0),
  terms: z.string().default("").optional(),
  notes: z.string().default("").optional(),
  status: z.enum(["Draft", "Sent", "Accepted", "Rejected", "Expired"]).default("Draft"),
  createdBy: z.coerce.number().optional(),
});

const QuotationItemSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  quoteId: { type: Number, required: true },
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

autoIncrementId(QuotationItemSchema, "quotation_items");
export const quotationItemsTable = mongoose.models.QuotationItem || mongoose.model("QuotationItem", QuotationItemSchema);

export const insertQuotationItemSchema = z.object({
  quoteId: z.coerce.number(),
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

const ProformaInvoiceSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  piNumber: { type: String, required: true },
  clientId: { type: Number, required: true },
  quoteId: { type: Number },
  piDate: { type: Date },
  billingAddressId: { type: Number },
  shippingAddressId: { type: Number },
  subtotal: { type: Number, default: 0 },
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  advanceReceived: { type: Number, default: 0 },
  terms: { type: String, default: "" },
  notes: { type: String, default: "" },
  status: { type: String, default: "Draft" },
  createdBy: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ProformaInvoiceSchema, "proforma_invoices");
export const proformaInvoicesTable = mongoose.models.ProformaInvoice || mongoose.model("ProformaInvoice", ProformaInvoiceSchema);

export const insertProformaInvoiceSchema = z.object({
  piNumber: z.string().min(1),
  clientId: z.coerce.number(),
  quoteId: z.coerce.number().optional(),
  piDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  billingAddressId: z.coerce.number().optional(),
  shippingAddressId: z.coerce.number().optional(),
  subtotal: z.coerce.number().default(0),
  cgstTotal: z.coerce.number().default(0),
  sgstTotal: z.coerce.number().default(0),
  igstTotal: z.coerce.number().default(0),
  grandTotal: z.coerce.number().default(0),
  discountAmount: z.coerce.number().default(0),
  advanceReceived: z.coerce.number().default(0),
  terms: z.string().default("").optional(),
  notes: z.string().default("").optional(),
  status: z.enum(["Draft", "Sent", "Acknowledged", "Converted"]).default("Draft"),
  createdBy: z.coerce.number().optional(),
});

const ProformaInvoiceItemSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  piId: { type: Number, required: true },
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

autoIncrementId(ProformaInvoiceItemSchema, "proforma_invoice_items");
export const proformaInvoiceItemsTable = mongoose.models.ProformaInvoiceItem || mongoose.model("ProformaInvoiceItem", ProformaInvoiceItemSchema);

export const insertProformaInvoiceItemSchema = z.object({
  piId: z.coerce.number(),
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

const SalesOrderSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  soNumber: { type: String, required: true },
  clientId: { type: Number, required: true },
  quoteId: { type: Number },
  piId: { type: Number },
  soDate: { type: Date },
  billingAddressId: { type: Number },
  shippingAddressId: { type: Number },
  subtotal: { type: Number, default: 0 },
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  promisedDeliveryDate: { type: Date },
  terms: { type: String, default: "" },
  notes: { type: String, default: "" },
  status: { type: String, default: "Pending" },
  createdBy: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(SalesOrderSchema, "sales_orders");
export const salesOrdersTable = mongoose.models.SalesOrder || mongoose.model("SalesOrder", SalesOrderSchema);

export const insertSalesOrderSchema = z.object({
  soNumber: z.string().min(1),
  clientId: z.coerce.number(),
  quoteId: z.coerce.number().optional(),
  piId: z.coerce.number().optional(),
  soDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  billingAddressId: z.coerce.number().optional(),
  shippingAddressId: z.coerce.number().optional(),
  subtotal: z.coerce.number().default(0),
  cgstTotal: z.coerce.number().default(0),
  sgstTotal: z.coerce.number().default(0),
  igstTotal: z.coerce.number().default(0),
  grandTotal: z.coerce.number().default(0),
  discountAmount: z.coerce.number().default(0),
  promisedDeliveryDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  terms: z.string().default("").optional(),
  notes: z.string().default("").optional(),
  status: z.enum(["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]).default("Pending"),
  createdBy: z.coerce.number().optional(),
});

const SalesOrderItemSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  soId: { type: Number, required: true },
  itemId: { type: Number },
  description: { type: String, required: true },
  hsnSac: { type: String, default: "" },
  qty: { type: Number, default: 1 },
  fulfilledQty: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  cgstPercent: { type: Number, default: 0 },
  sgstPercent: { type: Number, default: 0 },
  igstPercent: { type: Number, default: 0 },
  lineTotal: { type: Number, default: 0 },
});

autoIncrementId(SalesOrderItemSchema, "sales_order_items");
export const salesOrderItemsTable = mongoose.models.SalesOrderItem || mongoose.model("SalesOrderItem", SalesOrderItemSchema);

export const insertSalesOrderItemSchema = z.object({
  soId: z.coerce.number(),
  itemId: z.coerce.number().optional(),
  description: z.string().min(1),
  hsnSac: z.string().default("").optional(),
  qty: z.coerce.number().default(1),
  fulfilledQty: z.coerce.number().default(0),
  rate: z.coerce.number().default(0),
  cgstPercent: z.coerce.number().default(0),
  sgstPercent: z.coerce.number().default(0),
  igstPercent: z.coerce.number().default(0),
  lineTotal: z.coerce.number().default(0),
});

const DeliveryChallanSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  dcNumber: { type: String, required: true },
  clientId: { type: Number, required: true },
  soId: { type: Number },
  dcDate: { type: Date },
  dispatchDate: { type: Date },
  deliveryDate: { type: Date },
  billingAddressId: { type: Number },
  shippingAddressId: { type: Number },
  transporterName: { type: String, default: "" },
  vehicleNumber: { type: String, default: "" },
  lrNumber: { type: String, default: "" },
  subtotal: { type: Number, default: 0 },
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  terms: { type: String, default: "" },
  notes: { type: String, default: "" },
  status: { type: String, default: "Draft" },
  createdBy: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(DeliveryChallanSchema, "delivery_challans");
export const deliveryChallansTable = mongoose.models.DeliveryChallan || mongoose.model("DeliveryChallan", DeliveryChallanSchema);

export const insertDeliveryChallanSchema = z.object({
  dcNumber: z.string().min(1),
  clientId: z.coerce.number(),
  soId: z.coerce.number().optional(),
  dcDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  dispatchDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  deliveryDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  billingAddressId: z.coerce.number().optional(),
  shippingAddressId: z.coerce.number().optional(),
  transporterName: z.string().default("").optional(),
  vehicleNumber: z.string().default("").optional(),
  lrNumber: z.string().default("").optional(),
  subtotal: z.coerce.number().default(0),
  cgstTotal: z.coerce.number().default(0),
  sgstTotal: z.coerce.number().default(0),
  igstTotal: z.coerce.number().default(0),
  grandTotal: z.coerce.number().default(0),
  terms: z.string().default("").optional(),
  notes: z.string().default("").optional(),
  status: z.enum(["Draft", "Dispatched", "Delivered", "Returned"]).default("Draft"),
  createdBy: z.coerce.number().optional(),
});

const DeliveryChallanItemSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  dcId: { type: Number, required: true },
  soItemId: { type: Number },
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

autoIncrementId(DeliveryChallanItemSchema, "delivery_challan_items");
export const deliveryChallanItemsTable = mongoose.models.DeliveryChallanItem || mongoose.model("DeliveryChallanItem", DeliveryChallanItemSchema);

export const insertDeliveryChallanItemSchema = z.object({
  dcId: z.coerce.number(),
  soItemId: z.coerce.number().optional(),
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

const SalesInvoiceSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  invoiceNumber: { type: String, required: true },
  clientId: { type: Number, required: true },
  soId: { type: Number },
  dcId: { type: Number },
  invoiceDate: { type: Date },
  paymentDueDays: { type: Number, default: 30 },
  billingAddressId: { type: Number },
  shippingAddressId: { type: Number },
  placeOfSupply: { type: String, default: "" },
  reverseCharge: { type: Boolean, default: false },
  subtotal: { type: Number, default: 0 },
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  irnNumber: { type: String, default: "" },
  irnDate: { type: Date },
  eWayBillNumber: { type: String, default: "" },
  terms: { type: String, default: "" },
  notes: { type: String, default: "" },
  paymentStatus: { type: String, default: "Unpaid" },
  journalEntryId: { type: Number },
  createdBy: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(SalesInvoiceSchema, "sales_invoices");
export const salesInvoicesTable = mongoose.models.SalesInvoice || mongoose.model("SalesInvoice", SalesInvoiceSchema);

export const insertSalesInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  clientId: z.coerce.number(),
  soId: z.coerce.number().optional(),
  dcId: z.coerce.number().optional(),
  invoiceDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  paymentDueDays: z.coerce.number().default(30),
  billingAddressId: z.coerce.number().optional(),
  shippingAddressId: z.coerce.number().optional(),
  placeOfSupply: z.string().default("").optional(),
  reverseCharge: z.boolean().default(false).optional(),
  subtotal: z.coerce.number().default(0),
  cgstTotal: z.coerce.number().default(0),
  sgstTotal: z.coerce.number().default(0),
  igstTotal: z.coerce.number().default(0),
  grandTotal: z.coerce.number().default(0),
  discountAmount: z.coerce.number().default(0),
  amountPaid: z.coerce.number().default(0),
  balanceDue: z.coerce.number().default(0),
  irnNumber: z.string().default("").optional(),
  irnDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  eWayBillNumber: z.string().default("").optional(),
  terms: z.string().default("").optional(),
  notes: z.string().default("").optional(),
  paymentStatus: z.enum(["Unpaid", "Partial", "Paid"]).default("Unpaid"),
  createdBy: z.coerce.number().optional(),
});

const SalesInvoiceItemSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  invoiceId: { type: Number, required: true },
  soItemId: { type: Number },
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

autoIncrementId(SalesInvoiceItemSchema, "sales_invoice_items");
export const salesInvoiceItemsTable = mongoose.models.SalesInvoiceItem || mongoose.model("SalesInvoiceItem", SalesInvoiceItemSchema);

export const insertSalesInvoiceItemSchema = z.object({
  invoiceId: z.coerce.number(),
  soItemId: z.coerce.number().optional(),
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

const SalesReturnSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  returnNumber: { type: String, required: true },
  clientId: { type: Number, required: true },
  invoiceId: { type: Number },
  returnDate: { type: Date },
  restock: { type: Boolean, default: false },
  restockLocationId: { type: Number },
  subtotal: { type: Number, default: 0 },
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  notes: { type: String, default: "" },
  status: { type: String, default: "Initiated" },
  journalEntryId: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(SalesReturnSchema, "sales_returns");
export const salesReturnsTable = mongoose.models.SalesReturn || mongoose.model("SalesReturn", SalesReturnSchema);

export const insertSalesReturnSchema = z.object({
  returnNumber: z.string().min(1),
  clientId: z.coerce.number(),
  invoiceId: z.coerce.number().optional(),
  returnDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  restock: z.boolean().default(false).optional(),
  restockLocationId: z.coerce.number().optional(),
  subtotal: z.coerce.number().default(0),
  cgstTotal: z.coerce.number().default(0),
  sgstTotal: z.coerce.number().default(0),
  igstTotal: z.coerce.number().default(0),
  grandTotal: z.coerce.number().default(0),
  notes: z.string().default("").optional(),
  status: z.enum(["Initiated", "Received", "Credited"]).default("Initiated"),
});

const SalesReturnItemSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  returnId: { type: Number, required: true },
  invoiceItemId: { type: Number },
  itemId: { type: Number },
  description: { type: String, required: true },
  returnedQty: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  cgstPercent: { type: Number, default: 0 },
  sgstPercent: { type: Number, default: 0 },
  igstPercent: { type: Number, default: 0 },
  lineTotal: { type: Number, default: 0 },
});

autoIncrementId(SalesReturnItemSchema, "sales_return_items");
export const salesReturnItemsTable = mongoose.models.SalesReturnItem || mongoose.model("SalesReturnItem", SalesReturnItemSchema);

export const insertSalesReturnItemSchema = z.object({
  returnId: z.coerce.number(),
  invoiceItemId: z.coerce.number().optional(),
  itemId: z.coerce.number().optional(),
  description: z.string().min(1),
  returnedQty: z.coerce.number().default(0),
  rate: z.coerce.number().default(0),
  cgstPercent: z.coerce.number().default(0),
  sgstPercent: z.coerce.number().default(0),
  igstPercent: z.coerce.number().default(0),
  lineTotal: z.coerce.number().default(0),
});

const SalesPaymentSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  paymentNumber: { type: String, required: true },
  clientId: { type: Number, required: true },
  invoiceId: { type: Number },
  paymentDate: { type: Date },
  amount: { type: Number, default: 0 },
  paymentMode: { type: String, default: "Bank Transfer" },
  referenceNumber: { type: String, default: "" },
  journalEntryId: { type: Number },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(SalesPaymentSchema, "sales_payments");
export const salesPaymentsTable = mongoose.models.SalesPayment || mongoose.model("SalesPayment", SalesPaymentSchema);

export const insertSalesPaymentSchema = z.object({
  paymentNumber: z.string().min(1),
  clientId: z.coerce.number(),
  invoiceId: z.coerce.number().optional(),
  paymentDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  amount: z.coerce.number().default(0),
  paymentMode: z.enum(["Cash", "Bank Transfer", "Cheque", "UPI", "Card"]).default("Bank Transfer"),
  referenceNumber: z.string().default("").optional(),
  notes: z.string().default("").optional(),
});

export type DocumentSequence = mongoose.InferSchemaType<typeof DocumentSequenceSchema>;
export type ClientAddress = mongoose.InferSchemaType<typeof ClientAddressSchema>;
export type Quotation = mongoose.InferSchemaType<typeof QuotationSchema>;
export type QuotationItem = mongoose.InferSchemaType<typeof QuotationItemSchema>;
export type ProformaInvoice = mongoose.InferSchemaType<typeof ProformaInvoiceSchema>;
export type ProformaInvoiceItem = mongoose.InferSchemaType<typeof ProformaInvoiceItemSchema>;
export type SalesOrder = mongoose.InferSchemaType<typeof SalesOrderSchema>;
export type SalesOrderItem = mongoose.InferSchemaType<typeof SalesOrderItemSchema>;
export type DeliveryChallan = mongoose.InferSchemaType<typeof DeliveryChallanSchema>;
export type DeliveryChallanItem = mongoose.InferSchemaType<typeof DeliveryChallanItemSchema>;
export type SalesInvoice = mongoose.InferSchemaType<typeof SalesInvoiceSchema>;
export type SalesInvoiceItem = mongoose.InferSchemaType<typeof SalesInvoiceItemSchema>;
export type SalesReturn = mongoose.InferSchemaType<typeof SalesReturnSchema>;
export type SalesReturnItem = mongoose.InferSchemaType<typeof SalesReturnItemSchema>;
export type SalesPayment = mongoose.InferSchemaType<typeof SalesPaymentSchema>;
