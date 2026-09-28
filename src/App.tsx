import { useState, useEffect, useCallback } from 'react';
import {
  db,
  initializeDatabase,
  addRecordWithAdaptiveSchema,
} from './db';
import type { TableMeta, DynamicRecord, ChatMessage, AppSettings } from './types';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { TableView } from './components/TableView';
import { CommandHub } from './components/CommandHub';
import { InvoiceScannerModal } from './components/InvoiceScannerModal';
import { SettingsModal } from './components/SettingsModal';
import { RecordModal } from './components/RecordModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import { parseUnstructuredTransaction } from './services/aiParser';
import { MessageSquare, Table2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [viewMode, setViewMode] = useState<'split' | 'chat' | 'table'>('split');
  const [mobileTab, setMobileTab] = useState<'chat' | 'table'>('chat');
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [records, setRecords] = useState<DynamicRecord[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeTableId, setActiveTableId] = useState<string>('sales_incentives');
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const [recordModalData, setRecordModalData] = useState<{
    isOpen: boolean;
    table: TableMeta | null;
    editingRecord: DynamicRecord | null;
  }>({
    isOpen: false,
    table: null,
    editingRecord: null,
  });

  // Listen for PWA install prompt
  useEffect(() => {
    const isIosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setIsInstallModalOpen(false);
    }
    setDeferredPrompt(null);
  };

  // Reload all data from local IndexedDB
  const refreshLocalData = useCallback(async () => {
    try {
      const allTables = await db.tablesMeta.toArray();
      const allRecords = await db.records.toArray();
      const allMessages = await db.messages.orderBy('timestamp').toArray();
      const allSettings = await db.settings.toArray();

      setTables(allTables);
      setRecords(allRecords);
      setMessages(allMessages);
      if (allSettings.length > 0) {
        setSettings(allSettings[0]);
        setDarkMode(allSettings[0].theme === 'dark');
      }
      if (allTables.length > 0 && !allTables.some((t) => t.id === activeTableId)) {
        setActiveTableId(allTables[0].id);
      }
    } catch (e) {
      console.error('Failed to load local DB:', e);
    }
  }, [activeTableId]);

  // Initial startup
  useEffect(() => {
    async function init() {
      await initializeDatabase();
      await refreshLocalData();
    }
    init();
  }, [refreshLocalData]);

  // Sync dark mode class on document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle Natural Language Command or Query
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    // Save user message to IndexedDB and update state
    await db.messages.add(userMessage);
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Process using 100% offline local AI & dynamic schema parser
      const result = await parseUnstructuredTransaction(text);

      // Save assistant response to IndexedDB
      await db.messages.add(result.message);

      // Refresh database records and tables
      await refreshLocalData();

      // If a transaction occurred and created a record in a table
      if (result.affectedTableId) {
        setActiveTableId(result.affectedTableId);

        // Celebration confetti for positive transactions
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.7 },
        });
      }
    } catch (err: any) {
      console.error('Error processing command:', err);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ An error occurred while executing command: ${err.message}`,
        timestamp: new Date().toISOString(),
        metadata: { isSuccess: false },
      };
      await db.messages.add(errorMsg);
      await refreshLocalData();
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to specific table
  const handleNavigateToTable = (tableId: string) => {
    setActiveTableId(tableId);
    if (viewMode === 'chat') {
      setViewMode('split');
    }
    setMobileTab('table');
  };

  // Manual record add / edit
  const handleOpenAddRecord = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId) || null;
    setRecordModalData({
      isOpen: true,
      table,
      editingRecord: null,
    });
  };

  const handleOpenEditRecord = (record: DynamicRecord) => {
    const table = tables.find((t) => t.id === record.tableId) || null;
    setRecordModalData({
      isOpen: true,
      table,
      editingRecord: record,
    });
  };

  const handleSaveRecord = async (
    tableId: string,
    data: Record<string, any>,
    recordId?: string
  ) => {
    const targetTable = tables.find((t) => t.id === tableId);
    if (!targetTable) return;

    if (recordId) {
      // Update existing
      await db.records.update(recordId, {
        data,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Create new with adaptive schema
      await addRecordWithAdaptiveSchema(
        targetTable.id,
        targetTable.displayName,
        data,
        'Manually added entry'
      );
    }
    await refreshLocalData();
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (window.confirm('Delete this record from local storage?')) {
      await db.records.delete(recordId);
      await refreshLocalData();
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (window.confirm('Are you sure you want to delete this custom dynamic table and all its data?')) {
      await db.tablesMeta.delete(tableId);
      await db.records.where('tableId').equals(tableId).delete();
      await refreshLocalData();
      if (activeTableId === tableId && tables.length > 1) {
        const remaining = tables.filter((t) => t.id !== tableId);
        setActiveTableId(remaining[0].id);
      }
    }
  };

  const handleToggleDarkMode = async () => {
    const next = !darkMode;
    setDarkMode(next);
    if (settings && settings.id) {
      await db.settings.update(settings.id, { theme: next ? 'dark' : 'light' });
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    if (settings && settings.id) {
      await db.settings.update(settings.id, newSettings);
      setSettings((prev) => (prev ? { ...prev, ...newSettings } : null));
    }
  };

  return (
    <div
      className={`h-[100dvh] h-screen w-full flex flex-col font-sans transition-colors duration-200 overflow-hidden ${
        darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
      }`}
    >
      {/* Top Application Header */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        viewMode={viewMode}
        onChangeViewMode={(mode) => {
          setViewMode(mode);
          if (mode === 'chat') setMobileTab('chat');
          if (mode === 'table') setMobileTab('table');
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        activeTableCount={tables.length}
        totalRecordCount={records.length}
      />

      {/* Mobile Top Segmented Tab Pill (visible on < lg when in split mode) */}
      {viewMode === 'split' && (
        <div
          className={`lg:hidden px-3 py-2 border-b flex items-center justify-center shrink-0 ${
            darkMode ? 'bg-zinc-950/80 border-zinc-800' : 'bg-zinc-100/90 border-zinc-200'
          }`}
        >
          <div
            className={`flex items-center p-1 rounded-2xl border w-full max-w-sm ${
              darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            }`}
          >
            <button
              onClick={() => setMobileTab('chat')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                mobileTab === 'chat'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Gemini Chat</span>
            </button>
            <button
              onClick={() => setMobileTab('table')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                mobileTab === 'table'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Live Tables ({records.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 min-h-0 flex overflow-hidden max-w-7xl w-full mx-auto relative">
        {/* Chat Interface Pane */}
        {((viewMode === 'split' && mobileTab === 'chat') ||
          viewMode === 'chat' ||
          (viewMode === 'split' /* desktop side-by-side */)) && (
          <div
            className={`flex flex-col min-w-0 min-h-0 h-full ${
              viewMode === 'split'
                ? 'w-full lg:w-1/2 lg:border-r border-zinc-800/60 lg:flex ' +
                  (mobileTab === 'chat' ? 'flex' : 'hidden lg:flex')
                : 'w-full flex'
            }`}
          >
            <ChatView
              messages={messages}
              darkMode={darkMode}
              onNavigateToTable={handleNavigateToTable}
              isLoading={isLoading}
            />
            {/* Bottom Command Hub */}
            <CommandHub
              darkMode={darkMode}
              onSendMessage={handleSendMessage}
              onOpenScanner={() => setIsScannerOpen(true)}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Dynamic Database & Tables Pane */}
        {((viewMode === 'split' && mobileTab === 'table') ||
          viewMode === 'table' ||
          (viewMode === 'split' /* desktop side-by-side */)) && (
          <div
            className={`flex flex-col min-w-0 min-h-0 h-full ${
              viewMode === 'split'
                ? 'w-full lg:w-1/2 lg:flex ' +
                  (mobileTab === 'table' ? 'flex' : 'hidden lg:flex')
                : 'w-full flex'
            }`}
          >
            <TableView
              tables={tables}
              records={records}
              activeTableId={activeTableId}
              onSelectTable={setActiveTableId}
              darkMode={darkMode}
              onAddRecord={handleOpenAddRecord}
              onEditRecord={handleOpenEditRecord}
              onDeleteRecord={handleDeleteRecord}
              onDeleteTable={handleDeleteTable}
            />
            {/* If on mobile in table mode, or viewMode === 'table', allow command entry at bottom */}
            {(viewMode === 'table' || (viewMode === 'split' && mobileTab === 'table')) && (
              <CommandHub
                darkMode={darkMode}
                onSendMessage={handleSendMessage}
                onOpenScanner={() => setIsScannerOpen(true)}
                isLoading={isLoading}
              />
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <InstallPwaModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        darkMode={darkMode}
        onInstallClick={handleInstallClick}
        isInstallable={isInstallable}
        isIOS={isIOS}
      />

      <InvoiceScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        darkMode={darkMode}
        onInvoiceSaved={(tableId) => {
          setActiveTableId(tableId);
          setMobileTab('table');
          refreshLocalData();
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        darkMode={darkMode}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onRefreshData={refreshLocalData}
      />

      <RecordModal
        isOpen={recordModalData.isOpen}
        onClose={() =>
          setRecordModalData((prev) => ({ ...prev, isOpen: false, editingRecord: null }))
        }
        table={recordModalData.table}
        editingRecord={recordModalData.editingRecord}
        onSave={handleSaveRecord}
        darkMode={darkMode}
      />
    </div>
  );
}

export default App;
