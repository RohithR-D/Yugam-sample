import { Router } from "express";
import { handleCreateTask, handleGetTasks } from "../controllers/tasksController";

const tasksRouter = Router();

tasksRouter.get("/tasks", async (_req: Request, res: Response) => {
  const tasks = await tasksTable.find().sort({ createdAt: -1 }).lean();
  res.json(tasks);
});

tasksRouter.post("/tasks", async (req: Request, res: Response) => {
  const parsed = insertTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const task = await tasksTable.create(parsed.data);
    res.status(201).json(task.toObject());
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default tasksRouter;
