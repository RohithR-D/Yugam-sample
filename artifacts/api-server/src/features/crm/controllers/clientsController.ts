import { type Request, type Response } from "express";
import { getClientById, getClients, createClient, updateClient } from "../services/clientsService";
import { insertClientSchema } from "@workspace/db/schema";

export const handleGetClients = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 50));
  const result = await getClients(page, limit);
  res.json(result);
};

export const handleGetClientById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const client = await getClientById(id);
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.json(client);
};

export const handleCreateClient = async (req: Request, res: Response) => {
  const parsed = insertClientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const client = await createClient(parsed.data);
    res.status(201).json(client);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const handleUpdateClient = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const updates: Record<string, any> = {};
  if (req.body.pipelineStatus !== undefined) updates.pipelineStatus = req.body.pipelineStatus;
  if (req.body.companyName !== undefined) updates.companyName = req.body.companyName;
  if (req.body.contactName !== undefined) updates.contactName = req.body.contactName;
  if (req.body.industry !== undefined) updates.industry = req.body.industry;
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.dealValue !== undefined) updates.dealValue = req.body.dealValue;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const updated = await updateClient(id, updates);
  if (!updated) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.json(updated);
};
