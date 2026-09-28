import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Mic, MicOff, Camera, Sparkles, FileText, CornerDownLeft } from 'lucide-react';
import { speechService } from '../services/speechService';

interface CommandHubProps {
  darkMode: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onOpenScanner: () => void;
  isLoading: boolean;
}

export const CommandHub: React.FC<CommandHubProps> = ({
  darkMode,
  onSendMessage,
  onOpenScanner,
  isLoading,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      speechService.stop();
      setIsListening(false);
    } else {
      setSpeechError(null);
      const started = speechService.start(
        (transcript, isFinal) => {
          setInput((prev) => (isFinal ? `${prev} ${transcript}`.trim() : `${prev} ${transcript}`.trim()));
          if (isFinal) {
            setIsListening(false);
          }
        },
        (err) => {
          setSpeechError(err);
          setIsListening(false);
        }
      );
      if (started) {
        setIsListening(true);
      }
    }
  };

  // Suggestion chips
  const suggestions = [
    'Ashok sold 30000, 400 incentive',
    'Paid supplier Rohit 15000 for sofa',
    "What is Rohit's remaining balance?",
    "Show last month's transport expenses",
    'Tea & snacks expense 250',
    '50 cloth bundles 12500',
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-2.5 sm:px-4 pb-2.5 sm:pb-4 pt-1.5 shrink-0">
      {/* Quick Suggestion Pills */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1.5 mb-1 select-none">
        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-zinc-400 shrink-0">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span className="hidden xs:inline">Try:</span>
        </div>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => setInput(s)}
            className={`text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full whitespace-nowrap transition-all border shrink-0 ${
              darkMode
                ? 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700 hover:border-zinc-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {speechError && (
        <div className="text-xs text-rose-500 mb-1 px-3 py-1 bg-rose-500/10 rounded-lg">
          {speechError}
        </div>
      )}

      {/* Floating Gemini-Style Input Bar */}
      <div
        className={`relative rounded-2xl sm:rounded-3xl transition-all shadow-xl p-1.5 sm:p-2.5 flex items-end gap-1.5 sm:gap-2 border ${
          darkMode
            ? 'bg-zinc-900/95 border-zinc-800 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20'
            : 'bg-white border-zinc-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-zinc-200'
        }`}
      >
        {/* Invoice Scan / Camera Button */}
        <button
          type="button"
          onClick={onOpenScanner}
          className={`p-2 sm:p-2.5 rounded-full transition-all shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center ${
            darkMode
              ? 'bg-zinc-800 hover:bg-zinc-700 text-indigo-400 hover:text-indigo-300'
              : 'bg-zinc-100 hover:bg-zinc-200 text-indigo-600'
          }`}
          title="Scan & Parse GST Purchase Bill"
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? 'Listening in Hindi / English...'
              : 'Type entry or ask anything...'
          }
          rows={1}
          className={`flex-1 bg-transparent border-0 resize-none outline-none text-xs sm:text-sm py-1 sm:py-1.5 px-1.5 max-h-32 leading-relaxed ${
            darkMode ? 'text-zinc-100 placeholder-zinc-500' : 'text-zinc-900 placeholder-zinc-400'
          }`}
        />

        {/* Voice Input Button */}
        <button
          type="button"
          onClick={toggleVoiceInput}
          className={`p-2 sm:p-2.5 rounded-full transition-all shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
              : darkMode
              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
          }`}
          title={isListening ? 'Stop listening' : 'Speak in Hindi / English'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Send / Submit Button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={!input.trim() || isLoading}
          className={`p-2 sm:p-2.5 rounded-full transition-all shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center ${
            input.trim() && !isLoading
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-500 text-white shadow-md shadow-indigo-500/20 hover:opacity-95'
              : darkMode
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
          }`}
          title="Send command"
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between px-2 sm:px-3 pt-1 text-[10px] text-zinc-500">
        <span className="hidden sm:flex items-center gap-1">
          <CornerDownLeft className="w-3 h-3" /> Press Enter to send, Shift + Enter for newline
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <FileText className="w-3 h-3 text-indigo-400" /> Dynamic 100% offline engine
        </span>
      </div>
    </div>
  );
};
