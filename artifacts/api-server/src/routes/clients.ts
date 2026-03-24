import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { clientsTable, insertClientSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const clientsRouter = Router();

clientsRouter.get("/clients", async (_req: Request, res: Response) => {
  const clients = await db.select().from(clientsTable).orderBy(desc(clientsTable.createdAt));
  res.json(clients);
});

clientsRouter.post("/clients", async (req: Request, res: Response) => {
  const parsed = insertClientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const [client] = await db.insert(clientsTable).values(parsed.data).returning();
  res.status(201).json(client);
});

export default clientsRouter;
