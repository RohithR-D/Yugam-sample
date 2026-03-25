import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { contractsTable, insertContractSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const contractsRouter = Router();

contractsRouter.get("/contracts", async (_req: Request, res: Response) => {
  const contracts = await db.select().from(contractsTable).orderBy(desc(contractsTable.createdAt));
  res.json(contracts);
});

contractsRouter.post("/contracts", async (req: Request, res: Response) => {
  const parsed = insertContractSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [contract] = await db.insert(contractsTable).values(parsed.data).returning();
    res.status(201).json(contract);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default contractsRouter;
