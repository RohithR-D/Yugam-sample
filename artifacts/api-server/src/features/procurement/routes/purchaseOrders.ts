import { Router } from "express";
import { handleGetPurchaseOrders, handleCreatePurchaseOrder } from "../controllers/procurementController";

const purchaseOrdersRouter = Router();

purchaseOrdersRouter.get("/purchase-orders", handleGetPurchaseOrders);
purchaseOrdersRouter.post("/purchase-orders", handleCreatePurchaseOrder);

export default purchaseOrdersRouter;
