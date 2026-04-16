import { Router } from "express";
import { handleCreateFile, handleGetFiles } from "../controllers/filesController";

const filesRouter = Router();

filesRouter.get("/files", handleGetFiles);
filesRouter.post("/files", handleCreateFile);

export default filesRouter;
