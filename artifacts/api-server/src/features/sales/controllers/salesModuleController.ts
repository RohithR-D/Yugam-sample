import { type Request, type Response } from "express";
import {
  createClientAddressFromBody,
  createDeliveryChallan,
  createProformaInvoice,
  createQuotation,
  createSalesInvoice,
  createSalesOrder,
  createSalesPayment,
  createSalesReturn,
  deleteClientAddress,
  deleteDeliveryChallan,
  deleteProformaInvoice,
  deleteQuotation,
  deleteSalesInvoice,
  deleteSalesOrder,
  deleteSalesPayment,
  deleteSalesReturn,
  getAllSalesDocuments,
  getClientAddresses,
  getDeliveryChallanById,
  getDeliveryChallans,
  getDocumentSequences,
  getProformaInvoiceById,
  getProformaInvoices,
  getQuotationById,
  getQuotations,
  getSalesInvoiceById,
  getSalesInvoices,
  getSalesOrderById,
  getSalesOrders,
  getSalesOverview,
  getSalesPayments,
  getSalesReturnById,
  getSalesReturns,
  runSalesOverdueCheck,
  updateClientAddressById,
  updateDeliveryChallan,
  updateProformaInvoice,
  updateQuotation,
  updateSalesInvoice,
  updateSalesOrder,
  updateSalesReturn,
  determineGstType,
} from "../services/salesModuleService";

import {
  insertClientAddressSchema,
  insertDeliveryChallanSchema,
  insertProformaInvoiceSchema,
  insertQuotationSchema,
  insertSalesInvoiceSchema,
  insertSalesOrderSchema,
  insertSalesPaymentSchema,
  insertSalesReturnSchema,
} from "@workspace/db/schema";

function parseId(req: Request, res: Response): number | null {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return null;
  }
  return id;
}

export const handleGetOverdueCheck = async (_req: Request, res: Response) => {
  try {
    const result = await runSalesOverdueCheck();
    res.json(result);
  } catch (err: any) {
    console.error("Overdue check error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetSalesOverview = async (_req: Request, res: Response) => {
  try {
    runSalesOverdueCheck().catch((e) => console.error("[AUTO:SALES] Background overdue check error:", e.message));
    res.json(await getSalesOverview());
  } catch (err: any) {
    console.error("Sales overview error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetAllDocuments = async (_req: Request, res: Response) => {
  try {
    res.json(await getAllSalesDocuments());
  } catch (err: any) {
    console.error("All docs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetClientAddresses = async (req: Request, res: Response) => {
  const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
  res.json(await getClientAddresses(clientId));
};

export const handleCreateClientAddress = async (req: Request, res: Response) => {
  const parsed = insertClientAddressSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const address = await createClientAddressFromBody(parsed.data);
    res.status(201).json(address);
  } catch (err: any) {
    console.error("Client address create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateClientAddress = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const updated = await updateClientAddressById(id, req.body);
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(updated);
};

export const handleDeleteClientAddress = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const deleted = await deleteClientAddress(id);
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
};

export const handleGetQuotations = async (_req: Request, res: Response) => {
  res.json(await getQuotations());
};

export const handleGetQuotationById = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const doc = await getQuotationById(id);
  if (!doc) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(doc);
};

export const handleCreateQuotation = async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  const parsed = insertQuotationSchema.safeParse(docData);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const doc = await createQuotation(parsed.data, Array.isArray(items) ? items : []);
    res.status(201).json(doc);
  } catch (err: any) {
    console.error("Quotation create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateQuotation = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { items, ...updateData } = req.body;
  const updated = await updateQuotation(id, updateData, Array.isArray(items) ? items : []);
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(updated);
};

export const handleDeleteQuotation = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const deleted = await deleteQuotation(id);
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
};

export const handleGetProformaInvoices = async (_req: Request, res: Response) => {
  res.json(await getProformaInvoices());
};

export const handleGetProformaInvoiceById = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const doc = await getProformaInvoiceById(id);
  if (!doc) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(doc);
};

export const handleCreateProformaInvoice = async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  const parsed = insertProformaInvoiceSchema.safeParse(docData);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const doc = await createProformaInvoice(parsed.data, Array.isArray(items) ? items : []);
    res.status(201).json(doc);
  } catch (err: any) {
    console.error("Proforma create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateProformaInvoice = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { items, ...updateData } = req.body;
  const updated = await updateProformaInvoice(id, updateData, Array.isArray(items) ? items : []);
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(updated);
};

export const handleDeleteProformaInvoice = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const deleted = await deleteProformaInvoice(id);
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
};

export const handleGetSalesOrders = async (_req: Request, res: Response) => {
  res.json(await getSalesOrders());
};

export const handleGetSalesOrderById = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const doc = await getSalesOrderById(id);
  if (!doc) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(doc);
};

export const handleCreateSalesOrder = async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  const parsed = insertSalesOrderSchema.safeParse(docData);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const doc = await createSalesOrder(parsed.data, Array.isArray(items) ? items : []);
    res.status(201).json(doc);
  } catch (err: any) {
    console.error("Sales order create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateSalesOrder = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { items, ...updateData } = req.body;
  const updated = await updateSalesOrder(id, updateData, Array.isArray(items) ? items : []);
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(updated);
};

export const handleDeleteSalesOrder = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const deleted = await deleteSalesOrder(id);
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
};

export const handleGetDeliveryChallans = async (_req: Request, res: Response) => {
  res.json(await getDeliveryChallans());
};

export const handleGetDeliveryChallanById = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const doc = await getDeliveryChallanById(id);
  if (!doc) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(doc);
};

export const handleCreateDeliveryChallan = async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  const parsed = insertDeliveryChallanSchema.safeParse(docData);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const doc = await createDeliveryChallan(parsed.data, Array.isArray(items) ? items : []);
    res.status(201).json(doc);
  } catch (err: any) {
    console.error("Challan create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateDeliveryChallan = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { items, ...updateData } = req.body;
  try {
    const updated = await updateDeliveryChallan(id, updateData, Array.isArray(items) ? items : []);
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    if (err.message?.startsWith("Insufficient stock")) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error("Challan patch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteDeliveryChallan = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const deleted = await deleteDeliveryChallan(id);
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
};

export const handleGetSalesInvoices = async (_req: Request, res: Response) => {
  res.json(await getSalesInvoices());
};

export const handleGetSalesInvoiceById = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const doc = await getSalesInvoiceById(id);
  if (!doc) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(doc);
};

export const handleCreateSalesInvoice = async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  const parsed = insertSalesInvoiceSchema.safeParse(docData);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const doc = await createSalesInvoice(parsed.data, Array.isArray(items) ? items : []);
    res.status(201).json(doc);
  } catch (err: any) {
    console.error("Invoice create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateSalesInvoice = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { items, amountPaid, balanceDue, paymentStatus, createdBy, ...updateData } = req.body;
  const updated = await updateSalesInvoice(id, updateData, Array.isArray(items) ? items : []);
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(updated);
};

export const handleDeleteSalesInvoice = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const deleted = await deleteSalesInvoice(id);
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
};

export const handleGetSalesReturns = async (_req: Request, res: Response) => {
  res.json(await getSalesReturns());
};

export const handleGetSalesReturnById = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const doc = await getSalesReturnById(id);
  if (!doc) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(doc);
};

export const handleCreateSalesReturn = async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  const parsed = insertSalesReturnSchema.safeParse(docData);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const doc = await createSalesReturn(parsed.data, Array.isArray(items) ? items : []);
    res.status(201).json(doc);
  } catch (err: any) {
    console.error("Return create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateSalesReturn = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { items, ...updateData } = req.body;
  try {
    const updated = await updateSalesReturn(id, updateData, Array.isArray(items) ? items : []);
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    console.error("Return patch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteSalesReturn = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const deleted = await deleteSalesReturn(id);
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
};

export const handleGetSalesPayments = async (req: Request, res: Response) => {
  const invoiceId = req.query.invoiceId ? parseInt(req.query.invoiceId as string) : undefined;
  res.json(await getSalesPayments(invoiceId));
};

export const handleCreateSalesPayment = async (req: Request, res: Response) => {
  const parsed = insertSalesPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const payment = await createSalesPayment(parsed.data);
    res.status(201).json(payment);
  } catch (err: any) {
    console.error("Payment create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteSalesPayment = async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;
  const deleted = await deleteSalesPayment(id);
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
};

export const handleGetGstType = async (req: Request, res: Response) => {
  const placeOfSupply = req.query.placeOfSupply as string;
  res.json({ gstType: determineGstType(placeOfSupply), companyStateCode: COMPANY_STATE_CODE });
};

export const handleGetDocumentSequences = async (_req: Request, res: Response) => {
  res.json(await getDocumentSequences());
};
