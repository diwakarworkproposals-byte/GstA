import React, { useRef, useEffect } from 'react';
import { Sparkles, User, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import type { ChatMessage } from '../types';

interface ChatViewProps {
  messages: ChatMessage[];
  darkMode: boolean;
  onNavigateToTable: (tableId: string) => void;
  isLoading: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  darkMode,
  onNavigateToTable,
  isLoading,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Simple Markdown renderer for bolding, bullet points, headers
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-semibold text-sm sm:text-base pt-1 pb-0.5 text-indigo-400">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('* ') || line.startsWith('- ')) {
            const rawText = line.substring(2);
            return (
              <div key={idx} className="flex items-start gap-1.5 sm:gap-2 pl-0.5 sm:pl-1">
                <span className="text-indigo-400 mt-0.5">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatBoldAndCode(rawText) }} />
              </div>
            );
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatBoldAndCode(line) }} />
          );
        })}
      </div>
    );
  };

  const formatBoldAndCode = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-indigo-300">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-zinc-800 text-[11px] font-mono text-pink-400">$1</code>');
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto w-full px-2.5 sm:px-4 py-3 sm:py-6 space-y-3.5 sm:space-y-6">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-2 sm:gap-3.5 max-w-3xl ${
              isUser ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isUser
                  ? darkMode
                    ? 'bg-zinc-800 text-zinc-300'
                    : 'bg-zinc-200 text-zinc-700'
                  : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-pink-500 text-white shadow-md shadow-indigo-500/20'
              }`}
            >
              {isUser ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </div>

            {/* Message Bubble & Content */}
            <div
              className={`rounded-2xl p-3 sm:p-4 shadow-sm max-w-[88%] sm:max-w-2xl transition-all ${
                isUser
                  ? darkMode
                    ? 'bg-indigo-600/20 border border-indigo-500/30 text-zinc-100 rounded-tr-none'
                    : 'bg-indigo-600 text-white rounded-tr-none'
                  : darkMode
                  ? 'bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-tl-none'
                  : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none'
              }`}
            >
              {renderFormattedContent(msg.content)}

              {/* Action Preview Card: Record Created */}
              {msg.metadata?.action === 'record_created' && msg.metadata.recordData && (
                <div
                  className={`mt-2.5 sm:mt-3 p-2.5 sm:p-3 rounded-xl border ${
                    darkMode
                      ? 'bg-zinc-950/70 border-zinc-800 text-zinc-300'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/40 mb-2">
                    <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Saved to Local Table</span>
                    </span>
                    {msg.metadata.tableId && (
                      <button
                        onClick={() => onNavigateToTable(msg.metadata!.tableId!)}
                        className="flex items-center gap-1 text-[11px] sm:text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        <span>View Table</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                    {Object.entries(msg.metadata.recordData).map(([k, v]) => (
                      <div key={k} className="flex items-center sm:flex-col justify-between sm:justify-start">
                        <span className="text-[10px] text-zinc-500 capitalize">{k}</span>
                        <span className="font-medium truncate max-w-[60%] sm:max-w-full">
                          {typeof v === 'number' && (k.toLowerCase().includes('amount') || k.toLowerCase().includes('incentive') || k.toLowerCase().includes('balance'))
                            ? `₹${v.toLocaleString('en-IN')}`
                            : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Preview Card: Query Result with Metrics */}
              {msg.metadata?.action === 'query_result' && msg.metadata.queryResult && (
                <div className="mt-2.5 sm:mt-3 space-y-2">
                  {msg.metadata.queryResult.metrics && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                      {msg.metadata.queryResult.metrics.map((m, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg border ${
                            darkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                          }`}
                        >
                          <div className="text-[9px] sm:text-[10px] text-zinc-400 truncate">{m.label}</div>
                          <div className="text-xs sm:text-sm font-semibold text-indigo-400 truncate">{m.value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.metadata.queryResult.details && msg.metadata.queryResult.details.length > 0 && (
                    <div
                      className={`overflow-x-auto rounded-lg border text-[11px] sm:text-xs ${
                        darkMode ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-200 bg-white'
                      }`}
                    >
                      <table className="w-full text-left min-w-[280px]">
                        <thead>
                          <tr className={`border-b ${darkMode ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-600'}`}>
                            <th className="p-1.5 sm:p-2">Date</th>
                            <th className="p-1.5 sm:p-2">Entity/Item</th>
                            <th className="p-1.5 sm:p-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {msg.metadata.queryResult.details.slice(0, 4).map((row, idx) => (
                            <tr
                              key={idx}
                              className={`border-b last:border-0 ${
                                darkMode ? 'border-zinc-800/60' : 'border-zinc-100'
                              }`}
                            >
                              <td className="p-1.5 sm:p-2 text-zinc-400 text-[10px] sm:text-xs">{row.date || 'Recent'}</td>
                              <td className="p-1.5 sm:p-2 font-medium truncate max-w-[130px]">
                                {row.employee || row.supplier || row.description || row.item || 'Entry'}
                              </td>
                              <td className="p-1.5 sm:p-2 text-right text-emerald-400 font-semibold">
                                ₹{Number(row.saleAmount || row.paidAmount || row.amount || row.totalAmount || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <div
                className={`text-[9px] sm:text-[10px] mt-1.5 ${
                  isUser ? 'text-indigo-200 text-right' : 'text-zinc-500'
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Typing / Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
          </div>
          <div
            className={`p-2.5 sm:p-3.5 rounded-2xl rounded-tl-none border text-xs flex items-center gap-2 ${
              darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-500'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span className="text-[11px] sm:text-xs">Comprehending intent locally...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
