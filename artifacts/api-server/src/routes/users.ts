import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, insertUserSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const usersRouter = Router();

usersRouter.get("/users", async (_req: Request, res: Response) => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users);
});

usersRouter.post("/users", async (req: Request, res: Response) => {
  const parsed = insertUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const [user] = await db.insert(usersTable).values(parsed.data).returning();
  res.status(201).json(user);
});

export default usersRouter;
