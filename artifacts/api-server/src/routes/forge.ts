import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  forgeWorkstationsTable, insertForgeWorkstationSchema,
  forgeBOMTable, insertForgeBOMSchema,
  forgeBOMMaterialsTable, insertForgeBOMMaterialSchema,
  forgeBOMRoutingTable, insertForgeBOMRoutingSchema,
  forgeWorkOrdersTable, insertForgeWorkOrderSchema,
  forgeQualityControlTable, insertForgeQualityControlSchema,
  forgeDowntimeLogsTable, insertForgeDowntimeLogSchema,
  forgeWorkOrderUnitsTable,
  forgeProductionLogTable,
  forgeMaterialConsumptionTable,
  inventoryCatalogTable,
  inventoryLocationsTable,
  projectsTable,
  tasksTable,
} from "@workspace/db/schema";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import {
  triggerWorkOrderCreated,
  triggerWorkOrderStarted,
  triggerWorkOrderCompleted,
  triggerQualityRejection,
  triggerQcLogged,
  triggerUnitAdvance,
  triggerDowntimeLogged,
} from "./productionAutomation";

const forgeRouter = Router();

forgeRouter.get("/forge/workstations", async (_req: Request, res: Response) => {
  const rows = await db.select().from(forgeWorkstationsTable).orderBy(forgeWorkstationsTable.name);
  res.json(rows);
});

forgeRouter.post("/forge/workstations", async (req: Request, res: Response) => {
  const parsed = insertForgeWorkstationSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(forgeWorkstationsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

forgeRouter.patch("/forge/workstations/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const updates: Record<string, any> = {};
  const fields = ["name", "type", "costPerHour", "status", "description", "locationId", "capacity", "currentStatus", "maintenanceSchedule"];
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  if (req.body.lastMaintenanceDate !== undefined) updates.lastMaintenanceDate = req.body.lastMaintenanceDate ? new Date(req.body.lastMaintenanceDate) : null;
  if (req.body.nextMaintenanceDate !== undefined) updates.nextMaintenanceDate = req.body.nextMaintenanceDate ? new Date(req.body.nextMaintenanceDate) : null;
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No valid fields to update" }); return; }
  const [updated] = await db.update(forgeWorkstationsTable).set(updates).where(eq(forgeWorkstationsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

forgeRouter.delete("/forge/workstations/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(forgeWorkstationsTable).where(eq(forgeWorkstationsTable.id, id));
  res.json({ success: true });
});

forgeRouter.get("/forge/bom", async (_req: Request, res: Response) => {
  const rows = await db.select().from(forgeBOMTable).orderBy(desc(forgeBOMTable.createdAt));
  res.json(rows);
});

forgeRouter.get("/forge/bom/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [bom] = await db.select().from(forgeBOMTable).where(eq(forgeBOMTable.id, id));
  if (!bom) { res.status(404).json({ error: "Not found" }); return; }
  const materials = await db.select().from(forgeBOMMaterialsTable).where(eq(forgeBOMMaterialsTable.bomId, id));
  const routing = await db.select().from(forgeBOMRoutingTable).where(eq(forgeBOMRoutingTable.bomId, id)).orderBy(forgeBOMRoutingTable.sequenceNo);
  res.json({ ...bom, materials, routing });
});

forgeRouter.post("/forge/bom", async (req: Request, res: Response) => {
  const { materials, routing, ...bomData } = req.body;
  const parsed = insertForgeBOMSchema.safeParse(bomData);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  try {
    const result = await db.transaction(async (tx) => {
      const [bom] = await tx.insert(forgeBOMTable).values(parsed.data).returning();
      if (materials && Array.isArray(materials)) {
        for (const mat of materials) {
          const matParsed = insertForgeBOMMaterialSchema.safeParse({ ...mat, bomId: bom.id });
          if (!matParsed.success) throw new Error(`Invalid material: ${matParsed.error.issues.map(i => i.message).join(", ")}`);
          await tx.insert(forgeBOMMaterialsTable).values(matParsed.data);
        }
      }
      if (routing && Array.isArray(routing)) {
        for (const route of routing) {
          const routeParsed = insertForgeBOMRoutingSchema.safeParse({ ...route, bomId: bom.id });
          if (!routeParsed.success) throw new Error(`Invalid routing: ${routeParsed.error.issues.map(i => i.message).join(", ")}`);
          await tx.insert(forgeBOMRoutingTable).values(routeParsed.data);
        }
      }

      let estimatedCostPerUnit = 0;
      const mats = await tx.select().from(forgeBOMMaterialsTable).where(eq(forgeBOMMaterialsTable.bomId, bom.id));
      for (const m of mats) {
        if (m.itemId) {
          const [item] = await tx.select().from(inventoryCatalogTable).where(eq(inventoryCatalogTable.id, m.itemId));
          if (item) {
            const qty = parseFloat(m.qty?.toString() || "1");
            const wastage = parseFloat(m.wastagePercent?.toString() || "0");
            estimatedCostPerUnit += qty * (1 + wastage / 100) * parseFloat(item.unitPrice?.toString() || "0");
          }
        }
      }

      const routes = await tx.select().from(forgeBOMRoutingTable).where(eq(forgeBOMRoutingTable.bomId, bom.id));
      for (const r of routes) {
        if (r.workstationId) {
          const [ws] = await tx.select().from(forgeWorkstationsTable).where(eq(forgeWorkstationsTable.id, r.workstationId));
          if (ws) {
            const hours = ((r.estimatedMinutes || 0) + (r.setupTimeMinutes || 0)) / 60;
            estimatedCostPerUnit += hours * parseFloat(ws.costPerHour?.toString() || "0");
          }
        }
      }

      const outputQty = bom.outputQty || 1;
      estimatedCostPerUnit = estimatedCostPerUnit / outputQty;

      await tx.update(forgeBOMTable).set({ estimatedCostPerUnit: estimatedCostPerUnit.toFixed(2) }).where(eq(forgeBOMTable.id, bom.id));

      return { ...bom, estimatedCostPerUnit: estimatedCostPerUnit.toFixed(2), materials: mats, routing: routes };
    });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create BOM" });
  }
});

forgeRouter.put("/forge/bom/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [existing] = await db.select().from(forgeBOMTable).where(eq(forgeBOMTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }

    const { materials, routing, ...bomData } = req.body;

    const hasLinkedWOs = await db.select({ id: forgeWorkOrdersTable.id }).from(forgeWorkOrdersTable)
      .where(eq(forgeWorkOrdersTable.bomId, id)).limit(1);

    if (hasLinkedWOs.length > 0 && existing.bomStatus === "Active") {
      const result = await db.transaction(async (tx) => {
        await tx.update(forgeBOMTable).set({ bomStatus: "Obsolete" }).where(eq(forgeBOMTable.id, id));

        const newVersion = (existing.version || 1) + 1;
        const parsed = insertForgeBOMSchema.safeParse({
          ...bomData,
          productName: bomData.productName || existing.productName,
          productCode: bomData.productCode || existing.productCode,
          uom: bomData.uom || existing.uom,
          outputQty: bomData.outputQty || existing.outputQty,
          version: newVersion,
          bomStatus: "Draft",
          productItemId: bomData.productItemId || existing.productItemId,
        });
        if (!parsed.success) throw new Error("Invalid BOM data");

        const [newBom] = await tx.insert(forgeBOMTable).values({ ...parsed.data, version: newVersion }).returning();

        if (materials && Array.isArray(materials)) {
          for (const mat of materials) {
            await tx.insert(forgeBOMMaterialsTable).values({ ...mat, bomId: newBom.id, id: undefined });
          }
        } else {
          const oldMats = await tx.select().from(forgeBOMMaterialsTable).where(eq(forgeBOMMaterialsTable.bomId, id));
          for (const mat of oldMats) {
            await tx.insert(forgeBOMMaterialsTable).values({ ...mat, id: undefined, bomId: newBom.id });
          }
        }

        if (routing && Array.isArray(routing)) {
          for (const route of routing) {
            await tx.insert(forgeBOMRoutingTable).values({ ...route, bomId: newBom.id, id: undefined });
          }
        } else {
          const oldRoutes = await tx.select().from(forgeBOMRoutingTable).where(eq(forgeBOMRoutingTable.bomId, id));
          for (const route of oldRoutes) {
            await tx.insert(forgeBOMRoutingTable).values({ ...route, id: undefined, bomId: newBom.id });
          }
        }

        const mats = await tx.select().from(forgeBOMMaterialsTable).where(eq(forgeBOMMaterialsTable.bomId, newBom.id));
        const routes = await tx.select().from(forgeBOMRoutingTable).where(eq(forgeBOMRoutingTable.bomId, newBom.id));

        let totalMaterialCost = 0;
        for (const mat of mats) {
          const qty = parseFloat(mat.qty?.toString() || "0");
          const wastage = parseFloat(mat.wastagePercent?.toString() || "0");
          if (mat.itemId) {
            const [catalogItem] = await tx.select().from(inventoryCatalogTable).where(eq(inventoryCatalogTable.id, mat.itemId));
            const unitPrice = parseFloat(catalogItem?.unitPrice?.toString() || "0");
            totalMaterialCost += qty * (1 + wastage / 100) * unitPrice;
          }
        }
        let totalLaborCost = 0;
        for (const route of routes) {
          const minutes = (route.estimatedMinutes || 0) + (route.setupTimeMinutes || 0);
          if (route.workstationId) {
            const [ws] = await tx.select().from(forgeWorkstationsTable).where(eq(forgeWorkstationsTable.id, route.workstationId));
            const costPerHour = parseFloat(ws?.costPerHour?.toString() || "0");
            totalLaborCost += (minutes / 60) * costPerHour;
          }
        }
        const outputQty = newBom.outputQty || 1;
        const estimatedCostPerUnit = ((totalMaterialCost + totalLaborCost) / outputQty).toFixed(2);
        await tx.update(forgeBOMTable).set({ estimatedCostPerUnit }).where(eq(forgeBOMTable.id, newBom.id));

        return { ...newBom, estimatedCostPerUnit, materials: mats, routing: routes, versionCreated: true };
      });
      res.json(result);
    } else {
      const result = await db.transaction(async (tx) => {
        const updates: Record<string, any> = {};
        if (bomData.productName !== undefined) updates.productName = bomData.productName;
        if (bomData.productCode !== undefined) updates.productCode = bomData.productCode;
        if (bomData.uom !== undefined) updates.uom = bomData.uom;
        if (bomData.outputQty !== undefined) updates.outputQty = bomData.outputQty;
        if (bomData.notes !== undefined) updates.notes = bomData.notes;
        if (bomData.bomStatus !== undefined) updates.bomStatus = bomData.bomStatus;
        if (bomData.productItemId !== undefined) updates.productItemId = bomData.productItemId;

        if (Object.keys(updates).length > 0) {
          await tx.update(forgeBOMTable).set(updates).where(eq(forgeBOMTable.id, id));
        }

        if (materials && Array.isArray(materials)) {
          await tx.delete(forgeBOMMaterialsTable).where(eq(forgeBOMMaterialsTable.bomId, id));
          for (const mat of materials) {
            await tx.insert(forgeBOMMaterialsTable).values({ ...mat, bomId: id, id: undefined });
          }
        }

        if (routing && Array.isArray(routing)) {
          await tx.delete(forgeBOMRoutingTable).where(eq(forgeBOMRoutingTable.bomId, id));
          for (const route of routing) {
            await tx.insert(forgeBOMRoutingTable).values({ ...route, bomId: id, id: undefined });
          }
        }

        let estimatedCostPerUnit = 0;
        const mats = await tx.select().from(forgeBOMMaterialsTable).where(eq(forgeBOMMaterialsTable.bomId, id));
        for (const m of mats) {
          if (m.itemId) {
            const [item] = await tx.select().from(inventoryCatalogTable).where(eq(inventoryCatalogTable.id, m.itemId));
            if (item) {
              const qty = parseFloat(m.qty?.toString() || "1");
              const wastage = parseFloat(m.wastagePercent?.toString() || "0");
              estimatedCostPerUnit += qty * (1 + wastage / 100) * parseFloat(item.unitPrice?.toString() || "0");
            }
          }
        }
        const routes = await tx.select().from(forgeBOMRoutingTable).where(eq(forgeBOMRoutingTable.bomId, id));
        for (const r of routes) {
          if (r.workstationId) {
            const [ws] = await tx.select().from(forgeWorkstationsTable).where(eq(forgeWorkstationsTable.id, r.workstationId));
            if (ws) {
              const hours = ((r.estimatedMinutes || 0) + (r.setupTimeMinutes || 0)) / 60;
              estimatedCostPerUnit += hours * parseFloat(ws.costPerHour?.toString() || "0");
            }
          }
        }

        const outputQty = updates.outputQty || existing.outputQty || 1;
        estimatedCostPerUnit = estimatedCostPerUnit / outputQty;
        await tx.update(forgeBOMTable).set({ estimatedCostPerUnit: estimatedCostPerUnit.toFixed(2) }).where(eq(forgeBOMTable.id, id));

        const [updatedBom] = await tx.select().from(forgeBOMTable).where(eq(forgeBOMTable.id, id));
        return { ...updatedBom, materials: mats, routing: routes, versionCreated: false };
      });
      res.json(result);
    }
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update BOM" });
  }
});

forgeRouter.delete("/forge/bom/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(forgeBOMMaterialsTable).where(eq(forgeBOMMaterialsTable.bomId, id));
  await db.delete(forgeBOMRoutingTable).where(eq(forgeBOMRoutingTable.bomId, id));
  await db.delete(forgeBOMTable).where(eq(forgeBOMTable.id, id));
  res.json({ success: true });
});

forgeRouter.get("/forge/work-orders", async (_req: Request, res: Response) => {
  const rows = await db.select().from(forgeWorkOrdersTable).orderBy(desc(forgeWorkOrdersTable.createdAt));
  res.json(rows);
});

forgeRouter.get("/forge/work-orders/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [wo] = await db.select().from(forgeWorkOrdersTable).where(eq(forgeWorkOrdersTable.id, id));
  if (!wo) { res.status(404).json({ error: "Not found" }); return; }

  const units = await db.select().from(forgeWorkOrderUnitsTable)
    .where(eq(forgeWorkOrderUnitsTable.workOrderId, id))
    .orderBy(forgeWorkOrderUnitsTable.unitNumber);

  const productionLog = await db.select().from(forgeProductionLogTable)
    .where(eq(forgeProductionLogTable.workOrderId, id))
    .orderBy(desc(forgeProductionLogTable.createdAt));

  const materialConsumption = await db.select().from(forgeMaterialConsumptionTable)
    .where(eq(forgeMaterialConsumptionTable.workOrderId, id));

  const qcRecords = await db.select().from(forgeQualityControlTable)
    .where(eq(forgeQualityControlTable.workOrderId, id))
    .orderBy(desc(forgeQualityControlTable.createdAt));

  const downtimeLogs = await db.select().from(forgeDowntimeLogsTable)
    .where(eq(forgeDowntimeLogsTable.workOrderId, id))
    .orderBy(desc(forgeDowntimeLogsTable.createdAt));

  let routing: any[] = [];
  let bomMaterials: any[] = [];
  if (wo.bomId) {
    routing = await db.select().from(forgeBOMRoutingTable)
      .where(eq(forgeBOMRoutingTable.bomId, wo.bomId))
      .orderBy(forgeBOMRoutingTable.sequenceNo);
    bomMaterials = await db.select().from(forgeBOMMaterialsTable)
      .where(eq(forgeBOMMaterialsTable.bomId, wo.bomId));
  }

  res.json({
    ...wo,
    units,
    productionLog,
    materialConsumption,
    qcRecords,
    downtimeLogs,
    routing,
    bomMaterials,
  });
});

forgeRouter.post("/forge/work-orders", async (req: Request, res: Response) => {
  try {
    const parsed = insertForgeWorkOrderSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }

    if (!parsed.data.bomId) {
      res.status(400).json({ error: "BOM is required. Link a BOM to create a Work Order." });
      return;
    }

    const [bom] = await db.select().from(forgeBOMTable).where(eq(forgeBOMTable.id, parsed.data.bomId));
    if (!bom) { res.status(400).json({ error: "BOM not found" }); return; }
    if (bom.bomStatus !== "Active") {
      res.status(400).json({ error: "Only Active BOMs can be used in Work Orders" });
      return;
    }

    const result = await db.transaction(async (tx) => {
      const [row] = await tx.insert(forgeWorkOrdersTable).values({
        ...parsed.data,
        productName: bom.productName,
        productItemId: bom.productItemId,
      }).returning();

      const automation = await triggerWorkOrderCreated(row.id, tx as any);
      const [updated] = await tx.select().from(forgeWorkOrdersTable).where(eq(forgeWorkOrdersTable.id, row.id));
      return { ...updated, automation };
    });

    res.status(201).json(result);
  } catch (err: any) {
    console.error("Work Order POST error:", err);
    res.status(400).json({ error: err.message || "Failed to create work order" });
  }
});

forgeRouter.patch("/forge/work-orders/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    const validStatuses = ["Draft", "Planned", "In Progress", "QC", "Completed", "On Hold", "Cancelled"];
    const validPriorities = ["Low", "Normal", "High", "Urgent"];

    if (req.body.status !== undefined && !validStatuses.includes(req.body.status)) {
      res.status(400).json({ error: `Invalid status` }); return;
    }
    if (req.body.priority !== undefined && !validPriorities.includes(req.body.priority)) {
      res.status(400).json({ error: `Invalid priority` }); return;
    }

    const VALID_TRANSITIONS: Record<string, string[]> = {
      "Draft": ["Planned", "In Progress", "Cancelled"],
      "Planned": ["In Progress", "Draft", "Cancelled"],
      "In Progress": ["QC", "Completed", "On Hold", "Cancelled"],
      "QC": ["Completed", "In Progress"],
      "On Hold": ["In Progress", "Cancelled"],
      "Completed": [],
      "Cancelled": [],
    };

    const result = await db.transaction(async (tx) => {
      const lockRows = await tx.execute(sql`SELECT id, status FROM forge_work_orders WHERE id = ${id} FOR UPDATE`);
      const prev = (lockRows as any).rows?.[0] || (lockRows as any)[0];
      if (!prev) throw Object.assign(new Error("Not found"), { statusCode: 404 });
      const previousStatus = prev.status;

      if (req.body.status !== undefined && req.body.status !== previousStatus) {
        const allowed = VALID_TRANSITIONS[previousStatus] || [];
        if (!allowed.includes(req.body.status)) {
          throw Object.assign(new Error(`Invalid status transition: ${previousStatus} → ${req.body.status}. Allowed: ${allowed.join(", ") || "none"}`), { statusCode: 400 });
        }
      }

      const updates: Record<string, any> = {};
      const simpleFields = ["status", "producedQty", "scrapQty", "targetQty", "assignedWorkstationId", "assignedWorkstationName",
        "productItemId", "productionLocationId", "notes", "priority", "projectId", "taskId", "trackIndividualUnits"];
      for (const f of simpleFields) {
        if (req.body[f] !== undefined) updates[f] = req.body[f];
      }
      if (req.body.startDate !== undefined) updates.startDate = new Date(req.body.startDate);
      if (req.body.endDate !== undefined) updates.endDate = new Date(req.body.endDate);
      if (req.body.expectedEndDate !== undefined) updates.expectedEndDate = new Date(req.body.expectedEndDate);
      if (Object.keys(updates).length === 0) throw Object.assign(new Error("No valid fields to update"), { statusCode: 400 });

      const [updated] = await tx.update(forgeWorkOrdersTable).set(updates).where(eq(forgeWorkOrdersTable.id, id)).returning();
      const newStatus = updated.status;
      let automationResult = null;

      if (newStatus === "In Progress" && previousStatus !== "In Progress") {
        automationResult = await triggerWorkOrderStarted(id, tx as any);
      } else if (newStatus === "Completed" && previousStatus !== "Completed") {
        automationResult = await triggerWorkOrderCompleted(id, tx as any);
      }

      return { ...updated, automationResult };
    });

    res.json(result);
  } catch (err: any) {
    console.error("Work Order PATCH error:", err);
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message || "Internal server error", shortages: err.shortages });
  }
});

forgeRouter.delete("/forge/work-orders/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.transaction(async (tx) => {
    await tx.delete(forgeProductionLogTable).where(eq(forgeProductionLogTable.workOrderId, id));
    await tx.delete(forgeWorkOrderUnitsTable).where(eq(forgeWorkOrderUnitsTable.workOrderId, id));
    await tx.delete(forgeMaterialConsumptionTable).where(eq(forgeMaterialConsumptionTable.workOrderId, id));
    await tx.delete(forgeWorkOrdersTable).where(eq(forgeWorkOrdersTable.id, id));
  });
  res.json({ success: true });
});

forgeRouter.get("/forge/work-orders/:id/units", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const units = await db.select().from(forgeWorkOrderUnitsTable)
    .where(eq(forgeWorkOrderUnitsTable.workOrderId, id))
    .orderBy(forgeWorkOrderUnitsTable.unitNumber);
  res.json(units);
});

forgeRouter.post("/forge/units/:unitId/advance", async (req: Request, res: Response) => {
  try {
    const unitId = parseInt(req.params.unitId);
    if (isNaN(unitId)) { res.status(400).json({ error: "Invalid unit id" }); return; }
    const result = await triggerUnitAdvance(unitId, req.body.operatorName);
    res.json(result);
  } catch (err: any) {
    console.error("Unit advance error:", err);
    res.status(400).json({ error: err.message });
  }
});

forgeRouter.patch("/forge/units/:unitId", async (req: Request, res: Response) => {
  try {
    const unitId = parseInt(req.params.unitId);
    if (isNaN(unitId)) { res.status(400).json({ error: "Invalid unit id" }); return; }
    const updates: Record<string, any> = {};
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    updates.updatedAt = new Date();
    const [updated] = await db.update(forgeWorkOrderUnitsTable).set(updates).where(eq(forgeWorkOrderUnitsTable.id, unitId)).returning();
    if (!updated) { res.status(404).json({ error: "Unit not found" }); return; }
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

forgeRouter.get("/forge/work-orders/:id/production-log", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const logs = await db.select().from(forgeProductionLogTable)
    .where(eq(forgeProductionLogTable.workOrderId, id))
    .orderBy(desc(forgeProductionLogTable.createdAt));
  res.json(logs);
});

forgeRouter.get("/forge/work-orders/:id/material-consumption", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const materials = await db.select().from(forgeMaterialConsumptionTable)
    .where(eq(forgeMaterialConsumptionTable.workOrderId, id));
  res.json(materials);
});

forgeRouter.post("/forge/work-orders/:id/issue-material", async (req: Request, res: Response) => {
  try {
    const woId = parseInt(req.params.id);
    if (isNaN(woId)) { res.status(400).json({ error: "Invalid id" }); return; }
    const { itemId, quantity, issuedBy } = req.body;
    if (!itemId || quantity === undefined || quantity === null) { res.status(400).json({ error: "itemId and quantity are required" }); return; }
    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) { res.status(400).json({ error: "quantity must be a positive number" }); return; }
    const parsedItemId = parseInt(itemId);
    if (isNaN(parsedItemId)) { res.status(400).json({ error: "itemId must be a valid number" }); return; }

    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM forge_material_consumption WHERE work_order_id = ${woId} AND item_id = ${parsedItemId} FOR UPDATE`);
      const consumptions = await tx.select().from(forgeMaterialConsumptionTable)
        .where(and(
          eq(forgeMaterialConsumptionTable.workOrderId, woId),
          eq(forgeMaterialConsumptionTable.itemId, parsedItemId),
        ));

      if (consumptions.length === 0) {
        throw new Error("Material not found in this work order's consumption tracking");
      }

      const [wo] = await tx.select().from(forgeWorkOrdersTable).where(eq(forgeWorkOrdersTable.id, woId));
      const locationId = wo?.productionLocationId;

      if (locationId) {
        const stockCheck = await tx.execute(sql`
          SELECT quantity FROM stock_ledger WHERE item_id = ${parsedItemId} AND location_id = ${locationId}
        `);
        const stockRow = (stockCheck as any).rows?.[0] || (stockCheck as any)[0];
        const currentStock = parseFloat(stockRow?.quantity?.toString() || "0");
        if (currentStock < parsedQty) {
          throw new Error(`Insufficient stock: available ${currentStock}, requested ${parsedQty}`);
        }
      }

      const consumption = consumptions[0];
      const unitCost = parseFloat(consumption.unitCost?.toString() || "0");
      const newIssued = parseFloat(consumption.actualQtyIssued?.toString() || "0") + parsedQty;
      const newConsumed = parseFloat(consumption.actualQtyConsumed?.toString() || "0") + parsedQty;
      const bomEstimated = parseFloat(consumption.bomEstimatedQty?.toString() || "0");
      const variance = newConsumed - bomEstimated;
      const variancePercent = bomEstimated > 0 ? (variance / bomEstimated) * 100 : 0;

      await tx.update(forgeMaterialConsumptionTable).set({
        actualQtyIssued: newIssued.toFixed(3),
        actualQtyConsumed: newConsumed.toFixed(3),
        totalCost: (newConsumed * unitCost).toFixed(2),
        variance: variance.toFixed(3),
        variancePercent: variancePercent.toFixed(2),
        issuedBy: issuedBy || "System",
        issuedDate: new Date(),
        updatedAt: new Date(),
      }).where(eq(forgeMaterialConsumptionTable.id, consumption.id));

      if (locationId) {
        await tx.execute(sql`
          UPDATE stock_ledger SET quantity = quantity - ${parsedQty}, updated_at = NOW()
          WHERE item_id = ${parsedItemId} AND location_id = ${locationId}
        `);
      }

      await tx.update(inventoryCatalogTable).set({
        globalStock: sql`${inventoryCatalogTable.globalStock} - ${parsedQty}`,
      }).where(eq(inventoryCatalogTable.id, parsedItemId));

      const totalMaterialsCost = await tx.select({
        total: sql<string>`COALESCE(SUM(total_cost), 0)`,
      }).from(forgeMaterialConsumptionTable).where(eq(forgeMaterialConsumptionTable.workOrderId, woId));

      await tx.update(forgeWorkOrdersTable).set({
        materialsCost: totalMaterialsCost[0]?.total || "0",
      }).where(eq(forgeWorkOrdersTable.id, woId));

      return { success: true, newIssued, newConsumed, totalCost: (newConsumed * unitCost).toFixed(2) };
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

forgeRouter.get("/forge/quality-control", async (_req: Request, res: Response) => {
  const rows = await db.select().from(forgeQualityControlTable).orderBy(desc(forgeQualityControlTable.createdAt));
  res.json(rows);
});

forgeRouter.post("/forge/quality-control", async (req: Request, res: Response) => {
  try {
    const parsed = insertForgeQualityControlSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }

    const result = await db.transaction(async (tx) => {
      const [row] = await tx.insert(forgeQualityControlTable).values(parsed.data).returning();

      let automationResult: any = null;

      if (row.unitIdentifier) {
        automationResult = await triggerQcLogged(row.id, tx as any);
      }

      if (row.rejectedQty > 0) {
        const rejectionResult = await triggerQualityRejection(row.id, tx as any);
        automationResult = { ...automationResult, rejectionResult };
      }

      return { ...row, automationResult };
    });

    res.status(201).json(result);
  } catch (err: any) {
    console.error("QC POST error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

forgeRouter.delete("/forge/quality-control/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(forgeQualityControlTable).where(eq(forgeQualityControlTable.id, id));
  res.json({ success: true });
});

forgeRouter.get("/forge/downtime-logs", async (_req: Request, res: Response) => {
  const rows = await db.select().from(forgeDowntimeLogsTable).orderBy(desc(forgeDowntimeLogsTable.createdAt));
  res.json(rows);
});

forgeRouter.post("/forge/downtime-logs", async (req: Request, res: Response) => {
  try {
    const parsed = insertForgeDowntimeLogSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }

    const result = await db.transaction(async (tx) => {
      const [row] = await tx.insert(forgeDowntimeLogsTable).values(parsed.data).returning();
      const automation = await triggerDowntimeLogged(row.id, tx as any);
      const [updated] = await tx.select().from(forgeDowntimeLogsTable).where(eq(forgeDowntimeLogsTable.id, row.id));
      return { ...updated, automation };
    });

    res.status(201).json(result);
  } catch (err: any) {
    console.error("Downtime POST error:", err);
    res.status(400).json({ error: err.message || "Failed to create downtime log" });
  }
});

forgeRouter.delete("/forge/downtime-logs/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(forgeDowntimeLogsTable).where(eq(forgeDowntimeLogsTable.id, id));
  res.json({ success: true });
});

forgeRouter.get("/forge/dashboard-summary", async (_req: Request, res: Response) => {
  const [woStats] = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`count(*) filter (where ${forgeWorkOrdersTable.status} = 'In Progress')`,
    todayYield: sql<number>`coalesce(sum(${forgeWorkOrdersTable.producedQty}) filter (where ${forgeWorkOrdersTable.status} in ('In Progress','QC','Completed') and ${forgeWorkOrdersTable.createdAt} >= current_date), 0)`,
    totalProduced: sql<number>`coalesce(sum(${forgeWorkOrdersTable.producedQty}), 0)`,
    totalScrap: sql<number>`coalesce(sum(${forgeWorkOrdersTable.scrapQty}), 0)`,
    totalTarget: sql<number>`coalesce(sum(${forgeWorkOrdersTable.targetQty}), 0)`,
    totalMaterialsCost: sql<number>`coalesce(sum(${forgeWorkOrdersTable.materialsCost}), 0)`,
    totalLaborCost: sql<number>`coalesce(sum(${forgeWorkOrdersTable.laborCost}), 0)`,
    totalProductionCost: sql<number>`coalesce(sum(${forgeWorkOrdersTable.totalCost}), 0)`,
  }).from(forgeWorkOrdersTable);

  const [wsStats] = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`count(*) filter (where ${forgeWorkstationsTable.currentStatus} = 'Active')`,
    idle: sql<number>`count(*) filter (where ${forgeWorkstationsTable.currentStatus} = 'Idle')`,
    maintenance: sql<number>`count(*) filter (where ${forgeWorkstationsTable.currentStatus} = 'Maintenance')`,
    breakdown: sql<number>`count(*) filter (where ${forgeWorkstationsTable.currentStatus} = 'Breakdown')`,
  }).from(forgeWorkstationsTable);

  const totalProduced = Number(woStats.totalProduced) || 0;
  const totalScrap = Number(woStats.totalScrap) || 0;
  const totalTarget = Number(woStats.totalTarget) || 1;
  const oee = totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 100) : 0;
  const scrapRate = (totalProduced + totalScrap) > 0 ? Math.round((totalScrap / (totalProduced + totalScrap)) * 100) : 0;

  res.json({
    activeWorkOrders: Number(woStats.active),
    todayYield: Number(woStats.todayYield),
    oee,
    scrapRate,
    totalMaterialsCost: Number(woStats.totalMaterialsCost),
    totalLaborCost: Number(woStats.totalLaborCost),
    totalProductionCost: Number(woStats.totalProductionCost),
    workstations: {
      total: Number(wsStats.total),
      active: Number(wsStats.active),
      idle: Number(wsStats.idle),
      maintenance: Number(wsStats.maintenance),
      breakdown: Number(wsStats.breakdown),
    },
  });
});

forgeRouter.get("/forge/projects", async (_req: Request, res: Response) => {
  const rows = await db.select({ id: projectsTable.id, projectName: projectsTable.projectName }).from(projectsTable).orderBy(projectsTable.projectName);
  res.json(rows);
});

forgeRouter.get("/forge/projects/:projectId/tasks", async (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid project id" }); return; }
  const rows = await db.select({ id: tasksTable.id, title: tasksTable.title })
    .from(tasksTable).where(eq(tasksTable.parentProject, projectId)).orderBy(tasksTable.title);
  res.json(rows);
});

forgeRouter.get("/forge/locations", async (_req: Request, res: Response) => {
  const rows = await db.select().from(inventoryLocationsTable).orderBy(inventoryLocationsTable.name);
  res.json(rows);
});

forgeRouter.get("/forge/inventory-items", async (_req: Request, res: Response) => {
  const rows = await db.select({
    id: inventoryCatalogTable.id,
    name: inventoryCatalogTable.name,
    sku: inventoryCatalogTable.sku,
    uom: inventoryCatalogTable.uom,
    unitPrice: inventoryCatalogTable.unitPrice,
    globalStock: inventoryCatalogTable.globalStock,
  }).from(inventoryCatalogTable).orderBy(inventoryCatalogTable.name);
  res.json(rows);
});

forgeRouter.get("/forge/material-variance-report", async (_req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`
      SELECT
        mc.item_name,
        COUNT(DISTINCT mc.work_order_id) as wo_count,
        ROUND(AVG(mc.variance::numeric), 3) as avg_variance,
        ROUND(AVG(mc.variance_percent::numeric), 2) as avg_variance_percent,
        ROUND(SUM(mc.bom_estimated_qty::numeric), 3) as total_estimated,
        ROUND(SUM(mc.actual_qty_consumed::numeric), 3) as total_consumed,
        ROUND(SUM(mc.total_cost::numeric), 2) as total_cost
      FROM forge_material_consumption mc
      JOIN forge_work_orders wo ON wo.id = mc.work_order_id
      WHERE wo.status = 'Completed'
      GROUP BY mc.item_name
      ORDER BY avg_variance_percent DESC
    `);
    const rows = (result as any).rows || result;
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default forgeRouter;
