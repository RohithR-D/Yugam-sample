import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { employeesTable, insertEmployeeSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const employeesRouter = Router();

employeesRouter.get("/employees", async (_req: Request, res: Response) => {
  const employees = await db.select().from(employeesTable).orderBy(desc(employeesTable.createdAt));
  res.json(employees);
});

employeesRouter.post("/employees", async (req: Request, res: Response) => {
  const parsed = insertEmployeeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [employee] = await db.insert(employeesTable).values(parsed.data).returning();
    res.status(201).json(employee);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default employeesRouter;
