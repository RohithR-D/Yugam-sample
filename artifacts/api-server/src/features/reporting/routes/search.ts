import { Router } from "express";
import { handleSearch } from "../controllers/searchController";

const searchRouter = Router();

searchRouter.get("/search", handleSearch);

export default searchRouter;
