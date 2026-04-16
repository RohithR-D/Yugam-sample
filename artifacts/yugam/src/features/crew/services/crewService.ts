import { authFetch } from "@/lib/authFetch";
import { EmployeeRecord, EmployeeFormData } from "../types";

export async function getEmployees(): Promise<EmployeeRecord[]> {
  const res = await authFetch("/api/employees");
  if (!res.ok) return [];
  return res.json();
}

export async function createEmployee(payload: EmployeeFormData): Promise<EmployeeRecord> {
  const body: Record<string, string> = {
    name: payload.name,
    designation: payload.designation,
    department: payload.department,
    status: payload.status,
  };

  if (payload.joinDate) {
    body.joinDate = new Date(payload.joinDate).toISOString();
  }

  const res = await authFetch("/api/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to add employee");
  }

  return res.json();
}
