import { Router, type Request, type Response } from "express";
import {
  documentSequencesTable, clientAddressesTable,
  quotationsTable, quotationItemsTable,
  proformaInvoicesTable, proformaInvoiceItemsTable,
  salesOrdersTable, salesOrderItemsTable,
  deliveryChallansTable, deliveryChallanItemsTable,
  salesInvoicesTable, salesInvoiceItemsTable,
  salesReturnsTable, salesReturnItemsTable,
  salesPaymentsTable,
  insertClientAddressSchema,
  insertQuotationSchema, insertQuotationItemSchema,
  insertProformaInvoiceSchema, insertProformaInvoiceItemSchema,
  insertSalesOrderSchema, insertSalesOrderItemSchema,
  insertDeliveryChallanSchema, insertDeliveryChallanItemSchema,
  insertSalesInvoiceSchema, insertSalesInvoiceItemSchema,
  insertSalesReturnSchema, insertSalesReturnItemSchema,
  insertSalesPaymentSchema,
  clientsTable,
} from "@workspace/db/schema";
import { triggerInvoiceApproved, triggerPaymentReceived, triggerReturnCreditIssued, triggerOverdueCheck } from "./salesLedgerAutomation";
import { triggerChallanDispatched, triggerReturnRestock } from "./salesInventoryAutomation";

const r = Router();

const COMPANY_STATE_CODE = "27";

function determineGstType(placeOfSupply: string | null | undefined): "igst" | "cgst_sgst" {
  if (!placeOfSupply) return "cgst_sgst";
  return placeOfSupply === COMPANY_STATE_CODE ? "cgst_sgst" : "igst";
}

async function getNextDocNumber(docType: string): Promise<string> {
  const seq = await documentSequencesTable.findOneAndUpdate(
    { documentType: docType },
    { $inc: { lastNumber: 1 } },
    { new: true },
  ).lean();
  if (!seq) throw new Error(`No sequence configured for ${docType}`);
  const num = String((seq as any).lastNumber).padStart(4, "0");
  return `${(seq as any).prefix}-${(seq as any).financialYear}-${num}`;
}

function buildSalesOverview(
  quotations: any[], proformas: any[], orders: any[],
  invoices: any[], returns: any[], payments: any[],
) {
  const totalInvoiced = invoices.reduce((s: number, i: any) => s + parseFloat(i.grandTotal || "0"), 0);
  const totalPaid = invoices.filter((i: any) => i.paymentStatus === "Paid").reduce((s: number, i: any) => s + parseFloat(i.grandTotal || "0"), 0);
  const totalUnpaid = invoices.filter((i: any) => ["Unpaid", "Partial", "Overdue"].includes(i.paymentStatus)).reduce((s: number, i: any) => s + parseFloat(i.balanceDue || "0"), 0);
  return {
    totalInvoiced, totalPaid, totalUnpaid,
    counts: {
      quotations: quotations.length,
      proformaInvoices: proformas.length,
      salesOrders: orders.length,
      invoices: invoices.length,
      returns: returns.length,
      payments: payments.length,
    },
  };
}

r.get("/sales/overdue-check", async (_req: Request, res: Response) => {
  try {
    const result = await triggerOverdueCheck();
    res.json(result);
  } catch (err: any) {
    console.error("Overdue check error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

r.get("/sales/overview", async (_req: Request, res: Response) => {
  try {
    triggerOverdueCheck().catch((e) => console.error("[AUTO:SALES] Background overdue check error:", e.message));
    const [quotations, proformas, orders, invoices, returns, payments] = await Promise.all([
      quotationsTable.find({}).lean(),
      proformaInvoicesTable.find({}).lean(),
      salesOrdersTable.find({}).lean(),
      salesInvoicesTable.find({}).lean(),
      salesReturnsTable.find({}).lean(),
      salesPaymentsTable.find({}).lean(),
    ]);
    res.json(buildSalesOverview(quotations, proformas, orders, invoices, returns, payments));
  } catch (err: any) {
    console.error("Sales overview error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

r.get("/sales/all-documents", async (_req: Request, res: Response) => {
  try {
    const [quotations, proformas, orders, challans, invoices, returns] = await Promise.all([
      quotationsTable.find({}).sort({ createdAt: -1 }).lean(),
      proformaInvoicesTable.find({}).sort({ createdAt: -1 }).lean(),
      salesOrdersTable.find({}).sort({ createdAt: -1 }).lean(),
      deliveryChallansTable.find({}).sort({ createdAt: -1 }).lean(),
      salesInvoicesTable.find({}).sort({ createdAt: -1 }).lean(),
      salesReturnsTable.find({}).sort({ createdAt: -1 }).lean(),
    ]);
    const docs = [
      ...quotations.map((q: any) => ({ ...q, documentType: "Quotation", documentNumber: q.quotationNumber, grandTotal: q.grandTotal })),
      ...proformas.map((p: any) => ({ ...p, documentType: "Proforma Invoice", documentNumber: p.proformaNumber, grandTotal: p.grandTotal })),
      ...orders.map((o: any) => ({ ...o, documentType: "Sales Order", documentNumber: o.soNumber, grandTotal: o.grandTotal })),
      ...challans.map((c: any) => ({ ...c, documentType: "Delivery Challan", documentNumber: c.challanNumber, grandTotal: c.approximateValue || "0" })),
      ...invoices.map((i: any) => ({ ...i, documentType: "Invoice", documentNumber: i.invoiceNumber, grandTotal: i.grandTotal })),
      ...returns.map((r: any) => ({ ...r, documentType: "Sales Return", documentNumber: r.returnNumber, grandTotal: r.grandTotal })),
    ];
    docs.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(docs);
  } catch (err: any) {
    console.error("All docs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

r.get("/sales/client-addresses", async (req: Request, res: Response) => {
  const filter: any = {};
  if (req.query.clientId) filter.clientId = parseInt(req.query.clientId as string);
  res.json(await clientAddressesTable.find(filter).lean());
});

r.post("/sales/client-addresses", async (req: Request, res: Response) => {
  const parsed = insertClientAddressSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const addr = (await clientAddressesTable.create(parsed.data)).toObject();
  res.status(201).json(addr);
});

r.patch("/sales/client-addresses/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const updated = await clientAddressesTable.findOneAndUpdate({ id }, { $set: { ...req.body, updatedAt: new Date() } }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

r.delete("/sales/client-addresses/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await clientAddressesTable.findOneAndDelete({ id }).lean();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

// --- Quotations ---
r.get("/sales/quotations", async (_req: Request, res: Response) => {
  res.json(await quotationsTable.find({}).sort({ createdAt: -1 }).lean());
});

r.get("/sales/quotations/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const doc = await quotationsTable.findOne({ id }).lean();
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const items = await quotationItemsTable.find({ quotationId: id }).lean();
  res.json({ ...doc, items });
});

r.post("/sales/quotations", async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  try {
    const quotationNumber = await getNextDocNumber("quotation");
    const parsed = insertQuotationSchema.safeParse({ ...docData, quotationNumber, createdBy: (req as any).user?.userId || 1 });
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
    const doc = (await quotationsTable.create(parsed.data)).toObject();
    if (items?.length) {
      await quotationItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, quotationId: doc.id, sortOrder: i })));
    }
    const savedItems = await quotationItemsTable.find({ quotationId: doc.id }).lean();
    res.status(201).json({ ...doc, items: savedItems });
  } catch (err: any) {
    console.error("Quotation create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

r.patch("/sales/quotations/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { items, ...updateData } = req.body;
  try {
    const updated = await quotationsTable.findOneAndUpdate({ id }, { $set: { ...updateData, updatedAt: new Date() } }, { new: true }).lean();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    if (items && Array.isArray(items)) {
      await quotationItemsTable.deleteMany({ quotationId: id });
      if (items.length > 0) await quotationItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, quotationId: id, sortOrder: i })));
    }
    const savedItems = await quotationItemsTable.find({ quotationId: id }).lean();
    res.json({ ...updated, items: savedItems });
  } catch (err: any) {
    console.error("Quotation update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

r.delete("/sales/quotations/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await quotationsTable.findOneAndDelete({ id }).lean();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

// --- Proforma Invoices ---
r.get("/sales/proforma-invoices", async (_req: Request, res: Response) => {
  res.json(await proformaInvoicesTable.find({}).sort({ createdAt: -1 }).lean());
});

r.get("/sales/proforma-invoices/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const doc = await proformaInvoicesTable.findOne({ id }).lean();
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const items = await proformaInvoiceItemsTable.find({ proformaId: id }).lean();
  res.json({ ...doc, items });
});

r.post("/sales/proforma-invoices", async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  try {
    const proformaNumber = await getNextDocNumber("proforma_invoice");
    const parsed = insertProformaInvoiceSchema.safeParse({ ...docData, proformaNumber, createdBy: (req as any).user?.userId || 1 });
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
    const doc = (await proformaInvoicesTable.create(parsed.data)).toObject();
    if (items?.length) await proformaInvoiceItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, proformaId: doc.id, sortOrder: i })));
    const savedItems = await proformaInvoiceItemsTable.find({ proformaId: doc.id }).lean();
    res.status(201).json({ ...doc, items: savedItems });
  } catch (err: any) {
    console.error("Proforma create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

r.patch("/sales/proforma-invoices/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { items, ...updateData } = req.body;
  try {
    const updated = await proformaInvoicesTable.findOneAndUpdate({ id }, { $set: { ...updateData, updatedAt: new Date() } }, { new: true }).lean();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    if (items && Array.isArray(items)) {
      await proformaInvoiceItemsTable.deleteMany({ proformaId: id });
      if (items.length > 0) await proformaInvoiceItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, proformaId: id, sortOrder: i })));
    }
    const savedItems = await proformaInvoiceItemsTable.find({ proformaId: id }).lean();
    res.json({ ...updated, items: savedItems });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

r.delete("/sales/proforma-invoices/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await proformaInvoicesTable.findOneAndDelete({ id }).lean();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

// --- Sales Orders ---
r.get("/sales/orders", async (_req: Request, res: Response) => {
  res.json(await salesOrdersTable.find({}).sort({ createdAt: -1 }).lean());
});

r.get("/sales/orders/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const doc = await salesOrdersTable.findOne({ id }).lean();
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const items = await salesOrderItemsTable.find({ salesOrderId: id }).lean();
  res.json({ ...doc, items });
});

r.post("/sales/orders", async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  try {
    const soNumber = await getNextDocNumber("sales_order");
    const parsed = insertSalesOrderSchema.safeParse({ ...docData, soNumber, createdBy: (req as any).user?.userId || 1 });
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
    const doc = (await salesOrdersTable.create(parsed.data)).toObject();
    if (items?.length) await salesOrderItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, salesOrderId: doc.id, sortOrder: i })));
    const savedItems = await salesOrderItemsTable.find({ salesOrderId: doc.id }).lean();
    res.status(201).json({ ...doc, items: savedItems });
  } catch (err: any) {
    console.error("Sales order create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

r.patch("/sales/orders/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { items, ...updateData } = req.body;
  try {
    const updated = await salesOrdersTable.findOneAndUpdate({ id }, { $set: { ...updateData, updatedAt: new Date() } }, { new: true }).lean();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    if (items && Array.isArray(items)) {
      await salesOrderItemsTable.deleteMany({ salesOrderId: id });
      if (items.length > 0) await salesOrderItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, salesOrderId: id, sortOrder: i })));
    }
    const savedItems = await salesOrderItemsTable.find({ salesOrderId: id }).lean();
    res.json({ ...updated, items: savedItems });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

r.delete("/sales/orders/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await salesOrdersTable.findOneAndDelete({ id }).lean();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

// --- Delivery Challans ---
r.get("/sales/challans", async (_req: Request, res: Response) => {
  res.json(await deliveryChallansTable.find({}).sort({ createdAt: -1 }).lean());
});

r.get("/sales/challans/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const doc = await deliveryChallansTable.findOne({ id }).lean();
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const items = await deliveryChallanItemsTable.find({ challanId: id }).lean();
  res.json({ ...doc, items });
});

r.post("/sales/challans", async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  try {
    const challanNumber = await getNextDocNumber("delivery_challan");
    const parsed = insertDeliveryChallanSchema.safeParse({ ...docData, challanNumber, createdBy: (req as any).user?.userId || 1 });
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
    const doc = (await deliveryChallansTable.create(parsed.data)).toObject();
    if (items?.length) await deliveryChallanItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, challanId: doc.id, sortOrder: i })));
    const savedItems = await deliveryChallanItemsTable.find({ challanId: doc.id }).lean();
    res.status(201).json({ ...doc, items: savedItems });
  } catch (err: any) {
    console.error("Challan create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

r.patch("/sales/challans/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { items, ...updateData } = req.body;
  try {
    const existing = await deliveryChallansTable.findOne({ id }).lean();
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const previousStatus = (existing as any).status;
    const updated = await deliveryChallansTable.findOneAndUpdate({ id }, { $set: { ...updateData, updatedAt: new Date() } }, { new: true }).lean();
    if (items && Array.isArray(items)) {
      await deliveryChallanItemsTable.deleteMany({ challanId: id });
      if (items.length > 0) await deliveryChallanItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, challanId: id, sortOrder: i })));
    }
    const savedItems = await deliveryChallanItemsTable.find({ challanId: id }).lean();
    let lowStockWarnings: string[] | undefined;
    if ((updated as any).status === "Dispatched" && previousStatus !== "Dispatched") {
      const invResult = await triggerChallanDispatched(id);
      if (invResult?.lowStockWarnings?.length) lowStockWarnings = invResult.lowStockWarnings;
    }
    res.json({ ...updated, items: savedItems, lowStockWarnings });
  } catch (err: any) {
    if (err.message?.startsWith("Insufficient stock")) { res.status(400).json({ error: err.message }); return; }
    console.error("Challan patch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

r.delete("/sales/challans/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await deliveryChallansTable.findOneAndDelete({ id }).lean();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

// --- Sales Invoices ---
r.get("/sales/invoices", async (_req: Request, res: Response) => {
  res.json(await salesInvoicesTable.find({}).sort({ createdAt: -1 }).lean());
});

r.get("/sales/invoices/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const doc = await salesInvoicesTable.findOne({ id }).lean();
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const items = await salesInvoiceItemsTable.find({ invoiceId: id }).lean();
  res.json({ ...doc, items });
});

r.post("/sales/invoices", async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  try {
    const invoiceNumber = await getNextDocNumber("sales_invoice");
    const parsed = insertSalesInvoiceSchema.safeParse({ ...docData, invoiceNumber, createdBy: (req as any).user?.userId || 1 });
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
    const doc = (await salesInvoicesTable.create({ ...parsed.data, balanceDue: parsed.data.grandTotal || "0" })).toObject();
    if (items?.length) await salesInvoiceItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, invoiceId: doc.id, sortOrder: i })));
    const savedItems = await salesInvoiceItemsTable.find({ invoiceId: doc.id }).lean();
    const result = { ...doc, items: savedItems };
    if (result.status === "Approved" || result.status === "Sent") {
      try { await triggerInvoiceApproved(result.id); } catch (e: any) { console.error("[AUTO:SALES] Invoice trigger error:", e.message); }
    }
    res.status(201).json(result);
  } catch (err: any) {
    console.error("Invoice create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

r.patch("/sales/invoices/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { items, amountPaid: _ap, balanceDue: _bd, paymentStatus: _ps, createdBy: _cb, ...updateData } = req.body;
  try {
    const existing = await salesInvoicesTable.findOne({ id }).lean();
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (updateData.grandTotal && updateData.grandTotal !== (existing as any).grandTotal) {
      const paid = parseFloat(String((existing as any).amountPaid || "0"));
      const newGrand = parseFloat(updateData.grandTotal);
      updateData.balanceDue = (newGrand - paid).toFixed(2);
      updateData.paymentStatus = paid >= newGrand ? "Paid" : paid > 0 ? "Partial" : "Unpaid";
    }
    const updated = await salesInvoicesTable.findOneAndUpdate({ id }, { $set: { ...updateData, updatedAt: new Date() } }, { new: true }).lean();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    if (items && Array.isArray(items)) {
      await salesInvoiceItemsTable.deleteMany({ invoiceId: id });
      if (items.length > 0) await salesInvoiceItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, invoiceId: id, sortOrder: i })));
    }
    const savedItems = await salesInvoiceItemsTable.find({ invoiceId: id }).lean();
    const result = { ...updated, items: savedItems };
    if ((result as any).status === "Approved" || (result as any).status === "Sent") {
      try { await triggerInvoiceApproved(id); } catch (e: any) { console.error("[AUTO:SALES] Invoice trigger error:", e.message); }
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

r.delete("/sales/invoices/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await salesInvoicesTable.findOneAndDelete({ id }).lean();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

// --- Sales Returns ---
r.get("/sales/returns", async (_req: Request, res: Response) => {
  res.json(await salesReturnsTable.find({}).sort({ createdAt: -1 }).lean());
});

r.get("/sales/returns/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const doc = await salesReturnsTable.findOne({ id }).lean();
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const items = await salesReturnItemsTable.find({ returnId: id }).lean();
  res.json({ ...doc, items });
});

r.post("/sales/returns", async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  try {
    const returnNumber = await getNextDocNumber("sales_return");
    const creditNoteNumber = await getNextDocNumber("credit_note");
    const parsed = insertSalesReturnSchema.safeParse({ ...docData, returnNumber, creditNoteNumber, createdBy: (req as any).user?.userId || 1 });
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
    const doc = (await salesReturnsTable.create(parsed.data)).toObject();
    if (items?.length) {
      await salesReturnItemsTable.insertMany(items.map((item: any, i: number) => ({
        returnId: doc.id,
        invoiceItemId: item.invoiceItemId || null,
        itemId: item.itemId || null,
        description: item.description || "",
        hsnSac: item.hsnSac || "",
        itemType: item.itemType || "Product",
        invoicedQty: item.invoicedQty || item.quantity || "0",
        returnedQty: item.returnedQty || item.quantity || "0",
        uom: item.uom || "Nos",
        rate: item.rate || "0",
        discountPercent: item.discountPercent || "0",
        cgstPercent: item.cgstPercent || "0",
        cgstAmount: item.cgstAmount || "0",
        sgstPercent: item.sgstPercent || "0",
        sgstAmount: item.sgstAmount || "0",
        igstPercent: item.igstPercent || "0",
        igstAmount: item.igstAmount || "0",
        taxableAmount: item.taxableAmount || "0",
        lineTotal: item.lineTotal || "0",
        sortOrder: i,
        reason: item.reason || "",
        condition: item.condition || "Good",
      })));
    }
    const savedItems = await salesReturnItemsTable.find({ returnId: doc.id }).lean();
    const result = { ...doc, items: savedItems };
    if (result.status === "Credit Issued") {
      try { await triggerReturnCreditIssued(result.id); } catch (e) { console.error("[AUTO:SALES] Return credit trigger error:", e); }
    }
    res.status(201).json(result);
  } catch (err: any) {
    console.error("Return create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

r.patch("/sales/returns/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { items, ...updateData } = req.body;
  try {
    const existing = await salesReturnsTable.findOne({ id }).lean();
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const previousStatus = (existing as any).status;
    const updated = await salesReturnsTable.findOneAndUpdate({ id }, { $set: { ...updateData, updatedAt: new Date() } }, { new: true }).lean();
    if (items && Array.isArray(items)) {
      await salesReturnItemsTable.deleteMany({ returnId: id });
      if (items.length > 0) await salesReturnItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, returnId: id, sortOrder: i })));
    }
    const savedItems = await salesReturnItemsTable.find({ returnId: id }).lean();
    if ((updated as any).status === "Credit Issued" && previousStatus !== "Credit Issued") {
      await triggerReturnCreditIssued(id);
    }
    if ((updated as any).status === "Goods Received" && previousStatus !== "Goods Received" && (updated as any).restock) {
      await triggerReturnRestock(id);
    }
    res.json({ ...updated, items: savedItems });
  } catch (err: any) {
    console.error("Return patch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

r.delete("/sales/returns/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await salesReturnsTable.findOneAndDelete({ id }).lean();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

// --- Payments ---
r.get("/sales/payments", async (req: Request, res: Response) => {
  const filter: any = {};
  if (req.query.invoiceId) filter.invoiceId = parseInt(req.query.invoiceId as string);
  res.json(await salesPaymentsTable.find(filter).sort({ createdAt: -1 }).lean());
});

r.post("/sales/payments", async (req: Request, res: Response) => {
  const docData = req.body;
  try {
    const paymentNumber = await getNextDocNumber("sales_payment");
    const parsed = insertSalesPaymentSchema.safeParse({ ...docData, paymentNumber, createdBy: (req as any).user?.userId || 1 });
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
    const payment = (await salesPaymentsTable.create(parsed.data)).toObject();
    if (payment.status === "Received") {
      try { await triggerPaymentReceived(payment.id); } catch (e: any) { console.error("[AUTO:SALES] Payment trigger error:", e.message); }
    }
    res.status(201).json(payment);
  } catch (err: any) {
    console.error("Payment create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

r.delete("/sales/payments/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await salesPaymentsTable.findOneAndDelete({ id }).lean();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

r.get("/sales/gst-type", async (req: Request, res: Response) => {
  const placeOfSupply = req.query.placeOfSupply as string;
  res.json({ gstType: determineGstType(placeOfSupply), companyStateCode: COMPANY_STATE_CODE });
});

r.get("/sales/document-sequences", async (_req: Request, res: Response) => {
  res.json(await documentSequencesTable.find({}).lean());
});

export default r;
