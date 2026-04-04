import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  visitorsTable,
  insertVisitorSchema,
  gateWatchlistTable,
  insertWatchlistSchema,
  gateSettingsTable,
  employeesTable,
} from "@workspace/db/schema";
import { desc, eq, and, sql, gte, or, ilike } from "drizzle-orm";

const gateRouter = Router();

gateRouter.get("/gate/dashboard", async (_req: Request, res: Response) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const allToday = await db.select().from(visitorsTable)
      .where(gte(visitorsTable.checkInTime, todayStart));

    const currentOccupancy = allToday.filter((v) => v.status === "In-Premises").length;
    const totalToday = allToday.length;
    const expectedVIPs = allToday.filter((v) => v.classification === "VIP").length;

    res.json({ currentOccupancy, totalToday, expectedVIPs });
  } catch (err: any) {
    console.error("Gate dashboard error:", err);
    res.status(500).json({ error: "Failed to fetch gate dashboard" });
  }
});

gateRouter.get("/gate/roll-call", async (_req: Request, res: Response) => {
  try {
    const inPremises = await db.select().from(visitorsTable)
      .where(eq(visitorsTable.status, "In-Premises"))
      .orderBy(visitorsTable.checkInTime);
    res.json(inPremises);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch roll call" });
  }
});

gateRouter.get("/gate/employees", async (_req: Request, res: Response) => {
  try {
    const employees = await db.select({ id: employeesTable.id, name: employeesTable.name, department: employeesTable.department })
      .from(employeesTable)
      .where(eq(employeesTable.status, "Active"))
      .orderBy(employeesTable.name);
    res.json(employees);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

gateRouter.get("/gate/visitors", async (req: Request, res: Response) => {
  try {
    const { search, classification, status, limit: lim } = req.query;
    const conditions = [];
    if (classification && classification !== "all") {
      conditions.push(eq(visitorsTable.classification, classification as string));
    }
    if (status && status !== "all") {
      conditions.push(eq(visitorsTable.status, status as string));
    }
    if (search) {
      const s = `%${search}%`;
      conditions.push(or(
        ilike(visitorsTable.visitorName, s),
        ilike(visitorsTable.phone, s),
        ilike(visitorsTable.hostName, s),
      ));
    }
    const query = db.select().from(visitorsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(visitorsTable.checkInTime))
      .limit(lim ? parseInt(lim as string) : 200);
    const visitors = await query;
    res.json(visitors);
  } catch (err: any) {
    console.error("Gate visitors error:", err);
    res.status(500).json({ error: "Failed to fetch visitors" });
  }
});

gateRouter.post("/gate/check-in", async (req: Request, res: Response) => {
  const parsed = insertVisitorSchema.safeParse({
    ...req.body,
    status: "In-Premises",
    checkInTime: new Date().toISOString(),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const watchlistMatch = await db.select().from(gateWatchlistTable)
      .where(and(
        eq(gateWatchlistTable.classification, "Blacklist"),
        or(
          ilike(gateWatchlistTable.name, parsed.data.visitorName),
          parsed.data.phone ? eq(gateWatchlistTable.phone, parsed.data.phone) : undefined,
        ),
      ));

    let classification = parsed.data.classification || "Standard";
    const vipMatch = await db.select().from(gateWatchlistTable)
      .where(and(
        eq(gateWatchlistTable.classification, "VIP"),
        or(
          ilike(gateWatchlistTable.name, parsed.data.visitorName),
          parsed.data.phone ? eq(gateWatchlistTable.phone, parsed.data.phone) : undefined,
        ),
      ));
    if (watchlistMatch.length > 0) {
      classification = "Blacklist";
    } else if (vipMatch.length > 0) {
      classification = "VIP";
    }

    const [visitor] = await db.insert(visitorsTable).values({
      ...parsed.data,
      classification,
    }).returning();
    res.status(201).json({ ...visitor, blacklistAlert: watchlistMatch.length > 0 });
  } catch (err: any) {
    console.error("Check-in error:", err);
    res.status(500).json({ error: "Failed to check in visitor" });
  }
});

gateRouter.patch("/gate/check-out/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [updated] = await db.update(visitorsTable)
      .set({ status: "Checked-Out", checkOutTime: new Date() })
      .where(and(eq(visitorsTable.id, id), eq(visitorsTable.status, "In-Premises")))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Visitor not found or already checked out" });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to check out visitor" });
  }
});

gateRouter.patch("/gate/scan-checkout", async (req: Request, res: Response) => {
  try {
    const { visitorId } = req.body;
    if (!visitorId) {
      res.status(400).json({ error: "visitorId required" });
      return;
    }
    const [updated] = await db.update(visitorsTable)
      .set({ status: "Checked-Out", checkOutTime: new Date() })
      .where(and(eq(visitorsTable.id, parseInt(visitorId)), eq(visitorsTable.status, "In-Premises")))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Visitor not found or already checked out" });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to scan checkout" });
  }
});

gateRouter.get("/gate/watchlist", async (_req: Request, res: Response) => {
  try {
    const list = await db.select().from(gateWatchlistTable).orderBy(desc(gateWatchlistTable.createdAt));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
});

gateRouter.post("/gate/watchlist", async (req: Request, res: Response) => {
  const parsed = insertWatchlistSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const [entry] = await db.insert(gateWatchlistTable).values(parsed.data).returning();
    res.status(201).json(entry);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to add to watchlist" });
  }
});

gateRouter.delete("/gate/watchlist/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [deleted] = await db.delete(gateWatchlistTable).where(eq(gateWatchlistTable.id, id)).returning();
    if (!deleted) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete watchlist entry" });
  }
});

gateRouter.get("/gate/settings", async (_req: Request, res: Response) => {
  try {
    const settings = await db.select().from(gateSettingsTable);
    const map: Record<string, string> = {};
    settings.forEach((s) => { map[s.settingKey] = s.settingValue; });
    res.json(map);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

gateRouter.put("/gate/settings", async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    if (!key) {
      res.status(400).json({ error: "key required" });
      return;
    }
    await db.insert(gateSettingsTable)
      .values({ settingKey: key, settingValue: value || "" })
      .onConflictDoUpdate({
        target: gateSettingsTable.settingKey,
        set: { settingValue: value || "", updatedAt: new Date() },
      });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update setting" });
  }
});

export default gateRouter;
