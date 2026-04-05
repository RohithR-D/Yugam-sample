import { db } from "@workspace/db";
import {
  chartOfAccountsTable,
  journalEntriesTable,
  journalLinesTable,
  accountsReceivableTable,
  salesInvoicesTable,
  salesPaymentsTable,
  salesReturnsTable,
} from "@workspace/db/schema";
import { eq, sql, and, lt, inArray } from "drizzle-orm";

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

async function ensureRequiredAccounts(tx: any): Promise<RequiredAccounts> {
  const existing = await tx.select().from(chartOfAccountsTable);
  const map: Record<string, number> = {};

  for (const req of REQUIRED_ACCOUNTS) {
    let found = existing.find((a: any) => a.accountName === req.name);
    if (!found) {
      found = existing.find((a: any) => a.accountCode === req.code);
    }
    if (!found) {
      const [created] = await tx.insert(chartOfAccountsTable).values({
        accountCode: req.code,
        accountName: req.name,
        accountType: req.type,
        currentBalance: "0",
        description: `Auto-created for Sales→Ledger automation`,
        isActive: "Yes",
      }).returning();
      found = created;
      existing.push(found);
    }
    map[req.name] = found.id;
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

async function updateAccountBalance(tx: any, accountId: number, debitAmt: number, creditAmt: number) {
  const netChange = debitAmt - creditAmt;
  if (Math.abs(netChange) > 0.001) {
    await tx.update(chartOfAccountsTable)
      .set({ currentBalance: sql`${chartOfAccountsTable.currentBalance}::numeric + ${netChange}` })
      .where(eq(chartOfAccountsTable.id, accountId));
  }
}

export async function triggerInvoiceApproved(invoiceId: number): Promise<{ journalEntryId: number; arId: number } | null> {
  return await db.transaction(async (tx) => {
    const [invoice] = await tx.select().from(salesInvoicesTable).where(eq(salesInvoicesTable.id, invoiceId));
    if (!invoice) throw new Error("Invoice not found");

    if (!["Approved", "Sent"].includes(invoice.status)) return null;

    if (invoice.journalEntryId) return null;

    const existingAR = await tx.select().from(accountsReceivableTable)
      .where(eq(accountsReceivableTable.invoiceNumber, invoice.invoiceNumber));
    if (existingAR.length > 0) return null;

    const accts = await ensureRequiredAccounts(tx);

    const grandTotal = parseFloat(invoice.grandTotal || "0");
    const taxableAmount = parseFloat(invoice.taxableAmount || "0");
    const cgstTotal = parseFloat(invoice.cgstTotal || "0");
    const sgstTotal = parseFloat(invoice.sgstTotal || "0");
    const igstTotal = parseFloat(invoice.igstTotal || "0");

    const totalCredits = taxableAmount + cgstTotal + sgstTotal + igstTotal;
    if (Math.abs(grandTotal - totalCredits) > 0.01) {
      console.warn(`[AUTO:SALES] Invoice ${invoice.invoiceNumber}: grand_total (${grandTotal}) != sum of credits (${totalCredits}). Using grand_total for AR debit and adjusting revenue.`);
    }

    const lines: { accountId: number; accountName: string; accountCode: string; debit: number; credit: number; memo: string }[] = [];

    lines.push({
      accountId: accts.accountsReceivable,
      accountName: "Accounts Receivable",
      accountCode: "1100",
      debit: grandTotal,
      credit: 0,
      memo: `AR for ${invoice.invoiceNumber}`,
    });

    const revenueCredit = grandTotal - cgstTotal - sgstTotal - igstTotal;
    lines.push({
      accountId: accts.salesRevenue,
      accountName: "Sales Revenue",
      accountCode: "4100",
      debit: 0,
      credit: revenueCredit,
      memo: `Revenue from ${invoice.invoiceNumber}`,
    });

    if (cgstTotal > 0) {
      lines.push({
        accountId: accts.cgstOutput,
        accountName: "CGST Output",
        accountCode: "2210",
        debit: 0,
        credit: cgstTotal,
        memo: `CGST on ${invoice.invoiceNumber}`,
      });
    }
    if (sgstTotal > 0) {
      lines.push({
        accountId: accts.sgstOutput,
        accountName: "SGST Output",
        accountCode: "2220",
        debit: 0,
        credit: sgstTotal,
        memo: `SGST on ${invoice.invoiceNumber}`,
      });
    }
    if (igstTotal > 0) {
      lines.push({
        accountId: accts.igstOutput,
        accountName: "IGST Output",
        accountCode: "2230",
        debit: 0,
        credit: igstTotal,
        memo: `IGST on ${invoice.invoiceNumber}`,
      });
    }

    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCreditCalc = lines.reduce((s, l) => s + l.credit, 0);

    const [journalEntry] = await tx.insert(journalEntriesTable).values({
      entryDate: invoice.invoiceDate || new Date(),
      reference: `AUTO:SALES:${invoice.invoiceNumber}`,
      description: `Sales Invoice ${invoice.invoiceNumber} - ${invoice.clientName}`,
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCreditCalc.toFixed(2),
      status: "Posted",
    }).returning();

    for (const line of lines) {
      await tx.insert(journalLinesTable).values({
        journalEntryId: journalEntry.id,
        accountId: line.accountId,
        accountCode: line.accountCode,
        accountName: line.accountName,
        debit: line.debit.toFixed(2),
        credit: line.credit.toFixed(2),
        memo: line.memo,
      });
      await updateAccountBalance(tx, line.accountId, line.debit, line.credit);
    }

    const [arRecord] = await tx.insert(accountsReceivableTable).values({
      clientName: invoice.clientName,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate || new Date(),
      dueDate: invoice.dueDate || new Date(Date.now() + 30 * 86400000),
      amount: grandTotal.toFixed(2),
      receivedAmount: "0",
      status: "Pending",
      entryType: "Invoice",
      notes: `Auto-created from invoice ${invoice.invoiceNumber}`,
    }).returning();

    await tx.update(salesInvoicesTable).set({
      journalEntryId: journalEntry.id,
      updatedAt: new Date(),
    }).where(eq(salesInvoicesTable.id, invoiceId));

    console.log(`[AUTO:SALES] Invoice ${invoice.invoiceNumber} → JE#${journalEntry.id}, AR#${arRecord.id} (₹${grandTotal})`);

    return { journalEntryId: journalEntry.id, arId: arRecord.id };
  });
}

export async function triggerPaymentReceived(paymentId: number): Promise<{ journalEntryId: number } | null> {
  return await db.transaction(async (tx) => {
    const [payment] = await tx.select().from(salesPaymentsTable).where(eq(salesPaymentsTable.id, paymentId));
    if (!payment) throw new Error("Payment not found");

    if (payment.status !== "Received") return null;
    if (payment.journalEntryId) return null;

    const accts = await ensureRequiredAccounts(tx);

    const paymentAmount = parseFloat(payment.amount || "0");
    if (paymentAmount <= 0) return null;
    const bankChargesAmt = parseFloat(payment.bankCharges || "0");
    const tdsAmt = parseFloat(payment.tdsAmount || "0");
    const netReceived = paymentAmount - bankChargesAmt - tdsAmt;

    if (netReceived < 0) throw new Error(`[AUTO:SALES] Payment ${payment.paymentNumber}: netReceived is negative (${netReceived})`);

    const lines: { accountId: number; accountName: string; accountCode: string; debit: number; credit: number; memo: string }[] = [];

    lines.push({
      accountId: accts.bankAccount,
      accountName: "Bank Account",
      accountCode: "1020",
      debit: netReceived,
      credit: 0,
      memo: `Payment ${payment.paymentNumber} received`,
    });

    if (bankChargesAmt > 0) {
      lines.push({
        accountId: accts.bankCharges,
        accountName: "Bank Charges",
        accountCode: "5200",
        debit: bankChargesAmt,
        credit: 0,
        memo: `Bank charges on ${payment.paymentNumber}`,
      });
    }

    if (tdsAmt > 0) {
      lines.push({
        accountId: accts.tdsReceivable,
        accountName: "TDS Receivable",
        accountCode: "1120",
        debit: tdsAmt,
        credit: 0,
        memo: `TDS on ${payment.paymentNumber}`,
      });
    }

    lines.push({
      accountId: accts.accountsReceivable,
      accountName: "Accounts Receivable",
      accountCode: "1100",
      debit: 0,
      credit: paymentAmount,
      memo: `AR reduction for ${payment.paymentNumber}`,
    });

    const totalDebitCheck = lines.reduce((s, l) => s + l.debit, 0);
    const totalCreditCheck = lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebitCheck - totalCreditCheck) > 0.01) {
      throw new Error(`[AUTO:SALES] Payment ${payment.paymentNumber}: JE unbalanced (D:${totalDebitCheck} C:${totalCreditCheck})`);
    }

    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCreditCalc = lines.reduce((s, l) => s + l.credit, 0);

    const [journalEntry] = await tx.insert(journalEntriesTable).values({
      entryDate: payment.paymentDate || new Date(),
      reference: `AUTO:SALES:${payment.paymentNumber}`,
      description: `Payment ${payment.paymentNumber} - ${payment.clientName}`,
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCreditCalc.toFixed(2),
      status: "Posted",
    }).returning();

    for (const line of lines) {
      await tx.insert(journalLinesTable).values({
        journalEntryId: journalEntry.id,
        accountId: line.accountId,
        accountCode: line.accountCode,
        accountName: line.accountName,
        debit: line.debit.toFixed(2),
        credit: line.credit.toFixed(2),
        memo: line.memo,
      });
      await updateAccountBalance(tx, line.accountId, line.debit, line.credit);
    }

    await tx.update(salesPaymentsTable).set({
      journalEntryId: journalEntry.id,
      updatedAt: new Date(),
    }).where(eq(salesPaymentsTable.id, paymentId));

    if (payment.invoiceId) {
      const allPayments = await tx.select().from(salesPaymentsTable).where(
        and(eq(salesPaymentsTable.invoiceId, payment.invoiceId), eq(salesPaymentsTable.status, "Received"))
      );
      const totalPaid = allPayments.reduce((s, p) => s + parseFloat(p.amount || "0"), 0);
      const [invoice] = await tx.select().from(salesInvoicesTable).where(eq(salesInvoicesTable.id, payment.invoiceId));

      if (invoice) {
        const grandTotal = parseFloat(invoice.grandTotal || "0");
        const balanceDue = Math.max(0, grandTotal - totalPaid);
        let paymentStatus = "Unpaid";
        if (totalPaid >= grandTotal) paymentStatus = "Paid";
        else if (totalPaid > 0) paymentStatus = "Partial";

        await tx.update(salesInvoicesTable).set({
          amountPaid: totalPaid.toFixed(2),
          balanceDue: balanceDue.toFixed(2),
          paymentStatus,
          status: paymentStatus === "Paid" ? "Paid" : invoice.status,
          updatedAt: new Date(),
        }).where(eq(salesInvoicesTable.id, payment.invoiceId));

        const arRecords = await tx.select().from(accountsReceivableTable)
          .where(and(
            eq(accountsReceivableTable.invoiceNumber, invoice.invoiceNumber),
            eq(accountsReceivableTable.entryType, "Invoice"),
          ));
        if (arRecords.length > 0) {
          const arStatus = totalPaid >= grandTotal ? "Received" : totalPaid > 0 ? "Partial" : "Pending";
          await tx.update(accountsReceivableTable).set({
            receivedAmount: totalPaid.toFixed(2),
            status: arStatus,
          }).where(eq(accountsReceivableTable.id, arRecords[0].id));
        }
      }
    }

    console.log(`[AUTO:SALES] Payment ${payment.paymentNumber} → JE#${journalEntry.id} (₹${paymentAmount})`);

    return { journalEntryId: journalEntry.id };
  });
}

export async function triggerReturnCreditIssued(returnId: number): Promise<{ journalEntryId: number } | null> {
  return await db.transaction(async (tx) => {
    const [salesReturn] = await tx.select().from(salesReturnsTable).where(eq(salesReturnsTable.id, returnId));
    if (!salesReturn) throw new Error("Sales return not found");

    if (salesReturn.status !== "Credit Issued") return null;
    if (salesReturn.journalEntryId) return null;

    const accts = await ensureRequiredAccounts(tx);

    const grandTotal = parseFloat(salesReturn.grandTotal || "0");
    const cgstTotal = parseFloat(salesReturn.cgstTotal || "0");
    const sgstTotal = parseFloat(salesReturn.sgstTotal || "0");
    const igstTotal = parseFloat(salesReturn.igstTotal || "0");
    const revenueAmount = grandTotal - cgstTotal - sgstTotal - igstTotal;

    const lines: { accountId: number; accountName: string; accountCode: string; debit: number; credit: number; memo: string }[] = [];

    lines.push({
      accountId: accts.salesRevenue,
      accountName: "Sales Revenue",
      accountCode: "4100",
      debit: revenueAmount,
      credit: 0,
      memo: `Revenue reversal for ${salesReturn.returnNumber}`,
    });

    if (cgstTotal > 0) {
      lines.push({
        accountId: accts.cgstOutput,
        accountName: "CGST Output",
        accountCode: "2210",
        debit: cgstTotal,
        credit: 0,
        memo: `CGST reversal for ${salesReturn.returnNumber}`,
      });
    }
    if (sgstTotal > 0) {
      lines.push({
        accountId: accts.sgstOutput,
        accountName: "SGST Output",
        accountCode: "2220",
        debit: sgstTotal,
        credit: 0,
        memo: `SGST reversal for ${salesReturn.returnNumber}`,
      });
    }
    if (igstTotal > 0) {
      lines.push({
        accountId: accts.igstOutput,
        accountName: "IGST Output",
        accountCode: "2230",
        debit: igstTotal,
        credit: 0,
        memo: `IGST reversal for ${salesReturn.returnNumber}`,
      });
    }

    lines.push({
      accountId: accts.accountsReceivable,
      accountName: "Accounts Receivable",
      accountCode: "1100",
      debit: 0,
      credit: grandTotal,
      memo: `AR reduction for return ${salesReturn.returnNumber}`,
    });

    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCreditCalc = lines.reduce((s, l) => s + l.credit, 0);

    const [journalEntry] = await tx.insert(journalEntriesTable).values({
      entryDate: salesReturn.returnDate || new Date(),
      reference: `AUTO:SALES:${salesReturn.creditNoteNumber}`,
      description: `Credit Note ${salesReturn.creditNoteNumber} - ${salesReturn.clientName} (Return ${salesReturn.returnNumber})`,
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCreditCalc.toFixed(2),
      status: "Posted",
    }).returning();

    for (const line of lines) {
      await tx.insert(journalLinesTable).values({
        journalEntryId: journalEntry.id,
        accountId: line.accountId,
        accountCode: line.accountCode,
        accountName: line.accountName,
        debit: line.debit.toFixed(2),
        credit: line.credit.toFixed(2),
        memo: line.memo,
      });
      await updateAccountBalance(tx, line.accountId, line.debit, line.credit);
    }

    await tx.insert(accountsReceivableTable).values({
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
      const [sourceInvoice] = await tx.select().from(salesInvoicesTable).where(eq(salesInvoicesTable.id, salesReturn.sourceInvoiceId));
      if (sourceInvoice) {
        const arRecords = await tx.select().from(accountsReceivableTable)
          .where(and(
            eq(accountsReceivableTable.invoiceNumber, sourceInvoice.invoiceNumber),
            eq(accountsReceivableTable.entryType, "Invoice"),
          ));
        if (arRecords.length > 0) {
          const currentAmount = parseFloat(arRecords[0].amount || "0");
          const newAmount = currentAmount - grandTotal;
          const currentReceived = parseFloat(arRecords[0].receivedAmount || "0");
          const newStatus = currentReceived >= newAmount ? "Received" : currentReceived > 0 ? "Partial" : "Pending";
          await tx.update(accountsReceivableTable).set({
            amount: newAmount.toFixed(2),
            status: newStatus,
          }).where(eq(accountsReceivableTable.id, arRecords[0].id));
        }

        const currentPaid = parseFloat(sourceInvoice.amountPaid || "0");
        const originalGrandTotal = parseFloat(sourceInvoice.grandTotal || "0");
        const newGrandTotal = originalGrandTotal - grandTotal;
        const newBalance = Math.max(0, newGrandTotal - currentPaid);
        let paymentStatus = "Unpaid";
        if (currentPaid >= newGrandTotal) paymentStatus = "Paid";
        else if (currentPaid > 0) paymentStatus = "Partial";

        await tx.update(salesInvoicesTable).set({
          balanceDue: newBalance.toFixed(2),
          paymentStatus,
          updatedAt: new Date(),
        }).where(eq(salesInvoicesTable.id, salesReturn.sourceInvoiceId));
      }
    }

    await tx.update(salesReturnsTable).set({
      journalEntryId: journalEntry.id,
      updatedAt: new Date(),
    }).where(eq(salesReturnsTable.id, returnId));

    console.log(`[AUTO:SALES] Return ${salesReturn.returnNumber} Credit Issued → JE#${journalEntry.id} (₹${grandTotal})`);

    return { journalEntryId: journalEntry.id };
  });
}

export async function triggerOverdueCheck(): Promise<{ updatedCount: number }> {
  const now = new Date();

  return await db.transaction(async (tx) => {
    let updatedCount = 0;

    const overdueAR = await tx.select().from(accountsReceivableTable)
      .where(and(
        inArray(accountsReceivableTable.status, ["Pending", "Partial"]),
        lt(accountsReceivableTable.dueDate, now),
        eq(accountsReceivableTable.entryType, "Invoice"),
      ));

    for (const ar of overdueAR) {
      await tx.update(accountsReceivableTable).set({ status: "Overdue" })
        .where(eq(accountsReceivableTable.id, ar.id));

      if (ar.invoiceNumber) {
        const [invoice] = await tx.select().from(salesInvoicesTable)
          .where(eq(salesInvoicesTable.invoiceNumber, ar.invoiceNumber));
        if (invoice && !["Paid", "Cancelled", "Written Off"].includes(invoice.paymentStatus)) {
          await tx.update(salesInvoicesTable).set({
            paymentStatus: "Overdue",
            updatedAt: new Date(),
          }).where(eq(salesInvoicesTable.id, invoice.id));
        }
      }
      updatedCount++;
    }

    if (updatedCount > 0) {
      console.log(`[AUTO:SALES] Overdue check: ${updatedCount} record(s) marked overdue`);
    }

    return { updatedCount };
  });
}
