import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  clientsTable,
  insertClientSchema,
  contactsTable,
  clientActivitiesTable,
} from "@workspace/db/schema";
import { desc, eq, inArray, sql } from "drizzle-orm";

const clientsRouter = Router();

clientsRouter.get("/clients", async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 50));
  const offset = (page - 1) * limit;

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(clientsTable);
  const totalCount = countResult.count;

  const clients = await db
    .select()
    .from(clientsTable)
    .orderBy(desc(clientsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const clientIds = clients.map((c) => c.id);

  let contactsByClient: Record<number, any[]> = {};
  let activitiesByClient: Record<number, any[]> = {};

  if (clientIds.length > 0) {
    const contacts = await db
      .select()
      .from(contactsTable)
      .where(inArray(contactsTable.clientId, clientIds));

    for (const contact of contacts) {
      if (contact.clientId) {
        if (!contactsByClient[contact.clientId]) contactsByClient[contact.clientId] = [];
        contactsByClient[contact.clientId].push(contact);
      }
    }

    const activities = await db
      .select()
      .from(clientActivitiesTable)
      .where(inArray(clientActivitiesTable.clientId, clientIds))
      .orderBy(desc(clientActivitiesTable.createdAt));

    for (const activity of activities) {
      if (!activitiesByClient[activity.clientId]) activitiesByClient[activity.clientId] = [];
      activitiesByClient[activity.clientId].push(activity);
    }
  }

  const enriched = clients.map((c) => ({
    ...c,
    contacts: contactsByClient[c.id] || [],
    activities: activitiesByClient[c.id] || [],
  }));

  res.json({
    data: enriched,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  });
});

clientsRouter.get("/clients/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, id));
  if (!client) { res.status(404).json({ error: "Client not found" }); return; }

  const contacts = await db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.clientId, id));

  const activities = await db
    .select()
    .from(clientActivitiesTable)
    .where(eq(clientActivitiesTable.clientId, id))
    .orderBy(desc(clientActivitiesTable.createdAt));

  res.json({ ...client, contacts, activities });
});

clientsRouter.post("/clients", async (req: Request, res: Response) => {
  const parsed = insertClientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const [client] = await db.insert(clientsTable).values(parsed.data).returning();
  res.status(201).json(client);
});

clientsRouter.patch("/clients/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const updates: Record<string, any> = {};
  if (req.body.pipelineStatus) updates.pipelineStatus = req.body.pipelineStatus;
  if (req.body.companyName) updates.companyName = req.body.companyName;
  if (req.body.contactName) updates.contactName = req.body.contactName;
  if (req.body.industry) updates.industry = req.body.industry;
  if (req.body.status) updates.status = req.body.status;
  if (req.body.dealValue !== undefined) updates.dealValue = req.body.dealValue;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [updated] = await db.update(clientsTable).set(updates).where(eq(clientsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Client not found" }); return; }
  res.json(updated);
});

export default clientsRouter;
