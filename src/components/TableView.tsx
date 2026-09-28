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
    if (!activeTable) return { totalRecords: 0, totalAmount: 0, primaryColName: 'Total' };

    let totalAmount = 0;
    const currencyCols = activeTable.columns.filter((c) => c.type === 'currency');

    for (const r of tableRecords) {
      if (currencyCols.length > 0) {
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
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden w-full">
      {/* Dynamic Tabs Navigation (horizontally scrollable on mobile) */}
      <div
        className={`px-3 sm:px-4 pt-2.5 sm:pt-3 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 select-none ${
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
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-t-xl text-xs font-medium border-t border-x transition-all shrink-0 ${
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
              <span className="whitespace-nowrap">{table.displayName}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
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
        <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-4 overflow-hidden w-full">
          {/* Table Header & Metrics Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                  <span className={darkMode ? 'text-zinc-100' : 'text-zinc-900'}>
                    {activeTable.displayName}
                  </span>
                  {!activeTable.isSystem && (
                    <span className="text-[9px] sm:text-[10px] bg-pink-500/10 text-pink-400 border border-pink-500/30 px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Dynamic
                    </span>
                  )}
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                {activeTable.columns.length} columns adaptively generated
              </p>
            </div>

            {/* Quick Metrics Cards */}
            <div className="flex items-center gap-2">
              <div
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs ${
                  darkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
                }`}
              >
                <span className="text-zinc-400">Records: </span>
                <span className="font-semibold text-indigo-400">{metrics.totalRecords}</span>
              </div>
              {metrics.totalAmount > 0 && (
                <div
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs ${
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

          {/* Search & Actions Bar (stacks responsively) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pb-2.5">
            <div
              className={`relative flex items-center rounded-xl border px-3 py-1.5 w-full sm:w-64 ${
                darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search in this table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-0 outline-none text-xs w-full"
              />
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => onAddRecord(activeTable.id)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
              <button
                onClick={handleExportCSV}
                disabled={tableRecords.length === 0}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  tableRecords.length === 0
                    ? 'opacity-40 cursor-not-allowed border-zinc-800'
                    : darkMode
                    ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700'
                }`}
                title="Download CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              {!activeTable.isSystem && (
                <button
                  onClick={() => onDeleteTable(activeTable.id)}
                  className="p-1.5 rounded-xl border text-rose-400 hover:bg-rose-500/10 border-rose-500/20 transition-all shrink-0"
                  title="Delete Dynamic Table"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table Container with smooth touch scrolling */}
          <div
            className={`flex-1 min-h-0 overflow-auto rounded-2xl border shadow-inner ${
              darkMode ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-white border-zinc-200'
            }`}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {displayRecords.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800/50 flex items-center justify-center text-zinc-400 mb-2">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-zinc-300">No records found</h4>
                <p className="text-[11px] text-zinc-500 max-w-xs mt-1">
                  Type an entry in the Command Hub or tap "+ Add Record" to add data.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse min-w-full">
                <thead
                  className={`sticky top-0 z-10 backdrop-blur-md border-b ${
                    darkMode ? 'bg-zinc-900/90 border-zinc-800 text-zinc-400' : 'bg-zinc-100/90 border-zinc-200 text-zinc-600'
                  }`}
                >
                  <tr>
                    <th className="p-2.5 sm:p-3 font-semibold w-10 text-center">#</th>
                    {activeTable.columns.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="p-2.5 sm:p-3 font-semibold cursor-pointer hover:text-indigo-400 transition-colors select-none whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1">
                          <span>{col.label}</span>
                          <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                        </div>
                      </th>
                    ))}
                    <th className="p-2.5 sm:p-3 font-semibold text-right pr-3">Actions</th>
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
                      <td className="p-2.5 sm:p-3 text-center text-zinc-500 font-mono text-[10px] sm:text-[11px]">
                        {index + 1}
                      </td>
                      {activeTable.columns.map((col) => {
                        const val = record.data[col.key];

                        return (
                          <td key={col.key} className="p-2.5 sm:p-3 whitespace-nowrap text-[11px] sm:text-xs">
                            {col.type === 'currency' ? (
                              <span className="font-semibold text-emerald-400">
                                {val !== undefined && val !== null
                                  ? `₹${Number(val).toLocaleString('en-IN')}`
                                  : '-'}
                              </span>
                            ) : col.type === 'badge' ? (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium border ${
                                  darkMode
                                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                    : 'bg-zinc-100 border-zinc-300 text-zinc-700'
                                }`}
                              >
                                {String(val || '-')}
                              </span>
                            ) : col.type === 'date' ? (
                              <span className="text-zinc-400 font-mono text-[10px] sm:text-[11px]">
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
                      <td className="p-2.5 sm:p-3 text-right pr-3 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
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
