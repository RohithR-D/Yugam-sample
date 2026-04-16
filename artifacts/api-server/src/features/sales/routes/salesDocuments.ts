import { Router } from "express";
import {
  handleGetSalesDocuments,
  handleGetSalesDocumentById,
  handleCreateSalesDocument,
  handleUpdateSalesDocument,
  handleDeleteSalesDocument,
} from "../controllers/salesDocumentsController";

const salesDocumentsRouter = Router();

salesDocumentsRouter.get("/sales-documents", handleGetSalesDocuments);
salesDocumentsRouter.get("/sales-documents/:id", handleGetSalesDocumentById);
salesDocumentsRouter.post("/sales-documents", handleCreateSalesDocument);
salesDocumentsRouter.patch("/sales-documents/:id", handleUpdateSalesDocument);
salesDocumentsRouter.delete("/sales-documents/:id", handleDeleteSalesDocument);

export default salesDocumentsRouter;
