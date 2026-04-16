import { useModule } from "@/context/ModuleContext";
import type { FleetSub } from "../types";

export function useFleetSub(): FleetSub {
  const { activeModule } = useModule();
  const sub = activeModule.startsWith("Fleet:")
    ? activeModule.replace("Fleet:", "")
    : "Fleet Dashboard";
  return sub as FleetSub;
}
