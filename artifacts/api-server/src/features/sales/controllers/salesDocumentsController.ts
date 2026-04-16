import { type Request, type Response } from "express";
import {
  createSalesDocument,
  deleteSalesDocument,
  getSalesDocumentById,
  getSalesDocuments,
  updateSalesDocument,
} from "../services/salesDocumentsService";
import { insertSalesDocumentSchema } from "@workspace/db/schema";

export const handleGetSalesDocuments = async (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  res.json(await getSalesDocuments(type));
};

export const handleGetSalesDocumentById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const doc = await getSalesDocumentById(id);
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.json(doc);
};

export const handleCreateSalesDocument = async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  const parsed = insertSalesDocumentSchema.safeParse(docData);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const doc = await createSalesDocument(parsed.data, Array.isArray(items) ? items : []);
    res.status(201).json(doc);
  } catch (err: any) {
    console.error("Sales document create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateSalesDocument = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { items, ...updateData } = req.body;
  const updated = await updateSalesDocument(id, updateData, Array.isArray(items) ? items : []);
  if (!updated) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.json(updated);
};

export const handleDeleteSalesDocument = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const deleted = await deleteSalesDocument(id);
  if (!deleted) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.json({ success: true });
};
