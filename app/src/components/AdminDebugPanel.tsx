import { useState, useEffect, useCallback, useRef } from 'react';
import { Bug, Copy, Trash2, X, FileCheck, Upload } from 'lucide-react';
import { getLogs, subscribe, clearLogs, type DebugLogEntry, type ServiceLabel } from '@/lib/debugStore';
import ServiceDisconnectedModal from './ServiceDisconnectedModal';
import { analyzeDocument } from '@/services/hub';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SERVICE_COLORS: Record<ServiceLabel, string> = {
  'Identity (3001)': 'text-emerald-400',
  'Age (5000)': 'text-amber-400',
  'Liveness (8000)': 'text-cyan-400',
  'Document (3001)': 'text-violet-400',
  'Behavior': 'text-pink-400',
};

export default function AdminDebugPanel() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<DebugLogEntry[]>(getLogs());
  const [documentMockSuccess, setDocumentMockSuccess] = useState(true);
  const [docIssueDate, setDocIssueDate] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    setLogs(getLogs());
  }, []);

  useEffect(() => {
    const unsub = subscribe(refresh);
    return unsub;
  }, [refresh]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const copyAll = () => {
    const text = logs.map((l) => `${l.ts} [${l.service}] ${l.direction} ${l.error ?? JSON.stringify(l.payload ?? {}, null, 2)}`).join('\n\n');
    navigator.clipboard.writeText(text);
  };

  const handleDocumentTest = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Select a file first');
      return;
    }
    const res = await analyzeDocument(file, { docIssueDate: docIssueDate || undefined, mockSuccess: documentMockSuccess }, () => toast.error('Service Offline'));
    if (res) toast.success(`Document: ${res.isAuthentic ? 'Authentic' : 'Flagged'} | docIssueDateValid: ${(res as { docIssueDateValid?: boolean }).docIssueDateValid ?? 'n/a'}`);
  };

  return (
    <>
      <ServiceDisconnectedModal />
      {/* Hidden trigger: Ctrl+Shift+D */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-[#9333EA] hover:border-[#9333EA]/30 z-50"
        title="Admin Debug (Ctrl+Shift+D)"
        aria-label="Open Admin Debug"
      >
        <Bug className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[85vh] rounded-2xl border border-[#9333EA]/30 bg-[#0B0B0F] shadow-2xl shadow-[#9333EA]/10 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#9333EA]/10">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-[#9333EA]" />
                <h2 className="font-bold text-white">Admin Debug — Service Logs</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyAll}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                  title="Copy all"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { clearLogs(); refresh(); }}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                  title="Clear logs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Document Processing: Mock Success toggle + docIssueDate */}
            <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex flex-wrap items-center gap-4">
              <span className="text-slate-400 text-sm font-medium">Document test:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={documentMockSuccess}
                  onChange={(e) => setDocumentMockSuccess(e.target.checked)}
                  className="rounded border-white/20 bg-black/40 text-[#9333EA] focus:ring-[#9333EA]"
                />
                <span className="text-xs text-slate-400">Mock Success</span>
              </label>
              <input
                type="date"
                placeholder="docIssueDate (YYYY-MM-DD)"
                value={docIssueDate}
                onChange={(e) => setDocIssueDate(e.target.value)}
                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-slate-300"
              />
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" id="debug-doc-upload" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs px-2 py-1 rounded bg-white/10 text-slate-400 hover:text-white"
              >
                Choose file
              </button>
              <button
                type="button"
                onClick={handleDocumentTest}
                className="text-xs px-3 py-1 rounded bg-[#9333EA]/30 text-[#9333EA] hover:bg-[#9333EA]/50 flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                POST /api/analyze/document
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 font-mono text-xs space-y-2">
              {logs.length === 0 ? (
                <div className="text-slate-500 flex items-center gap-2 py-8 justify-center">
                  <FileCheck className="w-4 h-4" />
                  No logs yet. Use Identity Scan / New Application to generate traffic. Liveness, Age, and Identity responses will appear here.
                </div>
              ) : (
                logs.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      'rounded-lg border p-3 border-white/5 bg-white/[0.02]',
                      entry.direction === 'error' && 'border-red-500/30 bg-red-500/5'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('font-semibold', SERVICE_COLORS[entry.service])}>{entry.service}</span>
                      <span className="text-slate-500">{entry.direction}</span>
                      <span className="text-slate-600">{new Date(entry.ts).toLocaleTimeString()}</span>
                    </div>
                    {entry.error && <p className="text-red-400 mb-1">{entry.error}</p>}
                    {entry.payload != null && (
                      <pre className="text-slate-400 whitespace-pre-wrap break-all max-h-40 overflow-auto">
                        {typeof entry.payload === 'string' ? entry.payload : JSON.stringify(entry.payload, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
