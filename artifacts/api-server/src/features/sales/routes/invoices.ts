import { Router } from "express";
import {
  handleGetInvoices,
  handleGetInvoiceById,
  handleCreateInvoice,
  handleUpdateInvoice,
  handleDeleteInvoice,
} from "../controllers/invoicesController";

const invoicesRouter = Router();

invoicesRouter.get("/invoices", handleGetInvoices);
invoicesRouter.get("/invoices/:id", handleGetInvoiceById);
invoicesRouter.post("/invoices", handleCreateInvoice);
invoicesRouter.patch("/invoices/:id", handleUpdateInvoice);
invoicesRouter.delete("/invoices/:id", handleDeleteInvoice);

export default invoicesRouter;
