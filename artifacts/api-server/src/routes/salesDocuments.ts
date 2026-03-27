import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { salesDocumentsTable, insertSalesDocumentSchema, salesDocumentItemsTable, insertSalesDocumentItemSchema } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";

const salesDocumentsRouter = Router();

salesDocumentsRouter.get("/sales-documents", async (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  let query = db.select().from(salesDocumentsTable).orderBy(desc(salesDocumentsTable.createdAt)).$dynamic();
  if (type) {
    query = query.where(eq(salesDocumentsTable.documentType, type));
  }
  const docs = await query;
  res.json(docs);
});

salesDocumentsRouter.get("/sales-documents/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [doc] = await db.select().from(salesDocumentsTable).where(eq(salesDocumentsTable.id, id));
  if (!doc) { res.status(404).json({ error: "Document not found" }); return; }
  const items = await db.select().from(salesDocumentItemsTable).where(eq(salesDocumentItemsTable.documentId, id));
  res.json({ ...doc, items });
});

salesDocumentsRouter.post("/sales-documents", async (req: Request, res: Response) => {
  const { items, ...docData } = req.body;
  const parsed = insertSalesDocumentSchema.safeParse(docData);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const result = await db.transaction(async (tx) => {
      const [doc] = await tx.insert(salesDocumentsTable).values(parsed.data).returning();
      if (items && Array.isArray(items) && items.length > 0) {
        const itemRows = items.map((item: any) => ({ ...item, documentId: doc.id }));
        await tx.insert(salesDocumentItemsTable).values(itemRows);
      }
      const savedItems = await tx.select().from(salesDocumentItemsTable).where(eq(salesDocumentItemsTable.documentId, doc.id));
      return { ...doc, items: savedItems };
    });
    res.status(201).json(result);
  } catch (err: any) {
    console.error("Sales document create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

salesDocumentsRouter.patch("/sales-documents/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [existing] = await db.select().from(salesDocumentsTable).where(eq(salesDocumentsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Document not found" }); return; }

  const { items, ...updateData } = req.body;
  const updates: Record<string, any> = { updatedAt: new Date() };
  const allowed = ["clientId", "clientName", "documentType", "documentNumber", "issueDate", "dueDate", "subtotal", "sgstTotal", "cgstTotal", "grandTotal", "notes", "terms", "status"];
  const validStatuses = ["Paid", "Unpaid", "Drafting"];
  const validDocTypes = ["Quotation", "Proforma Invoice", "Sales Order", "Invoice", "Delivery Challan", "Sales Return"];
  for (const f of allowed) {
    if (updateData[f] !== undefined) {
      if (f === "status" && !validStatuses.includes(updateData[f])) continue;
      if (f === "documentType" && !validDocTypes.includes(updateData[f])) continue;
      if ((f === "issueDate" || f === "dueDate") && typeof updateData[f] === "string") {
        const d = new Date(updateData[f]);
        if (isNaN(d.getTime())) continue;
        updates[f] = d;
      } else {
        updates[f] = updateData[f];
      }
    }
  }
  try {
    const result = await db.transaction(async (tx) => {
      const [updated] = await tx.update(salesDocumentsTable).set(updates).where(eq(salesDocumentsTable.id, id)).returning();
      if (items && Array.isArray(items)) {
        await tx.delete(salesDocumentItemsTable).where(eq(salesDocumentItemsTable.documentId, id));
        if (items.length > 0) {
          const itemRows = items.map((item: any) => ({ ...item, documentId: id }));
          await tx.insert(salesDocumentItemsTable).values(itemRows);
        }
      }
      const savedItems = await tx.select().from(salesDocumentItemsTable).where(eq(salesDocumentItemsTable.documentId, id));
      return { ...updated, items: savedItems };
    });
    res.json(result);
  } catch (err: any) {
    console.error("Sales document update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

salesDocumentsRouter.delete("/sales-documents/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(salesDocumentsTable).where(eq(salesDocumentsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Document not found" }); return; }
  res.json({ success: true });
});

export default salesDocumentsRouter;
