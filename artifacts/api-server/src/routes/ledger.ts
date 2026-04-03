import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  chartOfAccountsTable, insertChartOfAccountsSchema,
  journalEntriesTable, insertJournalEntrySchema,
  journalLinesTable,
  accountsPayableTable, insertAPSchema,
  accountsReceivableTable, insertARSchema,
} from "@workspace/db/schema";
import { eq, desc, sql, and, gte, lte, inArray } from "drizzle-orm";

const ledgerRouter = Router();

ledgerRouter.get("/ledger/coa", async (_req: Request, res: Response) => {
  const rows = await db.select().from(chartOfAccountsTable).orderBy(chartOfAccountsTable.accountCode);
  res.json(rows);
});

ledgerRouter.post("/ledger/coa", async (req: Request, res: Response) => {
  const parsed = insertChartOfAccountsSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(chartOfAccountsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

ledgerRouter.delete("/ledger/coa/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const refs = await db.select({ id: journalLinesTable.id }).from(journalLinesTable).where(eq(journalLinesTable.accountId, id)).limit(1);
  if (refs.length > 0) { res.status(400).json({ error: "Account is referenced by journal entries and cannot be deleted" }); return; }
  await db.delete(chartOfAccountsTable).where(eq(chartOfAccountsTable.id, id));
  res.json({ success: true });
});

ledgerRouter.get("/ledger/journal-entries", async (_req: Request, res: Response) => {
  const entries = await db.select().from(journalEntriesTable).orderBy(desc(journalEntriesTable.entryDate));
  res.json(entries);
});

ledgerRouter.get("/ledger/journal-entries/:id/lines", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const lines = await db.select().from(journalLinesTable).where(eq(journalLinesTable.journalEntryId, id));
  res.json(lines);
});

ledgerRouter.post("/ledger/journal-entries", async (req: Request, res: Response) => {
  const { lines, ...entryData } = req.body;
  const parsed = insertJournalEntrySchema.safeParse(entryData);
  if (!parsed.success) { res.status(400).json({ error: "Invalid entry", details: parsed.error.issues }); return; }
  if (!Array.isArray(lines) || lines.length === 0) { res.status(400).json({ error: "At least one journal line required" }); return; }

  const accountIds = lines.map((l: any) => parseInt(l.accountId)).filter((id: number) => !isNaN(id) && id > 0);
  if (accountIds.length !== lines.length) { res.status(400).json({ error: "All lines must reference valid account IDs" }); return; }
  const uniqueIds = [...new Set(accountIds)];
  const existingAccounts = await db.select({ id: chartOfAccountsTable.id }).from(chartOfAccountsTable).where(inArray(chartOfAccountsTable.id, uniqueIds));
  const existingIdSet = new Set(existingAccounts.map(a => a.id));
  const invalidIds = uniqueIds.filter(id => !existingIdSet.has(id));
  if (invalidIds.length > 0) { res.status(400).json({ error: `Account IDs not found: ${invalidIds.join(", ")}` }); return; }

  const totalDebit = lines.reduce((s: number, l: any) => s + parseFloat(l.debit || 0), 0);
  const totalCredit = lines.reduce((s: number, l: any) => s + parseFloat(l.credit || 0), 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) { res.status(400).json({ error: "Debits and credits must balance" }); return; }

  try {
    const result = await db.transaction(async (tx) => {
      const [entry] = await tx.insert(journalEntriesTable).values({ ...parsed.data, totalDebit: totalDebit.toFixed(2), totalCredit: totalCredit.toFixed(2) }).returning();
      for (const line of lines) {
        const acctId = parseInt(line.accountId);
        const debitAmt = parseFloat(line.debit) || 0;
        const creditAmt = parseFloat(line.credit) || 0;
        await tx.insert(journalLinesTable).values({ journalEntryId: entry.id, accountId: acctId, accountCode: line.accountCode || "", accountName: line.accountName || "", debit: debitAmt.toFixed(2), credit: creditAmt.toFixed(2), memo: line.memo || "" });
        const netChange = debitAmt - creditAmt;
        if (Math.abs(netChange) > 0.001) {
          await tx.update(chartOfAccountsTable).set({ currentBalance: sql`(${chartOfAccountsTable.currentBalance}::numeric + ${netChange})::text` }).where(eq(chartOfAccountsTable.id, acctId));
        }
      }
      return entry;
    });
    res.status(201).json(result);
  } catch (err: any) { res.status(500).json({ error: "Failed to create journal entry" }); }
});

ledgerRouter.delete("/ledger/journal-entries/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.transaction(async (tx) => {
      const lines = await tx.select().from(journalLinesTable).where(eq(journalLinesTable.journalEntryId, id));
      for (const line of lines) {
        const debitAmt = parseFloat(line.debit) || 0;
        const creditAmt = parseFloat(line.credit) || 0;
        const reverseChange = creditAmt - debitAmt;
        if (Math.abs(reverseChange) > 0.001) {
          await tx.update(chartOfAccountsTable).set({ currentBalance: sql`(${chartOfAccountsTable.currentBalance}::numeric + ${reverseChange})::text` }).where(eq(chartOfAccountsTable.id, line.accountId));
        }
      }
      await tx.delete(journalLinesTable).where(eq(journalLinesTable.journalEntryId, id));
      await tx.delete(journalEntriesTable).where(eq(journalEntriesTable.id, id));
    });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: "Failed to delete journal entry" }); }
});

ledgerRouter.get("/ledger/ap", async (_req: Request, res: Response) => {
  const rows = await db.select().from(accountsPayableTable).orderBy(desc(accountsPayableTable.createdAt));
  res.json(rows);
});

ledgerRouter.post("/ledger/ap", async (req: Request, res: Response) => {
  const parsed = insertAPSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(accountsPayableTable).values(parsed.data).returning();
  res.status(201).json(row);
});

ledgerRouter.patch("/ledger/ap/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const validStatuses = ["Pending", "Partial", "Paid", "Overdue"];
  if (req.body.status !== undefined && !validStatuses.includes(req.body.status)) { res.status(400).json({ error: "Invalid status" }); return; }
  const updates: Record<string, any> = {};
  if (req.body.paidAmount !== undefined) updates.paidAmount = req.body.paidAmount;
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No valid fields" }); return; }
  const [updated] = await db.update(accountsPayableTable).set(updates).where(eq(accountsPayableTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

ledgerRouter.delete("/ledger/ap/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(accountsPayableTable).where(eq(accountsPayableTable.id, id));
  res.json({ success: true });
});

ledgerRouter.get("/ledger/ar", async (_req: Request, res: Response) => {
  const rows = await db.select().from(accountsReceivableTable).orderBy(desc(accountsReceivableTable.createdAt));
  res.json(rows);
});

ledgerRouter.post("/ledger/ar", async (req: Request, res: Response) => {
  const parsed = insertARSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [row] = await db.insert(accountsReceivableTable).values(parsed.data).returning();
  res.status(201).json(row);
});

ledgerRouter.patch("/ledger/ar/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const validStatuses = ["Pending", "Partial", "Received", "Overdue"];
  if (req.body.status !== undefined && !validStatuses.includes(req.body.status)) { res.status(400).json({ error: "Invalid status" }); return; }
  const updates: Record<string, any> = {};
  if (req.body.receivedAmount !== undefined) updates.receivedAmount = req.body.receivedAmount;
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No valid fields" }); return; }
  const [updated] = await db.update(accountsReceivableTable).set(updates).where(eq(accountsReceivableTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

ledgerRouter.delete("/ledger/ar/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(accountsReceivableTable).where(eq(accountsReceivableTable.id, id));
  res.json({ success: true });
});

ledgerRouter.get("/ledger/dashboard-summary", async (_req: Request, res: Response) => {
  const [coaSummary] = await db.select({
    totalAssets: sql<number>`coalesce(sum(case when ${chartOfAccountsTable.accountType} = 'Asset' then ${chartOfAccountsTable.currentBalance}::numeric else 0 end), 0)`,
    totalLiabilities: sql<number>`coalesce(sum(case when ${chartOfAccountsTable.accountType} = 'Liability' then ${chartOfAccountsTable.currentBalance}::numeric else 0 end), 0)`,
    totalRevenue: sql<number>`coalesce(sum(case when ${chartOfAccountsTable.accountType} = 'Revenue' then ${chartOfAccountsTable.currentBalance}::numeric else 0 end), 0)`,
    totalExpense: sql<number>`coalesce(sum(case when ${chartOfAccountsTable.accountType} = 'Expense' then ${chartOfAccountsTable.currentBalance}::numeric else 0 end), 0)`,
  }).from(chartOfAccountsTable);

  const [arSummary] = await db.select({
    totalReceivable: sql<number>`coalesce(sum(${accountsReceivableTable.amount}::numeric - ${accountsReceivableTable.receivedAmount}::numeric), 0)`,
    aging30: sql<number>`coalesce(sum(case when ${accountsReceivableTable.dueDate} < now() - interval '30 days' and ${accountsReceivableTable.dueDate} >= now() - interval '60 days' then ${accountsReceivableTable.amount}::numeric - ${accountsReceivableTable.receivedAmount}::numeric else 0 end), 0)`,
    aging60: sql<number>`coalesce(sum(case when ${accountsReceivableTable.dueDate} < now() - interval '60 days' and ${accountsReceivableTable.dueDate} >= now() - interval '90 days' then ${accountsReceivableTable.amount}::numeric - ${accountsReceivableTable.receivedAmount}::numeric else 0 end), 0)`,
    aging90: sql<number>`coalesce(sum(case when ${accountsReceivableTable.dueDate} < now() - interval '90 days' then ${accountsReceivableTable.amount}::numeric - ${accountsReceivableTable.receivedAmount}::numeric else 0 end), 0)`,
  }).from(accountsReceivableTable).where(sql`${accountsReceivableTable.status} != 'Received'`);

  const [apSummary] = await db.select({
    totalPayable: sql<number>`coalesce(sum(${accountsPayableTable.amount}::numeric - ${accountsPayableTable.paidAmount}::numeric), 0)`,
    aging30: sql<number>`coalesce(sum(case when ${accountsPayableTable.dueDate} < now() - interval '30 days' and ${accountsPayableTable.dueDate} >= now() - interval '60 days' then ${accountsPayableTable.amount}::numeric - ${accountsPayableTable.paidAmount}::numeric else 0 end), 0)`,
    aging60: sql<number>`coalesce(sum(case when ${accountsPayableTable.dueDate} < now() - interval '60 days' and ${accountsPayableTable.dueDate} >= now() - interval '90 days' then ${accountsPayableTable.amount}::numeric - ${accountsPayableTable.paidAmount}::numeric else 0 end), 0)`,
    aging90: sql<number>`coalesce(sum(case when ${accountsPayableTable.dueDate} < now() - interval '90 days' then ${accountsPayableTable.amount}::numeric - ${accountsPayableTable.paidAmount}::numeric else 0 end), 0)`,
  }).from(accountsPayableTable).where(sql`${accountsPayableTable.status} != 'Paid'`);

  const totalCash = Number(coaSummary.totalAssets);
  const netIncome = Number(coaSummary.totalRevenue) - Number(coaSummary.totalExpense);

  res.json({
    totalCash,
    totalReceivables: Number(arSummary.totalReceivable),
    totalPayables: Number(apSummary.totalPayable),
    netIncome,
    arAging: { days30: Number(arSummary.aging30), days60: Number(arSummary.aging60), days90: Number(arSummary.aging90) },
    apAging: { days30: Number(apSummary.aging30), days60: Number(apSummary.aging60), days90: Number(apSummary.aging90) },
  });
});

ledgerRouter.get("/ledger/financial-statements", async (req: Request, res: Response) => {
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;

  const conditions = [];
  if (dateFrom) conditions.push(gte(journalEntriesTable.entryDate, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(journalEntriesTable.entryDate, new Date(dateTo + "T23:59:59")));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const entries = whereClause
    ? await db.select({ id: journalEntriesTable.id }).from(journalEntriesTable).where(whereClause)
    : await db.select({ id: journalEntriesTable.id }).from(journalEntriesTable);

  const entryIds = entries.map(e => e.id);

  let accountBalances: Record<number, { debit: number; credit: number }> = {};

  if (entryIds.length > 0) {
    const lineSums = await db.select({
      accountId: journalLinesTable.accountId,
      totalDebit: sql<number>`coalesce(sum(${journalLinesTable.debit}::numeric), 0)`,
      totalCredit: sql<number>`coalesce(sum(${journalLinesTable.credit}::numeric), 0)`,
    }).from(journalLinesTable).where(inArray(journalLinesTable.journalEntryId, entryIds)).groupBy(journalLinesTable.accountId);

    for (const row of lineSums) {
      accountBalances[row.accountId] = { debit: Number(row.totalDebit), credit: Number(row.totalCredit) };
    }
  }

  const allAccounts = await db.select().from(chartOfAccountsTable).orderBy(chartOfAccountsTable.accountCode);

  const hasDateFilter = dateFrom || dateTo;
  const accountsWithBalances = allAccounts.map(a => {
    const journalData = accountBalances[a.id] || { debit: 0, credit: 0 };
    const periodBalance = hasDateFilter ? (journalData.debit - journalData.credit) : parseFloat(a.currentBalance);
    return { ...a, periodBalance, periodDebit: journalData.debit, periodCredit: journalData.credit };
  });

  res.json(accountsWithBalances);
});

export default ledgerRouter;
