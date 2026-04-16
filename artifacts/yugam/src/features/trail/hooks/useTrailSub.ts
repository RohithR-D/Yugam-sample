import { useModule } from "@/context/ModuleContext";
import type { TrailSub } from "../types";

export function useTrailSub(): TrailSub {
  const { activeModule } = useModule();
  return (activeModule.replace("Trail:", "") || "Expense Dashboard") as TrailSub;
}
