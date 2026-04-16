import { Router } from "express";
import { handleCreateProductionOrder, handleGetProductionOrders } from "../controllers/productionOrdersController";

const productionOrdersRouter = Router();

productionOrdersRouter.get("/production-orders", handleGetProductionOrders);
productionOrdersRouter.post("/production-orders", handleCreateProductionOrder);

export default productionOrdersRouter;
