import { type Request, type Response } from "express";
import { getHealthStatus } from "../services/healthService";

export const getHealth = (_req: Request, res: Response) => {
  const data = getHealthStatus();
  res.json(data);
};
