import { useEffect, useState } from 'react';
import { Activity, Server } from 'lucide-react';
import { fetchGlobalHealth, type GlobalHealth } from '@/services/hub';
import { cn } from '@/lib/utils';

const statusConfig = {
  online: { label: 'Online', color: 'text-emerald-400', bg: 'bg-emerald-500/20', pulse: false },
  offline: { label: 'Offline', color: 'text-red-400', bg: 'bg-red-500/20', pulse: true },
  checking: { label: 'Checking…', color: 'text-amber-400', bg: 'bg-amber-500/20', pulse: true },
};

const portLabels: Record<keyof GlobalHealth, string> = {
  port3001: 'Identity & Behavior (3001)',
  port5000: 'Age / Gender (5000)',
  port8000: 'Liveness (8000)',
};

export default function GlobalHealthMonitor() {
  const [health, setHealth] = useState<GlobalHealth>({
    port3001: 'checking',
    port5000: 'checking',
    port8000: 'checking',
  });

  useEffect(() => {
    let cancelled = false;
    setHealth((h) => ({ ...h, port3001: 'checking', port5000: 'checking', port8000: 'checking' }));
    fetchGlobalHealth().then((result) => {
      if (!cancelled) setHealth(result);
    });
    const t = setInterval(() => {
      fetchGlobalHealth().then((result) => {
        if (!cancelled) setHealth(result);
      });
    }, 15000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-3 space-y-2">
      <div className="flex items-center gap-2 px-1 pb-2 border-b border-white/5">
        <Activity className="h-4 w-4 text-[#6366F1]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Global Health</span>
      </div>
      {(Object.keys(health) as (keyof GlobalHealth)[]).map((key) => {
        const status = health[key];
        const cfg = statusConfig[status];
        return (
          <div key={key} className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Server className="h-3.5 w-3 text-slate-500 shrink-0" />
              <span className="text-slate-500 truncate">{portLabels[key]}</span>
            </div>
            <span
              className={cn(
                'shrink-0 px-2 py-0.5 rounded-md font-medium',
                cfg.bg,
                cfg.color,
                cfg.pulse && 'animate-pulse'
              )}
            >
              {cfg.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
