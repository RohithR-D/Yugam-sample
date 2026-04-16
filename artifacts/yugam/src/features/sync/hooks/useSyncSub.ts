import { useModule } from "@/context/ModuleContext";
import type { SyncSub } from "../types";

export function useSyncSub(): SyncSub {
  const { activeModule } = useModule();
  return (activeModule.replace("Sync:", "") || "Chats") as SyncSub;
}
