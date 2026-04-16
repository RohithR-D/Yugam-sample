import { Router } from "express";
import {
  handleGetClients,
  handleGetClientById,
  handleCreateClient,
  handleUpdateClient,
} from "../controllers/clientsController";

const clientsRouter = Router();

clientsRouter.get("/clients", handleGetClients);
clientsRouter.get("/clients/:id", handleGetClientById);
clientsRouter.post("/clients", handleCreateClient);
clientsRouter.patch("/clients/:id", handleUpdateClient);

export default clientsRouter;
