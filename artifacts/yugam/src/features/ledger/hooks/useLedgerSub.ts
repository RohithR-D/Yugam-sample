import { useModule } from "@/context/ModuleContext";
import type { LedgerSub } from "../types";

export function useLedgerSub(): LedgerSub {
  const { activeModule } = useModule();
  return (activeModule.replace("Ledger:", "") || "Finance Dashboard") as LedgerSub;
}
