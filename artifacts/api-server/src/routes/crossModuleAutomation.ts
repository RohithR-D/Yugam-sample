import {
  fleetExpensesTable,
  trailClaimsTable,
  journalEntriesTable,
  journalLinesTable,
  chartOfAccountsTable,
  payrollTable,
} from "@workspace/db/schema";
import { eq, sql, and, isNull } from "drizzle-orm";

const COA = {
  TRANSPORT_EXPENSE: "5300",
  SALARY_EXPENSE: "5100",
  TDS_PAYABLE: "2300",
  PF_PAYABLE: "2310",
  ESI_PAYABLE: "2320",
  SALARY_PAYABLE: "2400",
  EMPLOYEE_REIMB_PAYABLE: "2500",
};

async function getAccount(tx: any, code: string) {
  const [acct] = await tx.select().from(chartOfAccountsTable)
    .where(eq(chartOfAccountsTable.accountCode, code));
  return acct;
}

async function updateBalance(tx: any, accountId: number, delta: number) {
  await tx.update(chartOfAccountsTable).set({
    currentBalance: sql`${chartOfAccountsTable.currentBalance} + ${delta}`,
  }).where(eq(chartOfAccountsTable.id, accountId));
}

export async function onFleetExpenseCreated(expenseId: number, tx: any) {
  const lockRows = await tx.execute(
    sql`SELECT * FROM fleet_expenses WHERE id = ${expenseId} FOR UPDATE`
  );
  const expense = (lockRows as any).rows?.[0] || (lockRows as any)[0];
  if (!expense) throw new Error("Fleet expense not found");
  if (expense.paid_by !== "Employee") return { claimCreated: false };
  if (expense.is_claimed) return { claimCreated: false, reason: "already claimed" };

  const countRows = await tx.select({ count: sql<number>`count(*)::int` }).from(trailClaimsTable);
  const claimId = `CLM-${String((countRows[0].count || 0) + 1).padStart(4, "0")}`;

  const expenseDate = expense.expense_date instanceof Date
    ? expense.expense_date
    : new Date(expense.expense_date);

  const [claim] = await tx.insert(trailClaimsTable).values({
    claimId,
    employeeName: expense.logged_by || "Unknown",
    date: expenseDate,
    category: "Transport" as any,
    claimType: "Standard Receipt",
    amount: expense.amount,
    status: "Pending",
    description: `Fleet expense: ${expense.expense_type} - ${expense.vehicle_reg} - ${expense.description || ""}`,
  }).returning();

  await tx.update(fleetExpensesTable).set({
    isClaimed: true,
    trailClaimId: claim.id,
    reimbursementStatus: "Pending",
  }).where(eq(fleetExpensesTable.id, expenseId));

  console.log(`[AUTO:FLEET→TRAIL] Expense #${expenseId}: auto-created claim ${claimId}`);
  return { claimCreated: true, claimId: claim.claimId, trailClaimDbId: claim.id };
}

export async function onTrailClaimApproved(claimId: number, tx: any) {
  const [claim] = await tx.select().from(trailClaimsTable).where(eq(trailClaimsTable.id, claimId));
  if (!claim) return { journalCreated: false };
  if (claim.ledgerJournalId) return { journalCreated: false, reason: "already has journal entry" };

  const amount = parseFloat(claim.amount);
  if (amount <= 0) return { journalCreated: false, reason: "zero amount" };

  const categoryToCode: Record<string, string> = {
    Transport: COA.TRANSPORT_EXPENSE,
    Fuel: COA.TRANSPORT_EXPENSE,
    Travel: COA.TRANSPORT_EXPENSE,
    Meals: COA.TRANSPORT_EXPENSE,
    Misc: COA.TRANSPORT_EXPENSE,
  };
  const expenseCode = categoryToCode[claim.category] || COA.TRANSPORT_EXPENSE;
  let expenseAcct: any = await getAccount(tx, expenseCode);

  if (!expenseAcct) {
    const expenseAccounts = await tx.select().from(chartOfAccountsTable)
      .where(eq(chartOfAccountsTable.accountType, "Expense"));
    expenseAcct = expenseAccounts[0];
  }

  const payableAcct = await getAccount(tx, COA.EMPLOYEE_REIMB_PAYABLE);
  if (!expenseAcct) throw new Error("Missing COA expense account for claim JE");
  if (!payableAcct) throw new Error("Missing COA account: Employee Reimbursement Payable (2500)");

  const [entry] = await tx.insert(journalEntriesTable).values({
    entryDate: new Date(),
    reference: claim.claimId,
    description: `Expense claim approved: ${claim.description || claim.category} - ${claim.employeeName}`,
    totalDebit: amount.toFixed(2),
    totalCredit: amount.toFixed(2),
    status: "Posted",
  }).returning();

  await tx.insert(journalLinesTable).values({
    journalEntryId: entry.id,
    accountId: expenseAcct.id,
    accountCode: expenseAcct.accountCode,
    accountName: expenseAcct.accountName,
    debit: amount.toFixed(2),
    credit: "0",
    memo: `${claim.category} expense - ${claim.employeeName}`,
  });

  await tx.insert(journalLinesTable).values({
    journalEntryId: entry.id,
    accountId: payableAcct.id,
    accountCode: payableAcct.accountCode,
    accountName: payableAcct.accountName,
    debit: "0",
    credit: amount.toFixed(2),
    memo: `Employee Reimbursement Payable - ${claim.employeeName}`,
  });

  await updateBalance(tx, expenseAcct.id, amount);
  await updateBalance(tx, payableAcct.id, -amount);

  await tx.update(trailClaimsTable).set({
    ledgerJournalId: entry.id,
  }).where(eq(trailClaimsTable.id, claimId));

  const linkedExpenses = await tx.select().from(fleetExpensesTable)
    .where(eq(fleetExpensesTable.trailClaimId, claimId));
  for (const fe of linkedExpenses) {
    await tx.update(fleetExpensesTable).set({
      reimbursementStatus: "Reimbursed",
    }).where(eq(fleetExpensesTable.id, fe.id));
  }

  console.log(`[AUTO:TRAIL→LEDGER] Claim ${claim.claimId}: JE #${entry.id} created, ${linkedExpenses.length} fleet expense(s) marked reimbursed`);
  return { journalCreated: true, journalEntryId: entry.id, linkedFleetExpenses: linkedExpenses.length };
}

export async function onPayrollStatusChange(payrollId: number, newStatus: string, tx: any) {
  if (newStatus !== "Processed" && newStatus !== "Paid") return { journalCreated: false };

  const lockRows = await tx.execute(
    sql`SELECT * FROM payroll WHERE id = ${payrollId} FOR UPDATE`
  );
  const record = (lockRows as any).rows?.[0] || (lockRows as any)[0];
  if (!record) throw new Error("Payroll record not found");
  if (record.journal_entry_id) return { journalCreated: false, reason: "already has journal entry" };

  const grossPay = parseFloat(record.gross_pay || "0");
  const deductions = parseFloat(record.deductions || "0");
  const netPay = parseFloat(record.net_pay || "0");

  if (grossPay <= 0) return { journalCreated: false, reason: "zero gross pay" };

  const tdsAmount = Math.round(deductions * 0.4 * 100) / 100;
  const pfAmount = Math.round(deductions * 0.4 * 100) / 100;
  const esiAmount = Math.round((deductions - tdsAmount - pfAmount) * 100) / 100;

  const salaryExpenseAcct = await getAccount(tx, COA.SALARY_EXPENSE);
  const tdsPayableAcct = await getAccount(tx, COA.TDS_PAYABLE);
  const pfPayableAcct = await getAccount(tx, COA.PF_PAYABLE);
  const esiPayableAcct = await getAccount(tx, COA.ESI_PAYABLE);
  const salaryPayableAcct = await getAccount(tx, COA.SALARY_PAYABLE);

  if (!salaryExpenseAcct || !salaryPayableAcct) {
    throw new Error("Missing required COA accounts for payroll JE (Salary Expense 5100 or Salary Payable 2400)");
  }

  let totalCredits = netPay;
  if (tdsAmount > 0 && !tdsPayableAcct) throw new Error("Missing COA account: TDS Payable (2300)");
  if (pfAmount > 0 && !pfPayableAcct) throw new Error("Missing COA account: PF Payable (2310)");
  if (esiAmount > 0 && !esiPayableAcct) throw new Error("Missing COA account: ESI Payable (2320)");
  totalCredits += tdsAmount + pfAmount + esiAmount;

  if (Math.abs(grossPay - totalCredits) > 0.01) {
    throw new Error(`JE imbalance: debits=${grossPay}, credits=${totalCredits}`);
  }

  const [entry] = await tx.insert(journalEntriesTable).values({
    entryDate: new Date(),
    reference: `PAY-${record.pay_period}-${record.id}`,
    description: `Payroll ${newStatus}: ${record.employee_name} - ${record.pay_period}`,
    totalDebit: grossPay.toFixed(2),
    totalCredit: grossPay.toFixed(2),
    status: "Posted",
  }).returning();

  await tx.insert(journalLinesTable).values({
    journalEntryId: entry.id,
    accountId: salaryExpenseAcct.id,
    accountCode: salaryExpenseAcct.accountCode,
    accountName: salaryExpenseAcct.accountName,
    debit: grossPay.toFixed(2),
    credit: "0",
    memo: `Salary - ${record.employee_name}`,
  });
  await updateBalance(tx, salaryExpenseAcct.id, grossPay);

  if (tdsAmount > 0) {
    await tx.insert(journalLinesTable).values({
      journalEntryId: entry.id,
      accountId: tdsPayableAcct!.id,
      accountCode: tdsPayableAcct!.accountCode,
      accountName: tdsPayableAcct!.accountName,
      debit: "0",
      credit: tdsAmount.toFixed(2),
      memo: `TDS deduction - ${record.employee_name}`,
    });
    await updateBalance(tx, tdsPayableAcct!.id, -tdsAmount);
  }

  if (pfAmount > 0) {
    await tx.insert(journalLinesTable).values({
      journalEntryId: entry.id,
      accountId: pfPayableAcct!.id,
      accountCode: pfPayableAcct!.accountCode,
      accountName: pfPayableAcct!.accountName,
      debit: "0",
      credit: pfAmount.toFixed(2),
      memo: `PF deduction - ${record.employee_name}`,
    });
    await updateBalance(tx, pfPayableAcct!.id, -pfAmount);
  }

  if (esiAmount > 0) {
    await tx.insert(journalLinesTable).values({
      journalEntryId: entry.id,
      accountId: esiPayableAcct!.id,
      accountCode: esiPayableAcct!.accountCode,
      accountName: esiPayableAcct!.accountName,
      debit: "0",
      credit: esiAmount.toFixed(2),
      memo: `ESI deduction - ${record.employee_name}`,
    });
    await updateBalance(tx, esiPayableAcct!.id, -esiAmount);
  }

  await tx.insert(journalLinesTable).values({
    journalEntryId: entry.id,
    accountId: salaryPayableAcct.id,
    accountCode: salaryPayableAcct.accountCode,
    accountName: salaryPayableAcct.accountName,
    debit: "0",
    credit: netPay.toFixed(2),
    memo: `Net salary payable - ${record.employee_name}`,
  });
  await updateBalance(tx, salaryPayableAcct.id, -netPay);

  await tx.update(payrollTable).set({
    journalEntryId: entry.id,
  }).where(eq(payrollTable.id, payrollId));

  console.log(`[AUTO:PAYROLL→LEDGER] Payroll #${payrollId}: JE #${entry.id} created (gross=${grossPay}, net=${netPay})`);
  return { journalCreated: true, journalEntryId: entry.id };
}
