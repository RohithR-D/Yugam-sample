import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { invoicesTable, insertInvoiceSchema, invoiceItemsTable, insertInvoiceItemSchema } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";

const invoicesRouter = Router();

invoicesRouter.get("/invoices", async (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  let query = db.select().from(invoicesTable).orderBy(desc(invoicesTable.createdAt)).$dynamic();
  if (type) {
    query = query.where(eq(invoicesTable.type, type));
  }
  const invoices = await query;
  res.json(invoices);
});

invoicesRouter.get("/invoices/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
  if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }

  const items = await db.select().from(invoiceItemsTable).where(eq(invoiceItemsTable.invoiceId, id));
  res.json({ ...invoice, items });
});

invoicesRouter.post("/invoices", async (req: Request, res: Response) => {
  const { items, ...invoiceData } = req.body;
  const parsed = insertInvoiceSchema.safeParse(invoiceData);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [invoice] = await db.insert(invoicesTable).values(parsed.data).returning();

    if (items && Array.isArray(items) && items.length > 0) {
      const itemRows = items.map((item: any) => ({
        ...item,
        invoiceId: invoice.id,
      }));
      await db.insert(invoiceItemsTable).values(itemRows);
    }

    const savedItems = await db.select().from(invoiceItemsTable).where(eq(invoiceItemsTable.invoiceId, invoice.id));
    res.status(201).json({ ...invoice, items: savedItems });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A document with this number already exists" });
      return;
    }
    console.error("Invoice create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

invoicesRouter.patch("/invoices/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Invoice not found" }); return; }

  const { items, ...updateData } = req.body;

  const updates: Record<string, any> = { updatedAt: new Date() };
  const allowedFields = [
    "clientId", "clientName", "type", "documentNumber", "invoiceNumber",
    "poReference", "issueDate", "dueDate", "subtotal", "discountAmount",
    "sgstTotal", "cgstTotal", "grandTotal", "balanceDue", "notes", "terms",
    "reasonForCredit", "invoiceReference", "status",
  ];
  for (const f of allowedFields) {
    if (updateData[f] !== undefined) {
      if ((f === "issueDate" || f === "dueDate") && typeof updateData[f] === "string") {
        updates[f] = new Date(updateData[f]);
      } else {
        updates[f] = updateData[f];
      }
    }
  }

  const [updated] = await db.update(invoicesTable).set(updates).where(eq(invoicesTable.id, id)).returning();

  if (items && Array.isArray(items)) {
    await db.delete(invoiceItemsTable).where(eq(invoiceItemsTable.invoiceId, id));
    if (items.length > 0) {
      const itemRows = items.map((item: any) => ({
        ...item,
        invoiceId: id,
      }));
      await db.insert(invoiceItemsTable).values(itemRows);
    }
  }

  const savedItems = await db.select().from(invoiceItemsTable).where(eq(invoiceItemsTable.invoiceId, id));
  res.json({ ...updated, items: savedItems });
});

invoicesRouter.delete("/invoices/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [deleted] = await db.delete(invoicesTable).where(eq(invoicesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Invoice not found" }); return; }
  res.json({ success: true });
});

export default invoicesRouter;
