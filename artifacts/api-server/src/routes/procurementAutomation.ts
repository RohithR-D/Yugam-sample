import { db } from "@workspace/db";
import {
  goodsReceiptsTable,
  grnItemsTable,
  purchaseInvoicesTable,
  purchaseReturnsTable,
  stockMovementsTable,
  stockLedgerTable,
  inventoryCatalogTable,
  chartOfAccountsTable,
  journalEntriesTable,
  journalLinesTable,
  accountsPayableTable,
} from "@workspace/db/schema";
import { eq, sql, and } from "drizzle-orm";

type TxOrDb = typeof db;

const PROCUREMENT_ACCOUNTS = [
  { code: "1200", name: "Inventory / Stock-in-Hand", type: "Asset" },
  { code: "2100", name: "Accounts Payable", type: "Liability" },
  { code: "1130", name: "CGST Input Credit", type: "Asset" },
  { code: "1131", name: "SGST Input Credit", type: "Asset" },
  { code: "1132", name: "IGST Input Credit", type: "Asset" },
] as const;

interface ProcurementAccounts {
  inventoryStock: number;
  accountsPayable: number;
  cgstInput: number;
  sgstInput: number;
  igstInput: number;
}

async function ensureProcurementAccounts(tx: TxOrDb): Promise<ProcurementAccounts> {
  const existing = await tx.select().from(chartOfAccountsTable);
  const map: Record<string, number> = {};

  for (const req of PROCUREMENT_ACCOUNTS) {
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
        description: `Auto-created for Procurement→Ledger automation`,
        isActive: "Yes",
      }).returning();
      found = created;
      existing.push(found);
    }
    map[req.name] = found.id;
  }

  return {
    inventoryStock: map["Inventory / Stock-in-Hand"],
    accountsPayable: map["Accounts Payable"],
    cgstInput: map["CGST Input Credit"],
    sgstInput: map["SGST Input Credit"],
    igstInput: map["IGST Input Credit"],
  };
}

async function updateAccountBalance(tx: TxOrDb, accountId: number, debitAmt: number, creditAmt: number) {
  const netChange = debitAmt - creditAmt;
  await tx.update(chartOfAccountsTable).set({
    currentBalance: sql`${chartOfAccountsTable.currentBalance} + ${netChange}`,
  }).where(eq(chartOfAccountsTable.id, accountId));
}

export async function triggerGrnAccepted(
  grnId: number,
  externalTx?: TxOrDb,
): Promise<{ stockUpdates: number } | null> {
  const run = async (tx: TxOrDb) => {
    const [grn] = await tx.select().from(goodsReceiptsTable).where(eq(goodsReceiptsTable.id, grnId));
    if (!grn) throw new Error("GRN not found");

    if (!["Complete", "Partial"].includes(grn.status)) return null;

    const existingMovements = await tx.select().from(stockMovementsTable)
      .where(eq(stockMovementsTable.referenceNumber, grn.grnNumber));
    if (existingMovements.length > 0) {
      console.log(`[AUTO:PROCUREMENT] GRN ${grn.grnNumber}: already processed (idempotency guard)`);
      return null;
    }

    const items = await tx.select().from(grnItemsTable).where(eq(grnItemsTable.grnId, grnId));
    const inventoryItems = items.filter((item) => item.itemId != null && item.acceptedQty > 0);

    if (inventoryItems.length === 0) {
      console.log(`[AUTO:PROCUREMENT] GRN ${grn.grnNumber}: no inventory items to receive`);
      return { stockUpdates: 0 };
    }

    const locationId = grn.receivedAtLocationId;
    let stockUpdates = 0;

    for (const item of inventoryItems) {
      const qty = item.acceptedQty;
      if (qty <= 0) continue;

      if (locationId) {
        const ledgerRows = await tx.execute(
          sql`SELECT id, quantity FROM stock_ledger WHERE item_id = ${item.itemId!} AND location_id = ${locationId} FOR UPDATE`
        );
        const ledger = (ledgerRows as any).rows?.[0] || (ledgerRows as any)[0];

        if (ledger) {
          await tx.update(stockLedgerTable).set({
            quantity: sql`${stockLedgerTable.quantity} + ${qty}`,
            updatedAt: new Date(),
          }).where(eq(stockLedgerTable.id, ledger.id));
        } else {
          await tx.insert(stockLedgerTable).values({
            itemId: item.itemId!,
            locationId,
            quantity: qty,
          });
        }
      }

      await tx.update(inventoryCatalogTable).set({
        globalStock: sql`${inventoryCatalogTable.globalStock} + ${qty}`,
      }).where(eq(inventoryCatalogTable.id, item.itemId!));

      await tx.insert(stockMovementsTable).values({
        itemId: item.itemId!,
        movementType: "Inward",
        quantity: qty,
        fromLocationId: undefined,
        toLocationId: locationId || undefined,
        referenceNumber: grn.grnNumber,
        notes: `Received via GRN ${grn.grnNumber} from ${grn.vendorName}`,
        performedBy: grn.receivedBy || "System",
        movementDate: grn.receivedDate || new Date(),
      });

      stockUpdates++;
    }

    console.log(`[AUTO:PROCUREMENT] GRN ${grn.grnNumber} accepted → ${stockUpdates} stock update(s)`);
    return { stockUpdates };
  };

  if (externalTx) return await run(externalTx);
  return await db.transaction(async (tx) => run(tx as any));
}

export async function triggerInvoiceMatched(
  invoiceId: number,
  externalTx?: TxOrDb,
): Promise<{ journalEntryId: number; apId: number } | null> {
  const run = async (tx: TxOrDb) => {
    const [invoice] = await tx.select().from(purchaseInvoicesTable).where(eq(purchaseInvoicesTable.id, invoiceId));
    if (!invoice) throw new Error("Purchase invoice not found");

    if (invoice.matchStatus !== "Matched") return null;
    if (invoice.journalEntryId) {
      console.log(`[AUTO:PROCUREMENT] Invoice ${invoice.invoiceNumber}: already has JE (idempotency guard)`);
      return null;
    }

    const accts = await ensureProcurementAccounts(tx);

    const totalAmount = parseFloat(invoice.invoiceAmount?.toString() || "0");
    const taxableAmount = parseFloat(invoice.taxableAmount?.toString() || "0") || totalAmount;
    const cgst = parseFloat(invoice.cgstAmount?.toString() || "0");
    const sgst = parseFloat(invoice.sgstAmount?.toString() || "0");
    const igst = parseFloat(invoice.igstAmount?.toString() || "0");

    const netTaxable = totalAmount - cgst - sgst - igst;
    const inventoryDebit = netTaxable > 0 ? netTaxable : taxableAmount;

    const lines: { accountId: number; accountName: string; accountCode: string; debit: number; credit: number; memo: string }[] = [];

    lines.push({
      accountId: accts.inventoryStock,
      accountName: "Inventory / Stock-in-Hand",
      accountCode: "1200",
      debit: inventoryDebit,
      credit: 0,
      memo: `Inventory for ${invoice.invoiceNumber}`,
    });

    if (cgst > 0) {
      lines.push({
        accountId: accts.cgstInput,
        accountName: "CGST Input Credit",
        accountCode: "1130",
        debit: cgst,
        credit: 0,
        memo: `CGST input on ${invoice.invoiceNumber}`,
      });
    }
    if (sgst > 0) {
      lines.push({
        accountId: accts.sgstInput,
        accountName: "SGST Input Credit",
        accountCode: "1131",
        debit: sgst,
        credit: 0,
        memo: `SGST input on ${invoice.invoiceNumber}`,
      });
    }
    if (igst > 0) {
      lines.push({
        accountId: accts.igstInput,
        accountName: "IGST Input Credit",
        accountCode: "1132",
        debit: igst,
        credit: 0,
        memo: `IGST input on ${invoice.invoiceNumber}`,
      });
    }

    lines.push({
      accountId: accts.accountsPayable,
      accountName: "Accounts Payable",
      accountCode: "2100",
      debit: 0,
      credit: totalAmount,
      memo: `AP for ${invoice.invoiceNumber} (${invoice.vendorName})`,
    });

    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`[AUTO:PROCUREMENT] Invoice ${invoice.invoiceNumber}: JE unbalanced (D:${totalDebit} C:${totalCredit})`);
    }

    const [journalEntry] = await tx.insert(journalEntriesTable).values({
      entryDate: invoice.invoiceDate || new Date(),
      reference: `AUTO:PURCHASE:${invoice.invoiceNumber}`,
      description: `Purchase invoice ${invoice.invoiceNumber} from ${invoice.vendorName}`,
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
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

    const billDate = invoice.invoiceDate || new Date();
    const dueDays = invoice.paymentDueDays || 30;
    const dueDate = new Date(billDate.getTime() + dueDays * 86400000);

    const [apRecord] = await tx.insert(accountsPayableTable).values({
      vendorName: invoice.vendorName,
      billNumber: invoice.invoiceNumber,
      billDate,
      dueDate,
      amount: totalAmount.toFixed(2),
      paidAmount: "0",
      status: "Pending",
      entryType: "Bill",
      notes: `Auto-created from purchase invoice ${invoice.invoiceNumber}`,
    }).returning();

    await tx.update(purchaseInvoicesTable).set({
      journalEntryId: journalEntry.id,
      paymentStatus: "Approved",
    }).where(eq(purchaseInvoicesTable.id, invoiceId));

    console.log(`[AUTO:PROCUREMENT] Invoice ${invoice.invoiceNumber} → JE#${journalEntry.id}, AP#${apRecord.id} (₹${totalAmount})`);
    return { journalEntryId: journalEntry.id, apId: apRecord.id };
  };

  if (externalTx) return await run(externalTx);
  return await db.transaction(async (tx) => run(tx as any));
}

export async function triggerPurchaseReturn(
  returnId: number,
  externalTx?: TxOrDb,
): Promise<{ journalEntryId: number; stockReversed: boolean } | null> {
  const run = async (tx: TxOrDb) => {
    const [ret] = await tx.select().from(purchaseReturnsTable).where(eq(purchaseReturnsTable.id, returnId));
    if (!ret) throw new Error("Purchase return not found");

    if (ret.status !== "Sent") return null;
    if (ret.journalEntryId) {
      console.log(`[AUTO:PROCUREMENT] Return ${ret.returnNumber}: already has JE (idempotency guard)`);
      return null;
    }

    let stockReversed = false;
    if (ret.itemId && ret.returnedQty > 0) {
      const qty = ret.returnedQty;
      const locationId = ret.locationId;

      if (locationId) {
        const ledgerRows = await tx.execute(
          sql`SELECT id, quantity FROM stock_ledger WHERE item_id = ${ret.itemId} AND location_id = ${locationId} FOR UPDATE`
        );
        const ledger = (ledgerRows as any).rows?.[0] || (ledgerRows as any)[0];
        const available = ledger?.quantity ?? 0;

        if (available < qty) {
          const [catalogItem] = await tx.select().from(inventoryCatalogTable).where(eq(inventoryCatalogTable.id, ret.itemId));
          throw new Error(`Insufficient stock for return: ${catalogItem?.name || `item #${ret.itemId}`}. Available: ${available}, Returning: ${qty}`);
        }

        await tx.update(stockLedgerTable).set({
          quantity: sql`${stockLedgerTable.quantity} - ${qty}`,
          updatedAt: new Date(),
        }).where(and(
          eq(stockLedgerTable.itemId, ret.itemId),
          eq(stockLedgerTable.locationId, locationId),
        ));
      }

      await tx.update(inventoryCatalogTable).set({
        globalStock: sql`${inventoryCatalogTable.globalStock} - ${qty}`,
      }).where(eq(inventoryCatalogTable.id, ret.itemId));

      await tx.insert(stockMovementsTable).values({
        itemId: ret.itemId,
        movementType: "Outward",
        quantity: qty,
        fromLocationId: locationId || undefined,
        toLocationId: undefined,
        referenceNumber: ret.returnNumber,
        notes: `Purchase return ${ret.returnNumber} to ${ret.vendorName}`,
        performedBy: "System",
        movementDate: ret.returnDate || new Date(),
      });

      stockReversed = true;
    }

    const returnAmount = parseFloat(ret.returnAmount?.toString() || "0");
    const cgst = parseFloat(ret.cgstAmount?.toString() || "0");
    const sgst = parseFloat(ret.sgstAmount?.toString() || "0");
    const igst = parseFloat(ret.igstAmount?.toString() || "0");
    const totalAmount = returnAmount > 0 ? returnAmount : (ret.returnedQty * 100);
    const netTaxable = totalAmount - cgst - sgst - igst;

    if (totalAmount > 0) {
      const accts = await ensureProcurementAccounts(tx);
      const lines: { accountId: number; accountName: string; accountCode: string; debit: number; credit: number; memo: string }[] = [];

      lines.push({
        accountId: accts.accountsPayable,
        accountName: "Accounts Payable",
        accountCode: "2100",
        debit: totalAmount,
        credit: 0,
        memo: `Debit note ${ret.returnNumber} (reduces AP)`,
      });

      lines.push({
        accountId: accts.inventoryStock,
        accountName: "Inventory / Stock-in-Hand",
        accountCode: "1200",
        debit: 0,
        credit: netTaxable,
        memo: `Inventory reversal for ${ret.returnNumber}`,
      });

      if (cgst > 0) {
        lines.push({
          accountId: accts.cgstInput,
          accountName: "CGST Input Credit",
          accountCode: "1130",
          debit: 0,
          credit: cgst,
          memo: `CGST reversal on ${ret.returnNumber}`,
        });
      }
      if (sgst > 0) {
        lines.push({
          accountId: accts.sgstInput,
          accountName: "SGST Input Credit",
          accountCode: "1131",
          debit: 0,
          credit: sgst,
          memo: `SGST reversal on ${ret.returnNumber}`,
        });
      }
      if (igst > 0) {
        lines.push({
          accountId: accts.igstInput,
          accountName: "IGST Input Credit",
          accountCode: "1132",
          debit: 0,
          credit: igst,
          memo: `IGST reversal on ${ret.returnNumber}`,
        });
      }

      const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
      const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`[AUTO:PROCUREMENT] Return ${ret.returnNumber}: JE unbalanced (D:${totalDebit} C:${totalCredit})`);
      }

      const [journalEntry] = await tx.insert(journalEntriesTable).values({
        entryDate: ret.returnDate || new Date(),
        reference: `AUTO:PURCHASE:DN-${ret.returnNumber}`,
        description: `Debit note ${ret.returnNumber} for ${ret.vendorName}`,
        totalDebit: totalDebit.toFixed(2),
        totalCredit: totalCredit.toFixed(2),
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

      const [apRecord] = await tx.insert(accountsPayableTable).values({
        vendorName: ret.vendorName,
        billNumber: `DN-${ret.returnNumber}`,
        billDate: ret.returnDate || new Date(),
        dueDate: ret.returnDate || new Date(),
        amount: (-totalAmount).toFixed(2),
        paidAmount: "0",
        status: "Pending",
        entryType: "Debit Note",
        notes: `Debit note from purchase return ${ret.returnNumber}`,
      }).returning();

      await tx.update(purchaseReturnsTable).set({
        journalEntryId: journalEntry.id,
      }).where(eq(purchaseReturnsTable.id, returnId));

      console.log(`[AUTO:PROCUREMENT] Return ${ret.returnNumber} → JE#${journalEntry.id}, AP(DN)#${apRecord.id}, stock reversed: ${stockReversed}`);
      return { journalEntryId: journalEntry.id, stockReversed };
    }

    console.log(`[AUTO:PROCUREMENT] Return ${ret.returnNumber}: no amount, stock reversed: ${stockReversed}`);
    return { journalEntryId: 0, stockReversed };
  };

  if (externalTx) return await run(externalTx);
  return await db.transaction(async (tx) => run(tx as any));
}
