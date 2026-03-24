import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import clientsRouter from "./clients";
import quotesRouter from "./quotes";
import invoicesRouter from "./invoices";
import communicationsRouter from "./communications";
import employeesRouter from "./employees";
import candidatesRouter from "./candidates";
import payrollRouter from "./payroll";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(clientsRouter);
router.use(quotesRouter);
router.use(invoicesRouter);
router.use(communicationsRouter);
router.use(employeesRouter);
router.use(candidatesRouter);
router.use(payrollRouter);

export default router;
