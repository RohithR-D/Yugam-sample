import { Router } from "express";
import { handleCreateUser, handleGetUsers } from "../controllers/usersController";

const usersRouter = Router();

usersRouter.get("/users", handleGetUsers);
usersRouter.post("/users", handleCreateUser);

export default usersRouter;
