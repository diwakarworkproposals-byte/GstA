import React, { useState, useRef } from 'react';
import { X, Download, Upload, RefreshCw, Key, ShieldCheck, Database, Volume2 } from 'lucide-react';
import { exportDatabaseBackup, importDatabaseBackup, initializeDatabase, db } from '../db';
import type { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  settings: AppSettings | null;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onRefreshData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  settings,
  onUpdateSettings,
  onRefreshData,
}) => {
  const [apiKey, setApiKey] = useState(settings?.geminiApiKey || '');
  const [voiceLang, setVoiceLang] = useState(settings?.voiceLanguage || 'en-IN');
  const [currency, setCurrency] = useState(settings?.currencySymbol || '₹');
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings({
      geminiApiKey: apiKey.trim(),
      voiceLanguage: voiceLang,
      currencySymbol: currency,
    });
    onClose();
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const json = await exportDatabaseBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GstA_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setIsExporting(false);
    } catch (e: any) {
      console.error('Export error:', e);
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const text = await file.text();
      const success = await importDatabaseBackup(text);
      if (success) {
        setImportStatus('✅ Database restored successfully!');
        onRefreshData();
      } else {
        setImportStatus('❌ Failed to restore database: Invalid file.');
      }
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to reset local data to initial demo state?')) {
      await db.tablesMeta.clear();
      await db.records.clear();
      await db.messages.clear();
      await initializeDatabase();
      onRefreshData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Settings & Local Data</h3>
              <p className="text-xs text-zinc-400">Manage IndexedDB storage, backups, and inputs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Privacy & Zero-Cloud Notice */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-emerald-300">100% Local & Private</h5>
              <p className="text-zinc-400 mt-0.5 leading-relaxed">
                All employee records, supplier ledgers, expenses, and invoices are stored exclusively in your browser's IndexedDB. No external servers or forced account logins.
              </p>
            </div>
          </div>

          {/* Data Backup & Restore */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-zinc-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Data Backup & Restore</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all ${
                  darkMode
                    ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all ${
                  darkMode
                    ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restore JSON Backup</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
            {importStatus && (
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                {importStatus}
              </div>
            )}
          </div>

          {/* Voice Input & Regional Preferences */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-zinc-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-pink-400" />
              <span>Voice & Regional Preferences</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 mb-1">Speech Language</label>
                <select
                  value={voiceLang}
                  onChange={(e) => setVoiceLang(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-none ${
                    darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-800'
                  }`}
                >
                  <option value="en-IN">English (India / Hinglish)</option>
                  <option value="hi-IN">Hindi (हिन्दी)</option>
                  <option value="en-US">English (US)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                    darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-800'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Optional Gemini API Key */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-zinc-300 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Optional Google Gemini API Key</span>
            </h4>
            <p className="text-zinc-500">
              Not required! The app operates 100% offline with zero API keys. Provide a key only if you wish to enable cloud-augmented vision or LLM features.
            </p>
            <input
              type="password"
              placeholder="AIzaSy... (Optional)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-800'
              }`}
            />
          </div>

          {/* Danger zone: Reset */}
          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetData}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Factory Demo State</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="py-2 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:opacity-95 shadow-md"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
