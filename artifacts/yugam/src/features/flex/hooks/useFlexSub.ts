import { useModule } from "@/context/ModuleContext";
import type { FlexSub } from "../types";

export function useFlexSub(): FlexSub {
  const { activeModule } = useModule();
  return (activeModule.replace("Flex:", "") || "Material Requests") as FlexSub;
}
