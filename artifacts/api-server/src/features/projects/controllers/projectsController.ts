import { type Request, type Response } from "express";
import { createProject, getProjects } from "../services/projectsService";
import { insertProjectSchema } from "@workspace/db/schema";

export const handleGetProjects = async (_req: Request, res: Response) => {
  const projects = await getProjects();
  res.json(projects);
};

export const handleCreateProject = async (req: Request, res: Response) => {
  const parsed = insertProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const project = await createProject(parsed.data);
    res.status(201).json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};
