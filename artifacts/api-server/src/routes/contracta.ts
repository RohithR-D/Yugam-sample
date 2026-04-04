import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  contractaCompliancesTable, insertComplianceSchema,
  contractaTemplatesTable, insertTemplateSchema,
} from "@workspace/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

const contractaRouter = Router();

function computeStatus(expiryDate: Date): string {
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "Expired";
  if (diffDays <= 30) return "Expiring Soon";
  return "Active";
}

contractaRouter.get("/contracta/compliances", async (req: Request, res: Response) => {
  const { category } = req.query;
  const rows = await db.select().from(contractaCompliancesTable).orderBy(desc(contractaCompliancesTable.expiryDate));
  const enriched = rows
    .map((r) => ({ ...r, status: computeStatus(new Date(r.expiryDate)) }))
    .filter((r) => !category || r.category === String(category));
  res.json(enriched);
});

contractaRouter.post("/contracta/compliances", async (req: Request, res: Response) => {
  const parsed = insertComplianceSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }

  const status = computeStatus(new Date(parsed.data.expiryDate));

  try {
    const [row] = await db.insert(contractaCompliancesTable).values({ ...parsed.data, status }).returning();
    res.status(201).json({ ...row, status: computeStatus(new Date(row.expiryDate)) });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create compliance record" });
  }
});

contractaRouter.delete("/contracta/compliances/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [existing] = await db.select().from(contractaCompliancesTable).where(eq(contractaCompliancesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  await db.delete(contractaCompliancesTable).where(eq(contractaCompliancesTable.id, id));
  res.json({ success: true });
});

contractaRouter.get("/contracta/dashboard-summary", async (_req: Request, res: Response) => {
  const rows = await db.select().from(contractaCompliancesTable);
  const enriched = rows.map((r) => ({ ...r, status: computeStatus(new Date(r.expiryDate)) }));

  const active = enriched.filter((r) => r.status === "Active").length;
  const expiringSoon = enriched.filter((r) => r.status === "Expiring Soon").length;
  const expired = enriched.filter((r) => r.status === "Expired").length;

  const upcoming = enriched
    .filter((r) => r.status === "Expiring Soon" || r.status === "Active")
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    .slice(0, 10);

  res.json({ active, expiringSoon, expired, total: rows.length, upcomingRenewals: upcoming });
});

contractaRouter.get("/contracta/templates", async (_req: Request, res: Response) => {
  const rows = await db.select().from(contractaTemplatesTable).orderBy(desc(contractaTemplatesTable.updatedAt));
  res.json(rows);
});

contractaRouter.post("/contracta/templates", async (req: Request, res: Response) => {
  const parsed = insertTemplateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }

  try {
    const [row] = await db.insert(contractaTemplatesTable).values(parsed.data).returning();
    res.status(201).json(row);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create template" });
  }
});

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "");
}

contractaRouter.put("/contracta/templates/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { templateName, category, contentHtml } = req.body;
  const validCategories = ["HR", "Legal", "General"];
  if (category && !validCategories.includes(category)) {
    res.status(400).json({ error: "Invalid category" }); return;
  }
  if (templateName && (typeof templateName !== "string" || templateName.length > 300)) {
    res.status(400).json({ error: "Invalid template name" }); return;
  }

  const updates: Record<string, any> = { updatedAt: new Date() };
  if (templateName) updates.templateName = templateName;
  if (category) updates.category = category;
  if (contentHtml !== undefined) updates.contentHtml = sanitizeHtml(String(contentHtml));

  try {
    const [row] = await db.update(contractaTemplatesTable).set(updates).where(eq(contractaTemplatesTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Template not found" }); return; }
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update template" });
  }
});

contractaRouter.delete("/contracta/templates/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(contractaTemplatesTable).where(eq(contractaTemplatesTable.id, id));
  res.json({ success: true });
});

export default contractaRouter;
