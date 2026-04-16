import {
  chartOfAccountsTable,
  journalEntriesTable,
  journalLinesTable,
  accountsReceivableTable,
  salesInvoicesTable,
  salesPaymentsTable,
  salesReturnsTable,
} from "@workspace/db/schema";

interface RequiredAccounts {
  accountsReceivable: number;
  salesRevenue: number;
  cgstOutput: number;
  sgstOutput: number;
  igstOutput: number;
  bankAccount: number;
  tdsReceivable: number;
  bankCharges: number;
}

const REQUIRED_ACCOUNTS = [
  { code: "1100", name: "Accounts Receivable", type: "Asset" },
  { code: "4100", name: "Sales Revenue", type: "Revenue" },
  { code: "2210", name: "CGST Output", type: "Liability" },
  { code: "2220", name: "SGST Output", type: "Liability" },
  { code: "2230", name: "IGST Output", type: "Liability" },
  { code: "1020", name: "Bank Account", type: "Asset" },
  { code: "1120", name: "TDS Receivable", type: "Asset" },
  { code: "5200", name: "Bank Charges", type: "Expense" },
] as const;

async function ensureRequiredAccounts(): Promise<RequiredAccounts> {
  const existing = await chartOfAccountsTable.find({}).lean();
  const map: Record<string, number> = {};

  for (const req of REQUIRED_ACCOUNTS) {
    let found = existing.find((a: any) => a.accountName === req.name) ||
                existing.find((a: any) => a.accountCode === req.code);
    if (!found) {
      const created = await chartOfAccountsTable.create({
        accountCode: req.code,
        accountName: req.name,
        accountType: req.type,
        currentBalance: "0",
        description: `Auto-created for Sales?Ledger automation`,
        isActive: "Yes",
      });
      found = created.toObject();
      existing.push(found);
    }
    map[req.name] = (found as any).id;
  }

  return {
    accountsReceivable: map["Accounts Receivable"],
    salesRevenue: map["Sales Revenue"],
    cgstOutput: map["CGST Output"],
    sgstOutput: map["SGST Output"],
    igstOutput: map["IGST Output"],
    bankAccount: map["Bank Account"],
    tdsReceivable: map["TDS Receivable"],
    bankCharges: map["Bank Charges"],
  };
}

async function updateAccountBalance(accountId: number, debitAmt: number, creditAmt: number) {
  const netChange = debitAmt - creditAmt;
  if (Math.abs(netChange) > 0.001) {
    await chartOfAccountsTable.findOneAndUpdate(
      { id: accountId },
      { $inc: { currentBalance: netChange } },
    );
  }
}

interface JournalLine { accountId: number; accountName: string; accountCode: string; debit: number; credit: number; memo: string }

async function createJournalEntry(
  entryDate: Date | null,
  reference: string,
  description: string,
  lines: JournalLine[],
): Promise<any> {
  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

  const jeDoc = await journalEntriesTable.create({
    entryDate: entryDate || new Date(),
    reference,
    description,
    totalDebit: totalDebit.toFixed(2),
    totalCredit: totalCredit.toFixed(2),
    status: "Posted",
  });
  const je = jeDoc.toObject();

  for (const line of lines) {
    await journalLinesTable.create({
      journalEntryId: je.id,
      accountId: line.accountId,
      accountCode: line.accountCode,
      accountName: line.accountName,
      debit: line.debit.toFixed(2),
      credit: line.credit.toFixed(2),
      memo: line.memo,
    });
    await updateAccountBalance(line.accountId, line.debit, line.credit);
  }

  return je;
}

export async function triggerInvoiceApproved(invoiceId: number): Promise<{ journalEntryId: number; arId: number } | null> {
  const invoice = await salesInvoicesTable.findOne({ id: invoiceId }).lean();
  if (!invoice) throw new Error("Invoice not found");
  if (!["Approved", "Sent"].includes(invoice.status)) return null;
  if (invoice.journalEntryId) return null;

  const existingAR = await accountsReceivableTable.findOne({ invoiceNumber: invoice.invoiceNumber }).lean();
  if (existingAR) return null;

  const accts = await ensureRequiredAccounts();

  const grandTotal = parseFloat(String(invoice.grandTotal || "0"));
  const cgstTotal = parseFloat(String(invoice.cgstTotal || "0"));
  const sgstTotal = parseFloat(String(invoice.sgstTotal || "0"));
  const igstTotal = parseFloat(String(invoice.igstTotal || "0"));
  const revenueCredit = grandTotal - cgstTotal - sgstTotal - igstTotal;

  const lines: JournalLine[] = [
    { accountId: accts.accountsReceivable, accountName: "Accounts Receivable", accountCode: "1100", debit: grandTotal, credit: 0, memo: `AR for ${invoice.invoiceNumber}` },
    { accountId: accts.salesRevenue, accountName: "Sales Revenue", accountCode: "4100", debit: 0, credit: revenueCredit, memo: `Revenue from ${invoice.invoiceNumber}` },
  ];
  if (cgstTotal > 0) lines.push({ accountId: accts.cgstOutput, accountName: "CGST Output", accountCode: "2210", debit: 0, credit: cgstTotal, memo: `CGST on ${invoice.invoiceNumber}` });
  if (sgstTotal > 0) lines.push({ accountId: accts.sgstOutput, accountName: "SGST Output", accountCode: "2220", debit: 0, credit: sgstTotal, memo: `SGST on ${invoice.invoiceNumber}` });
  if (igstTotal > 0) lines.push({ accountId: accts.igstOutput, accountName: "IGST Output", accountCode: "2230", debit: 0, credit: igstTotal, memo: `IGST on ${invoice.invoiceNumber}` });

  const je = await createJournalEntry(
    invoice.invoiceDate ? new Date(invoice.invoiceDate) : new Date(),
    `AUTO:SALES:${invoice.invoiceNumber}`,
    `Sales Invoice ${invoice.invoiceNumber} - ${invoice.clientName}`,
    lines,
  );

  const arDoc = await accountsReceivableTable.create({
    clientName: invoice.clientName,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate || new Date(),
    dueDate: invoice.dueDate || new Date(Date.now() + 30 * 86400000),
    amount: grandTotal.toFixed(2),
    receivedAmount: "0",
    status: "Pending",
    entryType: "Invoice",
    notes: `Auto-created from invoice ${invoice.invoiceNumber}`,
  });
  const ar = arDoc.toObject();

  await salesInvoicesTable.findOneAndUpdate(
    { id: invoiceId },
    { $set: { journalEntryId: je.id, updatedAt: new Date() } },
  );

  console.log(`[AUTO:SALES] Invoice ${invoice.invoiceNumber} ? JE#${je.id}, AR#${ar.id} (?${grandTotal})`);
  return { journalEntryId: je.id, arId: ar.id };
}

export async function triggerPaymentReceived(paymentId: number): Promise<{ journalEntryId: number } | null> {
  const payment = await salesPaymentsTable.findOne({ id: paymentId }).lean();
  if (!payment) throw new Error("Payment not found");
  if (payment.status !== "Received") return null;
  if (payment.journalEntryId) return null;

  const accts = await ensureRequiredAccounts();

  const paymentAmount = parseFloat(String(payment.amount || "0"));
  if (paymentAmount <= 0) return null;
  const bankChargesAmt = parseFloat(String(payment.bankCharges || "0"));
  const tdsAmt = parseFloat(String(payment.tdsAmount || "0"));
  const netReceived = paymentAmount - bankChargesAmt - tdsAmt;
  if (netReceived < 0) throw new Error(`[AUTO:SALES] Payment ${payment.paymentNumber}: netReceived is negative (${netReceived})`);

  const lines: JournalLine[] = [
    { accountId: accts.bankAccount, accountName: "Bank Account", accountCode: "1020", debit: netReceived, credit: 0, memo: `Payment ${payment.paymentNumber} received` },
  ];
  if (bankChargesAmt > 0) lines.push({ accountId: accts.bankCharges, accountName: "Bank Charges", accountCode: "5200", debit: bankChargesAmt, credit: 0, memo: `Bank charges on ${payment.paymentNumber}` });
  if (tdsAmt > 0) lines.push({ accountId: accts.tdsReceivable, accountName: "TDS Receivable", accountCode: "1120", debit: tdsAmt, credit: 0, memo: `TDS on ${payment.paymentNumber}` });
  lines.push({ accountId: accts.accountsReceivable, accountName: "Accounts Receivable", accountCode: "1100", debit: 0, credit: paymentAmount, memo: `AR reduction for ${payment.paymentNumber}` });

  const totalD = lines.reduce((s, l) => s + l.debit, 0);
  const totalC = lines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(totalD - totalC) > 0.01) {
    throw new Error(`[AUTO:SALES] Payment ${payment.paymentNumber}: JE unbalanced (D:${totalD} C:${totalC})`);
  }

  const je = await createJournalEntry(
    payment.paymentDate ? new Date(payment.paymentDate) : new Date(),
    `AUTO:SALES:${payment.paymentNumber}`,
    `Payment ${payment.paymentNumber} - ${payment.clientName}`,
    lines,
  );

  await salesPaymentsTable.findOneAndUpdate(
    { id: paymentId },
    { $set: { journalEntryId: je.id, updatedAt: new Date() } },
  );

  if (payment.invoiceId) {
    const allPayments = await salesPaymentsTable.find({ invoiceId: payment.invoiceId, status: "Received" }).lean();
    const totalPaid = allPayments.reduce((s: number, p: any) => s + parseFloat(String(p.amount || "0")), 0);
    const invoice = await salesInvoicesTable.findOne({ id: payment.invoiceId }).lean();
    if (invoice) {
      const grandTotal = parseFloat(String(invoice.grandTotal || "0"));
      const balanceDue = Math.max(0, grandTotal - totalPaid);
      let paymentStatus = "Unpaid";
      if (totalPaid >= grandTotal) paymentStatus = "Paid";
      else if (totalPaid > 0) paymentStatus = "Partial";
      await salesInvoicesTable.findOneAndUpdate(
        { id: payment.invoiceId },
        { $set: { amountPaid: totalPaid.toFixed(2), balanceDue: balanceDue.toFixed(2), paymentStatus, status: paymentStatus === "Paid" ? "Paid" : invoice.status, updatedAt: new Date() } },
      );
      const arRecord = await accountsReceivableTable.findOne({ invoiceNumber: invoice.invoiceNumber, entryType: "Invoice" }).lean();
      if (arRecord) {
        const arStatus = totalPaid >= grandTotal ? "Received" : totalPaid > 0 ? "Partial" : "Pending";
        await accountsReceivableTable.findOneAndUpdate(
          { id: (arRecord as any).id },
          { $set: { receivedAmount: totalPaid.toFixed(2), status: arStatus } },
        );
      }
    }
  }

  console.log(`[AUTO:SALES] Payment ${payment.paymentNumber} ? JE#${je.id} (?${paymentAmount})`);
  return { journalEntryId: je.id };
}

export async function triggerReturnCreditIssued(returnId: number): Promise<{ journalEntryId: number } | null> {
  const salesReturn = await salesReturnsTable.findOne({ id: returnId }).lean();
  if (!salesReturn) throw new Error("Sales return not found");
  if (salesReturn.status !== "Credit Issued") return null;
  if (salesReturn.journalEntryId) return null;

  const accts = await ensureRequiredAccounts();

  const grandTotal = parseFloat(String(salesReturn.grandTotal || "0"));
  const cgstTotal = parseFloat(String(salesReturn.cgstTotal || "0"));
  const sgstTotal = parseFloat(String(salesReturn.sgstTotal || "0"));
  const igstTotal = parseFloat(String(salesReturn.igstTotal || "0"));
  const revenueAmount = grandTotal - cgstTotal - sgstTotal - igstTotal;

  const lines: JournalLine[] = [
    { accountId: accts.salesRevenue, accountName: "Sales Revenue", accountCode: "4100", debit: revenueAmount, credit: 0, memo: `Revenue reversal for ${salesReturn.returnNumber}` },
  ];
  if (cgstTotal > 0) lines.push({ accountId: accts.cgstOutput, accountName: "CGST Output", accountCode: "2210", debit: cgstTotal, credit: 0, memo: `CGST reversal for ${salesReturn.returnNumber}` });
  if (sgstTotal > 0) lines.push({ accountId: accts.sgstOutput, accountName: "SGST Output", accountCode: "2220", debit: sgstTotal, credit: 0, memo: `SGST reversal for ${salesReturn.returnNumber}` });
  if (igstTotal > 0) lines.push({ accountId: accts.igstOutput, accountName: "IGST Output", accountCode: "2230", debit: igstTotal, credit: 0, memo: `IGST reversal for ${salesReturn.returnNumber}` });
  lines.push({ accountId: accts.accountsReceivable, accountName: "Accounts Receivable", accountCode: "1100", debit: 0, credit: grandTotal, memo: `AR reduction for return ${salesReturn.returnNumber}` });

  const je = await createJournalEntry(
    salesReturn.returnDate ? new Date(salesReturn.returnDate) : new Date(),
    `AUTO:SALES:${salesReturn.creditNoteNumber}`,
    `Credit Note ${salesReturn.creditNoteNumber} - ${salesReturn.clientName} (Return ${salesReturn.returnNumber})`,
    lines,
  );

  await accountsReceivableTable.create({
    clientName: salesReturn.clientName,
    invoiceNumber: salesReturn.creditNoteNumber,
    invoiceDate: salesReturn.returnDate || new Date(),
    dueDate: salesReturn.returnDate || new Date(),
    amount: (-grandTotal).toFixed(2),
    receivedAmount: "0",
    status: "Received",
    entryType: "Credit Note",
    notes: `Credit note for return ${salesReturn.returnNumber}`,
  });

  if (salesReturn.sourceInvoiceId) {
    const sourceInvoice = await salesInvoicesTable.findOne({ id: salesReturn.sourceInvoiceId }).lean();
    if (sourceInvoice) {
      const arRecord = await accountsReceivableTable.findOne({ invoiceNumber: sourceInvoice.invoiceNumber, entryType: "Invoice" }).lean();
      if (arRecord) {
        const currentAmount = parseFloat(String((arRecord as any).amount || "0"));
        const newAmount = currentAmount - grandTotal;
        const currentReceived = parseFloat(String((arRecord as any).receivedAmount || "0"));
        const newStatus = currentReceived >= newAmount ? "Received" : currentReceived > 0 ? "Partial" : "Pending";
        await accountsReceivableTable.findOneAndUpdate(
          { id: (arRecord as any).id },
          { $set: { amount: newAmount.toFixed(2), status: newStatus } },
        );
      }
      const currentPaid = parseFloat(String(sourceInvoice.amountPaid || "0"));
      const originalGrandTotal = parseFloat(String(sourceInvoice.grandTotal || "0"));
      const newGrandTotal = originalGrandTotal - grandTotal;
      const newBalance = Math.max(0, newGrandTotal - currentPaid);
      let paymentStatus = "Unpaid";
      if (currentPaid >= newGrandTotal) paymentStatus = "Paid";
      else if (currentPaid > 0) paymentStatus = "Partial";
      await salesInvoicesTable.findOneAndUpdate(
        { id: salesReturn.sourceInvoiceId },
        { $set: { balanceDue: newBalance.toFixed(2), paymentStatus, updatedAt: new Date() } },
      );
    }
  }

  await salesReturnsTable.findOneAndUpdate(
    { id: returnId },
    { $set: { journalEntryId: je.id, updatedAt: new Date() } },
  );

  console.log(`[AUTO:SALES] Return ${salesReturn.returnNumber} Credit Issued ? JE#${je.id} (?${grandTotal})`);
  return { journalEntryId: je.id };
}

export async function triggerOverdueCheck(): Promise<{ updatedCount: number }> {
  const now = new Date();
  let updatedCount = 0;

  const overdueAR = await accountsReceivableTable.find({
    status: { $in: ["Pending", "Partial"] },
    dueDate: { $lt: now },
    entryType: "Invoice",
  }).lean();

  for (const ar of overdueAR) {
    await accountsReceivableTable.findOneAndUpdate({ id: (ar as any).id }, { $set: { status: "Overdue" } });
    if ((ar as any).invoiceNumber) {
      const invoice = await salesInvoicesTable.findOne({ invoiceNumber: (ar as any).invoiceNumber }).lean();
      if (invoice && !["Paid", "Cancelled", "Written Off"].includes(invoice.paymentStatus)) {
        await salesInvoicesTable.findOneAndUpdate(
          { id: invoice.id },
          { $set: { paymentStatus: "Overdue", updatedAt: new Date() } },
        );
      }
    }
    updatedCount++;
  }

  if (updatedCount > 0) {
    console.log(`[AUTO:SALES] Overdue check: ${updatedCount} record(s) marked overdue`);
  }
  return { updatedCount };
}
