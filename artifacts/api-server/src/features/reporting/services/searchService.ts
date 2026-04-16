import {
  clientsTable,
  contractsTable,
  employeesTable,
  projectsTable,
  salesInvoicesTable,
  tasksTable,
  transactionsTable,
} from "@workspace/db/schema";

export const searchAcrossModules = async (query: string) => {
  const q = query.trim();
  if (!q || q.length < 2) return [];
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const [clients, employees, projects, tasks, invoices, contracts, transactions] = await Promise.all([
    clientsTable.find({ $or: [{ companyName: regex }, { contactName: regex }] }).select({ id: 1, companyName: 1, contactName: 1 }).limit(5).lean(),
    employeesTable.find({ name: regex }).select({ id: 1, name: 1, designation: 1 }).limit(5).lean(),
    projectsTable.find({ projectName: regex }).select({ id: 1, projectName: 1, status: 1 }).limit(5).lean(),
    tasksTable.find({ title: regex }).select({ id: 1, title: 1, status: 1 }).limit(5).lean(),
    salesInvoicesTable.find({ $or: [{ invoiceNumber: regex }, { clientName: regex }] }).select({ id: 1, invoiceNumber: 1, clientName: 1 }).limit(5).lean(),
    contractsTable.find({ $or: [{ title: regex }, { partyName: regex }] }).select({ id: 1, title: 1, partyName: 1 }).limit(5).lean(),
    transactionsTable.find({ description: regex }).select({ id: 1, description: 1, category: 1 }).limit(5).lean(),
  ]);

  const results = [
    ...clients.map((c: any) => ({ type: "Client", text: c.companyName, subtitle: c.contactName, module: "Orbit" })),
    ...employees.map((e: any) => ({ type: "Employee", text: e.name, subtitle: e.designation, module: "Crew" })),
    ...projects.map((p: any) => ({ type: "Project", text: p.projectName, subtitle: p.status, module: "Flow" })),
    ...tasks.map((t: any) => ({ type: "Task", text: t.title, subtitle: t.status, module: "Sprint & Solve" })),
    ...invoices.map((i: any) => ({ type: "Invoice", text: i.invoiceNumber, subtitle: i.clientName, module: "Billr" })),
    ...contracts.map((c: any) => ({ type: "Contract", text: c.title, subtitle: c.partyName, module: "Contracta" })),
    ...transactions.map((t: any) => ({ type: "Transaction", text: t.description, subtitle: t.category, module: "Ledger" })),
  ];

  return results.slice(0, 20);
};
