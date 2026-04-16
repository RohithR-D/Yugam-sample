import { Router } from "express";
import { handleCreateProject, handleGetProjects } from "../controllers/projectsController";

const projectsRouter = Router();

projectsRouter.get("/projects", handleGetProjects);
projectsRouter.post("/projects", handleCreateProject);

export default projectsRouter;
