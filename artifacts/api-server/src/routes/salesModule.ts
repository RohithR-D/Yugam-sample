import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
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
import { desc, eq, sql, and } from "drizzle-orm";
import { triggerInvoiceApproved, triggerPaymentReceived, triggerReturnCreditIssued, triggerOverdueCheck } from "./salesLedgerAutomation";

const r = Router();

const COMPANY_STATE_CODE = "27";

function determineGstType(placeOfSupply: string | null | undefined): "igst" | "cgst_sgst" {
  if (!placeOfSupply) return "cgst_sgst";
  return placeOfSupply === COMPANY_STATE_CODE ? "cgst_sgst" : "igst";
}

async function getNextDocNumber(docType: string): Promise<string> {
  const result = await db.execute(sql`
    UPDATE document_sequences 
    SET last_number = last_number + 1 
    WHERE document_type = ${docType}
    RETURNING prefix, financial_year, last_number
  `);
  const row = (result as any).rows?.[0] || (result as any)[0];
  if (!row) throw new Error(`No sequence configured for ${docType}`);
  const num = String(row.last_number).padStart(4, "0");
  return `${row.prefix}-${row.financial_year}-${num}`;
}

function buildSalesOverview(
  quotations: any[], proformas: any[], orders: any[],
  invoices: any[], returns: any[], payments: any[]
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
      db.select().from(quotationsTable),
      db.select().from(proformaInvoicesTable),
      db.select().from(salesOrdersTable),
      db.select().from(salesInvoicesTable),
      db.select().from(salesReturnsTable),
      db.select().from(salesPaymentsTable),
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
      db.select().from(quotationsTable).orderBy(desc(quotationsTable.createdAt)),
      db.select().from(proformaInvoicesTable).orderBy(desc(proformaInvoicesTable.createdAt)),
      db.select().from(salesOrdersTable).orderBy(desc(salesOrdersTable.createdAt)),
      db.select().from(deliveryChallansTable).orderBy(desc(deliveryChallansTable.createdAt)),
      db.select().from(salesInvoicesTable).orderBy(desc(salesInvoicesTable.createdAt)),
      db.select().from(salesReturnsTable).orderBy(desc(salesReturnsTable.createdAt)),
    ]);
    const docs = [
      ...quotations.map((q) => ({ ...q, documentType: "Quotation", documentNumber: q.quotationNumber, grandTotal: q.grandTotal })),
      ...proformas.map((p) => ({ ...p, documentType: "Proforma Invoice", documentNumber: p.proformaNumber, grandTotal: p.grandTotal })),
      ...orders.map((o) => ({ ...o, documentType: "Sales Order", documentNumber: o.soNumber, grandTotal: o.grandTotal })),
      ...challans.map((c) => ({ ...c, documentType: "Delivery Challan", documentNumber: c.challanNumber, grandTotal: c.approximateValue || "0" })),
      ...invoices.map((i) => ({ ...i, documentType: "Invoice", documentNumber: i.invoiceNumber, grandTotal: i.grandTotal })),
      ...returns.map((r) => ({ ...r, documentType: "Sales Return", documentNumber: r.returnNumber, grandTotal: r.grandTotal })),
    ];
    docs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(docs);
  } catch (err: any) {
    console.error("All docs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

r.get("/sales/client-addresses", async (req: Request, res: Response) => {
  const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
  let query = db.select().from(clientAddressesTable).$dynamic();
  if (clientId) query = query.where(eq(clientAddressesTable.clientId, clientId));
  res.json(await query);
});

r.post("/sales/client-addresses", async (req: Request, res: Response) => {
  const parsed = insertClientAddressSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [addr] = await db.insert(clientAddressesTable).values(parsed.data).returning();
  res.status(201).json(addr);
});

r.patch("/sales/client-addresses/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [updated] = await db.update(clientAddressesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(clientAddressesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

r.delete("/sales/client-addresses/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(clientAddressesTable).where(eq(clientAddressesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

r.get("/sales/quotations", async (_req: Request, res: Response) => {
  res.json(await db.select().from(quotationsTable).orderBy(desc(quotationsTable.createdAt)));
});

r.get("/sales/quotations/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [doc] = await db.select().from(quotationsTable).where(eq(quotationsTable.id, id));
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const items = await db.select().from(quotationItemsTable).where(eq(quotationItemsTable.quotationId, id));
  res.json({ ...doc, items });
});

r.post("/sales/quotations", async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  try {
    const quotationNumber = await getNextDocNumber("quotation");
    const parsed = insertQuotationSchema.safeParse({ ...docData, quotationNumber, createdBy: (req as any).user?.userId || 1 });
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
    const result = await db.transaction(async (tx) => {
      const [doc] = await tx.insert(quotationsTable).values(parsed.data).returning();
      if (items?.length) {
        const itemRows = items.map((item: any, i: number) => ({ ...item, quotationId: doc.id, sortOrder: i }));
        await tx.insert(quotationItemsTable).values(itemRows);
      }
      const savedItems = await tx.select().from(quotationItemsTable).where(eq(quotationItemsTable.quotationId, doc.id));
      return { ...doc, items: savedItems };
    });
    res.status(201).json(result);
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
    const result = await db.transaction(async (tx) => {
      const [updated] = await tx.update(quotationsTable).set({ ...updateData, updatedAt: new Date() }).where(eq(quotationsTable.id, id)).returning();
      if (!updated) throw new Error("Not found");
      if (items && Array.isArray(items)) {
        await tx.delete(quotationItemsTable).where(eq(quotationItemsTable.quotationId, id));
        if (items.length > 0) {
          const itemRows = items.map((item: any, i: number) => ({ ...item, quotationId: id, sortOrder: i }));
          await tx.insert(quotationItemsTable).values(itemRows);
        }
      }
      const savedItems = await tx.select().from(quotationItemsTable).where(eq(quotationItemsTable.quotationId, id));
      return { ...updated, items: savedItems };
    });
    res.json(result);
  } catch (err: any) {
    if (err.message === "Not found") { res.status(404).json({ error: "Not found" }); return; }
    console.error("Quotation update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

r.delete("/sales/quotations/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(quotationsTable).where(eq(quotationsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

r.get("/sales/proforma-invoices", async (_req: Request, res: Response) => {
  res.json(await db.select().from(proformaInvoicesTable).orderBy(desc(proformaInvoicesTable.createdAt)));
});

r.get("/sales/proforma-invoices/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [doc] = await db.select().from(proformaInvoicesTable).where(eq(proformaInvoicesTable.id, id));
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const items = await db.select().from(proformaInvoiceItemsTable).where(eq(proformaInvoiceItemsTable.proformaId, id));
  res.json({ ...doc, items });
});

r.post("/sales/proforma-invoices", async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  try {
    const proformaNumber = await getNextDocNumber("proforma_invoice");
    const parsed = insertProformaInvoiceSchema.safeParse({ ...docData, proformaNumber, createdBy: (req as any).user?.userId || 1 });
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
    const result = await db.transaction(async (tx) => {
      const [doc] = await tx.insert(proformaInvoicesTable).values(parsed.data).returning();
      if (items?.length) {
        await tx.insert(proformaInvoiceItemsTable).values(items.map((item: any, i: number) => ({ ...item, proformaId: doc.id, sortOrder: i })));
      }
      const savedItems = await tx.select().from(proformaInvoiceItemsTable).where(eq(proformaInvoiceItemsTable.proformaId, doc.id));
      return { ...doc, items: savedItems };
    });
    res.status(201).json(result);
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
    const result = await db.transaction(async (tx) => {
      const [updated] = await tx.update(proformaInvoicesTable).set({ ...updateData, updatedAt: new Date() }).where(eq(proformaInvoicesTable.id, id)).returning();
      if (!updated) throw new Error("Not found");
      if (items && Array.isArray(items)) {
        await tx.delete(proformaInvoiceItemsTable).where(eq(proformaInvoiceItemsTable.proformaId, id));
        if (items.length > 0) await tx.insert(proformaInvoiceItemsTable).values(items.map((item: any, i: number) => ({ ...item, proformaId: id, sortOrder: i })));
      }
      const savedItems = await tx.select().from(proformaInvoiceItemsTable).where(eq(proformaInvoiceItemsTable.proformaId, id));
      return { ...updated, items: savedItems };
    });
    res.json(result);
  } catch (err: any) {
    if (err.message === "Not found") { res.status(404).json({ error: "Not found" }); return; }
    res.status(500).json({ error: "Internal server error" });
  }
});

r.delete("/sales/proforma-invoices/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(proformaInvoicesTable).where(eq(proformaInvoicesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

r.get("/sales/orders", async (_req: Request, res: Response) => {
  res.json(await db.select().from(salesOrdersTable).orderBy(desc(salesOrdersTable.createdAt)));
});

r.get("/sales/orders/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [doc] = await db.select().from(salesOrdersTable).where(eq(salesOrdersTable.id, id));
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const items = await db.select().from(salesOrderItemsTable).where(eq(salesOrderItemsTable.salesOrderId, id));
  res.json({ ...doc, items });
});

r.post("/sales/orders", async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  try {
    const soNumber = await getNextDocNumber("sales_order");
    const parsed = insertSalesOrderSchema.safeParse({ ...docData, soNumber, createdBy: (req as any).user?.userId || 1 });
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
    const result = await db.transaction(async (tx) => {
      const [doc] = await tx.insert(salesOrdersTable).values(parsed.data).returning();
      if (items?.length) {
        await tx.insert(salesOrderItemsTable).values(items.map((item: any, i: number) => ({ ...item, salesOrderId: doc.id, sortOrder: i })));
      }
      const savedItems = await tx.select().from(salesOrderItemsTable).where(eq(salesOrderItemsTable.salesOrderId, doc.id));
      return { ...doc, items: savedItems };
    });
    res.status(201).json(result);
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
    const result = await db.transaction(async (tx) => {
      const [updated] = await tx.update(salesOrdersTable).set({ ...updateData, updatedAt: new Date() }).where(eq(salesOrdersTable.id, id)).returning();
      if (!updated) throw new Error("Not found");
      if (items && Array.isArray(items)) {
        await tx.delete(salesOrderItemsTable).where(eq(salesOrderItemsTable.salesOrderId, id));
        if (items.length > 0) await tx.insert(salesOrderItemsTable).values(items.map((item: any, i: number) => ({ ...item, salesOrderId: id, sortOrder: i })));
      }
      const savedItems = await tx.select().from(salesOrderItemsTable).where(eq(salesOrderItemsTable.salesOrderId, id));
      return { ...updated, items: savedItems };
    });
    res.json(result);
  } catch (err: any) {
    if (err.message === "Not found") { res.status(404).json({ error: "Not found" }); return; }
    res.status(500).json({ error: "Internal server error" });
  }
});

r.delete("/sales/orders/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(salesOrdersTable).where(eq(salesOrdersTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

r.get("/sales/challans", async (_req: Request, res: Response) => {
  res.json(await db.select().from(deliveryChallansTable).orderBy(desc(deliveryChallansTable.createdAt)));
});

r.get("/sales/challans/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [doc] = await db.select().from(deliveryChallansTable).where(eq(deliveryChallansTable.id, id));
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const items = await db.select().from(deliveryChallanItemsTable).where(eq(deliveryChallanItemsTable.challanId, id));
  res.json({ ...doc, items });
});

r.post("/sales/challans", async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  try {
    const challanNumber = await getNextDocNumber("delivery_challan");
    const parsed = insertDeliveryChallanSchema.safeParse({ ...docData, challanNumber, createdBy: (req as any).user?.userId || 1 });
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
    const result = await db.transaction(async (tx) => {
      const [doc] = await tx.insert(deliveryChallansTable).values(parsed.data).returning();
      if (items?.length) {
        await tx.insert(deliveryChallanItemsTable).values(items.map((item: any, i: number) => ({ ...item, challanId: doc.id, sortOrder: i })));
      }
      const savedItems = await tx.select().from(deliveryChallanItemsTable).where(eq(deliveryChallanItemsTable.challanId, doc.id));
      return { ...doc, items: savedItems };
    });
    res.status(201).json(result);
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
    const result = await db.transaction(async (tx) => {
      const [updated] = await tx.update(deliveryChallansTable).set({ ...updateData, updatedAt: new Date() }).where(eq(deliveryChallansTable.id, id)).returning();
      if (!updated) throw new Error("Not found");
      if (items && Array.isArray(items)) {
        await tx.delete(deliveryChallanItemsTable).where(eq(deliveryChallanItemsTable.challanId, id));
        if (items.length > 0) await tx.insert(deliveryChallanItemsTable).values(items.map((item: any, i: number) => ({ ...item, challanId: id, sortOrder: i })));
      }
      const savedItems = await tx.select().from(deliveryChallanItemsTable).where(eq(deliveryChallanItemsTable.challanId, id));
      return { ...updated, items: savedItems };
    });
    res.json(result);
  } catch (err: any) {
    if (err.message === "Not found") { res.status(404).json({ error: "Not found" }); return; }
    res.status(500).json({ error: "Internal server error" });
  }
});

r.delete("/sales/challans/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(deliveryChallansTable).where(eq(deliveryChallansTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

r.get("/sales/invoices", async (_req: Request, res: Response) => {
  res.json(await db.select().from(salesInvoicesTable).orderBy(desc(salesInvoicesTable.createdAt)));
});

r.get("/sales/invoices/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [doc] = await db.select().from(salesInvoicesTable).where(eq(salesInvoicesTable.id, id));
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const items = await db.select().from(salesInvoiceItemsTable).where(eq(salesInvoiceItemsTable.invoiceId, id));
  res.json({ ...doc, items });
});

r.post("/sales/invoices", async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  try {
    const invoiceNumber = await getNextDocNumber("sales_invoice");
    const parsed = insertSalesInvoiceSchema.safeParse({ ...docData, invoiceNumber, createdBy: (req as any).user?.userId || 1 });
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
    const result = await db.transaction(async (tx) => {
      const [doc] = await tx.insert(salesInvoicesTable).values({ ...parsed.data, balanceDue: parsed.data.grandTotal || "0" }).returning();
      if (items?.length) {
        await tx.insert(salesInvoiceItemsTable).values(items.map((item: any, i: number) => ({ ...item, invoiceId: doc.id, sortOrder: i })));
      }
      const savedItems = await tx.select().from(salesInvoiceItemsTable).where(eq(salesInvoiceItemsTable.invoiceId, doc.id));
      return { ...doc, items: savedItems };
    });
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
    const result = await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(salesInvoicesTable).where(eq(salesInvoicesTable.id, id));
      if (!existing) throw new Error("Not found");
      if (updateData.grandTotal && updateData.grandTotal !== existing.grandTotal) {
        const paid = parseFloat(existing.amountPaid || "0");
        const newGrand = parseFloat(updateData.grandTotal);
        updateData.balanceDue = (newGrand - paid).toFixed(2);
        updateData.paymentStatus = paid >= newGrand ? "Paid" : paid > 0 ? "Partial" : "Unpaid";
      }
      const [updated] = await tx.update(salesInvoicesTable).set({ ...updateData, updatedAt: new Date() }).where(eq(salesInvoicesTable.id, id)).returning();
      if (!updated) throw new Error("Not found");
      if (items && Array.isArray(items)) {
        await tx.delete(salesInvoiceItemsTable).where(eq(salesInvoiceItemsTable.invoiceId, id));
        if (items.length > 0) await tx.insert(salesInvoiceItemsTable).values(items.map((item: any, i: number) => ({ ...item, invoiceId: id, sortOrder: i })));
      }
      const savedItems = await tx.select().from(salesInvoiceItemsTable).where(eq(salesInvoiceItemsTable.invoiceId, id));
      return { ...updated, items: savedItems };
    });
    if (result.status === "Approved" || result.status === "Sent") {
      try { await triggerInvoiceApproved(id); } catch (e: any) { console.error("[AUTO:SALES] Invoice trigger error:", e.message); }
    }
    res.json(result);
  } catch (err: any) {
    if (err.message === "Not found") { res.status(404).json({ error: "Not found" }); return; }
    res.status(500).json({ error: "Internal server error" });
  }
});

r.delete("/sales/invoices/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(salesInvoicesTable).where(eq(salesInvoicesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

r.get("/sales/returns", async (_req: Request, res: Response) => {
  res.json(await db.select().from(salesReturnsTable).orderBy(desc(salesReturnsTable.createdAt)));
});

r.get("/sales/returns/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [doc] = await db.select().from(salesReturnsTable).where(eq(salesReturnsTable.id, id));
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const items = await db.select().from(salesReturnItemsTable).where(eq(salesReturnItemsTable.returnId, id));
  res.json({ ...doc, items });
});

r.post("/sales/returns", async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  try {
    const returnNumber = await getNextDocNumber("sales_return");
    const creditNoteNumber = await getNextDocNumber("credit_note");
    const parsed = insertSalesReturnSchema.safeParse({ ...docData, returnNumber, creditNoteNumber, createdBy: (req as any).user?.userId || 1 });
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
    const result = await db.transaction(async (tx) => {
      const [doc] = await tx.insert(salesReturnsTable).values(parsed.data).returning();
      if (items?.length) {
        await tx.insert(salesReturnItemsTable).values(items.map((item: any, i: number) => ({
          returnId: doc.id,
          invoiceItemId: item.invoiceItemId || null,
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
      const savedItems = await tx.select().from(salesReturnItemsTable).where(eq(salesReturnItemsTable.returnId, doc.id));
      return { ...doc, items: savedItems };
    });
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
    const result = await db.transaction(async (tx) => {
      const [updated] = await tx.update(salesReturnsTable).set({ ...updateData, updatedAt: new Date() }).where(eq(salesReturnsTable.id, id)).returning();
      if (!updated) throw new Error("Not found");
      if (items && Array.isArray(items)) {
        await tx.delete(salesReturnItemsTable).where(eq(salesReturnItemsTable.returnId, id));
        if (items.length > 0) await tx.insert(salesReturnItemsTable).values(items.map((item: any, i: number) => ({ ...item, returnId: id, sortOrder: i })));
      }
      const savedItems = await tx.select().from(salesReturnItemsTable).where(eq(salesReturnItemsTable.returnId, id));
      return { ...updated, items: savedItems };
    });
    if (result.status === "Credit Issued") {
      try { await triggerReturnCreditIssued(id); } catch (e: any) { console.error("[AUTO:SALES] Return trigger error:", e.message); }
    }
    res.json(result);
  } catch (err: any) {
    if (err.message === "Not found") { res.status(404).json({ error: "Not found" }); return; }
    res.status(500).json({ error: "Internal server error" });
  }
});

r.delete("/sales/returns/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(salesReturnsTable).where(eq(salesReturnsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

r.get("/sales/payments", async (_req: Request, res: Response) => {
  const invoiceId = _req.query.invoiceId ? parseInt(_req.query.invoiceId as string) : undefined;
  let query = db.select().from(salesPaymentsTable).orderBy(desc(salesPaymentsTable.createdAt)).$dynamic();
  if (invoiceId) query = query.where(eq(salesPaymentsTable.invoiceId, invoiceId));
  res.json(await query);
});

r.post("/sales/payments", async (req: Request, res: Response) => {
  const docData = req.body;
  try {
    const paymentNumber = await getNextDocNumber("sales_payment");
    const parsed = insertSalesPaymentSchema.safeParse({ ...docData, paymentNumber, createdBy: (req as any).user?.userId || 1 });
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
    const [payment] = await db.insert(salesPaymentsTable).values(parsed.data).returning();
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
  const [deleted] = await db.delete(salesPaymentsTable).where(eq(salesPaymentsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

r.get("/sales/gst-type", async (req: Request, res: Response) => {
  const placeOfSupply = req.query.placeOfSupply as string;
  res.json({ gstType: determineGstType(placeOfSupply), companyStateCode: COMPANY_STATE_CODE });
});

r.get("/sales/document-sequences", async (_req: Request, res: Response) => {
  res.json(await db.select().from(documentSequencesTable));
});

export default r;
