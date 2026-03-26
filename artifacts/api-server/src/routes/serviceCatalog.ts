import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { serviceCatalogTable, insertServiceCatalogSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const serviceCatalogRouter = Router();

serviceCatalogRouter.get("/service-catalog", async (_req: Request, res: Response) => {
  const items = await db.select().from(serviceCatalogTable).orderBy(desc(serviceCatalogTable.createdAt));
  res.json(items);
});

serviceCatalogRouter.post("/service-catalog", async (req: Request, res: Response) => {
  const parsed = insertServiceCatalogSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const [item] = await db.insert(serviceCatalogTable).values(parsed.data).returning();
  res.status(201).json(item);
});

export default serviceCatalogRouter;
