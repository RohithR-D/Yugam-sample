import { Router } from "express";
import { handleGetInventory, handleCreateInventory } from "../controllers/inventoryController";

const inventoryRouter = Router();

inventoryRouter.get("/inventory", handleGetInventory);
inventoryRouter.post("/inventory", handleCreateInventory);

export default inventoryRouter;
