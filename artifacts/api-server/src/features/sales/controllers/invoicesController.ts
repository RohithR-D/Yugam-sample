import { type Request, type Response } from "express";
import { createInvoice, deleteInvoice, getInvoiceById, getInvoices, updateInvoice } from "../services/invoicesService";
import { insertInvoiceSchema } from "@workspace/db/schema";

export const handleGetInvoices = async (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  res.json(await getInvoices(type));
};

export const handleGetInvoiceById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const invoice = await getInvoiceById(id);
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(invoice);
};

export const handleCreateInvoice = async (req: Request, res: Response) => {
  const { items, ...invoiceData } = req.body;
  const parsed = insertInvoiceSchema.safeParse(invoiceData);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const invoice = await createInvoice(parsed.data, Array.isArray(items) ? items : []);
    res.status(201).json(invoice);
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ error: "A document with this number already exists" });
      return;
    }
    console.error("Invoice create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateInvoice = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { items, ...updateData } = req.body;
  const updated = await updateInvoice(id, updateData, Array.isArray(items) ? items : []);
  if (!updated) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(updated);
};

export const handleDeleteInvoice = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const deleted = await deleteInvoice(id);
  if (!deleted) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json({ success: true });
};
