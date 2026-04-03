import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  forgeWorkstationsTable, insertForgeWorkstationSchema,
  forgeBOMTable, insertForgeBOMSchema,
  forgeBOMMaterialsTable, insertForgeBOMMaterialSchema,
  forgeBOMRoutingTable, insertForgeBOMRoutingSchema,
  forgeWorkOrdersTable, insertForgeWorkOrderSchema,
  forgeQualityControlTable, insertForgeQualityControlSchema,
  forgeDowntimeLogsTable, insertForgeDowntimeLogSchema,
} from "@workspace/db/schema";
import { eq, desc, sql } from "drizzle-orm";

const forgeRouter = Router();

forgeRouter.get("/forge/workstations", async (_req: Request, res: Response) => {
  const rows = await db.select().from(forgeWorkstationsTable).orderBy(forgeWorkstationsTable.name);
  res.json(rows);
});

forgeRouter.post("/forge/workstations", async (req: Request, res: Response) => {
  const parsed = insertForgeWorkstationSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(forgeWorkstationsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

forgeRouter.patch("/forge/workstations/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const validTypes = ["Machine", "Manual Line", "Vendor", "QC Desk"];
  const validStatuses = ["Active", "Idle", "Maintenance"];
  if (req.body.type !== undefined && !validTypes.includes(req.body.type)) { res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(", ")}` }); return; }
  if (req.body.status !== undefined && !validStatuses.includes(req.body.status)) { res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }); return; }
  const updates: Record<string, any> = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.type !== undefined) updates.type = req.body.type;
  if (req.body.costPerHour !== undefined) updates.costPerHour = req.body.costPerHour;
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No valid fields to update" }); return; }
  const [updated] = await db.update(forgeWorkstationsTable).set(updates).where(eq(forgeWorkstationsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

forgeRouter.delete("/forge/workstations/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(forgeWorkstationsTable).where(eq(forgeWorkstationsTable.id, id));
  res.json({ success: true });
});

forgeRouter.get("/forge/bom", async (_req: Request, res: Response) => {
  const rows = await db.select().from(forgeBOMTable).orderBy(desc(forgeBOMTable.createdAt));
  res.json(rows);
});

forgeRouter.get("/forge/bom/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [bom] = await db.select().from(forgeBOMTable).where(eq(forgeBOMTable.id, id));
  if (!bom) { res.status(404).json({ error: "Not found" }); return; }
  const materials = await db.select().from(forgeBOMMaterialsTable).where(eq(forgeBOMMaterialsTable.bomId, id));
  const routing = await db.select().from(forgeBOMRoutingTable).where(eq(forgeBOMRoutingTable.bomId, id)).orderBy(forgeBOMRoutingTable.sequenceNo);
  res.json({ ...bom, materials, routing });
});

forgeRouter.post("/forge/bom", async (req: Request, res: Response) => {
  const { materials, routing, ...bomData } = req.body;
  const parsed = insertForgeBOMSchema.safeParse(bomData);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  try {
    const result = await db.transaction(async (tx) => {
      const [bom] = await tx.insert(forgeBOMTable).values(parsed.data).returning();
      if (materials && Array.isArray(materials)) {
        for (const mat of materials) {
          const matParsed = insertForgeBOMMaterialSchema.safeParse({ ...mat, bomId: bom.id });
          if (!matParsed.success) throw new Error(`Invalid material: ${matParsed.error.issues.map(i => i.message).join(", ")}`);
          await tx.insert(forgeBOMMaterialsTable).values(matParsed.data);
        }
      }
      if (routing && Array.isArray(routing)) {
        for (const route of routing) {
          const routeParsed = insertForgeBOMRoutingSchema.safeParse({ ...route, bomId: bom.id });
          if (!routeParsed.success) throw new Error(`Invalid routing: ${routeParsed.error.issues.map(i => i.message).join(", ")}`);
          await tx.insert(forgeBOMRoutingTable).values(routeParsed.data);
        }
      }
      const mats = await tx.select().from(forgeBOMMaterialsTable).where(eq(forgeBOMMaterialsTable.bomId, bom.id));
      const routes = await tx.select().from(forgeBOMRoutingTable).where(eq(forgeBOMRoutingTable.bomId, bom.id));
      return { ...bom, materials: mats, routing: routes };
    });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create BOM" });
  }
});

forgeRouter.delete("/forge/bom/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(forgeBOMMaterialsTable).where(eq(forgeBOMMaterialsTable.bomId, id));
  await db.delete(forgeBOMRoutingTable).where(eq(forgeBOMRoutingTable.bomId, id));
  await db.delete(forgeBOMTable).where(eq(forgeBOMTable.id, id));
  res.json({ success: true });
});

forgeRouter.get("/forge/work-orders", async (_req: Request, res: Response) => {
  const rows = await db.select().from(forgeWorkOrdersTable).orderBy(desc(forgeWorkOrdersTable.createdAt));
  res.json(rows);
});

forgeRouter.post("/forge/work-orders", async (req: Request, res: Response) => {
  const parsed = insertForgeWorkOrderSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(forgeWorkOrdersTable).values(parsed.data).returning();
  res.status(201).json(row);
});

forgeRouter.patch("/forge/work-orders/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const validStatuses = ["Draft", "In Progress", "QC", "Completed"];
  const validPriorities = ["Low", "Normal", "High", "Urgent"];
  if (req.body.status !== undefined && !validStatuses.includes(req.body.status)) { res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }); return; }
  if (req.body.priority !== undefined && !validPriorities.includes(req.body.priority)) { res.status(400).json({ error: `Invalid priority. Must be one of: ${validPriorities.join(", ")}` }); return; }
  if (req.body.producedQty !== undefined && (typeof req.body.producedQty !== "number" || req.body.producedQty < 0)) { res.status(400).json({ error: "producedQty must be a non-negative number" }); return; }
  if (req.body.scrapQty !== undefined && (typeof req.body.scrapQty !== "number" || req.body.scrapQty < 0)) { res.status(400).json({ error: "scrapQty must be a non-negative number" }); return; }
  if (req.body.targetQty !== undefined && (typeof req.body.targetQty !== "number" || req.body.targetQty < 1)) { res.status(400).json({ error: "targetQty must be a positive number" }); return; }
  const updates: Record<string, any> = {};
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.producedQty !== undefined) updates.producedQty = req.body.producedQty;
  if (req.body.scrapQty !== undefined) updates.scrapQty = req.body.scrapQty;
  if (req.body.targetQty !== undefined) updates.targetQty = req.body.targetQty;
  if (req.body.assignedWorkstationId !== undefined) updates.assignedWorkstationId = req.body.assignedWorkstationId;
  if (req.body.assignedWorkstationName !== undefined) updates.assignedWorkstationName = req.body.assignedWorkstationName;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  if (req.body.priority !== undefined) updates.priority = req.body.priority;
  if (req.body.startDate !== undefined) updates.startDate = new Date(req.body.startDate);
  if (req.body.endDate !== undefined) updates.endDate = new Date(req.body.endDate);
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No valid fields to update" }); return; }
  const [updated] = await db.update(forgeWorkOrdersTable).set(updates).where(eq(forgeWorkOrdersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

forgeRouter.delete("/forge/work-orders/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(forgeWorkOrdersTable).where(eq(forgeWorkOrdersTable.id, id));
  res.json({ success: true });
});

forgeRouter.get("/forge/quality-control", async (_req: Request, res: Response) => {
  const rows = await db.select().from(forgeQualityControlTable).orderBy(desc(forgeQualityControlTable.createdAt));
  res.json(rows);
});

forgeRouter.post("/forge/quality-control", async (req: Request, res: Response) => {
  const parsed = insertForgeQualityControlSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(forgeQualityControlTable).values(parsed.data).returning();
  res.status(201).json(row);
});

forgeRouter.delete("/forge/quality-control/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(forgeQualityControlTable).where(eq(forgeQualityControlTable.id, id));
  res.json({ success: true });
});

forgeRouter.get("/forge/downtime-logs", async (_req: Request, res: Response) => {
  const rows = await db.select().from(forgeDowntimeLogsTable).orderBy(desc(forgeDowntimeLogsTable.createdAt));
  res.json(rows);
});

forgeRouter.post("/forge/downtime-logs", async (req: Request, res: Response) => {
  const parsed = insertForgeDowntimeLogSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(forgeDowntimeLogsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

forgeRouter.delete("/forge/downtime-logs/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(forgeDowntimeLogsTable).where(eq(forgeDowntimeLogsTable.id, id));
  res.json({ success: true });
});

forgeRouter.get("/forge/dashboard-summary", async (_req: Request, res: Response) => {
  const [woStats] = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`count(*) filter (where ${forgeWorkOrdersTable.status} = 'In Progress')`,
    todayYield: sql<number>`coalesce(sum(${forgeWorkOrdersTable.producedQty}) filter (where ${forgeWorkOrdersTable.status} in ('In Progress','QC','Completed') and ${forgeWorkOrdersTable.createdAt} >= current_date), 0)`,
    totalProduced: sql<number>`coalesce(sum(${forgeWorkOrdersTable.producedQty}), 0)`,
    totalScrap: sql<number>`coalesce(sum(${forgeWorkOrdersTable.scrapQty}), 0)`,
    totalTarget: sql<number>`coalesce(sum(${forgeWorkOrdersTable.targetQty}), 0)`,
  }).from(forgeWorkOrdersTable);

  const [wsStats] = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`count(*) filter (where ${forgeWorkstationsTable.status} = 'Active')`,
    idle: sql<number>`count(*) filter (where ${forgeWorkstationsTable.status} = 'Idle')`,
    maintenance: sql<number>`count(*) filter (where ${forgeWorkstationsTable.status} = 'Maintenance')`,
  }).from(forgeWorkstationsTable);

  const totalProduced = Number(woStats.totalProduced) || 0;
  const totalScrap = Number(woStats.totalScrap) || 0;
  const totalTarget = Number(woStats.totalTarget) || 1;
  const oee = totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 100) : 0;
  const scrapRate = (totalProduced + totalScrap) > 0 ? Math.round((totalScrap / (totalProduced + totalScrap)) * 100) : 0;

  res.json({
    activeWorkOrders: Number(woStats.active),
    todayYield: Number(woStats.todayYield),
    oee,
    scrapRate,
    workstations: { total: Number(wsStats.total), active: Number(wsStats.active), idle: Number(wsStats.idle), maintenance: Number(wsStats.maintenance) },
  });
});

export default forgeRouter;
