import { useModule } from "@/context/ModuleContext";
import type { SprintSub } from "../types";

export function useSprintSub(): SprintSub {
  const { activeModule } = useModule();
  return (activeModule.replace("Sprint & Solve:", "") || "My Workspace") as SprintSub;
}
