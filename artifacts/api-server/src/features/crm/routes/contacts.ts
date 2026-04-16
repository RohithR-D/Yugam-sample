import { Router, type Request, type Response } from "express";
import { contactsTable, insertContactSchema, clientsTable } from "@workspace/db/schema";

const contactsRouter = Router();

contactsRouter.get("/contacts", async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const totalCount = await contactsTable.countDocuments();
  const contacts = await contactsTable.find().sort({ createdAt: -1 }).skip(offset).limit(limit).lean();
  const clientIds = contacts.map((contact) => contact.clientId).filter(Boolean);

  const clients = clientIds.length > 0 ? await clientsTable.find({ id: { $in: clientIds } }).lean() : [];
  const clientMap = new Map(clients.map((client) => [client.id, client.companyName]));

  const enriched = contacts.map((contact) => ({
    ...contact,
    companyName: clientMap.get(contact.clientId as number) || null,
  }));

  res.json({
    data: enriched,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  });
});

contactsRouter.post("/contacts", async (req: Request, res: Response) => {
  const parsed = insertContactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const contact = await contactsTable.create(parsed.data);
  res.status(201).json(contact.toObject());
});

export default contactsRouter;
