import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { payrollTable, insertPayrollSchema } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";
import { onPayrollStatusChange } from "./crossModuleAutomation";

const payrollRouter = Router();

payrollRouter.get("/payroll", async (_req: Request, res: Response) => {
  const records = await db.select().from(payrollTable).orderBy(desc(payrollTable.createdAt));
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
    const [record] = await db.insert(payrollTable).values(parsed.data).returning();
    res.status(201).json(record);
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

  const [record] = await db.select().from(payrollTable).where(eq(payrollTable.id, id));
  if (!record) { res.status(404).json({ error: "Payroll record not found" }); return; }

  try {
    const result = await db.transaction(async (tx) => {
      await tx.update(payrollTable).set({ status }).where(eq(payrollTable.id, id));

      let automation: any = null;
      if (status === "Processed" || status === "Paid") {
        automation = await onPayrollStatusChange(id, status, tx);
      }

      const [updated] = await tx.select().from(payrollTable).where(eq(payrollTable.id, id));
      return { ...updated, _automation: automation };
    });
    res.json(result);
  } catch (err: any) {
    console.error("[PAYROLL] Status update error:", err.message);
    res.status(500).json({ error: "Failed to update payroll status" });
  }
});

export default payrollRouter;
