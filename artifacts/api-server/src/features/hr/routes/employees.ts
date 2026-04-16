import { Router } from "express";
import { handleCreateEmployee, handleGetEmployees } from "../controllers/employeesController";

const employeesRouter = Router();

employeesRouter.get("/employees", handleGetEmployees);
employeesRouter.post("/employees", handleCreateEmployee);

export default employeesRouter;
