import { authFetch } from "@/lib/authFetch";

export async function getChatMessages(threadType: string) {
  const res = await authFetch(`/api/chat-messages?threadType=${encodeURIComponent(threadType)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function postChatMessage(payload: { threadType: string; senderName: string; messageBody: string }) {
  return authFetch("/api/chat-messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getCallLogs() {
  const res = await authFetch("/api/call-logs");
  if (!res.ok) return [];
  return res.json();
}

export async function getMeetings() {
  const res = await authFetch("/api/meetings");
  if (!res.ok) return [];
  return res.json();
}
