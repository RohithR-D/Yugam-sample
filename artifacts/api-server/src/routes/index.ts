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
import inventoryRouter from "./inventory";
import purchaseOrdersRouter from "./purchaseOrders";
import productionOrdersRouter from "./productionOrders";
import shipmentsRouter from "./shipments";
import projectsRouter from "./projects";
import tasksRouter from "./tasks";

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
router.use(inventoryRouter);
router.use(purchaseOrdersRouter);
router.use(productionOrdersRouter);
router.use(shipmentsRouter);
router.use(projectsRouter);
router.use(tasksRouter);

export default router;
