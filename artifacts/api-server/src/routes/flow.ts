import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  projectsTable, insertProjectSchema,
  flowMilestonesTable, insertFlowMilestoneSchema,
  flowBudgetsTable, insertFlowBudgetSchema,
  flowDocumentsTable, insertFlowDocumentSchema,
} from "@workspace/db/schema";
import { eq, desc, sql } from "drizzle-orm";

const flowRouter = Router();

flowRouter.get("/flow/projects", async (_req: Request, res: Response) => {
  const rows = await db.select().from(projectsTable).orderBy(desc(projectsTable.createdAt));
  res.json(rows);
});

flowRouter.post("/flow/projects", async (req: Request, res: Response) => {
  const parsed = insertProjectSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(projectsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

flowRouter.patch("/flow/projects/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const validStatuses = ["Planning", "Active", "On Hold", "Handover"];
  if (req.body.status !== undefined && !validStatuses.includes(req.body.status)) { res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }); return; }
  const updates: Record<string, any> = {};
  if (req.body.projectName !== undefined) updates.projectName = req.body.projectName;
  if (req.body.clientName !== undefined) updates.clientName = req.body.clientName;
  if (req.body.budget !== undefined) updates.budget = req.body.budget;
  if (req.body.totalValue !== undefined) updates.totalValue = req.body.totalValue;
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.startDate !== undefined) updates.startDate = new Date(req.body.startDate);
  if (req.body.dueDate !== undefined) updates.dueDate = new Date(req.body.dueDate);
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No valid fields to update" }); return; }
  const [updated] = await db.update(projectsTable).set(updates).where(eq(projectsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

flowRouter.delete("/flow/projects/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(flowMilestonesTable).where(eq(flowMilestonesTable.projectId, id));
    await db.delete(flowBudgetsTable).where(eq(flowBudgetsTable.projectId, id));
    await db.delete(flowDocumentsTable).where(eq(flowDocumentsTable.projectId, id));
    await db.delete(projectsTable).where(eq(projectsTable.id, id));
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: "Failed to delete project" }); }
});

flowRouter.get("/flow/milestones", async (req: Request, res: Response) => {
  const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : null;
  if (projectId) {
    const rows = await db.select().from(flowMilestonesTable).where(eq(flowMilestonesTable.projectId, projectId)).orderBy(flowMilestonesTable.targetDate);
    res.json(rows);
  } else {
    const rows = await db.select().from(flowMilestonesTable).orderBy(flowMilestonesTable.targetDate);
    res.json(rows);
  }
});

flowRouter.post("/flow/milestones", async (req: Request, res: Response) => {
  const parsed = insertFlowMilestoneSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(flowMilestonesTable).values(parsed.data).returning();
  res.status(201).json(row);
});

flowRouter.patch("/flow/milestones/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const updates: Record<string, any> = {};
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.targetDate !== undefined) updates.targetDate = new Date(req.body.targetDate);
  if (req.body.completionPercent !== undefined) {
    const pct = parseInt(req.body.completionPercent);
    if (isNaN(pct) || pct < 0 || pct > 100) { res.status(400).json({ error: "completionPercent must be 0-100" }); return; }
    updates.completionPercent = pct;
  }
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No valid fields to update" }); return; }
  const [updated] = await db.update(flowMilestonesTable).set(updates).where(eq(flowMilestonesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

flowRouter.delete("/flow/milestones/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(flowMilestonesTable).where(eq(flowMilestonesTable.id, id));
  res.json({ success: true });
});

flowRouter.get("/flow/budgets", async (req: Request, res: Response) => {
  const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : null;
  if (projectId) {
    const rows = await db.select().from(flowBudgetsTable).where(eq(flowBudgetsTable.projectId, projectId)).orderBy(flowBudgetsTable.category);
    res.json(rows);
  } else {
    const rows = await db.select().from(flowBudgetsTable).orderBy(desc(flowBudgetsTable.createdAt));
    res.json(rows);
  }
});

flowRouter.post("/flow/budgets", async (req: Request, res: Response) => {
  const parsed = insertFlowBudgetSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(flowBudgetsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

flowRouter.patch("/flow/budgets/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const updates: Record<string, any> = {};
  if (req.body.category !== undefined) updates.category = req.body.category;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.estimatedBudget !== undefined) updates.estimatedBudget = req.body.estimatedBudget;
  if (req.body.actualCost !== undefined) updates.actualCost = req.body.actualCost;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No valid fields to update" }); return; }
  const [updated] = await db.update(flowBudgetsTable).set(updates).where(eq(flowBudgetsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

flowRouter.delete("/flow/budgets/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(flowBudgetsTable).where(eq(flowBudgetsTable.id, id));
  res.json({ success: true });
});

flowRouter.get("/flow/documents", async (req: Request, res: Response) => {
  const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : null;
  if (projectId) {
    const rows = await db.select().from(flowDocumentsTable).where(eq(flowDocumentsTable.projectId, projectId)).orderBy(desc(flowDocumentsTable.createdAt));
    res.json(rows);
  } else {
    const rows = await db.select().from(flowDocumentsTable).orderBy(desc(flowDocumentsTable.createdAt));
    res.json(rows);
  }
});

flowRouter.post("/flow/documents", async (req: Request, res: Response) => {
  const parsed = insertFlowDocumentSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  if (parsed.data.fileUrl && !/^https?:\/\//i.test(parsed.data.fileUrl)) { res.status(400).json({ error: "fileUrl must use http or https scheme" }); return; }
  const [row] = await db.insert(flowDocumentsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

flowRouter.delete("/flow/documents/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(flowDocumentsTable).where(eq(flowDocumentsTable.id, id));
  res.json({ success: true });
});

flowRouter.get("/flow/dashboard-summary", async (_req: Request, res: Response) => {
  const [projStats] = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`count(*) filter (where ${projectsTable.status} = 'Active')`,
    totalValue: sql<number>`coalesce(sum(${projectsTable.totalValue}), 0)`,
    totalBudget: sql<number>`coalesce(sum(${projectsTable.budget}), 0)`,
  }).from(projectsTable);

  const [budgetStats] = await db.select({
    totalEstimated: sql<number>`coalesce(sum(${flowBudgetsTable.estimatedBudget}), 0)`,
    totalActual: sql<number>`coalesce(sum(${flowBudgetsTable.actualCost}), 0)`,
  }).from(flowBudgetsTable);

  const milestones = await db.select().from(flowMilestonesTable).orderBy(flowMilestonesTable.targetDate);
  const now = new Date();
  const upcomingMilestones = milestones.filter(m => new Date(m.targetDate) >= now && m.completionPercent < 100).slice(0, 8);

  const totalEstimated = Number(budgetStats.totalEstimated) || Number(projStats.totalBudget) || 1;
  const totalActual = Number(budgetStats.totalActual) || 0;
  const burnRate = Math.round((totalActual / totalEstimated) * 100);

  let scheduleVarianceDays = 0;
  if (milestones.length > 0) {
    const variances = milestones.map(m => {
      const target = new Date(m.targetDate).getTime();
      const today = now.getTime();
      if (m.completionPercent >= 100) return 0;
      return Math.round((today - target) / (1000 * 60 * 60 * 24));
    });
    scheduleVarianceDays = Math.round(variances.reduce((a, b) => a + b, 0) / variances.length);
  }

  const categoryBreakdown = await db.select({
    category: flowBudgetsTable.category,
    estimated: sql<number>`coalesce(sum(${flowBudgetsTable.estimatedBudget}), 0)`,
    actual: sql<number>`coalesce(sum(${flowBudgetsTable.actualCost}), 0)`,
  }).from(flowBudgetsTable).groupBy(flowBudgetsTable.category);

  res.json({
    activeProjects: Number(projStats.active),
    totalPortfolioValue: Number(projStats.totalValue) || Number(projStats.totalBudget),
    scheduleVarianceDays,
    budgetBurnRate: burnRate,
    upcomingMilestones,
    categoryBreakdown,
  });
});

export default flowRouter;
