import { Router, type Request, type Response } from "express";
import {
  projectsTable, insertProjectSchema,
  flowMilestonesTable, insertFlowMilestoneSchema,
  flowBudgetsTable, insertFlowBudgetSchema,
  flowDocumentsTable, insertFlowDocumentSchema,
} from "@workspace/db/schema";

const flowRouter = Router();

flowRouter.get("/flow/projects", async (_req: Request, res: Response) => {
  const rows = await projectsTable.find().sort({ createdAt: -1 }).lean();
  res.json(rows);
});

flowRouter.post("/flow/projects", async (req: Request, res: Response) => {
  const parsed = insertProjectSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const row = await projectsTable.create(parsed.data);
  res.status(201).json(row.toObject());
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
  const updated = await projectsTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

flowRouter.delete("/flow/projects/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await flowMilestonesTable.deleteMany({ projectId: id });
    await flowBudgetsTable.deleteMany({ projectId: id });
    await flowDocumentsTable.deleteMany({ projectId: id });
    await projectsTable.findOneAndDelete({ id });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: "Failed to delete project" }); }
});

flowRouter.get("/flow/milestones", async (req: Request, res: Response) => {
  const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : null;
  const filter: any = {};
  if (projectId) filter.projectId = projectId;
  const rows = await flowMilestonesTable.find(filter).sort({ targetDate: 1 }).lean();
  res.json(rows);
});

flowRouter.post("/flow/milestones", async (req: Request, res: Response) => {
  const parsed = insertFlowMilestoneSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const row = await flowMilestonesTable.create(parsed.data);
  res.status(201).json(row.toObject());
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
  const updated = await flowMilestonesTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

flowRouter.delete("/flow/milestones/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await flowMilestonesTable.findOneAndDelete({ id });
  res.json({ success: true });
});

flowRouter.get("/flow/budgets", async (req: Request, res: Response) => {
  const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : null;
  const filter: any = {};
  if (projectId) filter.projectId = projectId;
  const sortField = projectId ? "category" : "-createdAt";
  const rows = await flowBudgetsTable.find(filter).sort(sortField).lean();
  res.json(rows);
});

flowRouter.post("/flow/budgets", async (req: Request, res: Response) => {
  const parsed = insertFlowBudgetSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const row = await flowBudgetsTable.create(parsed.data);
  res.status(201).json(row.toObject());
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
  const updated = await flowBudgetsTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

flowRouter.delete("/flow/budgets/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await flowBudgetsTable.findOneAndDelete({ id });
  res.json({ success: true });
});

flowRouter.get("/flow/documents", async (req: Request, res: Response) => {
  const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : null;
  const filter: any = {};
  if (projectId) filter.projectId = projectId;
  const rows = await flowDocumentsTable.find(filter).sort({ createdAt: -1 }).lean();
  res.json(rows);
});

flowRouter.post("/flow/documents", async (req: Request, res: Response) => {
  const parsed = insertFlowDocumentSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  if (parsed.data.fileUrl && !/^https?:\/\//i.test(parsed.data.fileUrl)) { res.status(400).json({ error: "fileUrl must use http or https scheme" }); return; }
  const row = await flowDocumentsTable.create(parsed.data);
  res.status(201).json(row.toObject());
});

flowRouter.delete("/flow/documents/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await flowDocumentsTable.findOneAndDelete({ id });
  res.json({ success: true });
});

flowRouter.get("/flow/dashboard-summary", async (_req: Request, res: Response) => {
  const [projStats] = await projectsTable.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
        totalValue: { $sum: { $ifNull: ["$totalValue", 0] } },
        totalBudget: { $sum: { $ifNull: ["$budget", 0] } },
      },
    },
  ]);

  const [budgetStats] = await flowBudgetsTable.aggregate([
    {
      $group: {
        _id: null,
        totalEstimated: { $sum: { $ifNull: ["$estimatedBudget", 0] } },
        totalActual: { $sum: { $ifNull: ["$actualCost", 0] } },
      },
    },
  ]);

  const milestones = await flowMilestonesTable.find().sort({ targetDate: 1 }).lean();
  const now = new Date();
  const upcomingMilestones = milestones
    .filter((m) => new Date(m.targetDate) >= now && (m.completionPercent ?? 0) < 100)
    .slice(0, 8);

  const totalEstimated = Number(budgetStats?.totalEstimated) || Number(projStats?.totalBudget) || 1;
  const totalActual = Number(budgetStats?.totalActual) || 0;
  const burnRate = Math.round((totalActual / totalEstimated) * 100);

  let scheduleVarianceDays = 0;
  if (milestones.length > 0) {
    const variances = milestones.map((m) => {
      if ((m.completionPercent ?? 0) >= 100) return 0;
      return Math.round((now.getTime() - new Date(m.targetDate).getTime()) / (1000 * 60 * 60 * 24));
    });
    scheduleVarianceDays = Math.round(variances.reduce((a, b) => a + b, 0) / variances.length);
  }

  const categoryBreakdown = await flowBudgetsTable.aggregate([
    {
      $group: {
        _id: "$category",
        estimated: { $sum: { $ifNull: ["$estimatedBudget", 0] } },
        actual: { $sum: { $ifNull: ["$actualCost", 0] } },
      },
    },
    { $project: { _id: 0, category: "$_id", estimated: 1, actual: 1 } },
  ]);

  res.json({
    activeProjects: Number(projStats?.active) || 0,
    totalPortfolioValue: Number(projStats?.totalValue) || Number(projStats?.totalBudget) || 0,
    scheduleVarianceDays,
    budgetBurnRate: burnRate,
    upcomingMilestones,
    categoryBreakdown,
  });
});

export default flowRouter;
