import React from 'react';
import { X, Smartphone, Download, CheckCircle2, Share } from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onInstallClick: () => void;
  isInstallable: boolean;
  isIOS: boolean;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  onInstallClick,
  isInstallable,
  isIOS,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
          darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Install Mobile App (PWA)</h3>
              <p className="text-[11px] text-zinc-400">100% Offline Standalone App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* App preview card */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
              darkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-100/80 border-zinc-200'
            }`}
          >
            <img
              src="./pwa-192x192.png"
              alt="GstA App Icon"
              className="w-12 h-12 rounded-2xl shadow-md shrink-0"
            />
            <div>
              <h4 className="font-semibold text-sm text-zinc-100">GstA Local Ledger</h4>
              <p className="text-[11px] text-zinc-400">Instant launch • Zero cloud storage • Full screen</p>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2 text-zinc-400 text-[11px]">
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Runs 100% offline without any internet connection</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Full-screen native mobile experience without browser address bar</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>One-tap launch from your phone's Home Screen</span>
            </div>
          </div>

          {/* iOS Safari Guide */}
          {isIOS ? (
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
              <span className="font-semibold text-indigo-400 text-xs flex items-center gap-1.5">
                <Share className="w-3.5 h-3.5" /> Instructions for iPhone / iPad (Safari)
              </span>
              <ol className="list-decimal list-inside space-y-1 text-zinc-300 text-[11px] leading-relaxed">
                <li>Tap the <strong>Share</strong> button at bottom of Safari screen (square with arrow up).</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                <li>Tap <strong>"Add"</strong> in top right corner.</li>
              </ol>
            </div>
          ) : (
            <div className="pt-2">
              <button
                type="button"
                onClick={onInstallClick}
                disabled={!isInstallable}
                className="w-full py-3 rounded-xl font-medium text-xs bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-500 text-white hover:opacity-95 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Install on Device Home Screen</span>
              </button>
              {!isInstallable && (
                <p className="text-[10px] text-zinc-500 text-center mt-2">
                  (If the prompt does not appear, tap your browser's menu ⋮ and choose <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>)
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
