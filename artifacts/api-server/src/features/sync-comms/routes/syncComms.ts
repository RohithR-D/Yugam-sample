import { Router, type Request, type Response } from "express";
import {
  chatMessagesTable, insertChatMessageSchema,
  employeeCallLogsTable, insertEmployeeCallLogSchema,
  employeeMeetingsTable, insertEmployeeMeetingSchema,
} from "@workspace/db/schema";

const syncCommsRouter = Router();

syncCommsRouter.get("/chat-messages", async (req: Request, res: Response) => {
  const threadType = req.query.threadType as string | undefined;
  const filter: any = {};
  if (threadType) filter.threadType = threadType;
  const messages = await chatMessagesTable.find(filter).sort({ timestamp: 1 }).lean();
  res.json(messages);
});

syncCommsRouter.post("/chat-messages", async (req: Request, res: Response) => {
  const parsed = insertChatMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const msg = await chatMessagesTable.create(parsed.data);
  res.status(201).json(msg.toObject());
});

syncCommsRouter.get("/call-logs", async (_req: Request, res: Response) => {
  const logs = await employeeCallLogsTable.find().sort({ callDate: -1 }).lean();
  res.json(logs);
});

syncCommsRouter.get("/call-logs/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const log = await employeeCallLogsTable.findOne({ id }).lean();
  if (!log) { res.status(404).json({ error: "Not found" }); return; }
  res.json(log);
});

syncCommsRouter.post("/call-logs", async (req: Request, res: Response) => {
  const parsed = insertEmployeeCallLogSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const log = await employeeCallLogsTable.create(parsed.data);
  res.status(201).json(log.toObject());
});

syncCommsRouter.delete("/call-logs/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await employeeCallLogsTable.findOneAndDelete({ id }).lean();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

syncCommsRouter.get("/meetings", async (_req: Request, res: Response) => {
  const meetings = await employeeMeetingsTable.find().sort({ meetingDate: -1 }).lean();
  res.json(meetings);
});

syncCommsRouter.get("/meetings/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const meeting = await employeeMeetingsTable.findOne({ id }).lean();
  if (!meeting) { res.status(404).json({ error: "Not found" }); return; }
  res.json(meeting);
});

syncCommsRouter.post("/meetings", async (req: Request, res: Response) => {
  const parsed = insertEmployeeMeetingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const meeting = await employeeMeetingsTable.create(parsed.data);
  res.status(201).json(meeting.toObject());
});

syncCommsRouter.patch("/meetings/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const existing = await employeeMeetingsTable.findOne({ id }).lean();
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
  const updated = await employeeMeetingsTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  res.json(updated);
});

syncCommsRouter.delete("/meetings/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await employeeMeetingsTable.findOneAndDelete({ id }).lean();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

export default syncCommsRouter;
