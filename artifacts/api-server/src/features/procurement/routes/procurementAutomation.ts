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

async function ensureProcurementAccounts(): Promise<ProcurementAccounts> {
  const existing = await chartOfAccountsTable.find().lean();
  const map: Record<string, number> = {};

  for (const req of PROCUREMENT_ACCOUNTS) {
    let found: any = existing.find((a: any) => a.accountName === req.name) || existing.find((a: any) => a.accountCode === req.code);
    if (!found) {
      const created = await chartOfAccountsTable.create({
        accountCode: req.code,
        accountName: req.name,
        accountType: req.type,
        currentBalance: "0",
        description: `${req.name} account`,
        isActive: "Yes",
      });
      found = created.toObject();
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

async function updateAccountBalance(accountId: number, debitAmt: number, creditAmt: number) {
  const netChange = debitAmt - creditAmt;
  await chartOfAccountsTable.findOneAndUpdate({ id: accountId }, { $inc: { currentBalance: netChange } });
}

export async function triggerGrnAccepted(grnId: number): Promise<{ stockUpdates: number } | null> {
  const grn = await goodsReceiptsTable.findOne({ id: grnId }).lean();
  if (!grn) throw new Error("GRN not found");
  if (!["Complete", "Partial"].includes((grn as any).status)) return null;

  const existingMovements = await stockMovementsTable.countDocuments({ referenceNumber: (grn as any).grnNumber });
  if (existingMovements > 0) {
    return null;
  }

  const items = await grnItemsTable.find({ grnId }).lean();
  const inventoryItems = items.filter((item: any) => item.itemId != null && item.acceptedQty > 0);

  if (inventoryItems.length === 0) {
    return { stockUpdates: 0 };
  }

  const locationId = (grn as any).receivedAtLocationId;
  let stockUpdates = 0;

  for (const item of inventoryItems) {
    const qty = (item as any).acceptedQty;
    if (qty <= 0) continue;

    if (locationId) {
      const ledger = await stockLedgerTable.findOne({ itemId: (item as any).itemId, locationId }).lean();
      if (ledger) {
        await stockLedgerTable.findOneAndUpdate({ id: (ledger as any).id }, { $inc: { quantity: qty }, $set: { updatedAt: new Date() } });
      } else {
        await stockLedgerTable.create({ itemId: (item as any).itemId, locationId, quantity: qty });
      }
    }

    await inventoryCatalogTable.findOneAndUpdate({ id: (item as any).itemId }, { $inc: { globalStock: qty } });

    await stockMovementsTable.create({
      itemId: (item as any).itemId,
      movementType: "Inward",
      quantity: qty,
      toLocationId: locationId || undefined,
      referenceNumber: (grn as any).grnNumber,
      notes: `Received via GRN ${(grn as any).grnNumber} from ${(grn as any).vendorName}`,
      performedBy: (grn as any).receivedBy || "System",
      movementDate: (grn as any).receivedDate || new Date(),
    });

    stockUpdates++;
  }

  return { stockUpdates };
}

export async function triggerInvoiceMatched(invoiceId: number): Promise<{ journalEntryId: number; apId: number } | null> {
  const invoice = await purchaseInvoicesTable.findOne({ id: invoiceId }).lean();
  if (!invoice) throw new Error("Purchase invoice not found");
  if ((invoice as any).matchStatus !== "Matched") return null;
  if ((invoice as any).journalEntryId) {
    return null;
  }

  const accts = await ensureProcurementAccounts();

  const totalAmount = parseFloat((invoice as any).invoiceAmount?.toString() || "0");
  const taxableAmount = parseFloat((invoice as any).taxableAmount?.toString() || "0") || totalAmount;
  const cgst = parseFloat((invoice as any).cgstAmount?.toString() || "0");
  const sgst = parseFloat((invoice as any).sgstAmount?.toString() || "0");
  const igst = parseFloat((invoice as any).igstAmount?.toString() || "0");
  const netTaxable = totalAmount - cgst - sgst - igst;
  const inventoryDebit = netTaxable > 0 ? netTaxable : taxableAmount;

  const lines: any[] = [
    { accountId: accts.inventoryStock, accountName: "Inventory / Stock-in-Hand", accountCode: "1200", debit: inventoryDebit, credit: 0, memo: `Inventory for ${(invoice as any).invoiceNumber}` },
  ];
  if (cgst > 0) lines.push({ accountId: accts.cgstInput, accountName: "CGST Input Credit", accountCode: "1130", debit: cgst, credit: 0, memo: `CGST input on ${(invoice as any).invoiceNumber}` });
  if (sgst > 0) lines.push({ accountId: accts.sgstInput, accountName: "SGST Input Credit", accountCode: "1131", debit: sgst, credit: 0, memo: `SGST input on ${(invoice as any).invoiceNumber}` });
  if (igst > 0) lines.push({ accountId: accts.igstInput, accountName: "IGST Input Credit", accountCode: "1132", debit: igst, credit: 0, memo: `IGST input on ${(invoice as any).invoiceNumber}` });
  lines.push({ accountId: accts.accountsPayable, accountName: "Accounts Payable", accountCode: "2100", debit: 0, credit: totalAmount, memo: `AP for ${(invoice as any).invoiceNumber} (${(invoice as any).vendorName})` });

  const totalDebit = lines.reduce((s: number, l: any) => s + l.debit, 0);
  const totalCredit = lines.reduce((s: number, l: any) => s + l.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) throw new Error(`Purchase invoice ${(invoice as any).invoiceNumber}: Journal entry amounts do not balance`);

  const journalEntry = await journalEntriesTable.create({
    entryDate: (invoice as any).invoiceDate || new Date(),
    reference: `PURCH:${(invoice as any).invoiceNumber}`,
    description: `Purchase invoice ${(invoice as any).invoiceNumber} from ${(invoice as any).vendorName}`,
    totalDebit: totalDebit.toFixed(2),
    totalCredit: totalCredit.toFixed(2),
    status: "Posted",
  });

  await journalLinesTable.insertMany(lines.map((line: any) => ({
    journalEntryId: journalEntry.id,
    accountId: line.accountId,
    accountCode: line.accountCode,
    accountName: line.accountName,
    debit: line.debit.toFixed(2),
    credit: line.credit.toFixed(2),
    memo: line.memo,
  })));

  for (const line of lines) await updateAccountBalance(line.accountId, line.debit, line.credit);

  const billDate = (invoice as any).invoiceDate || new Date();
  const dueDays = (invoice as any).paymentDueDays || 30;
  const dueDate = new Date(billDate.getTime() + dueDays * 86400000);

  const apRecord = await accountsPayableTable.create({
    vendorName: (invoice as any).vendorName,
    billNumber: (invoice as any).invoiceNumber,
    billDate, dueDate,
    amount: totalAmount.toFixed(2),
    paidAmount: "0",
    status: "Pending",
    entryType: "Bill",
    notes: `From invoice ${(invoice as any).invoiceNumber}`,
  });

  await purchaseInvoicesTable.findOneAndUpdate({ id: invoiceId }, { $set: { journalEntryId: journalEntry.id, paymentStatus: "Approved" } });

  return { journalEntryId: journalEntry.id, apId: apRecord.id };
}

export async function triggerPurchaseReturn(returnId: number): Promise<{ journalEntryId: number; stockReversed: boolean } | null> {
  const ret = await purchaseReturnsTable.findOne({ id: returnId }).lean();
  if (!ret) throw new Error("Purchase return not found");
  if ((ret as any).status !== "Sent") return null;
  if ((ret as any).journalEntryId) {
    return null;
  }

  let stockReversed = false;
  if ((ret as any).itemId && (ret as any).returnedQty > 0) {
    const qty = (ret as any).returnedQty;
    const locationId = (ret as any).locationId;

    if (locationId) {
      const ledger = await stockLedgerTable.findOne({ itemId: (ret as any).itemId, locationId }).lean();
      const available = (ledger as any)?.quantity ?? 0;
      if (available < qty) {
        const catalogItem = await inventoryCatalogTable.findOne({ id: (ret as any).itemId }).lean();
        throw new Error(`Insufficient stock for return: ${(catalogItem as any)?.name || `item #${(ret as any).itemId}`}. Available: ${available}, Returning: ${qty}`);
      }
      await stockLedgerTable.findOneAndUpdate(
        { itemId: (ret as any).itemId, locationId },
        { $inc: { quantity: -qty }, $set: { updatedAt: new Date() } }
      );
    }

    await inventoryCatalogTable.findOneAndUpdate({ id: (ret as any).itemId }, { $inc: { globalStock: -qty } });
    await stockMovementsTable.create({
      itemId: (ret as any).itemId,
      movementType: "Outward",
      quantity: qty,
      fromLocationId: locationId || undefined,
      referenceNumber: (ret as any).returnNumber,
      notes: `Purchase return ${(ret as any).returnNumber}`,
      performedBy: "System",
      movementDate: (ret as any).returnDate || new Date(),
    });
    stockReversed = true;
  }

  const returnAmount = parseFloat((ret as any).returnAmount?.toString() || "0");
  const cgst = parseFloat((ret as any).cgstAmount?.toString() || "0");
  const sgst = parseFloat((ret as any).sgstAmount?.toString() || "0");
  const igst = parseFloat((ret as any).igstAmount?.toString() || "0");
  const totalAmount = returnAmount > 0 ? returnAmount : ((ret as any).returnedQty * 100);
  const netTaxable = totalAmount - cgst - sgst - igst;

  if (totalAmount > 0) {
    const accts = await ensureProcurementAccounts();
    const lines: any[] = [
      { accountId: accts.accountsPayable, accountName: "Accounts Payable", accountCode: "2100", debit: totalAmount, credit: 0, memo: `Debit note ${(ret as any).returnNumber} (reduces AP)` },
      { accountId: accts.inventoryStock, accountName: "Inventory / Stock-in-Hand", accountCode: "1200", debit: 0, credit: netTaxable, memo: `Inventory reversal for ${(ret as any).returnNumber}` },
    ];
    if (cgst > 0) lines.push({ accountId: accts.cgstInput, accountName: "CGST Input Credit", accountCode: "1130", debit: 0, credit: cgst, memo: `CGST reversal on ${(ret as any).returnNumber}` });
    if (sgst > 0) lines.push({ accountId: accts.sgstInput, accountName: "SGST Input Credit", accountCode: "1131", debit: 0, credit: sgst, memo: `SGST reversal on ${(ret as any).returnNumber}` });
    if (igst > 0) lines.push({ accountId: accts.igstInput, accountName: "IGST Input Credit", accountCode: "1132", debit: 0, credit: igst, memo: `IGST reversal on ${(ret as any).returnNumber}` });

    const totalDebit = lines.reduce((s: number, l: any) => s + l.debit, 0);
    const totalCredit = lines.reduce((s: number, l: any) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) throw new Error(`[AUTO:PROCUREMENT] Return ${(ret as any).returnNumber}: JE unbalanced (D:${totalDebit} C:${totalCredit})`);

    const journalEntry = await journalEntriesTable.create({
      entryDate: (ret as any).returnDate || new Date(),
      reference: `AUTO:PURCHASE:DN-${(ret as any).returnNumber}`,
      description: `Debit note ${(ret as any).returnNumber} for ${(ret as any).vendorName}`,
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
      status: "Posted",
    });

    await journalLinesTable.insertMany(lines.map((line: any) => ({
      journalEntryId: journalEntry.id,
      accountId: line.accountId,
      accountCode: line.accountCode,
      accountName: line.accountName,
      debit: line.debit.toFixed(2),
      credit: line.credit.toFixed(2),
      memo: line.memo,
    })));

    for (const line of lines) await updateAccountBalance(line.accountId, line.debit, line.credit);

    await accountsPayableTable.create({
      vendorName: (ret as any).vendorName,
      billNumber: `DN-${(ret as any).returnNumber}`,
      billDate: (ret as any).returnDate || new Date(),
      dueDate: (ret as any).returnDate || new Date(),
      amount: (-totalAmount).toFixed(2),
      paidAmount: "0",
      status: "Pending",
      entryType: "Debit Note",
      notes: `Debit note from purchase return ${(ret as any).returnNumber}`,
    });

    await purchaseReturnsTable.findOneAndUpdate({ id: returnId }, { $set: { journalEntryId: journalEntry.id } });

    console.log(`[AUTO:PROCUREMENT] Return ${(ret as any).returnNumber} => JE#${journalEntry.id}, stock reversed: ${stockReversed}`);
    return { journalEntryId: journalEntry.id, stockReversed };
  }

  console.log(`[AUTO:PROCUREMENT] Return ${(ret as any).returnNumber}: no amount, stock reversed: ${stockReversed}`);
  return { journalEntryId: 0, stockReversed };
}
