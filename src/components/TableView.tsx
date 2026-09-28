import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Plus,
  Trash2,
  TrendingUp,
  Users,
  Receipt,
  FileSpreadsheet,
  FolderKanban,
  ArrowUpDown,
  Edit2,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { TableMeta, DynamicRecord } from '../types';
import { convertTableToCSV } from '../db';

interface TableViewProps {
  tables: TableMeta[];
  records: DynamicRecord[];
  activeTableId: string;
  onSelectTable: (tableId: string) => void;
  darkMode: boolean;
  onAddRecord: (tableId: string) => void;
  onEditRecord: (record: DynamicRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onDeleteTable: (tableId: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  tables,
  records,
  activeTableId,
  onSelectTable,
  darkMode,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  onDeleteTable,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Currently active table
  const activeTable = useMemo(() => {
    return tables.find((t) => t.id === activeTableId) || tables[0];
  }, [tables, activeTableId]);

  // Records belonging to the active table
  const tableRecords = useMemo(() => {
    if (!activeTable) return [];
    return records.filter((r) => r.tableId === activeTable.id);
  }, [records, activeTable]);

  // Filtered & sorted records
  const displayRecords = useMemo(() => {
    let result = tableRecords;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) =>
        Object.values(r.data).some((val) => String(val).toLowerCase().includes(q))
      );
    }

    if (sortColumn) {
      result = [...result].sort((a, b) => {
        const valA = a.data[sortColumn];
        const valB = b.data[sortColumn];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA || '');
        const strB = String(valB || '');
        return sortDirection === 'asc'
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    return result;
  }, [tableRecords, searchQuery, sortColumn, sortDirection]);

  // Calculate summary metrics for the table
  const metrics = useMemo(() => {
    if (!activeTable) return { totalRecords: 0, totalAmount: 0 };

    let totalAmount = 0;
    const currencyCols = activeTable.columns.filter((c) => c.type === 'currency');

    for (const r of tableRecords) {
      if (currencyCols.length > 0) {
        // Use primary currency column
        const primaryKey = currencyCols[0].key;
        totalAmount += Number(r.data[primaryKey] || 0);
      }
    }

    return {
      totalRecords: tableRecords.length,
      totalAmount,
      primaryColName: currencyCols[0]?.label || 'Total',
    };
  }, [activeTable, tableRecords]);

  // Icon selector helper
  const renderTabIcon = (iconName?: string) => {
    switch (iconName) {
      case 'TrendingUp':
        return <TrendingUp className="w-3.5 h-3.5" />;
      case 'Users':
        return <Users className="w-3.5 h-3.5" />;
      case 'Receipt':
        return <Receipt className="w-3.5 h-3.5" />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className="w-3.5 h-3.5" />;
      default:
        return <FolderKanban className="w-3.5 h-3.5" />;
    }
  };

  const handleSort = (colKey: string) => {
    if (sortColumn === colKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(colKey);
      setSortDirection('asc');
    }
  };

  const handleExportCSV = () => {
    if (!activeTable) return;
    const csv = convertTableToCSV(activeTable, tableRecords);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTable.name}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Dynamic Tabs Navigation */}
      <div
        className={`px-4 pt-3 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 ${
          darkMode ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}
      >
        {tables.map((table) => {
          const isActive = table.id === activeTable?.id;
          const count = records.filter((r) => r.tableId === table.id).length;

          return (
            <button
              key={table.id}
              onClick={() => {
                onSelectTable(table.id);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-medium border-t border-x transition-all shrink-0 ${
                isActive
                  ? darkMode
                    ? 'bg-zinc-900 border-zinc-700/80 text-white shadow-sm'
                    : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'
                  : darkMode
                  ? 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              {renderTabIcon(table.icon)}
              <span>{table.displayName}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-400 font-semibold'
                    : darkMode
                    ? 'bg-zinc-800 text-zinc-400'
                    : 'bg-zinc-200 text-zinc-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {activeTable && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Table Header & Metrics Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-zinc-100 flex items-center gap-2">
                  <span className={`${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{activeTable.displayName}</span>
                  {!activeTable.isSystem && (
                    <span className="text-[10px] bg-pink-500/10 text-pink-400 border border-pink-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Auto-Generated Dynamic Tab
                    </span>
                  )}
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {activeTable.columns.length} columns inferred dynamically from natural language entries
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2">
              <div
                className={`px-3 py-1.5 rounded-xl border text-xs ${
                  darkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
                }`}
              >
                <span className="text-zinc-400">Total Records: </span>
                <span className="font-semibold text-indigo-400">{metrics.totalRecords}</span>
              </div>
              {metrics.totalAmount > 0 && (
                <div
                  className={`px-3 py-1.5 rounded-xl border text-xs ${
                    darkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
                  }`}
                >
                  <span className="text-zinc-400">{metrics.primaryColName}: </span>
                  <span className="font-semibold text-emerald-400">
                    ₹{metrics.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Search and Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
            <div
              className={`relative flex items-center rounded-xl border px-3 py-1.5 w-full sm:w-64 ${
                darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-zinc-400 mr-2" />
              <input
                type="text"
                placeholder="Search anything in this table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-0 outline-none text-xs w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onAddRecord(activeTable.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
              <button
                onClick={handleExportCSV}
                disabled={tableRecords.length === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  tableRecords.length === 0
                    ? 'opacity-40 cursor-not-allowed border-zinc-800'
                    : darkMode
                    ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700'
                }`}
                title="Download CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              {!activeTable.isSystem && (
                <button
                  onClick={() => onDeleteTable(activeTable.id)}
                  className={`p-1.5 rounded-xl border text-rose-400 hover:bg-rose-500/10 border-rose-500/20 transition-all`}
                  title="Delete Dynamic Table"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Interactive Structured Table */}
          <div
            className={`flex-1 overflow-auto rounded-2xl border shadow-inner ${
              darkMode ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-white border-zinc-200'
            }`}
          >
            {displayRecords.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/50 flex items-center justify-center text-zinc-400 mb-3">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-300">No records found</h4>
                <p className="text-xs text-zinc-500 max-w-sm mt-1">
                  Type an entry in the Command Hub below or click "Add Record" to populate this table.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead
                  className={`sticky top-0 z-10 backdrop-blur-md border-b ${
                    darkMode ? 'bg-zinc-900/90 border-zinc-800 text-zinc-400' : 'bg-zinc-100/90 border-zinc-200 text-zinc-600'
                  }`}
                >
                  <tr>
                    <th className="p-3 font-semibold w-12 text-center">#</th>
                    {activeTable.columns.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="p-3 font-semibold cursor-pointer hover:text-indigo-400 transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col.label}</span>
                          <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                        </div>
                      </th>
                    ))}
                    <th className="p-3 font-semibold text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {displayRecords.map((record, index) => (
                    <tr
                      key={record.id}
                      className={`transition-colors group ${
                        darkMode ? 'hover:bg-zinc-900/50 text-zinc-300' : 'hover:bg-zinc-50 text-zinc-800'
                      }`}
                    >
                      <td className="p-3 text-center text-zinc-500 font-mono text-[11px]">
                        {index + 1}
                      </td>
                      {activeTable.columns.map((col) => {
                        const val = record.data[col.key];

                        return (
                          <td key={col.key} className="p-3 whitespace-nowrap">
                            {col.type === 'currency' ? (
                              <span className="font-semibold text-emerald-400">
                                {val !== undefined && val !== null
                                  ? `₹${Number(val).toLocaleString('en-IN')}`
                                  : '-'}
                              </span>
                            ) : col.type === 'badge' ? (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                  darkMode
                                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                    : 'bg-zinc-100 border-zinc-300 text-zinc-700'
                                }`}
                              >
                                {String(val || '-')}
                              </span>
                            ) : col.type === 'date' ? (
                              <span className="text-zinc-400 font-mono text-[11px]">
                                {String(val || '-')}
                              </span>
                            ) : (
                              <span className={col.isKeyField ? 'font-medium text-indigo-300' : ''}>
                                {val !== undefined && val !== null ? String(val) : '-'}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 text-right pr-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditRecord(record)}
                            className="p-1 rounded-lg hover:bg-indigo-500/20 text-zinc-400 hover:text-indigo-400 transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(record.id)}
                            className="p-1 rounded-lg hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
