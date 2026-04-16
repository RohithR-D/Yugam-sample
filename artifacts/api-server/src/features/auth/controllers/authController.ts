import { type Request, type Response } from "express";
import { loginUser } from "../services/authService";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const result = await loginUser(email, password);
    res.json(result);
  } catch (err: any) {
    if (err?.statusCode === 401) {
      res.status(401).json({ error: err.message });
      return;
    }
    console.error("Login error:", err);
    res.status(500).json({ error: err.message || "Login failed" });
  }
};
    
export const getCurrentUser = (req: Request, res: Response) => {
  res.json({ user: req.user });
};
