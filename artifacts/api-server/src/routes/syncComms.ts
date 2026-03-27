import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  chatMessagesTable, insertChatMessageSchema,
  employeeCallLogsTable, insertEmployeeCallLogSchema,
  employeeMeetingsTable, insertEmployeeMeetingSchema,
} from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";

const syncCommsRouter = Router();

syncCommsRouter.get("/chat-messages", async (req: Request, res: Response) => {
  const threadType = req.query.threadType as string | undefined;
  let query = db.select().from(chatMessagesTable).orderBy(chatMessagesTable.timestamp).$dynamic();
  if (threadType) {
    query = query.where(eq(chatMessagesTable.threadType, threadType));
  }
  const messages = await query;
  res.json(messages);
});

syncCommsRouter.post("/chat-messages", async (req: Request, res: Response) => {
  const parsed = insertChatMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const [msg] = await db.insert(chatMessagesTable).values(parsed.data).returning();
  res.status(201).json(msg);
});

syncCommsRouter.get("/call-logs", async (_req: Request, res: Response) => {
  const logs = await db.select().from(employeeCallLogsTable).orderBy(desc(employeeCallLogsTable.callDate));
  res.json(logs);
});

syncCommsRouter.get("/call-logs/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [log] = await db.select().from(employeeCallLogsTable).where(eq(employeeCallLogsTable.id, id));
  if (!log) { res.status(404).json({ error: "Not found" }); return; }
  res.json(log);
});

syncCommsRouter.post("/call-logs", async (req: Request, res: Response) => {
  const parsed = insertEmployeeCallLogSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const [log] = await db.insert(employeeCallLogsTable).values(parsed.data).returning();
  res.status(201).json(log);
});

syncCommsRouter.delete("/call-logs/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(employeeCallLogsTable).where(eq(employeeCallLogsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

syncCommsRouter.get("/meetings", async (_req: Request, res: Response) => {
  const meetings = await db.select().from(employeeMeetingsTable).orderBy(desc(employeeMeetingsTable.meetingDate));
  res.json(meetings);
});

syncCommsRouter.get("/meetings/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [meeting] = await db.select().from(employeeMeetingsTable).where(eq(employeeMeetingsTable.id, id));
  if (!meeting) { res.status(404).json({ error: "Not found" }); return; }
  res.json(meeting);
});

syncCommsRouter.post("/meetings", async (req: Request, res: Response) => {
  const parsed = insertEmployeeMeetingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const [meeting] = await db.insert(employeeMeetingsTable).values(parsed.data).returning();
  res.status(201).json(meeting);
});

syncCommsRouter.patch("/meetings/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [existing] = await db.select().from(employeeMeetingsTable).where(eq(employeeMeetingsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const updates: Record<string, any> = {};
  const allowed = ["loggedByEmployee", "clientName", "meetingTitle", "meetingDate", "startTime", "endTime", "attendees", "agendaAndMinutes", "status"];
  const validStatuses = ["Scheduled", "Completed", "Canceled"];
  for (const f of allowed) {
    if (req.body[f] !== undefined) {
      if (f === "status" && !validStatuses.includes(req.body[f])) continue;
      if (f === "meetingDate" && typeof req.body[f] === "string") {
        const d = new Date(req.body[f]);
        if (isNaN(d.getTime())) continue;
        updates[f] = d;
      } else {
        updates[f] = req.body[f];
      }
    }
  }
  const [updated] = await db.update(employeeMeetingsTable).set(updates).where(eq(employeeMeetingsTable.id, id)).returning();
  res.json(updated);
});

syncCommsRouter.delete("/meetings/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(employeeMeetingsTable).where(eq(employeeMeetingsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

export default syncCommsRouter;
