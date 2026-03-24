import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import clientsRouter from "./clients";
import quotesRouter from "./quotes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(clientsRouter);
router.use(quotesRouter);

export default router;
