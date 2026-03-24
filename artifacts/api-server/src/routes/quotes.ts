import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { quotesTable, insertQuoteSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const quotesRouter = Router();

quotesRouter.get("/quotes", async (_req: Request, res: Response) => {
  const quotes = await db.select().from(quotesTable).orderBy(desc(quotesTable.createdAt));
  res.json(quotes);
});

quotesRouter.post("/quotes", async (req: Request, res: Response) => {
  const parsed = insertQuoteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [quote] = await db.insert(quotesTable).values(parsed.data).returning();
    res.status(201).json(quote);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A quote with this number already exists" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default quotesRouter;
