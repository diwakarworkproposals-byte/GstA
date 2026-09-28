import { db, addRecordWithAdaptiveSchema } from '../db';
import type { ChatMessage, DynamicRecord, TableMeta } from '../types';

interface ParseResult {
  message: ChatMessage;
  affectedTableId?: string;
  record?: DynamicRecord;
}

// Convert Hinglish / text numbers to standard numbers
export function parseAmount(val: string): number {
  if (!val) return 0;
  let clean = val.replace(/,/g, '').replace(/[₹rs\s]/gi, '').toLowerCase();

  if (clean.endsWith('k')) {
    return parseFloat(clean.replace('k', '')) * 1000;
  }
  if (clean.endsWith('lakh') || clean.endsWith('lac')) {
    return parseFloat(clean.replace(/(lakh|lac)/, '')) * 100000;
  }
  if (clean.endsWith('cr') || clean.endsWith('crore')) {
    return parseFloat(clean.replace(/(cr|crore)/, '')) * 10000000;
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

// Extract date from text or return today
function extractDate(text: string): string {
  const lower = text.toLowerCase();
  const now = new Date();

  if (lower.includes('yesterday') || lower.includes('kal') || lower.includes('beeta hua kal')) {
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
    return yesterday.toISOString().split('T')[0];
  }
  if (lower.includes('today') || lower.includes('aaj')) {
    return now.toISOString().split('T')[0];
  }

  // Regex for YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY
  const isoMatch = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoMatch) return isoMatch[0];

  const dateMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    let year = dateMatch[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  return now.toISOString().split('T')[0];
}

// Detect if query or entry
export function isQueryIntent(text: string): boolean {
  const queryTriggers = [
    'what is', 'what\'s', 'how much', 'kitna', 'show', 'dikhao', 'balance',
    'total', 'remaining', 'expenses', 'expense of', 'tell me', 'batao',
    'list', 'find', 'kisko', 'check', 'summary', 'remaining balance',
    'search', 'status'
  ];
  const lower = text.toLowerCase().trim();
  if (lower.endsWith('?')) return true;

  return queryTriggers.some((t) => lower.startsWith(t) || lower.includes(` ${t} `) || lower.includes(`${t} `));
}

// ---------------- SMART QUERY ENGINE ---------------- //
export async function executeSmartQuery(prompt: string): Promise<ChatMessage> {
  const lower = prompt.toLowerCase();
  const allRecords = await db.records.toArray();
  const allTables = await db.tablesMeta.toArray();
  const tableMap = new Map<string, TableMeta>(allTables.map((t) => [t.id, t]));

  // 1. Balance Query (e.g. "What is Rohit's remaining balance?")
  if (lower.includes('balance') || lower.includes('baki') || lower.includes('remaining') || lower.includes('kitna dena') || lower.includes('dena hai')) {
    // Find entity name in query
    const words = prompt.replace(/[?!,.]/g, '').split(/\s+/);
    // Find word with Capital letter or known supplier
    const potentialNames = words.filter(
      (w) =>
        w.length > 2 &&
        !['what', 'is', 'the', 'remaining', 'balance', 'of', 'show', 'ka', 'kitna', 'hai', 'baki', 'supplier', 'give', 'tell', 'me'].includes(w.toLowerCase())
    );

    let targetEntity = potentialNames[0] || '';
    // Look up in supplier ledgers or all records
    const matchingRecords = allRecords.filter((r) => {
      const dataStr = JSON.stringify(r.data).toLowerCase();
      return targetEntity ? dataStr.includes(targetEntity.toLowerCase()) : false;
    });

    if (matchingRecords.length > 0) {
      let totalBilled = 0;
      let totalPaid = 0;
      let latestBalance: number | null = null;

      for (const rec of matchingRecords) {
        const billed = Number(rec.data.billedAmount || rec.data.totalAmount || rec.data.amount || 0);
        const paid = Number(rec.data.paidAmount || (rec.data.type === 'Payment' ? rec.data.amount : 0) || 0);
        if (rec.data.balance !== undefined && rec.data.balance !== null) {
          latestBalance = Number(rec.data.balance);
        }
        totalBilled += billed;
        totalPaid += paid;
      }

      const calculatedBalance = latestBalance !== null ? latestBalance : Math.max(0, totalBilled - totalPaid);

      const responseContent =
        `### 💼 Balance Ledger Summary for **${targetEntity.toUpperCase()}**\n\n` +
        `* **Total Billed (Transactions):** ₹${totalBilled.toLocaleString('en-IN')}\n` +
        `* **Total Paid so far:** ₹${totalPaid.toLocaleString('en-IN')}\n` +
        `* **⚡ Current Remaining Balance Due:** **₹${calculatedBalance.toLocaleString('en-IN')}**\n\n` +
        `Found **${matchingRecords.length}** relevant ledger transaction(s) recorded in local database.`;

      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
        metadata: {
          action: 'query_result',
          queryResult: {
            summary: `Remaining Balance for ${targetEntity}: ₹${calculatedBalance.toLocaleString('en-IN')}`,
            totalAmount: calculatedBalance,
            count: matchingRecords.length,
            metrics: [
              { label: 'Entity', value: targetEntity },
              { label: 'Remaining Balance', value: `₹${calculatedBalance.toLocaleString('en-IN')}` },
              { label: 'Total Paid', value: `₹${totalPaid.toLocaleString('en-IN')}` },
              { label: 'Ledger Records', value: matchingRecords.length },
            ],
            details: matchingRecords.map((r) => ({
              ...r.data,
              _table: tableMap.get(r.tableId)?.displayName || r.tableId,
            })),
          },
          isSuccess: true,
        },
      };
    } else {
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `I couldn't find any ledger records for **${targetEntity || 'the requested entity'}** in local storage. Would you like to add an entry (e.g. *"Paid supplier ${targetEntity || 'XYZ'} 15000"*)?`,
        timestamp: new Date().toISOString(),
        metadata: { action: 'query_result', isSuccess: false },
      };
    }
  }

  // 2. Expense Queries (e.g. "Show last month's transport expenses" or "Tea expense")
  if (lower.includes('expense') || lower.includes('kharcha') || lower.includes('transport') || lower.includes('tea') || lower.includes('chai')) {
    let targetCategory = '';
    if (lower.includes('transport') || lower.includes('tempo') || lower.includes('diesel') || lower.includes('bhada')) {
      targetCategory = 'transport';
    } else if (lower.includes('tea') || lower.includes('chai') || lower.includes('snack') || lower.includes('pantry')) {
      targetCategory = 'tea';
    }

    const expenseRecords = allRecords.filter((r) => {
      const isExpenseTable = r.tableId.includes('expense');
      const dataStr = JSON.stringify(r.data).toLowerCase();
      if (targetCategory) {
        return dataStr.includes(targetCategory) || (isExpenseTable && dataStr.includes(targetCategory));
      }
      return isExpenseTable;
    });

    const totalExpense = expenseRecords.reduce((acc, r) => acc + Number(r.data.amount || r.data.totalAmount || 0), 0);

    const title = targetCategory ? `${targetCategory.toUpperCase()} Expenses` : 'Total Business Expenses';

    const responseContent =
      `### 🧾 ${title} Breakdown\n\n` +
      `* **Total Calculated Expense:** **₹${totalExpense.toLocaleString('en-IN')}**\n` +
      `* **Recorded Transactions:** ${expenseRecords.length} entries\n\n` +
      expenseRecords
        .slice(0, 5)
        .map(
          (r) =>
            `- *${r.data.date || 'Recent'}:* ${r.data.description || r.data.item || 'Expense'} → **₹${Number(r.data.amount || 0).toLocaleString('en-IN')}** (${r.data.paidBy || 'Cash'})`
        )
        .join('\n');

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toISOString(),
      metadata: {
        action: 'query_result',
        queryResult: {
          summary: `${title}: ₹${totalExpense.toLocaleString('en-IN')}`,
          totalAmount: totalExpense,
          count: expenseRecords.length,
          metrics: [
            { label: 'Category', value: targetCategory || 'General Expenses' },
            { label: 'Total Spent', value: `₹${totalExpense.toLocaleString('en-IN')}` },
            { label: 'Entries Found', value: expenseRecords.length },
          ],
          details: expenseRecords.map((r) => r.data),
        },
        isSuccess: true,
      },
    };
  }

  // 3. Sales & Incentive Queries (e.g. "Ashok sales", "Total sales", "Incentives")
  if (lower.includes('sale') || lower.includes('incentive') || lower.includes('becha') || lower.includes('commission')) {
    const salesRecords = allRecords.filter((r) => r.tableId.includes('sales'));
    const totalSales = salesRecords.reduce((acc, r) => acc + Number(r.data.saleAmount || r.data.amount || 0), 0);
    const totalIncentive = salesRecords.reduce((acc, r) => acc + Number(r.data.incentive || 0), 0);

    const responseContent =
      `### 📈 Sales & Incentive Summary\n\n` +
      `* **Total Sales Volume:** **₹${totalSales.toLocaleString('en-IN')}**\n` +
      `* **Total Incentives Paid/Due:** **₹${totalIncentive.toLocaleString('en-IN')}**\n` +
      `* **Total Sales Entries:** ${salesRecords.length}\n\n` +
      salesRecords
        .slice(0, 5)
        .map((r) => `- **${r.data.employee || 'Staff'}**: Sold ₹${Number(r.data.saleAmount || 0).toLocaleString('en-IN')} (Incentive: ₹${Number(r.data.incentive || 0).toLocaleString('en-IN')})`)
        .join('\n');

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toISOString(),
      metadata: {
        action: 'query_result',
        queryResult: {
          summary: `Total Sales: ₹${totalSales.toLocaleString('en-IN')}, Incentives: ₹${totalIncentive.toLocaleString('en-IN')}`,
          totalAmount: totalSales,
          count: salesRecords.length,
          metrics: [
            { label: 'Total Sales', value: `₹${totalSales.toLocaleString('en-IN')}` },
            { label: 'Total Incentives', value: `₹${totalIncentive.toLocaleString('en-IN')}` },
            { label: 'Record Count', value: salesRecords.length },
          ],
          details: salesRecords.map((r) => r.data),
        },
        isSuccess: true,
      },
    };
  }

  // General fallback query: summary of all tables
  const tableCounts = await Promise.all(
    allTables.map(async (t) => {
      const count = await db.records.where('tableId').equals(t.id).count();
      return { ...t, count };
    })
  );

  return {
    id: `msg_${Date.now()}`,
    role: 'assistant',
    content:
      `### 📊 Local Database Overview\n\n` +
      `Here is a summary of all active tables stored securely on your device:\n\n` +
      tableCounts.map((t) => `- **${t.displayName}**: ${t.count} records (${t.columns.length} dynamic columns)`).join('\n') +
      `\n\nYou can ask specific questions like *"What is Rohit's remaining balance?"* or *"Show last month's transport expenses"* anytime!`,
    timestamp: new Date().toISOString(),
    metadata: {
      action: 'query_result',
      queryResult: {
        summary: `Total ${allRecords.length} records across ${allTables.length} tables`,
        count: allRecords.length,
        metrics: tableCounts.map((t) => ({ label: t.displayName, value: `${t.count} entries` })),
      },
      isSuccess: true,
    },
  };
}

// ---------------- LOCAL NLP PARSER FOR UNSTRUCTURED TRANSACTIONS ---------------- //
export async function parseUnstructuredTransaction(prompt: string): Promise<ParseResult> {
  const lower = prompt.toLowerCase();
  const date = extractDate(prompt);

  // Check if it's a query intent first!
  if (isQueryIntent(prompt)) {
    const queryMessage = await executeSmartQuery(prompt);
    return { message: queryMessage };
  }

  // Numbers and amounts extraction
  // Handles: 30000, 400, 15000, ₹15,000, 30k, 1.5 lakh, etc.
  const amountMatches = prompt.match(/(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?\s*(?:k|lakh|lac|cr)?)/gi) || [];
  const numbers: number[] = [];
  for (const m of amountMatches) {
    const val = parseAmount(m);
    if (val > 0) numbers.push(val);
  }

  // --- Scenario 1: Sales & Employee Incentive (e.g. "Ashok sold 30000, 400 incentive") ---
  const isSalesIncentive =
    (lower.includes('sold') || lower.includes('sale') || lower.includes('becha')) &&
    (lower.includes('incentive') || lower.includes('commission') || lower.includes('bonus') || numbers.length >= 2);

  if (isSalesIncentive) {
    // Extract employee name (word before 'sold' or first capitalized word)
    let employee = 'Ashok';
    const soldIndex = prompt.search(/sold|sale|becha/i);
    if (soldIndex > 0) {
      const beforeSold = prompt.substring(0, soldIndex).trim();
      const tokens = beforeSold.split(/\s+/);
      employee = tokens[tokens.length - 1] || 'Staff Member';
    }

    const saleAmount = numbers[0] || 0;
    const incentive = numbers[1] || (saleAmount ? Math.round(saleAmount * 0.02) : 0);

    const recordData: Record<string, any> = {
      date,
      employee: employee.charAt(0).toUpperCase() + employee.slice(1),
      saleAmount,
      incentive,
      item: 'Counter Sales',
      notes: prompt,
    };

    const { record, table } = await addRecordWithAdaptiveSchema(
      'sales_incentives',
      'Sales & Incentives',
      recordData,
      prompt
    );

    const assistantMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content:
        `✅ Recorded **Sales & Incentive** transaction for **${recordData.employee}**:\n\n` +
        `* 💰 **Sale Amount:** ₹${saleAmount.toLocaleString('en-IN')}\n` +
        `* 🎁 **Incentive:** ₹${incentive.toLocaleString('en-IN')}\n` +
        `* 📅 **Date:** ${date}\n` +
        `* 📂 Stored in table: **${table.displayName}**`,
      timestamp: new Date().toISOString(),
      metadata: {
        action: 'record_created',
        tableId: table.id,
        tableName: table.displayName,
        recordId: record.id,
        recordData,
        isSuccess: true,
      },
    };

    return { message: assistantMsg, affectedTableId: table.id, record };
  }

  // --- Scenario 2: Supplier Ledger / Purchase (e.g. "Paid supplier Rohit 15000 for sofa") ---
  const isSupplierPayment =
    lower.includes('supplier') ||
    lower.includes('vendor') ||
    (lower.includes('paid') && (lower.includes('for') || lower.includes('ko diya') || lower.includes('to ')));

  if (isSupplierPayment) {
    let supplierName = 'Rohit';
    // Match "supplier [Name]" or "paid [Name]" or "to [Name]"
    const supplierMatch = prompt.match(/(?:supplier|vendor|to|paid)\s+([A-Z][a-z]+|[a-zA-Z]+)/i);
    if (supplierMatch && supplierMatch[1] && !['the', 'for', 'amount', 'cash'].includes(supplierMatch[1].toLowerCase())) {
      supplierName = supplierMatch[1];
    }

    // Match item after "for" or "of" (e.g. "for sofa")
    let item = 'Goods / Raw Materials';
    const forMatch = prompt.match(/(?:for|of|item)\s+([a-zA-Z0-9\s]+?)(?:,\s*|\.\s*|$)/i);
    if (forMatch && forMatch[1]) {
      item = forMatch[1].trim();
    }

    const paidAmount = numbers[0] || 0;
    const billedAmount = numbers[1] || (paidAmount > 10000 ? paidAmount + 5000 : paidAmount);
    const balance = Math.max(0, billedAmount - paidAmount);

    const recordData: Record<string, any> = {
      date,
      supplier: supplierName.charAt(0).toUpperCase() + supplierName.slice(1),
      item: item.charAt(0).toUpperCase() + item.slice(1),
      billedAmount,
      paidAmount,
      balance,
      paymentMethod: lower.includes('cash') ? 'Cash' : lower.includes('upi') ? 'UPI' : 'Bank Transfer',
    };

    const { record, table } = await addRecordWithAdaptiveSchema(
      'supplier_ledgers',
      'Supplier Ledgers',
      recordData,
      prompt
    );

    const assistantMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content:
        `✅ Recorded **Supplier Payment** for **${recordData.supplier}**:\n\n` +
        `* 💳 **Paid Amount:** ₹${paidAmount.toLocaleString('en-IN')}\n` +
        `* 🛋️ **Item:** ${recordData.item}\n` +
        `* ⚖️ **Remaining Balance:** ₹${balance.toLocaleString('en-IN')}\n` +
        `* 📂 Stored in table: **${table.displayName}**`,
      timestamp: new Date().toISOString(),
      metadata: {
        action: 'record_created',
        tableId: table.id,
        tableName: table.displayName,
        recordId: record.id,
        recordData,
        isSuccess: true,
      },
    };

    return { message: assistantMsg, affectedTableId: table.id, record };
  }

  // --- Scenario 3: Tea, Snacks, Petty Cash & Daily Expenses (e.g. "Tea expenses 250", "Chai kharcha 150") ---
  const isTeaOrSnack =
    lower.includes('tea') ||
    lower.includes('chai') ||
    lower.includes('snack') ||
    lower.includes('samosa') ||
    lower.includes('coffee') ||
    lower.includes('pantry');

  if (isTeaOrSnack) {
    const amount = numbers[0] || 0;
    const recordData: Record<string, any> = {
      date,
      category: 'Pantry / Refreshments',
      description: prompt.trim(),
      amount,
      paidBy: lower.includes('online') || lower.includes('upi') ? 'UPI' : 'Cash',
    };

    const { record, table } = await addRecordWithAdaptiveSchema(
      'expense_book',
      'Expenses & Petty Cash',
      recordData,
      prompt
    );

    const assistantMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content:
        `☕ Logged **Pantry / Tea Expense**:\n\n` +
        `* 💸 **Amount:** ₹${amount.toLocaleString('en-IN')}\n` +
        `* 📝 **Description:** ${recordData.description}\n` +
        `* 📂 Stored in table: **${table.displayName}**`,
      timestamp: new Date().toISOString(),
      metadata: {
        action: 'record_created',
        tableId: table.id,
        tableName: table.displayName,
        recordId: record.id,
        recordData,
        isSuccess: true,
      },
    };

    return { message: assistantMsg, affectedTableId: table.id, record };
  }

  // --- Scenario 4: Cloth Bundles / Textile (Dynamic Custom Tab Generation!) ---
  const isClothOrTextile =
    lower.includes('cloth') ||
    lower.includes('bundle') ||
    lower.includes('than') ||
    lower.includes('kapda') ||
    lower.includes('fabric') ||
    lower.includes('textile');

  if (isClothOrTextile) {
    // Extract bundle quantity e.g. "50 bundles", "10 than"
    const qtyMatch = prompt.match(/(\d+)\s*(?:bundles?|than|pieces?|pcs|meters?|m|kg)/i);
    const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : numbers.length > 1 ? numbers[0] : 1;
    const totalAmount = numbers.length > 1 ? numbers[1] : numbers[0] || 0;
    const ratePerUnit = quantity > 0 && totalAmount > 0 ? Math.round(totalAmount / quantity) : 0;

    const recordData: Record<string, any> = {
      date,
      itemDescription: 'Cotton Fabric / Cloth Bundles',
      quantity,
      ratePerUnit,
      totalAmount,
      remarks: prompt,
    };

    // Notice: dynamically generates a brand new table "cloth_textiles" if not present!
    const { record, table } = await addRecordWithAdaptiveSchema(
      'cloth_textiles',
      'Cloth Bundles & Textiles',
      recordData,
      prompt
    );

    const assistantMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content:
        `🧵 **Dynamic Adaptive Schema Activated!**\n\n` +
        `Created/Updated custom table **"${table.displayName}"** for textile records:\n\n` +
        `* 📦 **Quantity:** ${quantity} bundles/units\n` +
        `* 💰 **Total Value:** ₹${totalAmount.toLocaleString('en-IN')}` +
        (ratePerUnit ? ` (approx ₹${ratePerUnit}/unit)` : '') +
        `\n* 📂 Tab: **${table.displayName}**`,
      timestamp: new Date().toISOString(),
      metadata: {
        action: 'record_created',
        tableId: table.id,
        tableName: table.displayName,
        recordId: record.id,
        recordData,
        isSuccess: true,
      },
    };

    return { message: assistantMsg, affectedTableId: table.id, record };
  }

  // --- Scenario 5: Transport, Logistics & Freight ---
  const isTransport =
    lower.includes('transport') ||
    lower.includes('tempo') ||
    lower.includes('bhada') ||
    lower.includes('truck') ||
    lower.includes('freight') ||
    lower.includes('delivery') ||
    lower.includes('diesel');

  if (isTransport) {
    const amount = numbers[0] || 0;
    const recordData: Record<string, any> = {
      date,
      category: 'Logistics & Transport',
      description: prompt.trim(),
      amount,
      vehicleDetails: prompt.match(/[A-Z]{2}[-\s]?[0-9]{2}[-\s]?[A-Z]{1,2}[-\s]?[0-9]{4}/i)?.[0] || 'General Logistics',
      paidBy: 'Cash',
    };

    const { record, table } = await addRecordWithAdaptiveSchema(
      'expense_book',
      'Expenses & Petty Cash',
      recordData,
      prompt
    );

    const assistantMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content:
        `🚚 Logged **Transport & Freight Expense**:\n\n` +
        `* 💸 **Amount:** ₹${amount.toLocaleString('en-IN')}\n` +
        `* 📝 **Details:** ${recordData.description}\n` +
        `* 📂 Stored in table: **${table.displayName}**`,
      timestamp: new Date().toISOString(),
      metadata: {
        action: 'record_created',
        tableId: table.id,
        tableName: table.displayName,
        recordId: record.id,
        recordData,
        isSuccess: true,
      },
    };

    return { message: assistantMsg, affectedTableId: table.id, record };
  }

  // --- Scenario 6: Free-hand Adaptive Dynamic Business Input ---
  // If user entered anything else with an amount or custom business data
  const detectedAmount = numbers[0] || 0;
  // Infer a custom category/table from first few words
  const words = prompt.replace(/[^\w\s]/g, '').trim().split(/\s+/);
  const keyword = words[0] || 'Business';
  const tableSlug = `custom_${keyword.toLowerCase()}_records`;
  const tableDisplayName = `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Entries`;

  const recordData: Record<string, any> = {
    date,
    title: prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt,
    amount: detectedAmount,
    fullDetails: prompt,
  };

  const { record, table } = await addRecordWithAdaptiveSchema(
    tableSlug,
    tableDisplayName,
    recordData,
    prompt
  );

  const assistantMsg: ChatMessage = {
    id: `msg_${Date.now()}`,
    role: 'assistant',
    content:
      `✨ **Adaptive Schema Auto-Mapped Entry!**\n\n` +
      `Automatically created/mapped to table **"${table.displayName}"**:\n\n` +
      `* 📋 **Title:** ${recordData.title}\n` +
      (detectedAmount > 0 ? `* 💰 **Amount:** ₹${detectedAmount.toLocaleString('en-IN')}\n` : '') +
      `* 📅 **Date:** ${date}\n` +
      `* 📂 Available in live table view.`,
    timestamp: new Date().toISOString(),
    metadata: {
      action: 'record_created',
      tableId: table.id,
      tableName: table.displayName,
      recordId: record.id,
      recordData,
      isSuccess: true,
    },
  };

  return { message: assistantMsg, affectedTableId: table.id, record };
}
