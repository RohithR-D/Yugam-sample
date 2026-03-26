import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { proposalsTable, insertProposalSchema, clientsTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";

const proposalsRouter = Router();

proposalsRouter.get("/proposals", async (_req: Request, res: Response) => {
  const proposals = await db
    .select({
      id: proposalsTable.id,
      clientId: proposalsTable.clientId,
      title: proposalsTable.title,
      status: proposalsTable.status,
      totalEstimatedHours: proposalsTable.totalEstimatedHours,
      grandTotal: proposalsTable.grandTotal,
      createdAt: proposalsTable.createdAt,
      updatedAt: proposalsTable.updatedAt,
      clientName: clientsTable.companyName,
    })
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
      id: proposalsTable.id,
      clientId: proposalsTable.clientId,
      title: proposalsTable.title,
      status: proposalsTable.status,
      totalEstimatedHours: proposalsTable.totalEstimatedHours,
      grandTotal: proposalsTable.grandTotal,
      proposalData: proposalsTable.proposalData,
      createdAt: proposalsTable.createdAt,
      updatedAt: proposalsTable.updatedAt,
      clientName: clientsTable.companyName,
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

  if (req.body.title !== undefined) {
    if (typeof req.body.title !== "string" || !req.body.title.trim()) {
      res.status(400).json({ error: "Title must be a non-empty string" }); return;
    }
    updates.title = req.body.title.trim();
  }
  if (req.body.status !== undefined) {
    if (!validStatuses.includes(req.body.status)) {
      res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` }); return;
    }
    updates.status = req.body.status;
  }
  if (req.body.clientId !== undefined) updates.clientId = req.body.clientId;
  if (req.body.proposalData !== undefined) {
    if (!Array.isArray(req.body.proposalData)) {
      res.status(400).json({ error: "proposalData must be an array" }); return;
    }
    updates.proposalData = req.body.proposalData;
  }
  if (req.body.totalEstimatedHours !== undefined) {
    const hrs = parseFloat(req.body.totalEstimatedHours);
    if (isNaN(hrs) || hrs < 0) { res.status(400).json({ error: "totalEstimatedHours must be a non-negative number" }); return; }
    updates.totalEstimatedHours = String(hrs);
  }
  if (req.body.grandTotal !== undefined) {
    const gt = parseFloat(req.body.grandTotal);
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
