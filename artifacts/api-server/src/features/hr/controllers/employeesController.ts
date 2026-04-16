import { type Request, type Response } from "express";
import { createEmployee, getEmployees } from "../services/employeesService";
import { insertEmployeeSchema } from "@workspace/db/schema";

export const handleGetEmployees = async (_req: Request, res: Response) => {
  const employees = await getEmployees();
  res.json(employees);
};

export const handleCreateEmployee = async (req: Request, res: Response) => {
  const parsed = insertEmployeeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const employee = await createEmployee(parsed.data);
    res.status(201).json(employee);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};
