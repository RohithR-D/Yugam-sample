import { type Request, type Response } from "express";
import { createFile, getFiles } from "../services/filesService";
import { insertFileSchema } from "@workspace/db/schema";

export const handleGetFiles = async (_req: Request, res: Response) => {
  const files = await getFiles();
  res.json(files);
};

export const handleCreateFile = async (req: Request, res: Response) => {
  const parsed = insertFileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const file = await createFile(parsed.data);
    res.status(201).json(file);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};
