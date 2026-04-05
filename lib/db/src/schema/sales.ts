import { pgTable, serial, integer, varchar, numeric, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";
import { inventoryCatalogTable } from "./inventoryCatalog";
import { inventoryLocationsTable } from "./inventoryLocations";
import { usersTable } from "./users";
import { journalEntriesTable } from "./ledger";

export const documentSequencesTable = pgTable("document_sequences", {
  id: serial("id").primaryKey(),
  documentType: varchar("document_type", { length: 50 }).notNull().unique(),
  prefix: varchar("prefix", { length: 10 }).notNull(),
  financialYear: varchar("financial_year", { length: 4 }).notNull().default("2526"),
  lastNumber: integer("last_number").notNull().default(0),
  formatPattern: varchar("format_pattern", { length: 50 }).notNull().default("{prefix}-{fy}-{number:04d}"),
});

export const clientAddressesTable = pgTable("client_addresses", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id),
  addressType: varchar("address_type", { length: 20 }).notNull().default("Both"),
  label: varchar("label", { length: 100 }),
  addressLine1: varchar("address_line1", { length: 255 }).notNull(),
  addressLine2: varchar("address_line2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  stateCode: varchar("state_code", { length: 2 }).notNull(),
  pincode: varchar("pincode", { length: 6 }).notNull(),
  country: varchar("country", { length: 100 }).notNull().default("India"),
  gstin: varchar("gstin", { length: 15 }),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClientAddressSchema = createInsertSchema(clientAddressesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  addressType: z.enum(["Billing", "Shipping", "Both"]).default("Both"),
});

export const quotationsTable = pgTable("quotations", {
  id: serial("id").primaryKey(),
  quotationNumber: varchar("quotation_number", { length: 20 }).notNull().unique(),
  revisionNumber: integer("revision_number").notNull().default(0),
  clientId: integer("client_id").notNull().references(() => clientsTable.id),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientGstin: varchar("client_gstin", { length: 15 }),
  billingAddressId: integer("billing_address_id").references(() => clientAddressesTable.id),
  shippingAddressId: integer("shipping_address_id").references(() => clientAddressesTable.id),
  reference: varchar("reference", { length: 255 }),
  quotationDate: timestamp("quotation_date").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
  exchangeRate: numeric("exchange_rate", { precision: 10, scale: 4 }).notNull().default("1.0000"),
  placeOfSupply: varchar("place_of_supply", { length: 2 }),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  discountType: varchar("discount_type", { length: 20 }).notNull().default("None"),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  taxableAmount: numeric("taxable_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  cgstTotal: numeric("cgst_total", { precision: 12, scale: 2 }).notNull().default("0"),
  sgstTotal: numeric("sgst_total", { precision: 12, scale: 2 }).notNull().default("0"),
  igstTotal: numeric("igst_total", { precision: 12, scale: 2 }).notNull().default("0"),
  cessTotal: numeric("cess_total", { precision: 12, scale: 2 }),
  roundOff: numeric("round_off", { precision: 5, scale: 2 }).notNull().default("0"),
  grandTotal: numeric("grand_total", { precision: 12, scale: 2 }).notNull().default("0"),
  paymentTerms: text("payment_terms"),
  deliveryTimeline: varchar("delivery_timeline", { length: 255 }),
  notes: text("notes"),
  termsAndConditions: text("terms_and_conditions"),
  status: varchar("status", { length: 20 }).notNull().default("Draft"),
  createdBy: integer("created_by").notNull().references(() => usersTable.id),
  approvedBy: integer("approved_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuotationSchema = createInsertSchema(quotationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["Draft", "Sent", "Revised", "Accepted", "Rejected", "Expired", "Cancelled"]).default("Draft"),
  discountType: z.enum(["Percentage", "Amount", "None"]).default("None"),
  quotationDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  validUntil: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export const quotationItemsTable = pgTable("quotation_items", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").notNull().references(() => quotationsTable.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  itemId: integer("item_id").references(() => inventoryCatalogTable.id),
  itemType: varchar("item_type", { length: 20 }).notNull().default("Product"),
  itemCode: varchar("item_code", { length: 50 }),
  description: text("description").notNull(),
  hsnSac: varchar("hsn_sac", { length: 8 }).notNull().default(""),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull().default("1"),
  uom: varchar("uom", { length: 20 }).notNull().default("Nos"),
  rate: numeric("rate", { precision: 12, scale: 2 }).notNull().default("0"),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  taxableAmount: numeric("taxable_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  cgstPercent: numeric("cgst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  cgstAmount: numeric("cgst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  sgstPercent: numeric("sgst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  sgstAmount: numeric("sgst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  igstPercent: numeric("igst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  igstAmount: numeric("igst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  cessPercent: numeric("cess_percent", { precision: 5, scale: 2 }),
  cessAmount: numeric("cess_amount", { precision: 12, scale: 2 }),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull().default("0"),
});

export const insertQuotationItemSchema = createInsertSchema(quotationItemsTable).omit({ id: true }).extend({
  itemType: z.enum(["Product", "Service"]).default("Product"),
});

export const proformaInvoicesTable = pgTable("proforma_invoices", {
  id: serial("id").primaryKey(),
  proformaNumber: varchar("proforma_number", { length: 20 }).notNull().unique(),
  sourceQuotationId: integer("source_quotation_id").references(() => quotationsTable.id),
  clientId: integer("client_id").notNull().references(() => clientsTable.id),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientGstin: varchar("client_gstin", { length: 15 }),
  billingAddressId: integer("billing_address_id").references(() => clientAddressesTable.id),
  shippingAddressId: integer("shipping_address_id").references(() => clientAddressesTable.id),
  reference: varchar("reference", { length: 255 }),
  proformaDate: timestamp("proforma_date").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
  exchangeRate: numeric("exchange_rate", { precision: 10, scale: 4 }).notNull().default("1.0000"),
  placeOfSupply: varchar("place_of_supply", { length: 2 }),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  discountType: varchar("discount_type", { length: 20 }).notNull().default("None"),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  taxableAmount: numeric("taxable_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  cgstTotal: numeric("cgst_total", { precision: 12, scale: 2 }).notNull().default("0"),
  sgstTotal: numeric("sgst_total", { precision: 12, scale: 2 }).notNull().default("0"),
  igstTotal: numeric("igst_total", { precision: 12, scale: 2 }).notNull().default("0"),
  cessTotal: numeric("cess_total", { precision: 12, scale: 2 }),
  roundOff: numeric("round_off", { precision: 5, scale: 2 }).notNull().default("0"),
  grandTotal: numeric("grand_total", { precision: 12, scale: 2 }).notNull().default("0"),
  paymentTerms: text("payment_terms"),
  paymentInstructions: text("payment_instructions"),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  notes: text("notes"),
  termsAndConditions: text("terms_and_conditions"),
  status: varchar("status", { length: 20 }).notNull().default("Draft"),
  createdBy: integer("created_by").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProformaInvoiceSchema = createInsertSchema(proformaInvoicesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["Draft", "Sent", "Accepted", "Expired", "Cancelled"]).default("Draft"),
  discountType: z.enum(["Percentage", "Amount", "None"]).default("None"),
  proformaDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  validUntil: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  expectedDeliveryDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional().nullable(),
});

export const proformaInvoiceItemsTable = pgTable("proforma_invoice_items", {
  id: serial("id").primaryKey(),
  proformaId: integer("proforma_id").notNull().references(() => proformaInvoicesTable.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  itemId: integer("item_id").references(() => inventoryCatalogTable.id),
  itemType: varchar("item_type", { length: 20 }).notNull().default("Product"),
  itemCode: varchar("item_code", { length: 50 }),
  description: text("description").notNull(),
  hsnSac: varchar("hsn_sac", { length: 8 }).notNull().default(""),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull().default("1"),
  uom: varchar("uom", { length: 20 }).notNull().default("Nos"),
  rate: numeric("rate", { precision: 12, scale: 2 }).notNull().default("0"),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  taxableAmount: numeric("taxable_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  cgstPercent: numeric("cgst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  cgstAmount: numeric("cgst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  sgstPercent: numeric("sgst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  sgstAmount: numeric("sgst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  igstPercent: numeric("igst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  igstAmount: numeric("igst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  cessPercent: numeric("cess_percent", { precision: 5, scale: 2 }),
  cessAmount: numeric("cess_amount", { precision: 12, scale: 2 }),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull().default("0"),
});

export const insertProformaInvoiceItemSchema = createInsertSchema(proformaInvoiceItemsTable).omit({ id: true }).extend({
  itemType: z.enum(["Product", "Service"]).default("Product"),
});

export const salesOrdersTable = pgTable("sales_orders", {
  id: serial("id").primaryKey(),
  soNumber: varchar("so_number", { length: 20 }).notNull().unique(),
  sourceQuotationId: integer("source_quotation_id").references(() => quotationsTable.id),
  sourceProformaId: integer("source_proforma_id").references(() => proformaInvoicesTable.id),
  clientId: integer("client_id").notNull().references(() => clientsTable.id),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientGstin: varchar("client_gstin", { length: 15 }),
  billingAddressId: integer("billing_address_id").references(() => clientAddressesTable.id),
  shippingAddressId: integer("shipping_address_id").references(() => clientAddressesTable.id),
  customerPoNumber: varchar("customer_po_number", { length: 100 }),
  customerPoDate: timestamp("customer_po_date"),
  orderDate: timestamp("order_date").notNull(),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
  exchangeRate: numeric("exchange_rate", { precision: 10, scale: 4 }).notNull().default("1.0000"),
  placeOfSupply: varchar("place_of_supply", { length: 2 }),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  discountType: varchar("discount_type", { length: 20 }).notNull().default("None"),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  taxableAmount: numeric("taxable_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  cgstTotal: numeric("cgst_total", { precision: 12, scale: 2 }).notNull().default("0"),
  sgstTotal: numeric("sgst_total", { precision: 12, scale: 2 }).notNull().default("0"),
  igstTotal: numeric("igst_total", { precision: 12, scale: 2 }).notNull().default("0"),
  cessTotal: numeric("cess_total", { precision: 12, scale: 2 }),
  roundOff: numeric("round_off", { precision: 5, scale: 2 }).notNull().default("0"),
  grandTotal: numeric("grand_total", { precision: 12, scale: 2 }).notNull().default("0"),
  paymentTerms: text("payment_terms"),
  paymentDueDays: integer("payment_due_days"),
  deliveryStatus: varchar("delivery_status", { length: 20 }).notNull().default("Pending"),
  billingStatus: varchar("billing_status", { length: 20 }).notNull().default("Not Billed"),
  notes: text("notes"),
  termsAndConditions: text("terms_and_conditions"),
  status: varchar("status", { length: 20 }).notNull().default("Draft"),
  createdBy: integer("created_by").notNull().references(() => usersTable.id),
  approvedBy: integer("approved_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSalesOrderSchema = createInsertSchema(salesOrdersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["Draft", "Confirmed", "In Progress", "Completed", "Cancelled", "On Hold"]).default("Draft"),
  discountType: z.enum(["Percentage", "Amount", "None"]).default("None"),
  deliveryStatus: z.enum(["Pending", "Partial", "Delivered"]).default("Pending"),
  billingStatus: z.enum(["Not Billed", "Partial", "Fully Billed"]).default("Not Billed"),
  orderDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  expectedDeliveryDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional().nullable(),
  customerPoDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional().nullable(),
});

export const salesOrderItemsTable = pgTable("sales_order_items", {
  id: serial("id").primaryKey(),
  salesOrderId: integer("sales_order_id").notNull().references(() => salesOrdersTable.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  itemId: integer("item_id").references(() => inventoryCatalogTable.id),
  itemType: varchar("item_type", { length: 20 }).notNull().default("Product"),
  itemCode: varchar("item_code", { length: 50 }),
  description: text("description").notNull(),
  hsnSac: varchar("hsn_sac", { length: 8 }).notNull().default(""),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull().default("1"),
  uom: varchar("uom", { length: 20 }).notNull().default("Nos"),
  rate: numeric("rate", { precision: 12, scale: 2 }).notNull().default("0"),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  taxableAmount: numeric("taxable_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  cgstPercent: numeric("cgst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  cgstAmount: numeric("cgst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  sgstPercent: numeric("sgst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  sgstAmount: numeric("sgst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  igstPercent: numeric("igst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  igstAmount: numeric("igst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  cessPercent: numeric("cess_percent", { precision: 5, scale: 2 }),
  cessAmount: numeric("cess_amount", { precision: 12, scale: 2 }),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull().default("0"),
  deliveredQty: numeric("delivered_qty", { precision: 10, scale: 3 }).notNull().default("0"),
  billedQty: numeric("billed_qty", { precision: 10, scale: 3 }).notNull().default("0"),
});

export const insertSalesOrderItemSchema = createInsertSchema(salesOrderItemsTable).omit({ id: true }).extend({
  itemType: z.enum(["Product", "Service"]).default("Product"),
});

export const deliveryChallansTable = pgTable("delivery_challans", {
  id: serial("id").primaryKey(),
  challanNumber: varchar("challan_number", { length: 20 }).notNull().unique(),
  sourceSalesOrderId: integer("source_sales_order_id").references(() => salesOrdersTable.id),
  clientId: integer("client_id").notNull().references(() => clientsTable.id),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientGstin: varchar("client_gstin", { length: 15 }),
  billingAddressId: integer("billing_address_id").references(() => clientAddressesTable.id),
  shippingAddressId: integer("shipping_address_id").references(() => clientAddressesTable.id),
  challanType: varchar("challan_type", { length: 20 }).notNull().default("Supply"),
  challanDate: timestamp("challan_date").notNull(),
  dispatchFrom: text("dispatch_from"),
  vehicleNumber: varchar("vehicle_number", { length: 20 }),
  transporterName: varchar("transporter_name", { length: 255 }),
  transporterGstin: varchar("transporter_gstin", { length: 15 }),
  transportMode: varchar("transport_mode", { length: 10 }),
  lrNumber: varchar("lr_number", { length: 50 }),
  lrDate: timestamp("lr_date"),
  ewayBillNumber: varchar("eway_bill_number", { length: 20 }),
  ewayBillDate: timestamp("eway_bill_date"),
  ewayBillValidUntil: timestamp("eway_bill_valid_until"),
  approximateValue: numeric("approximate_value", { precision: 12, scale: 2 }),
  notes: text("notes"),
  receiverName: varchar("receiver_name", { length: 255 }),
  receivedDate: timestamp("received_date"),
  status: varchar("status", { length: 20 }).notNull().default("Draft"),
  createdBy: integer("created_by").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDeliveryChallanSchema = createInsertSchema(deliveryChallansTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["Draft", "Dispatched", "In Transit", "Delivered", "Returned", "Cancelled"]).default("Draft"),
  challanType: z.enum(["Supply", "Job Work", "Approval", "Exhibition", "Loan", "Others"]).default("Supply"),
  transportMode: z.enum(["Road", "Rail", "Air", "Ship"]).optional().nullable(),
  challanDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  lrDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional().nullable(),
  ewayBillDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional().nullable(),
  ewayBillValidUntil: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional().nullable(),
  receivedDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional().nullable(),
});

export const deliveryChallanItemsTable = pgTable("delivery_challan_items", {
  id: serial("id").primaryKey(),
  challanId: integer("challan_id").notNull().references(() => deliveryChallansTable.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  itemId: integer("item_id").references(() => inventoryCatalogTable.id),
  itemType: varchar("item_type", { length: 20 }).notNull().default("Product"),
  itemCode: varchar("item_code", { length: 50 }),
  description: text("description").notNull(),
  hsnSac: varchar("hsn_sac", { length: 8 }).notNull().default(""),
  soItemId: integer("so_item_id").references(() => salesOrderItemsTable.id),
  orderedQty: numeric("ordered_qty", { precision: 10, scale: 3 }),
  previouslyDispatchedQty: numeric("previously_dispatched_qty", { precision: 10, scale: 3 }).notNull().default("0"),
  dispatchedQty: numeric("dispatched_qty", { precision: 10, scale: 3 }).notNull().default("0"),
  uom: varchar("uom", { length: 20 }).notNull().default("Nos"),
  rate: numeric("rate", { precision: 12, scale: 2 }),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }),
});

export const insertDeliveryChallanItemSchema = createInsertSchema(deliveryChallanItemsTable).omit({ id: true }).extend({
  itemType: z.enum(["Product", "Service"]).default("Product"),
});

export const salesInvoicesTable = pgTable("sales_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 20 }).notNull().unique(),
  invoiceType: varchar("invoice_type", { length: 30 }).notNull().default("Tax Invoice"),
  sourceSalesOrderId: integer("source_sales_order_id").references(() => salesOrdersTable.id),
  sourceChallanId: integer("source_challan_id").references(() => deliveryChallansTable.id),
  clientId: integer("client_id").notNull().references(() => clientsTable.id),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientGstin: varchar("client_gstin", { length: 15 }),
  clientPan: varchar("client_pan", { length: 10 }),
  billingAddressId: integer("billing_address_id").references(() => clientAddressesTable.id),
  shippingAddressId: integer("shipping_address_id").references(() => clientAddressesTable.id),
  customerPoNumber: varchar("customer_po_number", { length: 100 }),
  invoiceDate: timestamp("invoice_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
  exchangeRate: numeric("exchange_rate", { precision: 10, scale: 4 }).notNull().default("1.0000"),
  placeOfSupply: varchar("place_of_supply", { length: 2 }),
  reverseCharge: boolean("reverse_charge").notNull().default(false),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  discountType: varchar("discount_type", { length: 20 }).notNull().default("None"),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  taxableAmount: numeric("taxable_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  cgstTotal: numeric("cgst_total", { precision: 12, scale: 2 }).notNull().default("0"),
  sgstTotal: numeric("sgst_total", { precision: 12, scale: 2 }).notNull().default("0"),
  igstTotal: numeric("igst_total", { precision: 12, scale: 2 }).notNull().default("0"),
  cessTotal: numeric("cess_total", { precision: 12, scale: 2 }),
  tcsPercent: numeric("tcs_percent", { precision: 5, scale: 2 }),
  tcsAmount: numeric("tcs_amount", { precision: 12, scale: 2 }),
  roundOff: numeric("round_off", { precision: 5, scale: 2 }).notNull().default("0"),
  grandTotal: numeric("grand_total", { precision: 12, scale: 2 }).notNull().default("0"),
  amountInWords: varchar("amount_in_words", { length: 500 }).notNull().default(""),
  amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  balanceDue: numeric("balance_due", { precision: 12, scale: 2 }).notNull().default("0"),
  paymentTerms: text("payment_terms"),
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("Unpaid"),
  ewayBillNumber: varchar("eway_bill_number", { length: 20 }),
  irnNumber: varchar("irn_number", { length: 64 }),
  irnDate: timestamp("irn_date"),
  ackNumber: varchar("ack_number", { length: 20 }),
  qrCodeData: text("qr_code_data"),
  notes: text("notes"),
  termsAndConditions: text("terms_and_conditions"),
  journalEntryId: integer("journal_entry_id").references(() => journalEntriesTable.id),
  status: varchar("status", { length: 20 }).notNull().default("Draft"),
  createdBy: integer("created_by").notNull().references(() => usersTable.id),
  approvedBy: integer("approved_by").references(() => usersTable.id),
  cancelledReason: text("cancelled_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSalesInvoiceSchema = createInsertSchema(salesInvoicesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  invoiceType: z.enum(["Tax Invoice", "Export", "SEZ", "Deemed Export", "Bill of Supply"]).default("Tax Invoice"),
  status: z.enum(["Draft", "Approved", "Sent", "Overdue", "Paid", "Cancelled", "Written Off"]).default("Draft"),
  paymentStatus: z.enum(["Unpaid", "Partial", "Paid", "Overdue", "Written Off"]).default("Unpaid"),
  discountType: z.enum(["Percentage", "Amount", "None"]).default("None"),
  invoiceDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  dueDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  irnDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional().nullable(),
});

export const salesInvoiceItemsTable = pgTable("sales_invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => salesInvoicesTable.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  itemId: integer("item_id").references(() => inventoryCatalogTable.id),
  itemType: varchar("item_type", { length: 20 }).notNull().default("Product"),
  itemCode: varchar("item_code", { length: 50 }),
  description: text("description").notNull(),
  hsnSac: varchar("hsn_sac", { length: 8 }).notNull().default(""),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull().default("1"),
  uom: varchar("uom", { length: 20 }).notNull().default("Nos"),
  rate: numeric("rate", { precision: 12, scale: 2 }).notNull().default("0"),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  taxableAmount: numeric("taxable_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  cgstPercent: numeric("cgst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  cgstAmount: numeric("cgst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  sgstPercent: numeric("sgst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  sgstAmount: numeric("sgst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  igstPercent: numeric("igst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  igstAmount: numeric("igst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  cessPercent: numeric("cess_percent", { precision: 5, scale: 2 }),
  cessAmount: numeric("cess_amount", { precision: 12, scale: 2 }),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull().default("0"),
  soItemId: integer("so_item_id").references(() => salesOrderItemsTable.id),
  challanItemId: integer("challan_item_id").references(() => deliveryChallanItemsTable.id),
});

export const insertSalesInvoiceItemSchema = createInsertSchema(salesInvoiceItemsTable).omit({ id: true }).extend({
  itemType: z.enum(["Product", "Service"]).default("Product"),
});

export const salesReturnsTable = pgTable("sales_returns", {
  id: serial("id").primaryKey(),
  returnNumber: varchar("return_number", { length: 20 }).notNull().unique(),
  creditNoteNumber: varchar("credit_note_number", { length: 20 }).notNull().unique(),
  sourceInvoiceId: integer("source_invoice_id").notNull().references(() => salesInvoicesTable.id),
  clientId: integer("client_id").notNull().references(() => clientsTable.id),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientGstin: varchar("client_gstin", { length: 15 }),
  returnDate: timestamp("return_date").notNull(),
  returnType: varchar("return_type", { length: 10 }).notNull().default("Partial"),
  reason: varchar("reason", { length: 30 }).notNull().default("Other"),
  reasonDetail: text("reason_detail"),
  placeOfSupply: varchar("place_of_supply", { length: 2 }),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  cgstTotal: numeric("cgst_total", { precision: 12, scale: 2 }).notNull().default("0"),
  sgstTotal: numeric("sgst_total", { precision: 12, scale: 2 }).notNull().default("0"),
  igstTotal: numeric("igst_total", { precision: 12, scale: 2 }).notNull().default("0"),
  cessTotal: numeric("cess_total", { precision: 12, scale: 2 }),
  roundOff: numeric("round_off", { precision: 5, scale: 2 }).notNull().default("0"),
  grandTotal: numeric("grand_total", { precision: 12, scale: 2 }).notNull().default("0"),
  restock: boolean("restock").notNull().default(false),
  restockLocationId: integer("restock_location_id").references(() => inventoryLocationsTable.id),
  journalEntryId: integer("journal_entry_id").references(() => journalEntriesTable.id),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).notNull().default("Draft"),
  createdBy: integer("created_by").notNull().references(() => usersTable.id),
  approvedBy: integer("approved_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSalesReturnSchema = createInsertSchema(salesReturnsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["Draft", "Confirmed", "Goods Received", "Credit Issued", "Cancelled"]).default("Draft"),
  returnType: z.enum(["Full", "Partial"]).default("Partial"),
  reason: z.enum(["Defective", "Wrong Item", "Excess Quantity", "Quality Issue", "Not as Described", "Customer Changed Mind", "Other"]).default("Other"),
  returnDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export const salesReturnItemsTable = pgTable("sales_return_items", {
  id: serial("id").primaryKey(),
  returnId: integer("return_id").notNull().references(() => salesReturnsTable.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  invoiceItemId: integer("invoice_item_id").references(() => salesInvoiceItemsTable.id),
  itemId: integer("item_id").references(() => inventoryCatalogTable.id),
  description: text("description").notNull(),
  hsnSac: varchar("hsn_sac", { length: 8 }).notNull().default(""),
  invoicedQty: numeric("invoiced_qty", { precision: 10, scale: 3 }).notNull(),
  returnedQty: numeric("returned_qty", { precision: 10, scale: 3 }).notNull(),
  uom: varchar("uom", { length: 20 }).notNull().default("Nos"),
  rate: numeric("rate", { precision: 12, scale: 2 }).notNull(),
  taxableAmount: numeric("taxable_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  cgstPercent: numeric("cgst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  cgstAmount: numeric("cgst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  sgstPercent: numeric("sgst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  sgstAmount: numeric("sgst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  igstPercent: numeric("igst_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  igstAmount: numeric("igst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull().default("0"),
});

export const insertSalesReturnItemSchema = createInsertSchema(salesReturnItemsTable).omit({ id: true });

export const salesPaymentsTable = pgTable("sales_payments", {
  id: serial("id").primaryKey(),
  paymentNumber: varchar("payment_number", { length: 20 }).notNull().unique(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  invoiceId: integer("invoice_id").references(() => salesInvoicesTable.id),
  paymentDate: timestamp("payment_date").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMode: varchar("payment_mode", { length: 20 }).notNull().default("Bank Transfer"),
  referenceNumber: varchar("reference_number", { length: 100 }),
  bankName: varchar("bank_name", { length: 255 }),
  depositedToAccount: varchar("deposited_to_account", { length: 100 }),
  bankCharges: numeric("bank_charges", { precision: 10, scale: 2 }).notNull().default("0"),
  tdsAmount: numeric("tds_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  tdsSection: varchar("tds_section", { length: 10 }),
  netReceived: numeric("net_received", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  journalEntryId: integer("journal_entry_id").references(() => journalEntriesTable.id),
  status: varchar("status", { length: 20 }).notNull().default("Received"),
  createdBy: integer("created_by").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSalesPaymentSchema = createInsertSchema(salesPaymentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["Received", "Deposited", "Bounced", "Cancelled"]).default("Received"),
  paymentMode: z.enum(["Cash", "Bank Transfer", "NEFT", "RTGS", "UPI", "Cheque", "DD", "Card", "Online", "Other"]).default("Bank Transfer"),
  paymentDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export type DocumentSequence = typeof documentSequencesTable.$inferSelect;
export type ClientAddress = typeof clientAddressesTable.$inferSelect;
export type Quotation = typeof quotationsTable.$inferSelect;
export type QuotationItem = typeof quotationItemsTable.$inferSelect;
export type ProformaInvoice = typeof proformaInvoicesTable.$inferSelect;
export type ProformaInvoiceItem = typeof proformaInvoiceItemsTable.$inferSelect;
export type SalesOrder = typeof salesOrdersTable.$inferSelect;
export type SalesOrderItem = typeof salesOrderItemsTable.$inferSelect;
export type DeliveryChallan = typeof deliveryChallansTable.$inferSelect;
export type DeliveryChallanItem = typeof deliveryChallanItemsTable.$inferSelect;
export type SalesInvoice = typeof salesInvoicesTable.$inferSelect;
export type SalesInvoiceItem = typeof salesInvoiceItemsTable.$inferSelect;
export type SalesReturn = typeof salesReturnsTable.$inferSelect;
export type SalesReturnItem = typeof salesReturnItemsTable.$inferSelect;
export type SalesPayment = typeof salesPaymentsTable.$inferSelect;
