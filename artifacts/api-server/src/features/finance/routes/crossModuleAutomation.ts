import {
  fleetExpensesTable,
  trailClaimsTable,
  journalEntriesTable,
  journalLinesTable,
  chartOfAccountsTable,
  payrollTable,
} from "@workspace/db/schema";

const COA = {
  TRANSPORT_EXPENSE: "5300",
  SALARY_EXPENSE: "5100",
  TDS_PAYABLE: "2300",
  PF_PAYABLE: "2310",
  ESI_PAYABLE: "2320",
  SALARY_PAYABLE: "2400",
  EMPLOYEE_REIMB_PAYABLE: "2500",
};

async function getAccount(code: string) {
  return chartOfAccountsTable.findOne({ accountCode: code }).lean();
}

async function updateBalance(accountId: number, delta: number) {
  await chartOfAccountsTable.findOneAndUpdate(
    { id: accountId },
    { $inc: { currentBalance: delta } }
  );
}

export async function onFleetExpenseCreated(expenseId: number) {
  const expense = await fleetExpensesTable.findOne({ id: expenseId }).lean();
  if (!expense) throw new Error("Fleet expense not found");
  if (expense.paidBy !== "Employee") return { claimCreated: false };
  if (expense.isClaimed) return { claimCreated: false, reason: "already claimed" };

  const count = await trailClaimsTable.countDocuments();
  const claimId = `CLM-${String(count + 1).padStart(4, "0")}`;

  const expenseDate = expense.expenseDate instanceof Date
    ? expense.expenseDate
    : new Date(expense.expenseDate);

  const claim = await trailClaimsTable.create({
    claimId,
    employeeName: expense.loggedBy || "Unknown",
    date: expenseDate,
    category: "Transport",
    claimType: "Standard Receipt",
    amount: expense.amount,
    status: "Pending",
    description: `Fleet expense: ${expense.expenseType} - ${expense.vehicleReg} - ${expense.description || ""}`,
  });

  await fleetExpensesTable.findOneAndUpdate(
    { id: expenseId },
    { $set: { isClaimed: true, trailClaimId: claim.id, reimbursementStatus: "Pending" } }
  );

  console.log(`[AUTO:FLEET->TRAIL] Expense #${expenseId}: auto-created claim ${claimId}`);
  return { claimCreated: true, claimId: claim.claimId, trailClaimDbId: claim.id };
}

export async function onTrailClaimApproved(claimId: number) {
  const claim = await trailClaimsTable.findOne({ id: claimId }).lean();
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
  let expenseAcct: any = await getAccount(expenseCode);

  if (!expenseAcct) {
    expenseAcct = await chartOfAccountsTable.findOne({ accountType: "Expense" }).lean();
  }

  const payableAcct = await getAccount(COA.EMPLOYEE_REIMB_PAYABLE);
  if (!expenseAcct) throw new Error("Missing COA expense account for claim JE");
  if (!payableAcct) throw new Error("Missing COA account: Employee Reimbursement Payable (2500)");

  const entry = await journalEntriesTable.create({
    entryDate: new Date(),
    reference: claim.claimId,
    description: `Expense claim approved: ${claim.description || claim.category} - ${claim.employeeName}`,
    totalDebit: amount.toFixed(2),
    totalCredit: amount.toFixed(2),
    status: "Posted",
  });

  await journalLinesTable.insertMany([
    {
      journalEntryId: entry.id,
      accountId: expenseAcct.id,
      accountCode: expenseAcct.accountCode,
      accountName: expenseAcct.accountName,
      debit: amount.toFixed(2),
      credit: "0",
      memo: `${claim.category} expense - ${claim.employeeName}`,
    },
    {
      journalEntryId: entry.id,
      accountId: payableAcct.id,
      accountCode: payableAcct.accountCode,
      accountName: payableAcct.accountName,
      debit: "0",
      credit: amount.toFixed(2),
      memo: `Employee Reimbursement Payable - ${claim.employeeName}`,
    },
  ]);

  await updateBalance(expenseAcct.id, amount);
  await updateBalance(payableAcct.id, -amount);

  await trailClaimsTable.findOneAndUpdate({ id: claimId }, { $set: { ledgerJournalId: entry.id } });

  const linkedExpenses = await fleetExpensesTable.find({ trailClaimId: claimId }).lean();
  for (const fe of linkedExpenses) {
    await fleetExpensesTable.findOneAndUpdate({ id: fe.id }, { $set: { reimbursementStatus: "Reimbursed" } });
  }

  console.log(`[AUTO:TRAIL->LEDGER] Claim ${claim.claimId}: JE #${entry.id} created, ${linkedExpenses.length} fleet expense(s) marked reimbursed`);
  return { journalCreated: true, journalEntryId: entry.id, linkedFleetExpenses: linkedExpenses.length };
}

export async function onPayrollStatusChange(payrollId: number, newStatus: string) {
  if (newStatus !== "Processed" && newStatus !== "Paid") return { journalCreated: false };

  const record = await payrollTable.findOne({ id: payrollId }).lean();
  if (!record) throw new Error("Payroll record not found");
  if (record.journalEntryId) return { journalCreated: false, reason: "already has journal entry" };

  const grossPay = parseFloat((record as any).grossPay || "0");
  const deductions = parseFloat((record as any).deductions || "0");
  const netPay = parseFloat((record as any).netPay || "0");

  if (grossPay <= 0) return { journalCreated: false, reason: "zero gross pay" };

  const tdsAmount = Math.round(deductions * 0.4 * 100) / 100;
  const pfAmount = Math.round(deductions * 0.4 * 100) / 100;
  const esiAmount = Math.round((deductions - tdsAmount - pfAmount) * 100) / 100;

  const [salaryExpenseAcct, tdsPayableAcct, pfPayableAcct, esiPayableAcct, salaryPayableAcct] = await Promise.all([
    getAccount(COA.SALARY_EXPENSE),
    getAccount(COA.TDS_PAYABLE),
    getAccount(COA.PF_PAYABLE),
    getAccount(COA.ESI_PAYABLE),
    getAccount(COA.SALARY_PAYABLE),
  ]);

  if (!salaryExpenseAcct || !salaryPayableAcct) {
    throw new Error("Missing required COA accounts for payroll JE (Salary Expense 5100 or Salary Payable 2400)");
  }
  if (tdsAmount > 0 && !tdsPayableAcct) throw new Error("Missing COA account: TDS Payable (2300)");
  if (pfAmount > 0 && !pfPayableAcct) throw new Error("Missing COA account: PF Payable (2310)");
  if (esiAmount > 0 && !esiPayableAcct) throw new Error("Missing COA account: ESI Payable (2320)");

  const totalCredits = netPay + tdsAmount + pfAmount + esiAmount;
  if (Math.abs(grossPay - totalCredits) > 0.01) {
    throw new Error(`JE imbalance: debits=${grossPay}, credits=${totalCredits}`);
  }

  const entry = await journalEntriesTable.create({
    entryDate: new Date(),
    reference: `PAY-${(record as any).payPeriod}-${record.id}`,
    description: `Payroll ${newStatus}: ${(record as any).employeeName} - ${(record as any).payPeriod}`,
    totalDebit: grossPay.toFixed(2),
    totalCredit: grossPay.toFixed(2),
    status: "Posted",
  });

  const lines: any[] = [
    {
      journalEntryId: entry.id,
      accountId: salaryExpenseAcct.id,
      accountCode: salaryExpenseAcct.accountCode,
      accountName: salaryExpenseAcct.accountName,
      debit: grossPay.toFixed(2),
      credit: "0",
      memo: `Salary - ${(record as any).employeeName}`,
    },
  ];
  await updateBalance(salaryExpenseAcct.id, grossPay);

  if (tdsAmount > 0) {
    lines.push({ journalEntryId: entry.id, accountId: tdsPayableAcct!.id, accountCode: tdsPayableAcct!.accountCode, accountName: tdsPayableAcct!.accountName, debit: "0", credit: tdsAmount.toFixed(2), memo: `TDS deduction - ${(record as any).employeeName}` });
    await updateBalance(tdsPayableAcct!.id, -tdsAmount);
  }
  if (pfAmount > 0) {
    lines.push({ journalEntryId: entry.id, accountId: pfPayableAcct!.id, accountCode: pfPayableAcct!.accountCode, accountName: pfPayableAcct!.accountName, debit: "0", credit: pfAmount.toFixed(2), memo: `PF deduction - ${(record as any).employeeName}` });
    await updateBalance(pfPayableAcct!.id, -pfAmount);
  }
  if (esiAmount > 0) {
    lines.push({ journalEntryId: entry.id, accountId: esiPayableAcct!.id, accountCode: esiPayableAcct!.accountCode, accountName: esiPayableAcct!.accountName, debit: "0", credit: esiAmount.toFixed(2), memo: `ESI deduction - ${(record as any).employeeName}` });
    await updateBalance(esiPayableAcct!.id, -esiAmount);
  }
  lines.push({ journalEntryId: entry.id, accountId: salaryPayableAcct.id, accountCode: salaryPayableAcct.accountCode, accountName: salaryPayableAcct.accountName, debit: "0", credit: netPay.toFixed(2), memo: `Net salary payable - ${(record as any).employeeName}` });
  await updateBalance(salaryPayableAcct.id, -netPay);

  await journalLinesTable.insertMany(lines);

  await payrollTable.findOneAndUpdate({ id: payrollId }, { $set: { journalEntryId: entry.id } });

  console.log(`[AUTO:PAYROLL->LEDGER] Payroll #${payrollId}: JE #${entry.id} created (gross=${grossPay}, net=${netPay})`);
  return { journalCreated: true, journalEntryId: entry.id };
}
