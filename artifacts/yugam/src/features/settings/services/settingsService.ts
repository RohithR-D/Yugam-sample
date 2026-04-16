import { authFetch } from "@/lib/authFetch";
import type { CreateUserPayload, User } from "../types";

export async function getUsers() {
  const res = await authFetch("/api/users");
  if (!res.ok) return [] as User[];
  return (await res.json()) as User[];
}

export async function createUser(payload: CreateUserPayload) {
  return authFetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
