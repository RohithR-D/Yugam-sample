import { Router } from "express";
import { login, getCurrentUser } from "../controllers/authController";
import { authMiddleware } from "../../../shared/auth";

const authRouter = Router();

authRouter.post("/auth/login", login);
authRouter.get("/auth/me", authMiddleware, getCurrentUser);

export default authRouter;
