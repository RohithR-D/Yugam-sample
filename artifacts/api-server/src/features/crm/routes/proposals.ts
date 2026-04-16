import { Router, type Request, type Response } from "express";
import { proposalsTable, insertProposalSchema, clientsTable } from "@workspace/db/schema";

const proposalsRouter = Router();

proposalsRouter.get("/proposals", async (_req: Request, res: Response) => {
  const proposals = await proposalsTable.find().sort({ createdAt: -1 }).lean();
  const clientIds = [...new Set(proposals.map((p: any) => p.clientId).filter(Boolean))];
  const clients = await clientsTable.find({ id: { $in: clientIds } }).lean();
  const clientMap: Record<number, string> = Object.fromEntries(clients.map((c: any) => [c.id, c.companyName]));
  const result = proposals.map((p: any) => ({ ...p, clientName: clientMap[p.clientId] || null }));
  res.json(result);
});

proposalsRouter.get("/proposals/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const proposal = await proposalsTable.findOne({ id }).lean();
  if (!proposal) { res.status(404).json({ error: "Proposal not found" }); return; }

  const client = await clientsTable.findOne({ id: (proposal as any).clientId }).lean();
  res.json({ ...proposal, clientName: (client as any)?.companyName || null });
});

proposalsRouter.post("/proposals", async (req: Request, res: Response) => {
  const parsed = insertProposalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const proposal = await proposalsTable.create(parsed.data);
  res.status(201).json(proposal.toObject());
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
    if (!Array.isArray(b.proposalData)) { res.status(400).json({ error: "proposalData must be an array" }); return; }
    updates.proposalData = b.proposalData;
  }
  if (b.boqData !== undefined) {
    if (!Array.isArray(b.boqData)) { res.status(400).json({ error: "boqData must be an array" }); return; }
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

  const updated = await proposalsTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Proposal not found" }); return; }
  res.json(updated);
});

proposalsRouter.delete("/proposals/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const deleted = await proposalsTable.findOneAndDelete({ id }).lean();
  if (!deleted) { res.status(404).json({ error: "Proposal not found" }); return; }
  res.json({ success: true });
});

export default proposalsRouter;
