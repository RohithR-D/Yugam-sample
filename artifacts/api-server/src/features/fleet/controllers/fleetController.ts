import { type Request, type Response } from "express";
import {
  createFleetExpense,
  createFleetTrip,
  createFleetVehicle,
  deleteFleetExpense,
  deleteFleetVehicle,
  getFleetDashboard,
  getFleetExpenses,
  getFleetTrips,
  getFleetVehicles,
  updateFleetTripStatus,
  updateFleetVehicleStatus,
} from "../services/fleetService";
import {
  insertFleetExpenseSchema,
  insertFleetTripSchema,
  insertFleetVehicleSchema,
} from "@workspace/db/schema";

export const handleGetFleetDashboard = async (_req: Request, res: Response) => {
  res.json(await getFleetDashboard());
};

export const handleGetFleetVehicles = async (_req: Request, res: Response) => {
  res.json(await getFleetVehicles());
};

export const handleCreateFleetVehicle = async (req: Request, res: Response) => {
  const parsed = insertFleetVehicleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const vehicle = await createFleetVehicle(parsed.data);
    res.status(201).json(vehicle);
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ error: "Vehicle with this registration number already exists" });
      return;
    }
    res.status(500).json({ error: err.message || "Failed to add vehicle" });
  }
};

export const handleUpdateFleetVehicle = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  if (!["Available", "On Trip", "Maintenance"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const updated = await updateFleetVehicleStatus(id, status);
  if (!updated) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }
  res.json(updated);
};

export const handleDeleteFleetVehicle = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const deleted = await deleteFleetVehicle(id);
  if (!deleted) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  res.json({ success: true });
};

export const handleGetFleetTrips = async (_req: Request, res: Response) => {
  res.json(await getFleetTrips());
};

export const handleCreateFleetTrip = async (req: Request, res: Response) => {
  const parsed = insertFleetTripSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const trip = await createFleetTrip(parsed.data);
    res.status(201).json(trip);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create trip" });
  }
};

export const handleUpdateFleetTripStatus = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  if (!["Scheduled", "In Transit", "Completed"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const updated = await updateFleetTripStatus(id, status);
  if (!updated) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }

  res.json(updated);
};

export const handleGetFleetExpenses = async (_req: Request, res: Response) => {
  res.json(await getFleetExpenses());
};

export const handleCreateFleetExpense = async (req: Request, res: Response) => {
  const parsed = insertFleetExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const expense = await createFleetExpense(parsed.data);
    res.status(201).json(expense);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to log expense" });
  }
};

export const handleDeleteFleetExpense = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const deleted = await deleteFleetExpense(id);
  if (!deleted) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.json({ success: true });
};
