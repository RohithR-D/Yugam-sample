import { type Request, type Response } from "express";
import { searchAcrossModules } from "../services/searchService";

export const handleSearch = async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || "");
    const results = await searchAcrossModules(q);
    res.json(results);
  } catch (err: any) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};
