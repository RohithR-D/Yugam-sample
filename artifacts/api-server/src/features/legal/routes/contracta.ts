import { Router } from "express";
import {
  handleGetContractaCompliances,
  handleCreateContractaCompliance,
  handleDeleteContractaCompliance,
  handleGetContractaDashboardSummary,
  handleGetContractaTemplates,
  handleCreateContractaTemplate,
  handleUpdateContractaTemplate,
  handleDeleteContractaTemplate,
} from "../controllers/legalController";

const contractaRouter = Router();

contractaRouter.get("/contracta/compliances", handleGetContractaCompliances);
contractaRouter.post("/contracta/compliances", handleCreateContractaCompliance);
contractaRouter.delete("/contracta/compliances/:id", handleDeleteContractaCompliance);
contractaRouter.get("/contracta/dashboard-summary", handleGetContractaDashboardSummary);
contractaRouter.get("/contracta/templates", handleGetContractaTemplates);
contractaRouter.post("/contracta/templates", handleCreateContractaTemplate);
contractaRouter.put("/contracta/templates/:id", handleUpdateContractaTemplate);
contractaRouter.delete("/contracta/templates/:id", handleDeleteContractaTemplate);

export default contractaRouter;
