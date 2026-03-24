import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { payrollTable, insertPayrollSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

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

export default payrollRouter;
