import { useEffect } from 'react';
import { X, WifiOff } from 'lucide-react';
import { getDisconnect, clearDisconnect, subscribe } from '@/lib/debugStore';
import { useState } from 'react';

/** Amethyst-themed modal when a service (PORT) returns 404 or Network Error */
export default function ServiceDisconnectedModal() {
  const [info, setInfo] = useState<ReturnType<typeof getDisconnect>>(getDisconnect());

  useEffect(() => {
    const unsub = subscribe(() => setInfo(getDisconnect()));
    return unsub;
  }, []);

  if (!info) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md rounded-2xl border-2 border-[#9333EA]/50 bg-gradient-to-b from-[#1a0a2e] to-[#0f0f1a] shadow-2xl shadow-[#9333EA]/20 overflow-hidden"
        role="dialog"
        aria-labelledby="disconnect-title"
      >
        {/* Amethyst glow */}
        <div className="absolute inset-0 bg-[#9333EA]/10 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#9333EA]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#9333EA]/30 flex items-center justify-center border border-[#9333EA]/50">
              <WifiOff className="w-6 h-6 text-[#9333EA]" />
            </div>
            <div>
              <h2 id="disconnect-title" className="text-lg font-bold text-white">
                Service Disconnected
              </h2>
              <p className="text-sm text-slate-400">Diagnostic: Port unreachable or error</p>
            </div>
          </div>

          <div className="rounded-xl bg-black/40 border border-[#9333EA]/20 p-4 mb-6">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">Disconnected port</div>
            <div className="text-2xl font-bold text-[#9333EA]">Port {info.port}</div>
            <div className="text-sm text-slate-300 mt-1">{info.service}</div>
            <div className="text-xs text-slate-500 mt-2 break-words">{info.error}</div>
          </div>

          <p className="text-sm text-slate-400 mb-6">
            Ensure the service for this port is running. Check the Admin Debug panel (Ctrl+Shift+D) for full request/response logs.
          </p>

          <button
            onClick={() => clearDisconnect()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#9333EA]/30 hover:bg-[#9333EA]/50 border border-[#9333EA]/50 text-white font-medium transition"
          >
            <X className="w-4 h-4" />
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
