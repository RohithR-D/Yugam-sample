import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { shipmentsTable, insertShipmentSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const shipmentsRouter = Router();

shipmentsRouter.get("/shipments", async (_req: Request, res: Response) => {
  const shipments = await db.select().from(shipmentsTable).orderBy(desc(shipmentsTable.createdAt));
  res.json(shipments);
});

shipmentsRouter.post("/shipments", async (req: Request, res: Response) => {
  const parsed = insertShipmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [shipment] = await db.insert(shipmentsTable).values(parsed.data).returning();
    res.status(201).json(shipment);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A shipment with this tracking number already exists" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default shipmentsRouter;
