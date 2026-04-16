import { type Request, type Response } from "express";
import { createQuote, getQuotes } from "../services/quotesService";
import { insertQuoteSchema } from "@workspace/db/schema";

export const handleGetQuotes = async (_req: Request, res: Response) => {
  res.json(await getQuotes());
};

export const handleCreateQuote = async (req: Request, res: Response) => {
  const parsed = insertQuoteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const quote = await createQuote(parsed.data);
    res.status(201).json(quote);
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ error: "A quote with this number already exists" });
      return;
    }
    console.error("Quote create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
