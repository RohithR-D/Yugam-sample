import { pgTable, serial, varchar, integer, numeric, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const materialRequestsTable = pgTable("material_requests", {
  id: serial("id").primaryKey(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  itemId: integer("item_id"),
  requestedQty: integer("requested_qty").notNull().default(1),
  requiredByDate: timestamp("required_by_date"),
  department: varchar("department", { length: 100 }).notNull().default(""),
  project: varchar("project", { length: 255 }).notNull().default(""),
  requestedBy: varchar("requested_by", { length: 100 }).notNull().default(""),
  status: varchar("status", { length: 30 }).notNull().default("Pending"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMaterialRequestSchema = createInsertSchema(materialRequestsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
  requiredByDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
});

export const purchaseRequestsTable = pgTable("purchase_requests", {
  id: serial("id").primaryKey(),
  materialRequestId: integer("material_request_id").references(() => materialRequestsTable.id),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  itemId: integer("item_id"),
  requestedQty: integer("requested_qty").notNull().default(1),
  estimatedUnitPrice: numeric("estimated_unit_price", { precision: 14, scale: 2 }).notNull().default("0"),
  requiredByDate: timestamp("required_by_date"),
  department: varchar("department", { length: 100 }).notNull().default(""),
  project: varchar("project", { length: 255 }).notNull().default(""),
  requestedBy: varchar("requested_by", { length: 100 }).notNull().default(""),
  status: varchar("status", { length: 30 }).notNull().default("Pending"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPurchaseRequestSchema = createInsertSchema(purchaseRequestsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Pending", "Approved", "Rejected", "Converted"]).default("Pending"),
  requiredByDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
});

export const rfqTable = pgTable("rfq_requests", {
  id: serial("id").primaryKey(),
  purchaseRequestId: integer("purchase_request_id").references(() => purchaseRequestsTable.id),
  rfqNumber: varchar("rfq_number", { length: 100 }).notNull(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  itemId: integer("item_id"),
  quantity: integer("quantity").notNull().default(1),
  vendors: text("vendors").notNull().default("[]"),
  status: varchar("status", { length: 30 }).notNull().default("Open"),
  requiredByDate: timestamp("required_by_date"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRfqSchema = createInsertSchema(rfqTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Open", "Received", "Closed"]).default("Open"),
  requiredByDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
});

export const rfqBidsTable = pgTable("rfq_bids", {
  id: serial("id").primaryKey(),
  rfqId: integer("rfq_id").notNull().references(() => rfqTable.id),
  vendorName: varchar("vendor_name", { length: 255 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull().default("0"),
  taxPercent: numeric("tax_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  leadTimeDays: integer("lead_time_days").notNull().default(0),
  notes: text("notes").notNull().default(""),
  selected: varchar("selected", { length: 10 }).notNull().default("No"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRfqBidSchema = createInsertSchema(rfqBidsTable).omit({
  id: true,
  createdAt: true,
});

export const flexPurchaseOrdersTable = pgTable("flex_purchase_orders", {
  id: serial("id").primaryKey(),
  poNumber: varchar("po_number", { length: 100 }).notNull(),
  vendorName: varchar("vendor_name", { length: 255 }).notNull(),
  rfqId: integer("rfq_id").references(() => rfqTable.id),
  poDate: timestamp("po_date"),
  deliveryDate: timestamp("delivery_date"),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
  cgstTotal: numeric("cgst_total", { precision: 14, scale: 2 }).notNull().default("0"),
  sgstTotal: numeric("sgst_total", { precision: 14, scale: 2 }).notNull().default("0"),
  igstTotal: numeric("igst_total", { precision: 14, scale: 2 }).notNull().default("0"),
  grandTotal: numeric("grand_total", { precision: 14, scale: 2 }).notNull().default("0"),
  terms: text("terms").notNull().default(""),
  status: varchar("status", { length: 30 }).notNull().default("Draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFlexPOSchema = createInsertSchema(flexPurchaseOrdersTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Draft", "Sent", "Acknowledged", "Closed"]).default("Draft"),
  poDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
  deliveryDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
});

export const flexPOItemsTable = pgTable("flex_po_items", {
  id: serial("id").primaryKey(),
  poId: integer("po_id").notNull().references(() => flexPurchaseOrdersTable.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 500 }).notNull(),
  hsnSac: varchar("hsn_sac", { length: 20 }).notNull().default(""),
  qty: integer("qty").notNull().default(1),
  rate: numeric("rate", { precision: 14, scale: 2 }).notNull().default("0"),
  cgstPercent: numeric("cgst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  sgstPercent: numeric("sgst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  igstPercent: numeric("igst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  lineTotal: numeric("line_total", { precision: 14, scale: 2 }).notNull().default("0"),
});

export const insertFlexPOItemSchema = createInsertSchema(flexPOItemsTable).omit({ id: true });

export const goodsReceiptsTable = pgTable("goods_receipts", {
  id: serial("id").primaryKey(),
  grnNumber: varchar("grn_number", { length: 100 }).notNull(),
  poId: integer("po_id").notNull().references(() => flexPurchaseOrdersTable.id),
  vendorName: varchar("vendor_name", { length: 255 }).notNull().default(""),
  receivedDate: timestamp("received_date"),
  receivedBy: varchar("received_by", { length: 100 }).notNull().default(""),
  notes: text("notes").notNull().default(""),
  status: varchar("status", { length: 30 }).notNull().default("Pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGoodsReceiptSchema = createInsertSchema(goodsReceiptsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Pending", "Partial", "Complete"]).default("Pending"),
  receivedDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
});

export const grnItemsTable = pgTable("grn_items", {
  id: serial("id").primaryKey(),
  grnId: integer("grn_id").notNull().references(() => goodsReceiptsTable.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 500 }).notNull(),
  orderedQty: integer("ordered_qty").notNull().default(0),
  receivedQty: integer("received_qty").notNull().default(0),
  acceptedQty: integer("accepted_qty").notNull().default(0),
  rejectedQty: integer("rejected_qty").notNull().default(0),
});

export const insertGrnItemSchema = createInsertSchema(grnItemsTable).omit({ id: true });

export const purchaseInvoicesTable = pgTable("purchase_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull(),
  vendorName: varchar("vendor_name", { length: 255 }).notNull(),
  poId: integer("po_id").references(() => flexPurchaseOrdersTable.id),
  grnId: integer("grn_id").references(() => goodsReceiptsTable.id),
  invoiceDate: timestamp("invoice_date"),
  invoiceAmount: numeric("invoice_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  poAmount: numeric("po_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  grnAmount: numeric("grn_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  matchStatus: varchar("match_status", { length: 30 }).notNull().default("Pending"),
  paymentStatus: varchar("payment_status", { length: 30 }).notNull().default("Unpaid"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPurchaseInvoiceSchema = createInsertSchema(purchaseInvoicesTable).omit({
  id: true,
  createdAt: true,
}).extend({
  matchStatus: z.enum(["Pending", "Matched", "Mismatch"]).default("Pending"),
  paymentStatus: z.enum(["Unpaid", "Approved", "Paid"]).default("Unpaid"),
  invoiceDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
});

export const purchaseReturnsTable = pgTable("purchase_returns", {
  id: serial("id").primaryKey(),
  returnNumber: varchar("return_number", { length: 100 }).notNull(),
  vendorName: varchar("vendor_name", { length: 255 }).notNull(),
  poId: integer("po_id").references(() => flexPurchaseOrdersTable.id),
  grnId: integer("grn_id").references(() => goodsReceiptsTable.id),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  returnedQty: integer("returned_qty").notNull().default(0),
  reason: varchar("reason", { length: 30 }).notNull().default("Damage"),
  notes: text("notes").notNull().default(""),
  returnDate: timestamp("return_date"),
  status: varchar("status", { length: 30 }).notNull().default("Initiated"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPurchaseReturnSchema = createInsertSchema(purchaseReturnsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  reason: z.enum(["Damage", "Wrong Item", "Quality Issue", "Excess Quantity"]).default("Damage"),
  status: z.enum(["Initiated", "Sent", "Credited"]).default("Initiated"),
  returnDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
});

export type MaterialRequest = typeof materialRequestsTable.$inferSelect;
export type PurchaseRequest = typeof purchaseRequestsTable.$inferSelect;
export type Rfq = typeof rfqTable.$inferSelect;
export type RfqBid = typeof rfqBidsTable.$inferSelect;
export type FlexPurchaseOrder = typeof flexPurchaseOrdersTable.$inferSelect;
export type FlexPOItem = typeof flexPOItemsTable.$inferSelect;
export type GoodsReceipt = typeof goodsReceiptsTable.$inferSelect;
export type GrnItem = typeof grnItemsTable.$inferSelect;
export type PurchaseInvoice = typeof purchaseInvoicesTable.$inferSelect;
export type PurchaseReturn = typeof purchaseReturnsTable.$inferSelect;
