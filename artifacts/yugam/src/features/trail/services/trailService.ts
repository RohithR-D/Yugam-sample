import { authFetch } from "@/lib/authFetch";
import type { ClaimRecord, DashSummary, PettyCashRecord } from "../types";

export async function getTrailData() {
  const [cR, pR, sR] = await Promise.all([
    authFetch("/api/trail/claims"),
    authFetch("/api/trail/petty-cash"),
    authFetch("/api/trail/dashboard-summary"),
  ]);

  const [claims, pettyCash, summary] = await Promise.all([
    cR.ok ? cR.json() : Promise.resolve([] as ClaimRecord[]),
    pR.ok ? pR.json() : Promise.resolve([] as PettyCashRecord[]),
    sR.ok ? sR.json() : Promise.resolve(null as DashSummary | null),
  ]);

  return { claims, pettyCash, summary };
}
