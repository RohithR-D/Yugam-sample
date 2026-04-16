import { type Request, type Response } from "express";
import {
  createContract,
  createContractaCompliance,
  createContractaTemplate,
  deleteContractaCompliance,
  deleteContractaTemplate,
  getContractaCompliances,
  getContractaDashboardSummary,
  getContractaTemplates,
  getContracts,
  updateContractaTemplate,
} from "../services/legalService";
import { insertComplianceSchema, insertContractSchema, insertTemplateSchema } from "@workspace/db/schema";

export const handleGetContracts = async (_req: Request, res: Response) => {
  res.json(await getContracts());
};

export const handleCreateContract = async (req: Request, res: Response) => {
  const parsed = insertContractSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const contract = await createContract(parsed.data);
    res.status(201).json(contract);
  } catch (err: any) {
    console.error("Contract create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetContractaCompliances = async (req: Request, res: Response) => {
  const category = req.query.category ? String(req.query.category) : undefined;
  res.json(await getContractaCompliances(category));
};

export const handleCreateContractaCompliance = async (req: Request, res: Response) => {
  const parsed = insertComplianceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const compliance = await createContractaCompliance(parsed.data);
    res.status(201).json(compliance);
  } catch (err: any) {
    console.error("Contracta compliance create error:", err);
    res.status(500).json({ error: "Failed to create compliance record" });
  }
};

export const handleDeleteContractaCompliance = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const deleted = await deleteContractaCompliance(id);
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
};

export const handleGetContractaDashboardSummary = async (_req: Request, res: Response) => {
  res.json(await getContractaDashboardSummary());
};

export const handleGetContractaTemplates = async (_req: Request, res: Response) => {
  res.json(await getContractaTemplates());
};

export const handleCreateContractaTemplate = async (req: Request, res: Response) => {
  const parsed = insertTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const template = await createContractaTemplate(parsed.data);
    res.status(201).json(template);
  } catch (err: any) {
    console.error("Contracta template create error:", err);
    res.status(500).json({ error: "Failed to create template" });
  }
};

export const handleUpdateContractaTemplate = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const row = await updateContractaTemplate(id, req.body);
    if (!row) {
      res.status(404).json({ error: "Template not found" });
      return;
    }
    res.json(row);
  } catch (err: any) {
    console.error("Contracta template update error:", err);
    res.status(500).json({ error: "Failed to update template" });
  }
};

export const handleDeleteContractaTemplate = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const deleted = await deleteContractaTemplate(id);
  if (!deleted) {
    res.status(404).json({ error: "Template not found" });
    return;
  }
  res.json({ success: true });
};
