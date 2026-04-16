import { type Request, type Response } from "express";
import {
  getVaultCatalog,
  createVaultCatalogItem,
  deleteVaultCatalogItem,
  getVaultLocations,
  createVaultLocation,
  deleteVaultLocation,
  getStockLedger,
  getStockMovements,
  createStockMovement,
  getMaterialIndents,
  createMaterialIndent,
  updateMaterialIndent,
  issueMaterialIndent,
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  getVaultDashboardSummary,
} from "../services/vaultService";
import {
  insertInventoryCatalogSchema,
  insertInventoryLocationSchema,
  insertStockMovementSchema,
  insertMaterialIndentSchema,
  insertAssetSchema,
} from "@workspace/db/schema";

export const handleGetVaultCatalog = async (_req: Request, res: Response) => {
  res.json(await getVaultCatalog());
};

export const handleCreateVaultCatalogItem = async (req: Request, res: Response) => {
  const parsed = insertInventoryCatalogSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const item = await createVaultCatalogItem(parsed.data);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const handleDeleteVaultCatalogItem = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const deleted = await deleteVaultCatalogItem(id);
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ success: true });
};

export const handleGetVaultLocations = async (_req: Request, res: Response) => {
  res.json(await getVaultLocations());
};

export const handleCreateVaultLocation = async (req: Request, res: Response) => {
  const parsed = insertInventoryLocationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const loc = await createVaultLocation(parsed.data);
  res.status(201).json(loc);
};

export const handleDeleteVaultLocation = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const deleted = await deleteVaultLocation(id);
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ success: true });
};

export const handleGetStockLedger = async (_req: Request, res: Response) => {
  res.json(await getStockLedger());
};

export const handleGetStockMovements = async (_req: Request, res: Response) => {
  res.json(await getStockMovements());
};

export const handleCreateStockMovement = async (req: Request, res: Response) => {
  const parsed = insertStockMovementSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const { movementType, quantity, fromLocationId, toLocationId } = parsed.data;
  if (!quantity || quantity <= 0) {
    res.status(400).json({ error: "Quantity must be greater than 0" });
    return;
  }
  if (movementType === "Inward" && !toLocationId) {
    res.status(400).json({ error: "Inward movement requires a destination location" });
    return;
  }
  if (movementType === "Outward" && !fromLocationId) {
    res.status(400).json({ error: "Outward movement requires a source location" });
    return;
  }
  if (movementType === "Transfer" && (!fromLocationId || !toLocationId)) {
    res.status(400).json({ error: "Transfer requires both source and destination locations" });
    return;
  }
  if (movementType === "Adjustment" && !toLocationId) {
    res.status(400).json({ error: "Adjustment requires a target location" });
    return;
  }

  try {
    const movement = await createStockMovement(parsed.data);
    res.status(201).json(movement);
  } catch (err: any) {
    console.error("Stock movement error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const handleGetMaterialIndents = async (_req: Request, res: Response) => {
  res.json(await getMaterialIndents());
};

export const handleCreateMaterialIndent = async (req: Request, res: Response) => {
  const parsed = insertMaterialIndentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const indent = await createMaterialIndent(parsed.data);
  res.status(201).json(indent);
};

export const handleUpdateMaterialIndent = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const updates: Record<string, any> = {};
  const allowed = ["approvedQty", "issuedFromLocationId", "status", "issueDate"];
  const validStatuses = ["Pending", "Approved", "Issued", "Rejected"];

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      if (field === "status" && !validStatuses.includes(req.body[field])) continue;
      if (field === "issueDate" && typeof req.body[field] === "string") {
        const date = new Date(req.body[field]);
        if (isNaN(date.getTime())) continue;
        updates[field] = date;
      } else {
        updates[field] = req.body[field];
      }
    }
  }

  const updated = await updateMaterialIndent(id, updates);
  res.json(updated);
};

export const handleIssueMaterialIndent = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { approvedQty, issuedFromLocationId } = req.body;
  if (!approvedQty || approvedQty <= 0) {
    res.status(400).json({ error: "Approved quantity must be > 0" });
    return;
  }
  if (!issuedFromLocationId) {
    res.status(400).json({ error: "Issue location required" });
    return;
  }

  try {
    const result = await issueMaterialIndent(id, approvedQty, issuedFromLocationId);
    res.json(result);
  } catch (err: any) {
    if (err?.message === "Indent not found") {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err?.message === "Already issued") {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error("Issue error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const handleGetAssets = async (_req: Request, res: Response) => {
  res.json(await getAssets());
};

export const handleCreateAsset = async (req: Request, res: Response) => {
  const parsed = insertAssetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const asset = await createAsset(parsed.data);
  res.status(201).json(asset);
};

export const handleUpdateAsset = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const updates: Record<string, any> = {};
  const allowed = ["assetName", "serialNumber", "category", "status", "assignedTo", "purchaseValue", "maintenanceNotes"];
  const validStatuses = ["Active", "Allocated", "Maintenance", "Sold"];

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      if (field === "status" && !validStatuses.includes(req.body[field])) continue;
      updates[field] = req.body[field];
    }
  }

  const updated = await updateAsset(id, updates);
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(updated);
};

export const handleDeleteAsset = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const deleted = await deleteAsset(id);
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ success: true });
};

export const handleGetVaultDashboardSummary = async (_req: Request, res: Response) => {
  res.json(await getVaultDashboardSummary());
};
