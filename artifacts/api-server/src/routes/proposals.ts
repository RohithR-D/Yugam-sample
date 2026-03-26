import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { proposalsTable, insertProposalSchema, clientsTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";

const proposalsRouter = Router();

const allProposalFields = {
  id: proposalsTable.id,
  clientId: proposalsTable.clientId,
  title: proposalsTable.title,
  quoteNumber: proposalsTable.quoteNumber,
  revision: proposalsTable.revision,
  status: proposalsTable.status,
  validFrom: proposalsTable.validFrom,
  validTo: proposalsTable.validTo,
  projectLocation: proposalsTable.projectLocation,
  pocName: proposalsTable.pocName,
  pocContact: proposalsTable.pocContact,
  scopeOfWork: proposalsTable.scopeOfWork,
  inclusions: proposalsTable.inclusions,
  exclusions: proposalsTable.exclusions,
  totalEstimatedHours: proposalsTable.totalEstimatedHours,
  grandTotal: proposalsTable.grandTotal,
  createdAt: proposalsTable.createdAt,
  updatedAt: proposalsTable.updatedAt,
  clientName: clientsTable.companyName,
};

proposalsRouter.get("/proposals", async (_req: Request, res: Response) => {
  const proposals = await db
    .select(allProposalFields)
    .from(proposalsTable)
    .leftJoin(clientsTable, eq(proposalsTable.clientId, clientsTable.id))
    .orderBy(desc(proposalsTable.createdAt));
  res.json(proposals);
});

proposalsRouter.get("/proposals/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [proposal] = await db
    .select({
      ...allProposalFields,
      proposalData: proposalsTable.proposalData,
      boqData: proposalsTable.boqData,
    })
    .from(proposalsTable)
    .leftJoin(clientsTable, eq(proposalsTable.clientId, clientsTable.id))
    .where(eq(proposalsTable.id, id));

  if (!proposal) { res.status(404).json({ error: "Proposal not found" }); return; }
  res.json(proposal);
});

proposalsRouter.post("/proposals", async (req: Request, res: Response) => {
  const parsed = insertProposalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const [proposal] = await db.insert(proposalsTable).values(parsed.data).returning();
  res.status(201).json(proposal);
});

proposalsRouter.patch("/proposals/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const validStatuses = ["Draft", "Sent", "Accepted", "Rejected", "Revised"];
  const updates: Record<string, any> = {};
  const b = req.body;

  if (b.title !== undefined) {
    if (typeof b.title !== "string" || !b.title.trim()) {
      res.status(400).json({ error: "Title must be a non-empty string" }); return;
    }
    updates.title = b.title.trim();
  }
  if (b.status !== undefined) {
    if (!validStatuses.includes(b.status)) {
      res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` }); return;
    }
    updates.status = b.status;
  }
  if (b.clientId !== undefined) updates.clientId = b.clientId;
  if (b.quoteNumber !== undefined) updates.quoteNumber = String(b.quoteNumber);
  if (b.revision !== undefined) updates.revision = String(b.revision);
  if (b.projectLocation !== undefined) updates.projectLocation = String(b.projectLocation);
  if (b.pocName !== undefined) updates.pocName = String(b.pocName);
  if (b.pocContact !== undefined) updates.pocContact = String(b.pocContact);
  if (b.scopeOfWork !== undefined) updates.scopeOfWork = String(b.scopeOfWork);
  if (b.inclusions !== undefined) updates.inclusions = String(b.inclusions);
  if (b.exclusions !== undefined) updates.exclusions = String(b.exclusions);
  if (b.validFrom !== undefined) {
    if (b.validFrom === null || b.validFrom === "") { updates.validFrom = null; }
    else { const d = new Date(b.validFrom); if (isNaN(d.getTime())) { res.status(400).json({ error: "validFrom must be a valid date" }); return; } updates.validFrom = d; }
  }
  if (b.validTo !== undefined) {
    if (b.validTo === null || b.validTo === "") { updates.validTo = null; }
    else { const d = new Date(b.validTo); if (isNaN(d.getTime())) { res.status(400).json({ error: "validTo must be a valid date" }); return; } updates.validTo = d; }
  }

  if (b.proposalData !== undefined) {
    if (!Array.isArray(b.proposalData)) {
      res.status(400).json({ error: "proposalData must be an array" }); return;
    }
    updates.proposalData = b.proposalData;
  }
  if (b.boqData !== undefined) {
    if (!Array.isArray(b.boqData)) {
      res.status(400).json({ error: "boqData must be an array" }); return;
    }
    updates.boqData = b.boqData;
  }
  if (b.totalEstimatedHours !== undefined) {
    const hrs = parseFloat(b.totalEstimatedHours);
    if (isNaN(hrs) || hrs < 0) { res.status(400).json({ error: "totalEstimatedHours must be a non-negative number" }); return; }
    updates.totalEstimatedHours = String(hrs);
  }
  if (b.grandTotal !== undefined) {
    const gt = parseFloat(b.grandTotal);
    if (isNaN(gt) || gt < 0) { res.status(400).json({ error: "grandTotal must be a non-negative number" }); return; }
    updates.grandTotal = String(gt);
  }
  updates.updatedAt = new Date();

  const [updated] = await db.update(proposalsTable).set(updates).where(eq(proposalsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Proposal not found" }); return; }
  res.json(updated);
});

proposalsRouter.delete("/proposals/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [deleted] = await db.delete(proposalsTable).where(eq(proposalsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Proposal not found" }); return; }
  res.json({ success: true });
});

export default proposalsRouter;
