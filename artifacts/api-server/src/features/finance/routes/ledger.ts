import { Router, type Request, type Response } from "express";
import {
  chartOfAccountsTable, insertChartOfAccountsSchema,
  journalEntriesTable, insertJournalEntrySchema,
  journalLinesTable,
  accountsPayableTable, insertAPSchema,
  accountsReceivableTable, insertARSchema,
} from "@workspace/db/schema";

const ledgerRouter = Router();

ledgerRouter.get("/ledger/coa", async (_req: Request, res: Response) => {
  const rows = await chartOfAccountsTable.find().sort({ accountCode: 1 }).lean();
  res.json(rows);
});

ledgerRouter.post("/ledger/coa", async (req: Request, res: Response) => {
  const parsed = insertChartOfAccountsSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const row = await chartOfAccountsTable.create(parsed.data);
  res.status(201).json(row.toObject());
});

ledgerRouter.delete("/ledger/coa/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const refs = await journalLinesTable.findOne({ accountId: id }).lean();
  if (refs) { res.status(400).json({ error: "Account is referenced by journal entries and cannot be deleted" }); return; }
  await chartOfAccountsTable.findOneAndDelete({ id });
  res.json({ success: true });
});

ledgerRouter.get("/ledger/journal-entries", async (_req: Request, res: Response) => {
  const entries = await journalEntriesTable.find().sort({ entryDate: -1 }).lean();
  res.json(entries);
});

ledgerRouter.get("/ledger/journal-entries/:id/lines", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const lines = await journalLinesTable.find({ journalEntryId: id }).lean();
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
  const existingAccounts = await chartOfAccountsTable.find({ id: { $in: uniqueIds } }).lean();
  const existingIdSet = new Set(existingAccounts.map((a: any) => a.id));
  const invalidIds = uniqueIds.filter(id => !existingIdSet.has(id));
  if (invalidIds.length > 0) { res.status(400).json({ error: `Account IDs not found: ${invalidIds.join(", ")}` }); return; }

  const totalDebit = lines.reduce((s: number, l: any) => s + parseFloat(l.debit || 0), 0);
  const totalCredit = lines.reduce((s: number, l: any) => s + parseFloat(l.credit || 0), 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) { res.status(400).json({ error: "Debits and credits must balance" }); return; }

  try {
    const entry = await journalEntriesTable.create({ ...parsed.data, totalDebit: totalDebit.toFixed(2), totalCredit: totalCredit.toFixed(2) });
    for (const line of lines) {
      const acctId = parseInt(line.accountId);
      const debitAmt = parseFloat(line.debit) || 0;
      const creditAmt = parseFloat(line.credit) || 0;
      await journalLinesTable.create({ journalEntryId: entry.id, accountId: acctId, accountCode: line.accountCode || "", accountName: line.accountName || "", debit: debitAmt.toFixed(2), credit: creditAmt.toFixed(2), memo: line.memo || "" });
      const netChange = debitAmt - creditAmt;
      if (Math.abs(netChange) > 0.001) {
        const acct = await chartOfAccountsTable.findOne({ id: acctId }).lean();
        const prevBalance = parseFloat(String((acct as any)?.currentBalance || 0));
        await chartOfAccountsTable.findOneAndUpdate({ id: acctId }, { $set: { currentBalance: (prevBalance + netChange).toFixed(4) } });
      }
    }
    res.status(201).json(entry.toObject());
  } catch (err: any) { res.status(500).json({ error: "Failed to create journal entry" }); }
});

ledgerRouter.delete("/ledger/journal-entries/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const lines = await journalLinesTable.find({ journalEntryId: id }).lean();
    for (const line of lines) {
      const debitAmt = parseFloat(String((line as any).debit)) || 0;
      const creditAmt = parseFloat(String((line as any).credit)) || 0;
      const reverseChange = creditAmt - debitAmt;
      if (Math.abs(reverseChange) > 0.001) {
        const acct = await chartOfAccountsTable.findOne({ id: (line as any).accountId }).lean();
        const prevBalance = parseFloat(String((acct as any)?.currentBalance || 0));
        await chartOfAccountsTable.findOneAndUpdate({ id: (line as any).accountId }, { $set: { currentBalance: (prevBalance + reverseChange).toFixed(4) } });
      }
    }
    await journalLinesTable.deleteMany({ journalEntryId: id });
    await journalEntriesTable.findOneAndDelete({ id });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: "Failed to delete journal entry" }); }
});

ledgerRouter.get("/ledger/ap", async (_req: Request, res: Response) => {
  const rows = await accountsPayableTable.find().sort({ createdAt: -1 }).lean();
  res.json(rows);
});

ledgerRouter.post("/ledger/ap", async (req: Request, res: Response) => {
  const parsed = insertAPSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const row = await accountsPayableTable.create(parsed.data);
  res.status(201).json(row.toObject());
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
  const updated = await accountsPayableTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

ledgerRouter.delete("/ledger/ap/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await accountsPayableTable.findOneAndDelete({ id });
  res.json({ success: true });
});

ledgerRouter.get("/ledger/ar", async (_req: Request, res: Response) => {
  const rows = await accountsReceivableTable.find().sort({ createdAt: -1 }).lean();
  res.json(rows);
});

ledgerRouter.post("/ledger/ar", async (req: Request, res: Response) => {
  const parsed = insertARSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const row = await accountsReceivableTable.create(parsed.data);
  res.status(201).json(row.toObject());
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
  const updated = await accountsReceivableTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

ledgerRouter.delete("/ledger/ar/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await accountsReceivableTable.findOneAndDelete({ id });
  res.json({ success: true });
});

ledgerRouter.get("/ledger/dashboard-summary", async (_req: Request, res: Response) => {
  const [coaAgg] = await chartOfAccountsTable.aggregate([
    {
      $group: {
        _id: null,
        totalAssets: { $sum: { $cond: [{ $eq: ["$accountType", "Asset"] }, { $toDouble: "$currentBalance" }, 0] } },
        totalLiabilities: { $sum: { $cond: [{ $eq: ["$accountType", "Liability"] }, { $toDouble: "$currentBalance" }, 0] } },
        totalRevenue: { $sum: { $cond: [{ $eq: ["$accountType", "Revenue"] }, { $toDouble: "$currentBalance" }, 0] } },
        totalExpense: { $sum: { $cond: [{ $eq: ["$accountType", "Expense"] }, { $toDouble: "$currentBalance" }, 0] } },
      }
    }
  ]);

  const now = new Date();
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
  const d60 = new Date(now); d60.setDate(d60.getDate() - 60);
  const d90 = new Date(now); d90.setDate(d90.getDate() - 90);

  const [arAgg] = await accountsReceivableTable.aggregate([
    { $match: { status: { $ne: "Received" } } },
    {
      $group: {
        _id: null,
        totalReceivable: { $sum: { $subtract: [{ $toDouble: "$amount" }, { $toDouble: "$receivedAmount" }] } },
        aging30: { $sum: { $cond: [{ $and: [{ $lt: ["$dueDate", d30] }, { $gte: ["$dueDate", d60] }] }, { $subtract: [{ $toDouble: "$amount" }, { $toDouble: "$receivedAmount" }] }, 0] } },
        aging60: { $sum: { $cond: [{ $and: [{ $lt: ["$dueDate", d60] }, { $gte: ["$dueDate", d90] }] }, { $subtract: [{ $toDouble: "$amount" }, { $toDouble: "$receivedAmount" }] }, 0] } },
        aging90: { $sum: { $cond: [{ $lt: ["$dueDate", d90] }, { $subtract: [{ $toDouble: "$amount" }, { $toDouble: "$receivedAmount" }] }, 0] } },
      }
    }
  ]);

  const [apAgg] = await accountsPayableTable.aggregate([
    { $match: { status: { $ne: "Paid" } } },
    {
      $group: {
        _id: null,
        totalPayable: { $sum: { $subtract: [{ $toDouble: "$amount" }, { $toDouble: "$paidAmount" }] } },
        aging30: { $sum: { $cond: [{ $and: [{ $lt: ["$dueDate", d30] }, { $gte: ["$dueDate", d60] }] }, { $subtract: [{ $toDouble: "$amount" }, { $toDouble: "$paidAmount" }] }, 0] } },
        aging60: { $sum: { $cond: [{ $and: [{ $lt: ["$dueDate", d60] }, { $gte: ["$dueDate", d90] }] }, { $subtract: [{ $toDouble: "$amount" }, { $toDouble: "$paidAmount" }] }, 0] } },
        aging90: { $sum: { $cond: [{ $lt: ["$dueDate", d90] }, { $subtract: [{ $toDouble: "$amount" }, { $toDouble: "$paidAmount" }] }, 0] } },
      }
    }
  ]);

  const totalCash = Number(coaAgg?.totalAssets || 0);
  const netIncome = Number(coaAgg?.totalRevenue || 0) - Number(coaAgg?.totalExpense || 0);

  res.json({
    totalCash,
    totalReceivables: Number(arAgg?.totalReceivable || 0),
    totalPayables: Number(apAgg?.totalPayable || 0),
    netIncome,
    arAging: { days30: Number(arAgg?.aging30 || 0), days60: Number(arAgg?.aging60 || 0), days90: Number(arAgg?.aging90 || 0) },
    apAging: { days30: Number(apAgg?.aging30 || 0), days60: Number(apAgg?.aging60 || 0), days90: Number(apAgg?.aging90 || 0) },
  });
});

ledgerRouter.get("/ledger/financial-statements", async (req: Request, res: Response) => {
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;

  const dateFilter: Record<string, any> = {};
  if (dateFrom) dateFilter.$gte = new Date(dateFrom);
  if (dateTo) dateFilter.$lte = new Date(dateTo + "T23:59:59");

  const entryQuery = Object.keys(dateFilter).length > 0 ? { entryDate: dateFilter } : {};
  const entries = await journalEntriesTable.find(entryQuery, { id: 1 }).lean();
  const entryIds = entries.map((e: any) => e.id);

  let accountBalances: Record<number, { debit: number; credit: number }> = {};

  if (entryIds.length > 0) {
    const lineSums = await journalLinesTable.aggregate([
      { $match: { journalEntryId: { $in: entryIds } } },
      { $group: { _id: "$accountId", totalDebit: { $sum: { $toDouble: "$debit" } }, totalCredit: { $sum: { $toDouble: "$credit" } } } },
    ]);
    for (const row of lineSums) {
      accountBalances[row._id] = { debit: Number(row.totalDebit), credit: Number(row.totalCredit) };
    }
  }

  const allAccounts = await chartOfAccountsTable.find().sort({ accountCode: 1 }).lean();
  const hasDateFilter = dateFrom || dateTo;
  const accountsWithBalances = allAccounts.map((a: any) => {
    const journalData = accountBalances[a.id] || { debit: 0, credit: 0 };
    const periodBalance = hasDateFilter ? (journalData.debit - journalData.credit) : parseFloat(a.currentBalance);
    return { ...a, periodBalance, periodDebit: journalData.debit, periodCredit: journalData.credit };
  });

  res.json(accountsWithBalances);
});

export default ledgerRouter;
