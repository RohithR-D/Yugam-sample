import { type Request, type Response } from "express";
import { getShipments, createShipment } from "../services/shipmentsService";
import { insertShipmentSchema } from "@workspace/db/schema";

export const handleGetShipments = async (_req: Request, res: Response) => {
  const shipments = await getShipments();
  res.json(shipments);
};

export const handleCreateShipment = async (req: Request, res: Response) => {
  const parsed = insertShipmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const shipment = await createShipment(parsed.data);
    res.status(201).json(shipment);
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ error: "A shipment with this tracking number already exists" });
      return;
    }
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};
