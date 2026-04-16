export type SprintSub = "My Workspace" | "Task Boards" | "Backlog & Planning" | "Issue Desk (Tickets)" | "Timesheets";

export interface TaskRecord { id: number; title: string; description: string; assignee: string; priority: string; status: string; parentProject: number | null; startDate: string | null; dueDate: string; attachments: string; reminder: string | null; createdAt: string | null; }
export interface TicketRecord { id: number; ticketName: string; type: string; priority: string; status: string; parentProject: number | null; dueDate: string | null; contact: string; description: string; assignedTeam: string; assignedTo: string; attachments: string; createdAt: string | null; }
export interface TimesheetRecord { id: number; userName: string; referenceType: string; referenceId: number | null; referenceLabel: string; logDate: string; startTime: string; endTime: string; totalHours: string; notes: string; createdAt: string | null; }
export interface ProjectRef { id: number; projectName: string; }
