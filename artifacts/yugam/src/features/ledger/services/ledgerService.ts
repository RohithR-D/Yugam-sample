import { authFetch } from "@/lib/authFetch";
import type { APRecord, ARRecord, CoaRecord, DashSummary, JournalEntry } from "../types";

export async function getLedgerData() {
  const [cR, jR, apR, arR, sR] = await Promise.all([
    authFetch("/api/ledger/coa"),
    authFetch("/api/ledger/journal-entries"),
    authFetch("/api/ledger/ap"),
    authFetch("/api/ledger/ar"),
    authFetch("/api/ledger/dashboard-summary"),
  ]);

  const [coa, journals, ap, ar, summary] = await Promise.all([
    cR.ok ? cR.json() : Promise.resolve([] as CoaRecord[]),
    jR.ok ? jR.json() : Promise.resolve([] as JournalEntry[]),
    apR.ok ? apR.json() : Promise.resolve([] as APRecord[]),
    arR.ok ? arR.json() : Promise.resolve([] as ARRecord[]),
    sR.ok ? sR.json() : Promise.resolve(null as DashSummary | null),
  ]);

  return { coa, journals, ap, ar, summary };
}
