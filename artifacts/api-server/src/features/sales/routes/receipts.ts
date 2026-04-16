import { Router } from "express";
import { handleGetReceipts, handleCreateReceipt, handleDeleteReceipt } from "../controllers/receiptsController";

const receiptsRouter = Router();

receiptsRouter.get("/receipts", handleGetReceipts);
receiptsRouter.post("/receipts", handleCreateReceipt);
receiptsRouter.delete("/receipts/:id", handleDeleteReceipt);

export default receiptsRouter;
