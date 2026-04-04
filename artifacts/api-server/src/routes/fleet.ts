import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  fleetVehiclesTable,
  insertFleetVehicleSchema,
  fleetTripsTable,
  insertFleetTripSchema,
  fleetExpensesTable,
  insertFleetExpenseSchema,
} from "@workspace/db/schema";
import { desc, eq, sql, gte, lte, and } from "drizzle-orm";

const fleetRouter = Router();

fleetRouter.get("/fleet/dashboard", async (_req: Request, res: Response) => {
  try {
    const vehicles = await db.select().from(fleetVehiclesTable);
    const total = vehicles.length;
    const onTrip = vehicles.filter((v) => v.status === "On Trip").length;
    const inMaint = vehicles.filter((v) => v.status === "Maintenance").length;
    const available = vehicles.filter((v) => v.status === "Available").length;

    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const now = new Date();
    const expiring = vehicles.filter((v) => {
      const rcExp = v.rcExpiry ? new Date(v.rcExpiry) : null;
      const insExp = v.insuranceExpiry ? new Date(v.insuranceExpiry) : null;
      return (
        (rcExp && rcExp >= now && rcExp <= thirtyDays) ||
        (insExp && insExp >= now && insExp <= thirtyDays)
      );
    }).map((v) => {
      const items: { type: string; date: string }[] = [];
      if (v.rcExpiry && new Date(v.rcExpiry) <= thirtyDays) items.push({ type: "RC", date: v.rcExpiry.toISOString() });
      if (v.insuranceExpiry && new Date(v.insuranceExpiry) <= thirtyDays) items.push({ type: "Insurance", date: v.insuranceExpiry.toISOString() });
      return { regNumber: v.regNumber, vehicleType: v.type, expiries: items };
    });

    res.json({ total, onTrip, inMaintenance: inMaint, available, expiring });
  } catch (err: any) {
    console.error("Fleet dashboard error:", err);
    res.status(500).json({ error: "Failed to fetch fleet dashboard" });
  }
});

fleetRouter.get("/fleet/vehicles", async (_req: Request, res: Response) => {
  try {
    const vehicles = await db.select().from(fleetVehiclesTable).orderBy(desc(fleetVehiclesTable.createdAt));
    res.json(vehicles);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});

fleetRouter.post("/fleet/vehicles", async (req: Request, res: Response) => {
  const parsed = insertFleetVehicleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const [vehicle] = await db.insert(fleetVehiclesTable).values(parsed.data).returning();
    res.status(201).json(vehicle);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "Vehicle with this registration number already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to add vehicle" });
  }
});

fleetRouter.patch("/fleet/vehicles/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!["Available", "On Trip", "Maintenance"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const [updated] = await db.update(fleetVehiclesTable)
      .set({ status })
      .where(eq(fleetVehiclesTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Vehicle not found" });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update vehicle" });
  }
});

fleetRouter.delete("/fleet/vehicles/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [deleted] = await db.delete(fleetVehiclesTable).where(eq(fleetVehiclesTable.id, id)).returning();
    if (!deleted) {
      res.status(404).json({ error: "Vehicle not found" });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete vehicle" });
  }
});

fleetRouter.get("/fleet/trips", async (_req: Request, res: Response) => {
  try {
    const trips = await db.select().from(fleetTripsTable).orderBy(desc(fleetTripsTable.startTime));
    res.json(trips);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch trips" });
  }
});

fleetRouter.post("/fleet/trips", async (req: Request, res: Response) => {
  const parsed = insertFleetTripSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const [trip] = await db.insert(fleetTripsTable).values(parsed.data).returning();
    if (parsed.data.status === "In Transit" && parsed.data.vehicleId) {
      await db.update(fleetVehiclesTable)
        .set({ status: "On Trip" })
        .where(eq(fleetVehiclesTable.id, parsed.data.vehicleId));
    }
    res.status(201).json(trip);
  } catch (err: any) {
    console.error("Trip creation error:", err);
    res.status(500).json({ error: "Failed to create trip" });
  }
});

fleetRouter.patch("/fleet/trips/:id/status", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!["Scheduled", "In Transit", "Completed"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const updates: any = { status };
    if (status === "Completed") updates.endTime = new Date();

    const [updated] = await db.update(fleetTripsTable)
      .set(updates)
      .where(eq(fleetTripsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }
    if (status === "Completed" && updated.vehicleId) {
      await db.update(fleetVehiclesTable)
        .set({ status: "Available" })
        .where(eq(fleetVehiclesTable.id, updated.vehicleId));
    }
    if (status === "In Transit" && updated.vehicleId) {
      await db.update(fleetVehiclesTable)
        .set({ status: "On Trip" })
        .where(eq(fleetVehiclesTable.id, updated.vehicleId));
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update trip" });
  }
});

fleetRouter.get("/fleet/expenses", async (_req: Request, res: Response) => {
  try {
    const expenses = await db.select().from(fleetExpensesTable).orderBy(desc(fleetExpensesTable.expenseDate));
    res.json(expenses);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

fleetRouter.post("/fleet/expenses", async (req: Request, res: Response) => {
  const parsed = insertFleetExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const [expense] = await db.insert(fleetExpensesTable).values(parsed.data).returning();
    res.status(201).json(expense);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to log expense" });
  }
});

fleetRouter.delete("/fleet/expenses/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [deleted] = await db.delete(fleetExpensesTable).where(eq(fleetExpensesTable.id, id)).returning();
    if (!deleted) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

export default fleetRouter;
