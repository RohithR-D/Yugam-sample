import { useCallback, useEffect, useState } from "react";
import { getSprintData } from "../services/sprintService";
import type { ProjectRef, TaskRecord, TicketRecord, TimesheetRecord } from "../types";

export function useSprint() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRef[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const data = await getSprintData();
      setTasks(data.tasks);
      setTickets(data.tickets);
      setTimesheets(data.timesheets);
      setProjects(data.projects);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { tasks, tickets, timesheets, projects, loading, fetchAll };
}
