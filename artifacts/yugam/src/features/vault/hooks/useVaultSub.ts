import { useModule } from "@/context/ModuleContext";
import type { VaultSub } from "../types";

export function useVaultSub(): VaultSub {
  const { activeModule } = useModule();
  return (activeModule.replace("Vault:", "") || "Dashboard") as VaultSub;
}
