import {
  chartOfAccountsTable,
  clientsTable,
  deliveryChallanItemsTable,
  deliveryChallansTable,
  documentSequencesTable,
  invoiceItemsTable,
  insertClientAddressSchema,
  insertDeliveryChallanItemSchema,
  insertDeliveryChallanSchema,
  insertInvoiceSchema,
  insertProformaInvoiceItemSchema,
  insertProformaInvoiceSchema,
  insertQuotationItemSchema,
  insertQuotationSchema,
  insertSalesInvoiceItemSchema,
  insertSalesInvoiceSchema,
  insertSalesOrderItemSchema,
  insertSalesOrderSchema,
  insertSalesPaymentSchema,
  insertSalesReturnItemSchema,
  insertSalesReturnSchema,
  proformaInvoiceItemsTable,
  proformaInvoicesTable,
  quotationItemsTable,
  quotationsTable,
  salesInvoiceItemsTable,
  salesInvoicesTable,
  salesOrderItemsTable,
  salesOrdersTable,
  salesPaymentsTable,
  salesReturnItemsTable,
  salesReturnsTable,
  clientAddressesTable,
} from "@workspace/db/schema";
import { triggerChallanDispatched, triggerReturnRestock } from "./salesInventoryAutomation";
import { triggerInvoiceApproved, triggerPaymentReceived, triggerReturnCreditIssued, triggerOverdueCheck } from "./salesLedgerAutomation";

const COMPANY_STATE_CODE = "27";

export const determineGstType = (placeOfSupply: string | null | undefined): "igst" | "cgst_sgst" => {
  if (!placeOfSupply) return "cgst_sgst";
  return placeOfSupply === COMPANY_STATE_CODE ? "cgst_sgst" : "igst";
};

export const getNextDocNumber = async (docType: string) => {
  const seq = await documentSequencesTable.findOneAndUpdate(
    { documentType: docType },
    { $inc: { lastNumber: 1 } },
    { new: true },
  ).lean();
  if (!seq) throw new Error(`No sequence configured for ${docType}`);
  const num = String((seq as any).lastNumber).padStart(4, "0");
  return `${(seq as any).prefix}-${(seq as any).financialYear}-${num}`;
};

function buildSalesOverview(
  quotations: any[],
  proformas: any[],
  orders: any[],
  invoices: any[],
  returns: any[],
  payments: any[],
) {
  const totalInvoiced = invoices.reduce((s: number, i: any) => s + parseFloat(i.grandTotal || "0"), 0);
  const totalPaid = invoices.filter((i: any) => i.paymentStatus === "Paid").reduce((s: number, i: any) => s + parseFloat(i.grandTotal || "0"), 0);
  const totalUnpaid = invoices.filter((i: any) => ["Unpaid", "Partial", "Overdue"].includes(i.paymentStatus)).reduce((s: number, i: any) => s + parseFloat(i.balanceDue || "0"), 0);
  return {
    totalInvoiced,
    totalPaid,
    totalUnpaid,
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

export const getSalesOverview = async () => {
  const [quotations, proformas, orders, invoices, returns, payments] = await Promise.all([
    quotationsTable.find({}).lean(),
    proformaInvoicesTable.find({}).lean(),
    salesOrdersTable.find({}).lean(),
    salesInvoicesTable.find({}).lean(),
    salesReturnsTable.find({}).lean(),
    salesPaymentsTable.find({}).lean(),
  ]);
  return buildSalesOverview(quotations, proformas, orders, invoices, returns, payments);
};

export const runSalesOverdueCheck = async () => {
  return await triggerOverdueCheck();
};

export const getAllSalesDocuments = async () => {
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

  return docs.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
};

export const getClientAddresses = async (clientId?: number) => {
  const filter: any = {};
  if (clientId) filter.clientId = clientId;
  return await clientAddressesTable.find(filter).lean();
};

export const createClientAddress = async (data: any) => {
  const row = await clientAddressesTable.create(data);
  return row.toObject();
};

export const updateClientAddress = async (id: number, data: any) => {
  return await clientAddressesTable.findOneAndUpdate({ id }, { $set: { ...data, updatedAt: new Date() } }, { new: true }).lean();
};

export const deleteClientAddress = async (id: number) => {
  return await clientAddressesTable.findOneAndDelete({ id }).lean();
};

export const getQuotations = async () => {
  return await quotationsTable.find({}).sort({ createdAt: -1 }).lean();
};

export const getQuotationById = async (id: number) => {
  const doc = await quotationsTable.findOne({ id }).lean();
  if (!doc) return null;
  const items = await quotationItemsTable.find({ quotationId: id }).lean();
  return { ...doc, items };
};

export const createQuotation = async (data: any, items: any[]) => {
  const doc = await quotationsTable.create(data);
  const quote = doc.toObject();
  if (items.length > 0) {
    await quotationItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, quotationId: quote.id, sortOrder: i })));
  }
  const savedItems = await quotationItemsTable.find({ quotationId: quote.id }).lean();
  return { ...quote, items: savedItems };
};

export const updateQuotation = async (id: number, updateData: any, items: any[]) => {
  const updated = await quotationsTable.findOneAndUpdate({ id }, { $set: { ...updateData, updatedAt: new Date() } }, { new: true }).lean();
  if (!updated) return null;
  if (items && Array.isArray(items)) {
    await quotationItemsTable.deleteMany({ quotationId: id });
    if (items.length > 0) {
      await quotationItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, quotationId: id, sortOrder: i })));
    }
  }
  const savedItems = await quotationItemsTable.find({ quotationId: id }).lean();
  return { ...updated, items: savedItems };
};

export const deleteQuotation = async (id: number) => {
  return await quotationsTable.findOneAndDelete({ id }).lean();
};

export const getProformaInvoices = async () => {
  return await proformaInvoicesTable.find({}).sort({ createdAt: -1 }).lean();
};

export const getProformaInvoiceById = async (id: number) => {
  const doc = await proformaInvoicesTable.findOne({ id }).lean();
  if (!doc) return null;
  const items = await proformaInvoiceItemsTable.find({ proformaId: id }).lean();
  return { ...doc, items };
};

export const createProformaInvoice = async (data: any, items: any[]) => {
  const doc = await proformaInvoicesTable.create(data);
  const obj = doc.toObject();
  if (items.length > 0) {
    await proformaInvoiceItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, proformaId: obj.id, sortOrder: i })));
  }
  const savedItems = await proformaInvoiceItemsTable.find({ proformaId: obj.id }).lean();
  return { ...obj, items: savedItems };
};

export const updateProformaInvoice = async (id: number, updateData: any, items: any[]) => {
  const updated = await proformaInvoicesTable.findOneAndUpdate({ id }, { $set: { ...updateData, updatedAt: new Date() } }, { new: true }).lean();
  if (!updated) return null;
  if (items && Array.isArray(items)) {
    await proformaInvoiceItemsTable.deleteMany({ proformaId: id });
    if (items.length > 0) {
      await proformaInvoiceItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, proformaId: id, sortOrder: i })));
    }
  }
  const savedItems = await proformaInvoiceItemsTable.find({ proformaId: id }).lean();
  return { ...updated, items: savedItems };
};

export const deleteProformaInvoice = async (id: number) => {
  return await proformaInvoicesTable.findOneAndDelete({ id }).lean();
};

export const getSalesOrders = async () => {
  return await salesOrdersTable.find({}).sort({ createdAt: -1 }).lean();
};

export const getSalesOrderById = async (id: number) => {
  const doc = await salesOrdersTable.findOne({ id }).lean();
  if (!doc) return null;
  const items = await salesOrderItemsTable.find({ salesOrderId: id }).lean();
  return { ...doc, items };
};

export const createSalesOrder = async (data: any, items: any[]) => {
  const doc = await salesOrdersTable.create(data);
  const obj = doc.toObject();
  if (items.length > 0) {
    await salesOrderItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, salesOrderId: obj.id, sortOrder: i })));
  }
  const savedItems = await salesOrderItemsTable.find({ salesOrderId: obj.id }).lean();
  return { ...obj, items: savedItems };
};

export const updateSalesOrder = async (id: number, updateData: any, items: any[]) => {
  const updated = await salesOrdersTable.findOneAndUpdate({ id }, { $set: { ...updateData, updatedAt: new Date() } }, { new: true }).lean();
  if (!updated) return null;
  if (items && Array.isArray(items)) {
    await salesOrderItemsTable.deleteMany({ salesOrderId: id });
    if (items.length > 0) {
      await salesOrderItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, salesOrderId: id, sortOrder: i })));
    }
  }
  const savedItems = await salesOrderItemsTable.find({ salesOrderId: id }).lean();
  return { ...updated, items: savedItems };
};

export const deleteSalesOrder = async (id: number) => {
  return await salesOrdersTable.findOneAndDelete({ id }).lean();
};

export const getDeliveryChallans = async () => {
  return await deliveryChallansTable.find({}).sort({ createdAt: -1 }).lean();
};

export const getDeliveryChallanById = async (id: number) => {
  const doc = await deliveryChallansTable.findOne({ id }).lean();
  if (!doc) return null;
  const items = await deliveryChallanItemsTable.find({ challanId: id }).lean();
  return { ...doc, items };
};

export const createDeliveryChallan = async (data: any, items: any[]) => {
  const doc = await deliveryChallansTable.create(data);
  const obj = doc.toObject();
  if (items.length > 0) {
    await deliveryChallanItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, challanId: obj.id, sortOrder: i })));
  }
  const savedItems = await deliveryChallanItemsTable.find({ challanId: obj.id }).lean();
  return { ...obj, items: savedItems };
};

export const updateDeliveryChallan = async (id: number, updateData: any, items: any[]) => {
  const existing = await deliveryChallansTable.findOne({ id }).lean();
  if (!existing) return null;
  const previousStatus = (existing as any).status;
  const updated = await deliveryChallansTable.findOneAndUpdate({ id }, { $set: { ...updateData, updatedAt: new Date() } }, { new: true }).lean();
  if (!updated) return null;
  if (items && Array.isArray(items)) {
    await deliveryChallanItemsTable.deleteMany({ challanId: id });
    if (items.length > 0) {
      await deliveryChallanItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, challanId: id, sortOrder: i })));
    }
  }
  const savedItems = await deliveryChallanItemsTable.find({ challanId: id }).lean();
  let lowStockWarnings: string[] | undefined;
  if ((updated as any).status === "Dispatched" && previousStatus !== "Dispatched") {
    const invResult = await triggerChallanDispatched(id);
    if (invResult?.lowStockWarnings?.length) lowStockWarnings = invResult.lowStockWarnings;
  }
  return { ...updated, items: savedItems, lowStockWarnings };
};

export const deleteDeliveryChallan = async (id: number) => {
  return await deliveryChallansTable.findOneAndDelete({ id }).lean();
};

export const getSalesInvoices = async () => {
  return await salesInvoicesTable.find({}).sort({ createdAt: -1 }).lean();
};

export const getSalesInvoiceById = async (id: number) => {
  const doc = await salesInvoicesTable.findOne({ id }).lean();
  if (!doc) return null;
  const items = await salesInvoiceItemsTable.find({ invoiceId: id }).lean();
  return { ...doc, items };
};

export const createSalesInvoice = async (data: any, items: any[]) => {
  const invoice = await salesInvoicesTable.create({ ...data, balanceDue: data.grandTotal || "0" });
  const invoiceObj = invoice.toObject();
  if (items.length > 0) {
    await salesInvoiceItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, invoiceId: invoiceObj.id, sortOrder: i })));
  }
  const savedItems = await salesInvoiceItemsTable.find({ invoiceId: invoiceObj.id }).lean();
  const result = { ...invoiceObj, items: savedItems };
  if (result.status === "Approved" || result.status === "Sent") {
    try { await triggerInvoiceApproved(result.id); } catch (e: any) { console.error("[AUTO:SALES] Invoice trigger error:", e.message); }
  }
  return result;
};

export const updateSalesInvoice = async (id: number, updateData: any, items: any[]) => {
  const existing = await salesInvoicesTable.findOne({ id }).lean();
  if (!existing) return null;
  if (updateData.grandTotal && updateData.grandTotal !== (existing as any).grandTotal) {
    const paid = parseFloat(String((existing as any).amountPaid || "0"));
    const newGrand = parseFloat(updateData.grandTotal);
    updateData.balanceDue = (newGrand - paid).toFixed(2);
    updateData.paymentStatus = paid >= newGrand ? "Paid" : paid > 0 ? "Partial" : "Unpaid";
  }
  const updated = await salesInvoicesTable.findOneAndUpdate({ id }, { $set: { ...updateData, updatedAt: new Date() } }, { new: true }).lean();
  if (!updated) return null;
  if (items && Array.isArray(items)) {
    await salesInvoiceItemsTable.deleteMany({ invoiceId: id });
    if (items.length > 0) {
      await salesInvoiceItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, invoiceId: id, sortOrder: i })));
    }
  }
  const savedItems = await salesInvoiceItemsTable.find({ invoiceId: id }).lean();
  const result = { ...updated, items: savedItems };
  if ((result as any).status === "Approved" || (result as any).status === "Sent") {
    try { await triggerInvoiceApproved(id); } catch (e: any) { console.error("[AUTO:SALES] Invoice trigger error:", e.message); }
  }
  return result;
};

export const deleteSalesInvoice = async (id: number) => {
  return await salesInvoicesTable.findOneAndDelete({ id }).lean();
};

export const getSalesReturns = async () => {
  return await salesReturnsTable.find({}).sort({ createdAt: -1 }).lean();
};

export const getSalesReturnById = async (id: number) => {
  const doc = await salesReturnsTable.findOne({ id }).lean();
  if (!doc) return null;
  const items = await salesReturnItemsTable.find({ returnId: id }).lean();
  return { ...doc, items };
};

export const createSalesReturn = async (data: any, items: any[]) => {
  const doc = await salesReturnsTable.create(data);
  const obj = doc.toObject();
  if (items.length > 0) {
    await salesReturnItemsTable.insertMany(items.map((item: any, i: number) => ({
      returnId: obj.id,
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
  const savedItems = await salesReturnItemsTable.find({ returnId: obj.id }).lean();
  const result = { ...obj, items: savedItems };
  if (result.status === "Credit Issued") {
    try { await triggerReturnCreditIssued(result.id); } catch (e: any) { console.error("[AUTO:SALES] Return credit trigger error:", e); }
  }
  return result;
};

export const updateSalesReturn = async (id: number, updateData: any, items: any[]) => {
  const existing = await salesReturnsTable.findOne({ id }).lean();
  if (!existing) return null;
  const previousStatus = (existing as any).status;
  const updated = await salesReturnsTable.findOneAndUpdate({ id }, { $set: { ...updateData, updatedAt: new Date() } }, { new: true }).lean();
  if (!updated) return null;
  if (items && Array.isArray(items)) {
    await salesReturnItemsTable.deleteMany({ returnId: id });
    if (items.length > 0) {
      await salesReturnItemsTable.insertMany(items.map((item: any, i: number) => ({ ...item, returnId: id, sortOrder: i })));
    }
  }
  const savedItems = await salesReturnItemsTable.find({ returnId: id }).lean();
  if ((updated as any).status === "Credit Issued" && previousStatus !== "Credit Issued") {
    await triggerReturnCreditIssued(id);
  }
  if ((updated as any).status === "Goods Received" && previousStatus !== "Goods Received" && (updated as any).restock) {
    await triggerReturnRestock(id);
  }
  return { ...updated, items: savedItems };
};

export const deleteSalesReturn = async (id: number) => {
  return await salesReturnsTable.findOneAndDelete({ id }).lean();
};

export const getSalesPayments = async (invoiceId?: number) => {
  const filter: any = {};
  if (invoiceId) filter.invoiceId = invoiceId;
  return await salesPaymentsTable.find(filter).sort({ createdAt: -1 }).lean();
};

export const createSalesPayment = async (data: any) => {
  const payment = await salesPaymentsTable.create(data);
  const paymentObj = payment.toObject();
  if (paymentObj.status === "Received") {
    try { await triggerPaymentReceived(paymentObj.id); } catch (e: any) { console.error("[AUTO:SALES] Payment trigger error:", e.message); }
  }
  return paymentObj;
};

export const deleteSalesPayment = async (id: number) => {
  return await salesPaymentsTable.findOneAndDelete({ id }).lean();
};

export const getDocumentSequences = async () => {
  return await documentSequencesTable.find({}).lean();
};

export const createClientAddressFromBody = async (body: any) => {
  const parsed = insertClientAddressSchema.safeParse(body);
  if (!parsed.success) throw parsed.error;
  const row = await clientAddressesTable.create(parsed.data);
  return row.toObject();
};

export const updateClientAddressById = async (id: number, body: any) => {
  return await clientAddressesTable.findOneAndUpdate({ id }, { $set: { ...body, updatedAt: new Date() } }, { new: true }).lean();
};
