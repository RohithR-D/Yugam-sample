import { type Request, type Response } from "express";
import { createUser, getUsers } from "../services/usersService";
import { insertUserSchema } from "@workspace/db/schema";

export const handleGetUsers = async (_req: Request, res: Response) => {
  const users = await getUsers();
  res.json(users);
};

export const handleCreateUser = async (req: Request, res: Response) => {
  const parsed = insertUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const user = await createUser(parsed.data);
    res.status(201).json(user);
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ error: "A user with this email already exists" });
      return;
    }
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};
