import { authFetch } from "@/lib/authFetch";
import { PayrollFormData, PayrollRecord } from "../types";

export async function getPayrollRecords(): Promise<PayrollRecord[]> {
  const res = await authFetch("/api/payroll");
  if (!res.ok) return [];
  return res.json();
}

export async function createPayrollRecord(payload: PayrollFormData): Promise<PayrollRecord> {
  const res = await authFetch("/api/payroll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employeeName: payload.employeeName,
      payPeriod: payload.payPeriod,
      grossPay: payload.grossPay || "0",
      deductions: payload.deductions || "0",
      status: payload.status,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to add payroll record");
  }

  return res.json();
}
