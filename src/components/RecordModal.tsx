import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Sparkles } from 'lucide-react';
import type { TableMeta, DynamicRecord } from '../types';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableMeta | null;
  editingRecord: DynamicRecord | null;
  onSave: (tableId: string, data: Record<string, any>, recordId?: string) => Promise<void>;
  darkMode: boolean;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  table,
  editingRecord,
  onSave,
  darkMode,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [customKey, setCustomKey] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [showAddCustomField, setShowAddCustomField] = useState(false);

  useEffect(() => {
    if (editingRecord) {
      setFormData({ ...editingRecord.data });
    } else if (table) {
      const initial: Record<string, any> = {};
      table.columns.forEach((col) => {
        if (col.type === 'date') {
          initial[col.key] = new Date().toISOString().split('T')[0];
        } else if (col.type === 'number' || col.type === 'currency') {
          initial[col.key] = 0;
        } else {
          initial[col.key] = '';
        }
      });
      setFormData(initial);
    }
  }, [editingRecord, table]);

  if (!isOpen || !table) return null;

  const handleChange = (key: string, val: any, type: string) => {
    let parsedVal = val;
    if (type === 'number' || type === 'currency') {
      parsedVal = parseFloat(val) || 0;
    }
    setFormData((prev) => ({ ...prev, [key]: parsedVal }));
  };

  const handleAddCustomField = () => {
    if (!customKey.trim()) return;
    const sanitizedKey = customKey.trim().replace(/\s+/g, '_').toLowerCase();
    setFormData((prev) => ({ ...prev, [sanitizedKey]: customValue }));
    setCustomKey('');
    setCustomValue('');
    setShowAddCustomField(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(table.id, formData, editingRecord?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
          <div>
            <h3 className="font-semibold text-base">
              {editingRecord ? 'Edit Record' : 'Add New Record'}
            </h3>
            <p className="text-xs text-zinc-400">
              Table: <strong className="text-indigo-400">{table.displayName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {table.columns.map((col) => (
            <div key={col.key} className="space-y-1">
              <label className="block text-zinc-400 font-medium">
                {col.label} {col.type === 'currency' && '(₹)'}
              </label>
              <input
                type={col.type === 'date' ? 'date' : col.type === 'currency' || col.type === 'number' ? 'number' : 'text'}
                value={formData[col.key] !== undefined ? formData[col.key] : ''}
                onChange={(e) => handleChange(col.key, e.target.value, col.type)}
                className={`w-full p-2.5 rounded-xl border outline-none ${
                  darkMode
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-200 focus:border-indigo-500'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-indigo-500'
                }`}
              />
            </div>
          ))}

          {/* Any extra dynamic fields present on record but not yet in basic schema */}
          {Object.keys(formData)
            .filter((k) => !table.columns.some((c) => c.key === k))
            .map((extraKey) => (
              <div key={extraKey} className="space-y-1">
                <label className="block text-pink-400 font-medium capitalize">
                  {extraKey} (Dynamic Attribute)
                </label>
                <input
                  type="text"
                  value={formData[extraKey] !== undefined ? formData[extraKey] : ''}
                  onChange={(e) => handleChange(extraKey, e.target.value, 'text')}
                  className={`w-full p-2.5 rounded-xl border outline-none ${
                    darkMode
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-200 focus:border-indigo-500'
                      : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-indigo-500'
                  }`}
                />
              </div>
            ))}

          {/* Add custom attribute on the fly */}
          {showAddCustomField ? (
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <span className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Add Dynamic Column / Field
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Attribute name (e.g. hsn_code, vehicle)"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 outline-none text-xs"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 outline-none text-xs"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomField(false)}
                  className="px-2.5 py-1 text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500"
                >
                  Add Field
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddCustomField(true)}
              className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 font-medium pt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Custom Dynamic Attribute</span>
            </button>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:opacity-95 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Save Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
