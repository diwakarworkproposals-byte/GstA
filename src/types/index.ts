export interface TableMeta {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
  columns: ColumnMeta[];
  color?: string;
  createdAt: string;
  updatedAt: string;
  isSystem?: boolean;
}

export interface ColumnMeta {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'badge' | 'boolean';
  isKeyField?: boolean;
}

export interface DynamicRecord {
  id: string;
  tableId: string;
  data: Record<string, any>;
  rawPrompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    action?: 'record_created' | 'query_result' | 'ocr_parsed' | 'schema_updated' | 'error';
    tableId?: string;
    tableName?: string;
    recordId?: string;
    recordData?: Record<string, any>;
    queryResult?: {
      summary: string;
      details?: Record<string, any>[];
      totalAmount?: number;
      count?: number;
      metrics?: { label: string; value: string | number }[];
    };
    ocrResult?: {
      rawText: string;
      extractedData: Record<string, any>;
    };
    isSuccess?: boolean;
  };
}

export interface AppSettings {
  id?: number;
  theme: 'dark' | 'light' | 'system';
  geminiApiKey?: string;
  voiceLanguage: string;
  currencySymbol: string;
  autoSwitchToTable: boolean;
}

export type ParseIntent = 'TRANSACTION' | 'QUERY' | 'UNKNOWN';

export interface ParsedTransaction {
  targetTable: string;
  tableName: string;
  extractedEntities: Record<string, any>;
  confidence: number;
  explanation: string;
}

export interface ParsedQuery {
  queryType: 'BALANCE' | 'EXPENSE_SUM' | 'SALES_SUM' | 'LIST_RECORDS' | 'GENERAL_STATS';
  entityName?: string;
  category?: string;
  targetTable?: string;
  timeRange?: string;
}
