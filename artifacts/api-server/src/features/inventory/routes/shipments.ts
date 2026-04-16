import { Router } from "express";
import { handleGetShipments, handleCreateShipment } from "../controllers/shipmentsController";

const shipmentsRouter = Router();

shipmentsRouter.get("/shipments", handleGetShipments);
shipmentsRouter.post("/shipments", handleCreateShipment);

export default shipmentsRouter;
