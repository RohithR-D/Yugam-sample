import { Router, type Request, type Response } from "express";
import { mongooseInstance, runMongoTransaction } from "@workspace/db";
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
  res.json(await forgeWorkstationsTable.find({}).sort({ name: 1 }).lean());
});

forgeRouter.post("/forge/workstations", async (req: Request, res: Response) => {
  const parsed = insertForgeWorkstationSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const row = (await forgeWorkstationsTable.create(parsed.data)).toObject();
  res.status(201).json(row);
});

forgeRouter.patch("/forge/workstations/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const updates: Record<string, any> = {};
  const fields = ["name", "type", "costPerHour", "status", "description", "locationId", "capacity", "currentStatus", "maintenanceSchedule"];
  for (const f of fields) { if (req.body[f] !== undefined) updates[f] = req.body[f]; }
  if (req.body.lastMaintenanceDate !== undefined) updates.lastMaintenanceDate = req.body.lastMaintenanceDate ? new Date(req.body.lastMaintenanceDate) : null;
  if (req.body.nextMaintenanceDate !== undefined) updates.nextMaintenanceDate = req.body.nextMaintenanceDate ? new Date(req.body.nextMaintenanceDate) : null;
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No valid fields to update" }); return; }
  const updated = await forgeWorkstationsTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

forgeRouter.delete("/forge/workstations/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await forgeWorkstationsTable.findOneAndDelete({ id });
  res.json({ success: true });
});

forgeRouter.get("/forge/bom", async (_req: Request, res: Response) => {
  res.json(await forgeBOMTable.find({}).sort({ createdAt: -1 }).lean());
});

forgeRouter.get("/forge/bom/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const bom = await forgeBOMTable.findOne({ id }).lean();
  if (!bom) { res.status(404).json({ error: "Not found" }); return; }
  const materials = await forgeBOMMaterialsTable.find({ bomId: id }).lean();
  const routing = await forgeBOMRoutingTable.find({ bomId: id }).sort({ sequenceNo: 1 }).lean();
  res.json({ ...bom, materials, routing });
});

async function calcBomCost(bomId: number, session?: mongoose.ClientSession): Promise<number> {
  const mats = await forgeBOMMaterialsTable.find({ bomId }).session(session).lean();
  const routes = await forgeBOMRoutingTable.find({ bomId }).session(session).lean();
  let cost = 0;
  for (const m of mats) {
    if ((m as any).itemId) {
      const item = await inventoryCatalogTable.findOne({ id: (m as any).itemId }).session(session).lean();
      if (item) {
        const qty = parseFloat(String((m as any).qty || "1"));
        const wastage = parseFloat(String((m as any).wastagePercent || "0"));
        cost += qty * (1 + wastage / 100) * parseFloat(String((item as any).unitPrice || "0"));
      }
    }
  }
  for (const r of routes) {
    if ((r as any).workstationId) {
      const ws = await forgeWorkstationsTable.findOne({ id: (r as any).workstationId }).session(session).lean();
      if (ws) {
        const hours = (((r as any).estimatedMinutes || 0) + ((r as any).setupTimeMinutes || 0)) / 60;
        cost += hours * parseFloat(String((ws as any).costPerHour || "0"));
      }
    }
  }
  return cost;
}

forgeRouter.post("/forge/bom", async (req: Request, res: Response) => {
  const { materials, routing, ...bomData } = req.body;
  const parsed = insertForgeBOMSchema.safeParse(bomData);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }

  const session = await mongooseInstance.startSession();
  try {
    let responseData: any;
    await session.withTransaction(async () => {
      const [bomDoc] = await forgeBOMTable.create([parsed.data], { session });
      const bom = bomDoc.toObject();

      if (materials && Array.isArray(materials)) {
        for (const mat of materials) {
          const matParsed = insertForgeBOMMaterialSchema.safeParse({ ...mat, bomId: bom.id });
          if (!matParsed.success) throw new Error(`Invalid material: ${matParsed.error.issues.map((i: any) => i.message).join(", ")}`);
          await forgeBOMMaterialsTable.create([matParsed.data], { session });
        }
      }

      if (routing && Array.isArray(routing)) {
        for (const route of routing) {
          const routeParsed = insertForgeBOMRoutingSchema.safeParse({ ...route, bomId: bom.id });
          if (!routeParsed.success) throw new Error(`Invalid routing: ${routeParsed.error.issues.map((i: any) => i.message).join(", ")}`);
          await forgeBOMRoutingTable.create([routeParsed.data], { session });
        }
      }

      const totalCost = await calcBomCost(bom.id, session);
      const outputQty = bom.outputQty || 1;
      const estimatedCostPerUnit = (totalCost / outputQty).toFixed(2);
      await forgeBOMTable.findOneAndUpdate(
        { id: bom.id },
        { $set: { estimatedCostPerUnit } },
        { session },
      );
      const mats = await forgeBOMMaterialsTable.find({ bomId: bom.id }).session(session).lean();
      const routes = await forgeBOMRoutingTable.find({ bomId: bom.id }).session(session).lean();
      responseData = { ...bom, estimatedCostPerUnit, materials: mats, routing: routes };
    });

    res.status(201).json(responseData);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create BOM" });
  } finally {
    session.endSession();
  }
});

forgeRouter.put("/forge/bom/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const session = await mongooseInstance.startSession();
  try {
    let responseData: any;
    await session.withTransaction(async () => {
      const existing = await forgeBOMTable.findOne({ id }).session(session).lean();
      if (!existing) { throw { statusCode: 404, message: "Not found" }; }
      const { materials, routing, ...bomData } = req.body;
      const hasLinkedWOs = await forgeWorkOrdersTable.findOne({ bomId: id }).session(session).lean();
      if (hasLinkedWOs && (existing as any).bomStatus === "Active") {
        await forgeBOMTable.findOneAndUpdate(
          { id },
          { $set: { bomStatus: "Obsolete" } },
          { session },
        );
        const newVersion = ((existing as any).version || 1) + 1;
        const parsed = insertForgeBOMSchema.safeParse({
          ...bomData,
          productName: bomData.productName || (existing as any).productName,
          productCode: bomData.productCode || (existing as any).productCode,
          uom: bomData.uom || (existing as any).uom,
          outputQty: bomData.outputQty || (existing as any).outputQty,
          version: newVersion,
          bomStatus: "Draft",
          productItemId: bomData.productItemId || (existing as any).productItemId,
        });
        if (!parsed.success) throw new Error("Invalid BOM data");
        const [newBomDoc] = await forgeBOMTable.create([{ ...parsed.data, version: newVersion }], { session });
        const newBom = newBomDoc.toObject();
        const srcMats = materials && Array.isArray(materials) ? materials : await forgeBOMMaterialsTable.find({ bomId: id }).session(session).lean();
        for (const mat of srcMats) {
          await forgeBOMMaterialsTable.create([{ ...(mat as any), id: undefined, bomId: newBom.id }], { session });
        }
        const srcRoutes = routing && Array.isArray(routing) ? routing : await forgeBOMRoutingTable.find({ bomId: id }).session(session).lean();
        for (const route of srcRoutes) {
          await forgeBOMRoutingTable.create([{ ...(route as any), id: undefined, bomId: newBom.id }], { session });
        }
        const totalCost = await calcBomCost(newBom.id, session);
        const outputQty = newBom.outputQty || 1;
        const estimatedCostPerUnit = (totalCost / outputQty).toFixed(2);
        await forgeBOMTable.findOneAndUpdate(
          { id: newBom.id },
          { $set: { estimatedCostPerUnit } },
          { session },
        );
        const mats = await forgeBOMMaterialsTable.find({ bomId: newBom.id }).session(session).lean();
        const routes = await forgeBOMRoutingTable.find({ bomId: newBom.id }).session(session).lean();
        responseData = { ...newBom, estimatedCostPerUnit, materials: mats, routing: routes, versionCreated: true };
      } else {
        const updates: Record<string, any> = {};
        for (const f of ["productName", "productCode", "uom", "outputQty", "notes", "bomStatus", "productItemId"]) {
          if (bomData[f] !== undefined) updates[f] = bomData[f];
        }
        if (Object.keys(updates).length > 0) {
          await forgeBOMTable.findOneAndUpdate({ id }, { $set: updates }, { session });
        }
        if (materials && Array.isArray(materials)) {
          await forgeBOMMaterialsTable.deleteMany({ bomId: id }).session(session);
          for (const mat of materials) {
            await forgeBOMMaterialsTable.create([{ ...(mat as any), id: undefined, bomId: id }], { session });
          }
        }
        if (routing && Array.isArray(routing)) {
          await forgeBOMRoutingTable.deleteMany({ bomId: id }).session(session);
          for (const route of routing) {
            await forgeBOMRoutingTable.create([{ ...(route as any), id: undefined, bomId: id }], { session });
          }
        }
        const totalCost = await calcBomCost(id, session);
        const outputQty = updates.outputQty || (existing as any).outputQty || 1;
        const estimatedCostPerUnit = (totalCost / outputQty).toFixed(2);
        await forgeBOMTable.findOneAndUpdate(
          { id },
          { $set: { estimatedCostPerUnit } },
          { session },
        );
        const updatedBom = await forgeBOMTable.findOne({ id }).session(session).lean();
        const mats = await forgeBOMMaterialsTable.find({ bomId: id }).session(session).lean();
        const routes = await forgeBOMRoutingTable.find({ bomId: id }).session(session).lean();
        responseData = { ...updatedBom, materials: mats, routing: routes, versionCreated: false };
      }
    });

    if (responseData == null) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(responseData);
  } catch (err: any) {
    if (err?.statusCode === 404) {
      res.status(404).json({ error: err.message || "Not found" });
    } else {
      res.status(400).json({ error: err.message || "Failed to update BOM" });
    }
  } finally {
    session.endSession();
  }
});

forgeRouter.delete("/forge/bom/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const session = await mongooseInstance.startSession();
  try {
    await session.withTransaction(async () => {
      await forgeBOMMaterialsTable.deleteMany({ bomId: id }).session(session);
      await forgeBOMRoutingTable.deleteMany({ bomId: id }).session(session);
      await forgeBOMTable.findOneAndDelete({ id }, { session });
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to delete BOM" });
  } finally {
    session.endSession();
  }
});

forgeRouter.get("/forge/work-orders", async (_req: Request, res: Response) => {
  res.json(await forgeWorkOrdersTable.find({}).sort({ createdAt: -1 }).lean());
});

forgeRouter.get("/forge/work-orders/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const wo = await forgeWorkOrdersTable.findOne({ id }).lean();
  if (!wo) { res.status(404).json({ error: "Not found" }); return; }
  const [units, productionLog, materialConsumption, qcRecords, downtimeLogs] = await Promise.all([
    forgeWorkOrderUnitsTable.find({ workOrderId: id }).sort({ unitNumber: 1 }).lean(),
    forgeProductionLogTable.find({ workOrderId: id }).sort({ createdAt: -1 }).lean(),
    forgeMaterialConsumptionTable.find({ workOrderId: id }).lean(),
    forgeQualityControlTable.find({ workOrderId: id }).sort({ createdAt: -1 }).lean(),
    forgeDowntimeLogsTable.find({ workOrderId: id }).sort({ createdAt: -1 }).lean(),
  ]);
  let routing: any[] = [];
  let bomMaterials: any[] = [];
  if ((wo as any).bomId) {
    [routing, bomMaterials] = await Promise.all([
      forgeBOMRoutingTable.find({ bomId: (wo as any).bomId }).sort({ sequenceNo: 1 }).lean(),
      forgeBOMMaterialsTable.find({ bomId: (wo as any).bomId }).lean(),
    ]);
  }
  res.json({ ...wo, units, productionLog, materialConsumption, qcRecords, downtimeLogs, routing, bomMaterials });
});

forgeRouter.post("/forge/work-orders", async (req: Request, res: Response) => {
  const session = await mongooseInstance.startSession();
  try {
    let responseData: any;
    await session.withTransaction(async () => {
      const parsed = insertForgeWorkOrderSchema.safeParse(req.body);
      if (!parsed.success) throw { statusCode: 400, message: "Invalid input", details: parsed.error.issues };
      if (!parsed.data.bomId) throw { statusCode: 400, message: "BOM is required." };
      const bom = await forgeBOMTable.findOne({ id: parsed.data.bomId }).session(session).lean();
      if (!bom) throw { statusCode: 400, message: "BOM not found" };
      if ((bom as any).bomStatus !== "Active") throw { statusCode: 400, message: "Only Active BOMs can be used in Work Orders" };

      const [rowDoc] = await forgeWorkOrdersTable.create([
        { ...parsed.data, productName: (bom as any).productName, productItemId: (bom as any).productItemId },
      ], { session });
      const row = rowDoc.toObject();
      const automation = await triggerWorkOrderCreated(row.id, session);
      const updated = await forgeWorkOrdersTable.findOne({ id: row.id }).session(session).lean();
      responseData = { ...updated, automation };
    });
    res.status(201).json(responseData);
  } catch (err: any) {
    console.error("Work Order POST error:", err);
    if (err?.statusCode) {
      res.status(err.statusCode).json({ error: err.message, details: err.details });
    } else {
      res.status(400).json({ error: err.message || "Failed to create work order" });
    }
  } finally {
    session.endSession();
  }
});

forgeRouter.patch("/forge/work-orders/:id", async (req: Request, res: Response) => {
  const session = await mongooseInstance.startSession();
  try {
    let responseData: any;
    await session.withTransaction(async () => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw { statusCode: 400, message: "Invalid id" };
      const validStatuses = ["Draft", "Planned", "In Progress", "QC", "Completed", "On Hold", "Cancelled"];
      const validPriorities = ["Low", "Normal", "High", "Urgent"];
      if (req.body.status !== undefined && !validStatuses.includes(req.body.status)) throw { statusCode: 400, message: "Invalid status" };
      if (req.body.priority !== undefined && !validPriorities.includes(req.body.priority)) throw { statusCode: 400, message: "Invalid priority" };
      const VALID_TRANSITIONS: Record<string, string[]> = {
        "Draft": ["Planned", "In Progress", "Cancelled"],
        "Planned": ["In Progress", "Draft", "Cancelled"],
        "In Progress": ["QC", "Completed", "On Hold", "Cancelled"],
        "QC": ["Completed", "In Progress"],
        "On Hold": ["In Progress", "Cancelled"],
        "Completed": [],
        "Cancelled": [],
      };
      const prev = await forgeWorkOrdersTable.findOne({ id }).session(session).lean();
      if (!prev) throw { statusCode: 404, message: "Not found" };
      const previousStatus = (prev as any).status;
      if (req.body.status !== undefined && req.body.status !== previousStatus) {
        const allowed = VALID_TRANSITIONS[previousStatus] || [];
        if (!allowed.includes(req.body.status)) {
          throw { statusCode: 400, message: `Invalid status transition: ${previousStatus} ? ${req.body.status}. Allowed: ${allowed.join(", ") || "none"}` };
        }
      }
      const updates: Record<string, any> = {};
      for (const f of ["status", "producedQty", "scrapQty", "targetQty", "assignedWorkstationId", "assignedWorkstationName",
        "productItemId", "productionLocationId", "notes", "priority", "projectId", "taskId", "trackIndividualUnits"]) {
        if (req.body[f] !== undefined) updates[f] = req.body[f];
      }
      if (req.body.startDate !== undefined) updates.startDate = new Date(req.body.startDate);
      if (req.body.endDate !== undefined) updates.endDate = new Date(req.body.endDate);
      if (req.body.expectedEndDate !== undefined) updates.expectedEndDate = new Date(req.body.expectedEndDate);
      if (Object.keys(updates).length === 0) throw { statusCode: 400, message: "No valid fields to update" };
      const updated = await forgeWorkOrdersTable.findOneAndUpdate(
        { id },
        { $set: updates },
        { new: true, session },
      ).lean();
      const newStatus = (updated as any).status;
      let automationResult = null;
      if (newStatus === "In Progress" && previousStatus !== "In Progress") {
        automationResult = await triggerWorkOrderStarted(id, session);
      } else if (newStatus === "Completed" && previousStatus !== "Completed") {
        automationResult = await triggerWorkOrderCompleted(id, session);
      }
      responseData = { ...updated, automationResult };
    });
    res.json(responseData);
  } catch (err: any) {
    console.error("Work Order PATCH error:", err);
    if (err?.statusCode) {
      res.status(err.statusCode).json({ error: err.message, shortages: err.shortages });
    } else {
      res.status(500).json({ error: err.message || "Internal server error", shortages: err.shortages });
    }
  } finally {
    session.endSession();
  }
});

forgeRouter.delete("/forge/work-orders/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await runMongoTransaction(async (session) => {
      await forgeProductionLogTable.deleteMany({ workOrderId: id }).session(session);
      await forgeWorkOrderUnitsTable.deleteMany({ workOrderId: id }).session(session);
      await forgeMaterialConsumptionTable.deleteMany({ workOrderId: id }).session(session);
      await forgeWorkOrdersTable.findOneAndDelete({ id }, { session });
    }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

forgeRouter.get("/forge/work-orders/:id/units", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  res.json(await forgeWorkOrderUnitsTable.find({ workOrderId: id }).sort({ unitNumber: 1 }).lean());
});

forgeRouter.post("/forge/units/:unitId/advance", async (req: Request, res: Response) => {
  try {
    const unitId = parseInt(req.params.unitId);
    if (isNaN(unitId)) { res.status(400).json({ error: "Invalid unit id" }); return; }
    const result = await runMongoTransaction(async (session) => {
      return triggerUnitAdvance(unitId, req.body.operatorName, session);
    }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
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
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    const updated = await forgeWorkOrderUnitsTable.findOneAndUpdate({ id: unitId }, { $set: updates }, { new: true }).lean();
    if (!updated) { res.status(404).json({ error: "Unit not found" }); return; }
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

forgeRouter.get("/forge/work-orders/:id/production-log", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  res.json(await forgeProductionLogTable.find({ workOrderId: id }).sort({ createdAt: -1 }).lean());
});

forgeRouter.get("/forge/work-orders/:id/material-consumption", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  res.json(await forgeMaterialConsumptionTable.find({ workOrderId: id }).lean());
});

forgeRouter.post("/forge/work-orders/:id/issue-material", async (req: Request, res: Response) => {
  try {
    const result = await runMongoTransaction(async (session) => {
      const woId = parseInt(req.params.id);
      if (isNaN(woId)) { throw { statusCode: 400, message: "Invalid id" }; }
      const { itemId, quantity, issuedBy } = req.body;
      if (!itemId || quantity === undefined || quantity === null) {
        throw { statusCode: 400, message: "itemId and quantity are required" };
      }
      const parsedQty = parseFloat(quantity);
      if (isNaN(parsedQty) || parsedQty <= 0) {
        throw { statusCode: 400, message: "quantity must be a positive number" };
      }
      const parsedItemId = parseInt(itemId);
      if (isNaN(parsedItemId)) {
        throw { statusCode: 400, message: "itemId must be a valid number" };
      }

      const consumption = await forgeMaterialConsumptionTable.findOne({ workOrderId: woId, itemId: parsedItemId }).session(session).lean();
      if (!consumption) throw { statusCode: 400, message: "Material not found in this work order's consumption tracking" };

      const wo = await forgeWorkOrdersTable.findOne({ id: woId }).session(session).lean();
      const locationId = (wo as any)?.productionLocationId;

      if (locationId) {
        const { stockLedgerTable } = await import("@workspace/db/schema");
        const stockRow = await stockLedgerTable.findOne({ itemId: parsedItemId, locationId }).session(session).lean();
        const currentStock = parseFloat(String((stockRow as any)?.quantity || "0"));
        if (currentStock < parsedQty) throw { statusCode: 400, message: `Insufficient stock: available ${currentStock}, requested ${parsedQty}` };
      }

      const unitCost = parseFloat(String((consumption as any).unitCost || "0"));
      const newIssued = parseFloat(String((consumption as any).actualQtyIssued || "0")) + parsedQty;
      const newConsumed = parseFloat(String((consumption as any).actualQtyConsumed || "0")) + parsedQty;
      const bomEstimated = parseFloat(String((consumption as any).bomEstimatedQty || "0"));
      const variance = newConsumed - bomEstimated;
      const variancePercent = bomEstimated > 0 ? (variance / bomEstimated) * 100 : 0;

      await forgeMaterialConsumptionTable.findOneAndUpdate(
        { id: (consumption as any).id },
        {
          $set: {
            actualQtyIssued: newIssued.toFixed(3),
            actualQtyConsumed: newConsumed.toFixed(3),
            totalCost: (newConsumed * unitCost).toFixed(2),
            variance: variance.toFixed(3),
            variancePercent: variancePercent.toFixed(2),
            issuedBy: issuedBy || "System",
            issuedDate: new Date(),
            updatedAt: new Date(),
          },
        },
        { session },
      );

      if (locationId) {
        const { stockLedgerTable } = await import("@workspace/db/schema");
        await stockLedgerTable.findOneAndUpdate(
          { itemId: parsedItemId, locationId },
          { $inc: { quantity: -parsedQty }, $set: { updatedAt: new Date() } },
          { session },
        );
      }

      await inventoryCatalogTable.findOneAndUpdate(
        { id: parsedItemId },
        { $inc: { globalStock: -parsedQty } },
        { session },
      );

      const totalAgg = await forgeMaterialConsumptionTable.aggregate([
        { $match: { workOrderId: woId } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$totalCost" } } } },
      ]).session(session);
      await forgeWorkOrdersTable.findOneAndUpdate(
        { id: woId },
        { $set: { materialsCost: String((totalAgg[0]?.total || 0).toFixed(2)) } },
        { session },
      );

      return {
        success: true,
        newIssued,
        newConsumed,
        totalCost: (newConsumed * unitCost).toFixed(2),
      };
    }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });

    res.json(result);
  } catch (err: any) {
    if (err?.statusCode === 400) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

forgeRouter.get("/forge/quality-control", async (_req: Request, res: Response) => {
  res.json(await forgeQualityControlTable.find({}).sort({ createdAt: -1 }).lean());
});

forgeRouter.post("/forge/quality-control", async (req: Request, res: Response) => {
  try {
    const response = await runMongoTransaction(async (session) => {
      const parsed = insertForgeQualityControlSchema.safeParse(req.body);
      if (!parsed.success) {
        throw { statusCode: 400, message: "Invalid input", details: parsed.error.issues };
      }
      const [doc] = await forgeQualityControlTable.create([parsed.data], { session });
      const row = doc.toObject();
      let automationResult: any = null;
      if (row.unitIdentifier) {
        automationResult = await triggerQcLogged(row.id, session);
      }
      if (row.rejectedQty > 0) {
        const rejectionResult = await triggerQualityRejection(row.id, session);
        automationResult = { ...automationResult, rejectionResult };
      }
      const updatedRow = await forgeQualityControlTable.findOne({ id: row.id }).session(session).lean();
      return { row: updatedRow || row, automationResult };
    }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
    res.status(201).json({ ...response.row, automationResult: response.automationResult });
  } catch (err: any) {
    console.error("QC POST error:", err);
    if (err?.statusCode === 400) {
      res.status(400).json({ error: err.message, details: err.details });
    } else {
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }
});

forgeRouter.delete("/forge/quality-control/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await forgeQualityControlTable.findOneAndDelete({ id });
  res.json({ success: true });
});

forgeRouter.get("/forge/downtime-logs", async (_req: Request, res: Response) => {
  res.json(await forgeDowntimeLogsTable.find({}).sort({ createdAt: -1 }).lean());
});

forgeRouter.post("/forge/downtime-logs", async (req: Request, res: Response) => {
  try {
    const response = await runMongoTransaction(async (session) => {
      const parsed = insertForgeDowntimeLogSchema.safeParse(req.body);
      if (!parsed.success) {
        throw { statusCode: 400, message: "Invalid input", details: parsed.error.issues };
      }
      const [doc] = await forgeDowntimeLogsTable.create([parsed.data], { session });
      const row = doc.toObject();
      const automation = await triggerDowntimeLogged(row.id, session);
      const updated = await forgeDowntimeLogsTable.findOne({ id: row.id }).session(session).lean();
      return { row: updated || row, automation };
    }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
    res.status(201).json({ ...response.row, automation: response.automation });
  } catch (err: any) {
    console.error("Downtime POST error:", err);
    if (err?.statusCode === 400) {
      res.status(400).json({ error: err.message, details: err.details });
    } else {
      res.status(400).json({ error: err.message || "Failed to create downtime log" });
    }
  }
});

forgeRouter.delete("/forge/downtime-logs/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await forgeDowntimeLogsTable.findOneAndDelete({ id });
  res.json({ success: true });
});

forgeRouter.get("/forge/dashboard-summary", async (_req: Request, res: Response) => {
  const [woAgg, wsAgg] = await Promise.all([
    forgeWorkOrdersTable.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
          totalProduced: { $sum: { $ifNull: ["$producedQty", 0] } },
          totalScrap: { $sum: { $ifNull: ["$scrapQty", 0] } },
          totalTarget: { $sum: { $ifNull: ["$targetQty", 0] } },
          totalMaterialsCost: { $sum: { $toDouble: { $ifNull: ["$materialsCost", "0"] } } },
          totalLaborCost: { $sum: { $toDouble: { $ifNull: ["$laborCost", "0"] } } },
          totalProductionCost: { $sum: { $toDouble: { $ifNull: ["$totalCost", "0"] } } },
        },
      },
    ]),
    forgeWorkstationsTable.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ["$currentStatus", "Active"] }, 1, 0] } },
          idle: { $sum: { $cond: [{ $eq: ["$currentStatus", "Idle"] }, 1, 0] } },
          maintenance: { $sum: { $cond: [{ $eq: ["$currentStatus", "Maintenance"] }, 1, 0] } },
          breakdown: { $sum: { $cond: [{ $eq: ["$currentStatus", "Breakdown"] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const wo = woAgg[0] || {};
  const ws = wsAgg[0] || {};
  const totalProduced = Number(wo.totalProduced) || 0;
  const totalScrap = Number(wo.totalScrap) || 0;
  const totalTarget = Number(wo.totalTarget) || 1;
  const oee = totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 100) : 0;
  const scrapRate = (totalProduced + totalScrap) > 0 ? Math.round((totalScrap / (totalProduced + totalScrap)) * 100) : 0;

  res.json({
    activeWorkOrders: Number(wo.active) || 0,
    todayYield: 0,
    oee,
    scrapRate,
    totalMaterialsCost: Number(wo.totalMaterialsCost) || 0,
    totalLaborCost: Number(wo.totalLaborCost) || 0,
    totalProductionCost: Number(wo.totalProductionCost) || 0,
    workstations: {
      total: Number(ws.total) || 0,
      active: Number(ws.active) || 0,
      idle: Number(ws.idle) || 0,
      maintenance: Number(ws.maintenance) || 0,
      breakdown: Number(ws.breakdown) || 0,
    },
  });
});

forgeRouter.get("/forge/projects", async (_req: Request, res: Response) => {
  res.json(await projectsTable.find({}, { id: 1, projectName: 1 }).sort({ projectName: 1 }).lean());
});

forgeRouter.get("/forge/projects/:projectId/tasks", async (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid project id" }); return; }
  res.json(await tasksTable.find({ parentProject: projectId }, { id: 1, title: 1 }).sort({ title: 1 }).lean());
});

forgeRouter.get("/forge/locations", async (_req: Request, res: Response) => {
  res.json(await inventoryLocationsTable.find({}).sort({ name: 1 }).lean());
});

forgeRouter.get("/forge/inventory-items", async (_req: Request, res: Response) => {
  res.json(await inventoryCatalogTable.find({}, { id: 1, name: 1, sku: 1, uom: 1, unitPrice: 1, globalStock: 1 }).sort({ name: 1 }).lean());
});

forgeRouter.get("/forge/material-variance-report", async (_req: Request, res: Response) => {
  try {
    const result = await forgeMaterialConsumptionTable.aggregate([
      {
        $lookup: {
          from: "forgeworkorders",
          let: { woId: "$workOrderId" },
          pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$id", "$$woId"] }, { $eq: ["$status", "Completed"] }] } } }],
          as: "wo",
        },
      },
      { $match: { "wo.0": { $exists: true } } },
      {
        $group: {
          _id: "$itemName",
          woCount: { $addToSet: "$workOrderId" },
          avgVariance: { $avg: { $toDouble: "$variance" } },
          avgVariancePercent: { $avg: { $toDouble: "$variancePercent" } },
          totalEstimated: { $sum: { $toDouble: "$bomEstimatedQty" } },
          totalConsumed: { $sum: { $toDouble: "$actualQtyConsumed" } },
          totalCost: { $sum: { $toDouble: "$totalCost" } },
        },
      },
      {
        $project: {
          item_name: "$_id",
          wo_count: { $size: "$woCount" },
          avg_variance: { $round: ["$avgVariance", 3] },
          avg_variance_percent: { $round: ["$avgVariancePercent", 2] },
          total_estimated: { $round: ["$totalEstimated", 3] },
          total_consumed: { $round: ["$totalConsumed", 3] },
          total_cost: { $round: ["$totalCost", 2] },
        },
      },
      { $sort: { avg_variance_percent: -1 } },
    ]);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default forgeRouter;
