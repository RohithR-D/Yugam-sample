import { Router, type Request, type Response } from "express";
import { serviceCatalogTable, insertServiceCatalogSchema } from "@workspace/db/schema";

const serviceCatalogRouter = Router();

serviceCatalogRouter.get("/service-catalog", async (_req: Request, res: Response) => {
  const items = await serviceCatalogTable.find().sort({ createdAt: -1 }).lean();
  res.json(items);
});

serviceCatalogRouter.post("/service-catalog", async (req: Request, res: Response) => {
  const parsed = insertServiceCatalogSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const item = await serviceCatalogTable.create(parsed.data);
  res.status(201).json(item.toObject());
});

export default serviceCatalogRouter;
