import { Router, type Request, type Response } from "express";
import { payrollTable, insertPayrollSchema } from "@workspace/db/schema";
import { onPayrollStatusChange } from "../../finance/routes/crossModuleAutomation";

const payrollRouter = Router();

payrollRouter.get("/payroll", async (_req: Request, res: Response) => {
  const records = await payrollTable.find().sort({ createdAt: -1 }).lean();
  res.json(records);
});

payrollRouter.post("/payroll", async (req: Request, res: Response) => {
  const body = { ...req.body };
  const gross = parseFloat(body.grossPay || "0");
  const ded = parseFloat(body.deductions || "0");
  body.netPay = (gross - ded).toFixed(2);

  const parsed = insertPayrollSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const record = await payrollTable.create(parsed.data);
    res.status(201).json(record.toObject());
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

payrollRouter.patch("/payroll/:id/status", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { status } = req.body;
  const validStatuses = ["Processing", "Processed", "Paid"];
  if (!validStatuses.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }

  const record = await payrollTable.findOne({ id }).lean();
  if (!record) { res.status(404).json({ error: "Payroll record not found" }); return; }

  try {
    let automation: any = null;
    await payrollTable.findOneAndUpdate({ id }, { $set: { status } });
    if (status === "Processed" || status === "Paid") {
      automation = await onPayrollStatusChange(id, status);
    }
    const updated = await payrollTable.findOne({ id }).lean();
    res.json({ ...updated, _automation: automation });
  } catch (err: any) {
    console.error("[PAYROLL] Status update error:", err.message);
    res.status(500).json({ error: "Failed to update payroll status" });
  }
});

export default payrollRouter;
