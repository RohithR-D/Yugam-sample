import {
  invoiceItemsTable,
  insertInvoiceSchema,
  invoicesTable,
} from "@workspace/db/schema";

export const getInvoices = async (type?: string) => {
  const filter: any = {};
  if (type) filter.type = type;
  return await invoicesTable.find(filter).sort({ createdAt: -1 }).lean();
};

export const getInvoiceById = async (id: number) => {
  const invoice = await invoicesTable.findOne({ id }).lean();
  if (!invoice) return null;
  const items = await invoiceItemsTable.find({ invoiceId: id }).lean();
  return { ...invoice, items };
};

export const createInvoice = async (data: any, items: any[]) => {
  const invoice = await invoicesTable.create(data);
  const invoiceObj = invoice.toObject();
  if (items.length > 0) {
    const itemRows = items.map((item: any) => ({ ...item, invoiceId: invoiceObj.id }));
    await invoiceItemsTable.insertMany(itemRows);
  }
  const savedItems = await invoiceItemsTable.find({ invoiceId: invoiceObj.id }).lean();
  return { ...invoiceObj, items: savedItems };
};

export const updateInvoice = async (id: number, updateData: any, items: any[]) => {
  const existing = await invoicesTable.findOne({ id }).lean();
  if (!existing) return null;

  const updates: Record<string, any> = { updatedAt: new Date() };
  const allowedFields = [
    "clientId", "clientName", "type", "documentNumber", "invoiceNumber",
    "poReference", "issueDate", "dueDate", "subtotal", "discountAmount",
    "sgstTotal", "cgstTotal", "grandTotal", "balanceDue", "notes", "terms",
    "reasonForCredit", "invoiceReference", "status",
  ];
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      if ((field === "issueDate" || field === "dueDate") && typeof updateData[field] === "string") {
        updates[field] = new Date(updateData[field]);
      } else {
        updates[field] = updateData[field];
      }
    }
  }

  const updated = await invoicesTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  if (!updated) return null;

  if (items && Array.isArray(items)) {
    await invoiceItemsTable.deleteMany({ invoiceId: id });
    if (items.length > 0) {
      const itemRows = items.map((item: any) => ({ ...item, invoiceId: id }));
      await invoiceItemsTable.insertMany(itemRows);
    }
  }
  const savedItems = await invoiceItemsTable.find({ invoiceId: id }).lean();
  return { ...updated, items: savedItems };
};

export const deleteInvoice = async (id: number) => {
  return await invoicesTable.findOneAndDelete({ id }).lean();
};
