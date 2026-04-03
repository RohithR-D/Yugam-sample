import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  tasksTable, insertTaskSchema,
  ticketsTable, insertTicketSchema,
  timesheetsTable, insertTimesheetSchema,
} from "@workspace/db/schema";
import { projectsTable } from "@workspace/db/schema";
import { eq, desc, sql } from "drizzle-orm";

const sprintRouter = Router();

sprintRouter.get("/sprint/tasks", async (_req: Request, res: Response) => {
  const rows = await db.select().from(tasksTable).orderBy(desc(tasksTable.createdAt));
  res.json(rows);
});

sprintRouter.post("/sprint/tasks", async (req: Request, res: Response) => {
  const parsed = insertTaskSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(tasksTable).values(parsed.data).returning();
  res.status(201).json(row);
});

sprintRouter.patch("/sprint/tasks/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const validStatuses = ["New", "In Progress", "Review", "Done"];
  const validPriorities = ["Low", "Medium", "High"];
  if (req.body.status !== undefined && !validStatuses.includes(req.body.status)) { res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }); return; }
  if (req.body.priority !== undefined && !validPriorities.includes(req.body.priority)) { res.status(400).json({ error: `Invalid priority` }); return; }
  const updates: Record<string, any> = {};
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.assignee !== undefined) updates.assignee = req.body.assignee;
  if (req.body.priority !== undefined) updates.priority = req.body.priority;
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.parentProject !== undefined) updates.parentProject = req.body.parentProject;
  if (req.body.startDate !== undefined) updates.startDate = new Date(req.body.startDate);
  if (req.body.dueDate !== undefined) updates.dueDate = new Date(req.body.dueDate);
  if (req.body.attachments !== undefined) updates.attachments = req.body.attachments;
  if (req.body.reminder !== undefined) updates.reminder = new Date(req.body.reminder);
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No valid fields to update" }); return; }
  const [updated] = await db.update(tasksTable).set(updates).where(eq(tasksTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

sprintRouter.delete("/sprint/tasks/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(tasksTable).where(eq(tasksTable.id, id));
  res.json({ success: true });
});

sprintRouter.get("/sprint/tickets", async (_req: Request, res: Response) => {
  const rows = await db.select().from(ticketsTable).orderBy(desc(ticketsTable.createdAt));
  res.json(rows);
});

sprintRouter.post("/sprint/tickets", async (req: Request, res: Response) => {
  const parsed = insertTicketSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(ticketsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

sprintRouter.patch("/sprint/tickets/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const validStatuses = ["New", "Open", "Pending", "Closed"];
  const validPriorities = ["Low", "Medium", "High"];
  const validTypes = ["Question", "Bug", "Maintenance", "HR"];
  if (req.body.status !== undefined && !validStatuses.includes(req.body.status)) { res.status(400).json({ error: `Invalid status` }); return; }
  if (req.body.priority !== undefined && !validPriorities.includes(req.body.priority)) { res.status(400).json({ error: `Invalid priority` }); return; }
  if (req.body.type !== undefined && !validTypes.includes(req.body.type)) { res.status(400).json({ error: `Invalid type` }); return; }
  const updates: Record<string, any> = {};
  if (req.body.ticketName !== undefined) updates.ticketName = req.body.ticketName;
  if (req.body.type !== undefined) updates.type = req.body.type;
  if (req.body.priority !== undefined) updates.priority = req.body.priority;
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.parentProject !== undefined) updates.parentProject = req.body.parentProject;
  if (req.body.dueDate !== undefined) updates.dueDate = new Date(req.body.dueDate);
  if (req.body.contact !== undefined) updates.contact = req.body.contact;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.assignedTeam !== undefined) updates.assignedTeam = req.body.assignedTeam;
  if (req.body.assignedTo !== undefined) updates.assignedTo = req.body.assignedTo;
  if (req.body.attachments !== undefined) updates.attachments = req.body.attachments;
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No valid fields to update" }); return; }
  const [updated] = await db.update(ticketsTable).set(updates).where(eq(ticketsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

sprintRouter.delete("/sprint/tickets/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(ticketsTable).where(eq(ticketsTable.id, id));
  res.json({ success: true });
});

sprintRouter.get("/sprint/timesheets", async (_req: Request, res: Response) => {
  const rows = await db.select().from(timesheetsTable).orderBy(desc(timesheetsTable.logDate));
  res.json(rows);
});

sprintRouter.post("/sprint/timesheets", async (req: Request, res: Response) => {
  const parsed = insertTimesheetSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(timesheetsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

sprintRouter.delete("/sprint/timesheets/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(timesheetsTable).where(eq(timesheetsTable.id, id));
  res.json({ success: true });
});

sprintRouter.get("/sprint/projects", async (_req: Request, res: Response) => {
  const rows = await db.select({ id: projectsTable.id, projectName: projectsTable.projectName }).from(projectsTable).orderBy(projectsTable.projectName);
  res.json(rows);
});

export default sprintRouter;
