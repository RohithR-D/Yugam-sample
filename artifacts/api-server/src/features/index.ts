import { Router, type IRouter } from "express";
import { authMiddleware } from "../shared/auth";

// infra
import healthRouter from "./infra/routes/health";

// auth
import authRouter from "./auth/routes/auth";

// users
import usersRouter from "./users/routes/users";

// reporting
import searchRouter from "./reporting/routes/search";
import analyticsRouter from "./reporting/routes/analytics";
import dashboardSummaryRouter from "./reporting/routes/dashboardSummary";
import reportsRouter from "./reporting/routes/reports";
import visionRouter from "./reporting/routes/vision";

// crm
import clientsRouter from "./crm/routes/clients";
import contactsRouter from "./crm/routes/contacts";
import clientActivitiesRouter from "./crm/routes/clientActivities";
import serviceCatalogRouter from "./crm/routes/serviceCatalog";
import proposalsRouter from "./crm/routes/proposals";
import communicationsRouter from "./crm/routes/communications";

// sales
import salesModuleRouter from "./sales/routes/salesModule";
import salesDocumentsRouter from "./sales/routes/salesDocuments";
import quotesRouter from "./sales/routes/quotes";
import invoicesRouter from "./sales/routes/invoices";
import receiptsRouter from "./sales/routes/receipts";

// sync-comms
import syncCommsRouter from "./sync-comms/routes/syncComms";

// hr
import employeesRouter from "./hr/routes/employees";
import candidatesRouter from "./hr/routes/candidates";
import payrollRouter from "./hr/routes/payroll";

// inventory
import inventoryRouter from "./inventory/routes/inventory";
import vaultRouter from "./inventory/routes/vault";
import shipmentsRouter from "./inventory/routes/shipments";

// procurement
import flexRouter from "./procurement/routes/flex";
import purchaseOrdersRouter from "./procurement/routes/purchaseOrders";

// production
import forgeRouter from "./production/routes/forge";
import productionOrdersRouter from "./production/routes/productionOrders";

// fleet
import fleetRouter from "./fleet/routes/fleet";

// projects
import flowRouter from "./projects/routes/flow";
import projectsRouter from "./projects/routes/projects";

// task-management
import tasksRouter from "./task-management/routes/tasks";
import sprintRouter from "./task-management/routes/sprint";

// finance
import ledgerRouter from "./finance/routes/ledger";
import transactionsRouter from "./finance/routes/transactions";

// expenses
import expensesRouter from "./expenses/routes/expenses";
import trailRouter from "./expenses/routes/trail";

// legal
import contractaRouter from "./legal/routes/contracta";
import contractsRouter from "./legal/routes/contracts";

// security
import gateRouter from "./security/routes/gate";
import visitorsRouter from "./security/routes/visitors";

// files
import filesRouter from "./files/routes/files";

const router: IRouter = Router();

// public routes
router.use(healthRouter);
router.use(authRouter);

// protected routes
router.use(authMiddleware);
router.use(searchRouter);
router.use(analyticsRouter);
router.use(dashboardSummaryRouter);
router.use(reportsRouter);
router.use(visionRouter);
router.use(usersRouter);
router.use(clientsRouter);
router.use(contactsRouter);
router.use(clientActivitiesRouter);
router.use(serviceCatalogRouter);
router.use(proposalsRouter);
router.use(salesModuleRouter);
router.use(salesDocumentsRouter);
router.use(quotesRouter);
router.use(invoicesRouter);
router.use(receiptsRouter);
router.use(communicationsRouter);
router.use(syncCommsRouter);
router.use(employeesRouter);
router.use(candidatesRouter);
router.use(payrollRouter);
router.use(inventoryRouter);
router.use(vaultRouter);
router.use(shipmentsRouter);
router.use(flexRouter);
router.use(purchaseOrdersRouter);
router.use(forgeRouter);
router.use(productionOrdersRouter);
router.use(fleetRouter);
router.use(flowRouter);
router.use(projectsRouter);
router.use(tasksRouter);
router.use(sprintRouter);
router.use(ledgerRouter);
router.use(transactionsRouter);
router.use(expensesRouter);
router.use(trailRouter);
router.use(contractaRouter);
router.use(contractsRouter);
router.use(gateRouter);
router.use(visitorsRouter);
router.use(filesRouter);

export default router;
