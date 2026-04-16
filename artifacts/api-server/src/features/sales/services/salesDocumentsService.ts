import {
  insertSalesDocumentSchema,
  salesDocumentItemsTable,
  salesDocumentsTable,
} from "@workspace/db/schema";

export const getSalesDocuments = async (type?: string) => {
  const filter: any = {};
  if (type) filter.documentType = type;
  return await salesDocumentsTable.find(filter).sort({ createdAt: -1 }).lean();
};

export const getSalesDocumentById = async (id: number) => {
  const doc = await salesDocumentsTable.findOne({ id }).lean();
  if (!doc) return null;
  const items = await salesDocumentItemsTable.find({ documentId: id }).lean();
  return { ...doc, items };
};

export const createSalesDocument = async (data: any, items: any[]) => {
  const doc = await salesDocumentsTable.create(data);
  const docObj = doc.toObject();
  if (items.length > 0) {
    const itemRows = items.map((item: any) => ({ ...item, documentId: docObj.id }));
    await salesDocumentItemsTable.insertMany(itemRows);
  }
  const savedItems = await salesDocumentItemsTable.find({ documentId: docObj.id }).lean();
  return { ...docObj, items: savedItems };
};

export const updateSalesDocument = async (id: number, updateData: any, items: any[]) => {
  const existing = await salesDocumentsTable.findOne({ id }).lean();
  if (!existing) return null;
  const updates: Record<string, any> = { updatedAt: new Date() };
  const allowedFields = [
    "clientId", "clientName", "documentType", "documentNumber", "issueDate", "dueDate",
    "subtotal", "sgstTotal", "cgstTotal", "grandTotal", "notes", "terms", "status",
  ];
  const validStatuses = ["Paid", "Unpaid", "Drafting"];
  const validDocTypes = ["Quotation", "Proforma Invoice", "Sales Order", "Invoice", "Delivery Challan", "Sales Return"];
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      if (field === "status" && !validStatuses.includes(updateData[field])) continue;
      if (field === "documentType" && !validDocTypes.includes(updateData[field])) continue;
      if ((field === "issueDate" || field === "dueDate") && typeof updateData[field] === "string") {
        const d = new Date(updateData[field]);
        if (!isNaN(d.getTime())) {
          updates[field] = d;
        }
      } else {
        updates[field] = updateData[field];
      }
    }
  }
  const updated = await salesDocumentsTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  if (!updated) return null;
  if (items && Array.isArray(items)) {
    await salesDocumentItemsTable.deleteMany({ documentId: id });
    if (items.length > 0) {
      const itemRows = items.map((item: any) => ({ ...item, documentId: id }));
      await salesDocumentItemsTable.insertMany(itemRows);
    }
  }
  const savedItems = await salesDocumentItemsTable.find({ documentId: id }).lean();
  return { ...updated, items: savedItems };
};

export const deleteSalesDocument = async (id: number) => {
  return await salesDocumentsTable.findOneAndDelete({ id }).lean();
};
