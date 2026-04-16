import { authFetch } from "@/lib/authFetch";
import type { CreateFilePayload, FileRecord } from "../types";

export async function getFiles() {
  const res = await authFetch("/api/files");
  if (!res.ok) return [] as FileRecord[];
  return (await res.json()) as FileRecord[];
}

export async function createFile(payload: CreateFilePayload) {
  return authFetch("/api/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
