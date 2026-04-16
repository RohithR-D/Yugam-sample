import { authFetch } from "@/lib/authFetch";
import type {
  DashboardData,
  Expense,
  ExpenseFormData,
  Trip,
  TripFormData,
  Vehicle,
  VehicleFormData,
} from "../types";

export async function getFleetDashboard(): Promise<DashboardData | null> {
  const response = await authFetch("/api/fleet/dashboard");
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export async function getVehicles(): Promise<Vehicle[]> {
  const response = await authFetch("/api/fleet/vehicles");
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function createVehicle(payload: VehicleFormData): Promise<{ ok: boolean; error?: string }> {
  const body: Record<string, string> = {
    regNumber: payload.regNumber,
    type: payload.type,
    make: payload.make,
    model: payload.model,
    status: payload.status,
  };

  if (payload.rcExpiry) {
    body.rcExpiry = payload.rcExpiry;
  }
  if (payload.insuranceExpiry) {
    body.insuranceExpiry = payload.insuranceExpiry;
  }

  const response = await authFetch("/api/fleet/vehicles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (response.ok) {
    return { ok: true };
  }

  const data = await response.json().catch(() => ({ error: "Failed to add vehicle" }));
  return { ok: false, error: data.error || "Failed to add vehicle" };
}

export async function getTrips(): Promise<Trip[]> {
  const response = await authFetch("/api/fleet/trips");
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function createTrip(payload: TripFormData): Promise<{ ok: boolean; error?: string }> {
  const body: Record<string, string | number> = {
    vehicleReg: payload.vehicleReg,
    driverName: payload.driverName,
    origin: payload.origin,
    destination: payload.destination,
    status: payload.status,
    notes: payload.notes,
    startTime: payload.startTime || new Date().toISOString(),
  };

  if (payload.vehicleId) {
    body.vehicleId = parseInt(payload.vehicleId, 10);
  }

  const response = await authFetch("/api/fleet/trips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (response.ok) {
    return { ok: true };
  }

  const data = await response.json().catch(() => ({ error: "Failed to create trip" }));
  return { ok: false, error: data.error || "Failed to create trip" };
}

export async function updateTripStatus(tripId: number, status: string): Promise<void> {
  await authFetch(`/api/fleet/trips/${tripId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function getExpenses(): Promise<Expense[]> {
  const response = await authFetch("/api/fleet/expenses");
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function createExpense(payload: ExpenseFormData): Promise<{ ok: boolean; error?: string }> {
  const body: Record<string, string | number> = {
    vehicleReg: payload.vehicleReg,
    expenseDate: payload.expenseDate,
    expenseType: payload.expenseType,
    amount: payload.amount,
    description: payload.description,
    loggedBy: payload.loggedBy,
  };

  if (payload.vehicleId) {
    body.vehicleId = parseInt(payload.vehicleId, 10);
  }

  const response = await authFetch("/api/fleet/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (response.ok) {
    return { ok: true };
  }

  const data = await response.json().catch(() => ({ error: "Failed to log expense" }));
  return { ok: false, error: data.error || "Failed to log expense" };
}

export async function deleteExpense(expenseId: number): Promise<void> {
  await authFetch(`/api/fleet/expenses/${expenseId}`, { method: "DELETE" });
}
