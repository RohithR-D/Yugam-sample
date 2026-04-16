import { useModule } from "@/context/ModuleContext";
import type { SalesSubModule } from "../types";

export function useSalesSub(): SalesSubModule {
  const { activeModule, setActiveModule } = useModule();
  const subModule = (activeModule.replace("Sales:", "") || "Overview") as SalesSubModule;
  void setActiveModule;
  return subModule;
}
