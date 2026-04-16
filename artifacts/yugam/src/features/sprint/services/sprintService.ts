import { authFetch } from "@/lib/authFetch";
import type { ProjectRef, TaskRecord, TicketRecord, TimesheetRecord } from "../types";

export async function getSprintData() {
  const [tR, tkR, tsR, pR] = await Promise.all([
    authFetch("/api/sprint/tasks"),
    authFetch("/api/sprint/tickets"),
    authFetch("/api/sprint/timesheets"),
    authFetch("/api/sprint/projects"),
  ]);

  const [tasks, tickets, timesheets, projects] = await Promise.all([
    tR.ok ? tR.json() : Promise.resolve([] as TaskRecord[]),
    tkR.ok ? tkR.json() : Promise.resolve([] as TicketRecord[]),
    tsR.ok ? tsR.json() : Promise.resolve([] as TimesheetRecord[]),
    pR.ok ? pR.json() : Promise.resolve([] as ProjectRef[]),
  ]);

  return { tasks, tickets, timesheets, projects };
}
