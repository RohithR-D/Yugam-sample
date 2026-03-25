import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { contactsTable, insertContactSchema, clientsTable } from "@workspace/db/schema";
import { desc, eq, sql } from "drizzle-orm";

const contactsRouter = Router();

contactsRouter.get("/contacts", async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(contactsTable);
  const totalCount = countResult.count;

  const contacts = await db
    .select({
      id: contactsTable.id,
      name: contactsTable.name,
      email: contactsTable.email,
      phone: contactsTable.phone,
      contactType: contactsTable.contactType,
      clientId: contactsTable.clientId,
      createdAt: contactsTable.createdAt,
      companyName: clientsTable.companyName,
    })
    .from(contactsTable)
    .leftJoin(clientsTable, eq(contactsTable.clientId, clientsTable.id))
    .orderBy(desc(contactsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    data: contacts,
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

  const [contact] = await db.insert(contactsTable).values(parsed.data).returning();
  res.status(201).json(contact);
});

export default contactsRouter;
