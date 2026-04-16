import { useModule } from "@/context/ModuleContext";
import type { ForgeSub } from "../types";

export function useForgeSub(): ForgeSub {
  const { activeModule } = useModule();
  const sub = (activeModule.replace("Forge:", "") || "Production Dashboard") as ForgeSub;
  return sub;
}
