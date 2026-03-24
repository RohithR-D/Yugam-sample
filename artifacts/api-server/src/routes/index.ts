import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import clientsRouter from "./clients";
import quotesRouter from "./quotes";
import invoicesRouter from "./invoices";
import communicationsRouter from "./communications";
import employeesRouter from "./employees";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(clientsRouter);
router.use(quotesRouter);
router.use(invoicesRouter);
router.use(communicationsRouter);
router.use(employeesRouter);

export default router;
