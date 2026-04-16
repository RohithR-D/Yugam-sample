import { onFleetExpenseCreated } from "../../finance/routes/crossModuleAutomation";
import {
  fleetVehiclesTable,
  fleetTripsTable,
  fleetExpensesTable,
} from "@workspace/db/schema";

export const getFleetDashboard = async () => {
  const vehicles = await fleetVehiclesTable.find().lean();
  const total = vehicles.length;
  const onTrip = vehicles.filter((v) => v.status === "On Trip").length;
  const inMaint = vehicles.filter((v) => v.status === "Maintenance").length;
  const available = vehicles.filter((v) => v.status === "Available").length;

  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  const now = new Date();

  const expiring = vehicles
    .filter((v) => {
      const rcExp = v.rcExpiry ? new Date(v.rcExpiry) : null;
      const insExp = v.insuranceExpiry ? new Date(v.insuranceExpiry) : null;
      return (
        (rcExp && rcExp >= now && rcExp <= thirtyDays) ||
        (insExp && insExp >= now && insExp <= thirtyDays)
      );
    })
    .map((v) => {
      const items: { type: string; date: string }[] = [];
      if (v.rcExpiry && new Date(v.rcExpiry) <= thirtyDays) items.push({ type: "RC", date: new Date(v.rcExpiry).toISOString() });
      if (v.insuranceExpiry && new Date(v.insuranceExpiry) <= thirtyDays) items.push({ type: "Insurance", date: new Date(v.insuranceExpiry).toISOString() });
      return { regNumber: v.regNumber, vehicleType: v.type, expiries: items };
    });

  return { total, onTrip, inMaintenance: inMaint, available, expiring };
};

export const getFleetVehicles = async () => {
  return await fleetVehiclesTable.find().sort({ createdAt: -1 }).lean();
};

export const createFleetVehicle = async (data: any) => {
  const vehicle = await fleetVehiclesTable.create(data);
  return vehicle.toObject();
};

export const updateFleetVehicleStatus = async (id: number, status: string) => {
  return await fleetVehiclesTable.findOneAndUpdate({ id }, { $set: { status } }, { new: true }).lean();
};

export const deleteFleetVehicle = async (id: number) => {
  return await fleetVehiclesTable.findOneAndDelete({ id }).lean();
};

export const getFleetTrips = async () => {
  return await fleetTripsTable.find().sort({ startTime: -1 }).lean();
};

export const createFleetTrip = async (data: any) => {
  const trip = await fleetTripsTable.create(data);
  if (data.status === "In Transit" && data.vehicleId) {
    await fleetVehiclesTable.findOneAndUpdate({ id: data.vehicleId }, { $set: { status: "On Trip" } });
  }
  return trip.toObject();
};

export const updateFleetTripStatus = async (id: number, status: string) => {
  const updates: any = { status };
  if (status === "Completed") updates.endTime = new Date();

  const updated = await fleetTripsTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  if (!updated) return null;

  if (status === "Completed" && updated.vehicleId) {
    await fleetVehiclesTable.findOneAndUpdate({ id: updated.vehicleId }, { $set: { status: "Available" } });
  }
  if (status === "In Transit" && updated.vehicleId) {
    await fleetVehiclesTable.findOneAndUpdate({ id: updated.vehicleId }, { $set: { status: "On Trip" } });
  }

  return updated;
};

export const getFleetExpenses = async () => {
  return await fleetExpensesTable.find().sort({ expenseDate: -1 }).lean();
};

export const createFleetExpense = async (data: any) => {
  const expense = await fleetExpensesTable.create(data);
  let automation: any = null;
  if (data.paidBy === "Employee") {
    automation = await onFleetExpenseCreated(expense.id);
  }
  const freshExpense = await fleetExpensesTable.findOne({ id: expense.id }).lean();
  return { ...freshExpense, _automation: automation };
};

export const deleteFleetExpense = async (id: number) => {
  return await fleetExpensesTable.findOneAndDelete({ id }).lean();
};
