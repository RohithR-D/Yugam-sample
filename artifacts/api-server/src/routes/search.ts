import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  clientsTable,
  employeesTable,
  projectsTable,
  tasksTable,
  salesInvoicesTable,
  contractsTable,
  transactionsTable,
} from "@workspace/db/schema";
import { ilike, or } from "drizzle-orm";

const searchRouter = Router();

searchRouter.get("/search", async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || "").trim();
    if (!q || q.length < 2) {
      res.json([]);
      return;
    }

    const pattern = `%${q}%`;

    const [clients, employees, projects, tasks, invoices, contracts, transactions] = await Promise.all([
      db.select({ id: clientsTable.id, companyName: clientsTable.companyName, contactName: clientsTable.contactName })
        .from(clientsTable).where(or(ilike(clientsTable.companyName, pattern), ilike(clientsTable.contactName, pattern))).limit(5),
      db.select({ id: employeesTable.id, name: employeesTable.name, designation: employeesTable.designation })
        .from(employeesTable).where(ilike(employeesTable.name, pattern)).limit(5),
      db.select({ id: projectsTable.id, name: projectsTable.projectName, status: projectsTable.status })
        .from(projectsTable).where(ilike(projectsTable.projectName, pattern)).limit(5),
      db.select({ id: tasksTable.id, title: tasksTable.title, status: tasksTable.status })
        .from(tasksTable).where(ilike(tasksTable.title, pattern)).limit(5),
      db.select({ id: salesInvoicesTable.id, invoiceNumber: salesInvoicesTable.invoiceNumber, clientName: salesInvoicesTable.clientName })
        .from(salesInvoicesTable).where(or(ilike(salesInvoicesTable.invoiceNumber, pattern), ilike(salesInvoicesTable.clientName, pattern))).limit(5),
      db.select({ id: contractsTable.id, title: contractsTable.title, partyName: contractsTable.partyName })
        .from(contractsTable).where(or(ilike(contractsTable.title, pattern), ilike(contractsTable.partyName, pattern))).limit(5),
      db.select({ id: transactionsTable.id, description: transactionsTable.description, category: transactionsTable.category })
        .from(transactionsTable).where(ilike(transactionsTable.description, pattern)).limit(5),
    ]);

    const results = [
      ...clients.map((c) => ({ type: "Client", text: c.companyName, subtitle: c.contactName, module: "Orbit" })),
      ...employees.map((e) => ({ type: "Employee", text: e.name, subtitle: e.designation, module: "Crew" })),
      ...projects.map((p) => ({ type: "Project", text: p.name, subtitle: p.status, module: "Flow" })),
      ...tasks.map((t) => ({ type: "Task", text: t.title, subtitle: t.status, module: "Sprint & Solve" })),
      ...invoices.map((i) => ({ type: "Invoice", text: i.invoiceNumber, subtitle: i.clientName, module: "Billr" })),
      ...contracts.map((c) => ({ type: "Contract", text: c.title, subtitle: c.partyName, module: "Contracta" })),
      ...transactions.map((t) => ({ type: "Transaction", text: t.description, subtitle: t.category, module: "Ledger" })),
    ];

    res.json(results.slice(0, 20));
  } catch (err: any) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

export default searchRouter;
