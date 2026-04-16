import { useModule } from "@/context/ModuleContext";
import type { VisionSub } from "../types";

export function useVisionSub(): VisionSub {
  const { activeModule } = useModule();
  return (activeModule.startsWith("Vision:") ? activeModule.replace("Vision:", "") : "Executive Dashboard") as VisionSub;
}
