import Dexie, { type Table } from 'dexie';
import type { TableMeta, DynamicRecord, ChatMessage, AppSettings, ColumnMeta } from '../types';

export class LocalDatabase extends Dexie {
  tablesMeta!: Table<TableMeta, string>;
  records!: Table<DynamicRecord, string>;
  messages!: Table<ChatMessage, string>;
  settings!: Table<AppSettings, number>;

  constructor() {
    super('GstALocalDB');
    this.version(1).stores({
      tablesMeta: 'id, name, displayName, createdAt',
      records: 'id, tableId, createdAt',
      messages: 'id, role, timestamp',
      settings: '++id',
    });
  }
}

export const db = new LocalDatabase();

// Format column key into readable label
export function formatColumnLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

// Infer column type from value
export function inferColumnType(val: any, key: string): ColumnMeta['type'] {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes('date') || lowerKey.includes('time')) return 'date';
  if (
    lowerKey.includes('amount') ||
    lowerKey.includes('price') ||
    lowerKey.includes('paid') ||
    lowerKey.includes('balance') ||
    lowerKey.includes('incentive') ||
    lowerKey.includes('total') ||
    lowerKey.includes('cost') ||
    lowerKey.includes('rate') ||
    lowerKey.includes('tax')
  ) {
    return 'currency';
  }
  if (typeof val === 'number') return 'number';
  if (typeof val === 'boolean') return 'boolean';
  if (lowerKey.includes('status') || lowerKey.includes('type') || lowerKey.includes('category')) return 'badge';
  return 'text';
}

// Initial default tables
const DEFAULT_TABLES: TableMeta[] = [
  {
    id: 'sales_incentives',
    name: 'sales_incentives',
    displayName: 'Sales & Incentives',
    icon: 'TrendingUp',
    color: '#3b82f6',
    columns: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'employee', label: 'Employee / Person', type: 'text', isKeyField: true },
      { key: 'saleAmount', label: 'Sale Amount', type: 'currency' },
      { key: 'incentive', label: 'Incentive', type: 'currency' },
      { key: 'item', label: 'Product / Item', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'text' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSystem: true,
  },
  {
    id: 'supplier_ledgers',
    name: 'supplier_ledgers',
    displayName: 'Supplier Ledgers',
    icon: 'Users',
    color: '#8b5cf6',
    columns: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'supplier', label: 'Supplier Name', type: 'text', isKeyField: true },
      { key: 'item', label: 'Item / Material', type: 'text' },
      { key: 'billedAmount', label: 'Billed (Dr)', type: 'currency' },
      { key: 'paidAmount', label: 'Paid (Cr)', type: 'currency' },
      { key: 'balance', label: 'Balance Due', type: 'currency' },
      { key: 'paymentMethod', label: 'Payment Mode', type: 'badge' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSystem: true,
  },
  {
    id: 'expense_book',
    name: 'expense_book',
    displayName: 'Expenses & Petty Cash',
    icon: 'Receipt',
    color: '#ec4899',
    columns: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'category', label: 'Category', type: 'badge' },
      { key: 'description', label: 'Description', type: 'text', isKeyField: true },
      { key: 'amount', label: 'Amount', type: 'currency' },
      { key: 'paidBy', label: 'Paid By', type: 'text' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSystem: true,
  },
  {
    id: 'gst_invoices',
    name: 'gst_invoices',
    displayName: 'GST Purchase Bills',
    icon: 'FileSpreadsheet',
    color: '#10b981',
    columns: [
      { key: 'date', label: 'Invoice Date', type: 'date' },
      { key: 'vendorName', label: 'Vendor / Firm', type: 'text', isKeyField: true },
      { key: 'gstin', label: 'GSTIN', type: 'badge' },
      { key: 'invoiceNumber', label: 'Invoice #', type: 'text' },
      { key: 'taxableValue', label: 'Taxable Value', type: 'currency' },
      { key: 'gstAmount', label: 'GST (CGST+SGST/IGST)', type: 'currency' },
      { key: 'totalAmount', label: 'Total Amount', type: 'currency' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSystem: true,
  },
];

// Initial starter records to showcase capabilities
const SAMPLE_RECORDS: DynamicRecord[] = [
  {
    id: 'rec_sample_1',
    tableId: 'sales_incentives',
    data: {
      date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0],
      employee: 'Ashok',
      saleAmount: 30000,
      incentive: 400,
      item: 'Retail Counter Sales',
      notes: 'Monthly target milestone completed',
    },
    rawPrompt: 'Ashok sold 30000, 400 incentive',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rec_sample_2',
    tableId: 'supplier_ledgers',
    data: {
      date: new Date(Date.now() - 48 * 3600 * 1000).toISOString().split('T')[0],
      supplier: 'Rohit',
      item: 'Sofa Set 3+2 Luxury',
      billedAmount: 25000,
      paidAmount: 15000,
      balance: 10000,
      paymentMethod: 'UPI / Bank Transfer',
    },
    rawPrompt: 'Paid supplier Rohit 15000 for sofa',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rec_sample_3',
    tableId: 'expense_book',
    data: {
      date: new Date().toISOString().split('T')[0],
      category: 'Pantry / Refreshments',
      description: 'Tea and snacks for afternoon staff & guests',
      amount: 250,
      paidBy: 'Cash',
    },
    rawPrompt: 'Tea and snacks expense 250',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rec_sample_4',
    tableId: 'expense_book',
    data: {
      date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
      category: 'Logistics',
      description: 'Tempo transport for showroom delivery',
      amount: 1800,
      paidBy: 'Cash',
    },
    rawPrompt: 'Transport freight 1800 paid for delivery',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initialize database
export async function initializeDatabase(): Promise<void> {
  const tableCount = await db.tablesMeta.count();
  if (tableCount === 0) {
    await db.tablesMeta.bulkAdd(DEFAULT_TABLES);
    await db.records.bulkAdd(SAMPLE_RECORDS);

    // Initial welcome message in chat
    const welcomeMsg: ChatMessage = {
      id: 'welcome_1',
      role: 'assistant',
      content:
        `Namaste! Welcome to **Gemini Local Ledger (GstA)**.\n\n` +
        `This app is **100% offline-first**, powered entirely by in-browser IndexedDB with **zero cloud dependencies** and **dynamic adaptive schemas**.\n\n` +
        `### You can speak, type, or scan:\n` +
        `* 💬 **Natural Entry:** *"Ashok sold 30000, 400 incentive"* or *"Paid supplier Rohit 15000 for sofa"*\n` +
        `* 📊 **Smart Query:** *"What is Rohit's remaining balance?"* or *"Show last month's transport expenses"*\n` +
        `* 📸 **Scan Invoices:** Click the **Camera / Upload icon** to scan any GST purchase bill for instant OCR.\n` +
        `* 🏷️ **Dynamic Schemas:** Enter cloth bundles, tea expenses, employee bonuses—new tabs and columns will automatically generate!`,
      timestamp: new Date().toISOString(),
      metadata: { isSuccess: true },
    };
    await db.messages.add(welcomeMsg);
  }

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      theme: 'dark',
      voiceLanguage: 'en-IN',
      currencySymbol: '₹',
      autoSwitchToTable: true,
    });
  }
}

// Adaptive schema helper: ensure table exists and all keys exist as columns
export async function ensureTableAndColumns(
  tableId: string,
  tableName: string,
  rowSample: Record<string, any>,
  preferredIcon?: string
): Promise<TableMeta> {
  let table = await db.tablesMeta.get(tableId);

  if (!table) {
    // Generate new table on the fly!
    const generatedColumns: ColumnMeta[] = Object.entries(rowSample).map(([key, val], idx) => ({
      key,
      label: formatColumnLabel(key),
      type: inferColumnType(val, key),
      isKeyField: idx === 0,
    }));

    table = {
      id: tableId,
      name: tableId,
      displayName: tableName || formatColumnLabel(tableId),
      icon: preferredIcon || 'FolderKanban',
      columns: generatedColumns,
      color: '#6366f1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSystem: false,
    };
    await db.tablesMeta.add(table);
    return table;
  }

  // If table exists, check if any new column needs to be dynamically added
  const existingColKeys = new Set(table.columns.map((c) => c.key));
  let modified = false;

  for (const [key, val] of Object.entries(rowSample)) {
    if (!existingColKeys.has(key)) {
      table.columns.push({
        key,
        label: formatColumnLabel(key),
        type: inferColumnType(val, key),
      });
      modified = true;
    }
  }

  if (modified) {
    table.updatedAt = new Date().toISOString();
    await db.tablesMeta.put(table);
  }

  return table;
}

// Add a new record with automatic schema adaptation
export async function addRecordWithAdaptiveSchema(
  tableId: string,
  tableName: string,
  data: Record<string, any>,
  rawPrompt?: string
): Promise<{ record: DynamicRecord; table: TableMeta }> {
  const table = await ensureTableAndColumns(tableId, tableName, data);

  const record: DynamicRecord = {
    id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    tableId: table.id,
    data,
    rawPrompt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.records.add(record);
  return { record, table };
}

// Export a table's data to CSV format
export function convertTableToCSV(table: TableMeta, records: DynamicRecord[]): string {
  if (records.length === 0) return '';
  const headers = table.columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',');
  const rows = records.map((rec) => {
    return table.columns
      .map((col) => {
        const val = rec.data[col.key];
        if (val === undefined || val === null) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',');
  });
  return [headers, ...rows].join('\r\n');
}

// Export complete local DB as JSON
export async function exportDatabaseBackup(): Promise<string> {
  const tables = await db.tablesMeta.toArray();
  const records = await db.records.toArray();
  const messages = await db.messages.toArray();
  const settings = await db.settings.toArray();

  const backup = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    tables,
    records,
    messages,
    settings,
  };

  return JSON.stringify(backup, null, 2);
}

// Restore local DB from JSON
export async function importDatabaseBackup(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.tables || !data.records) {
      throw new Error('Invalid backup file structure');
    }

    await db.transaction('rw', [db.tablesMeta, db.records, db.messages, db.settings], async () => {
      await db.tablesMeta.clear();
      await db.records.clear();
      await db.messages.clear();

      await db.tablesMeta.bulkAdd(data.tables);
      await db.records.bulkAdd(data.records);
      if (data.messages && data.messages.length > 0) {
        await db.messages.bulkAdd(data.messages);
      }
      if (data.settings && data.settings.length > 0) {
        await db.settings.clear();
        await db.settings.bulkAdd(data.settings);
      }
    });

    return true;
  } catch (err) {
    console.error('Failed to import database:', err);
    return false;
  }
}
