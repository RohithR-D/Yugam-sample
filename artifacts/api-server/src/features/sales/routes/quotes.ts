import { Router } from "express";
import { handleGetQuotes, handleCreateQuote } from "../controllers/quotesController";

const quotesRouter = Router();

quotesRouter.get("/quotes", handleGetQuotes);
quotesRouter.post("/quotes", handleCreateQuote);

export default quotesRouter;
