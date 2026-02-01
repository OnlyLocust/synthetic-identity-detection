import React from 'react';
import { LayoutDashboard, Fingerprint, ScanFace, Activity } from 'lucide-react';
import GlobalHealthMonitor from '@/components/GlobalHealth';
import { cn } from '@/lib/utils';

export type EchelonView = 'overview' | 'identity-scan' | 'biometrics' | 'behavior-analytics';

const navItems: { id: EchelonView; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'identity-scan', label: 'Identity Scan', icon: <Fingerprint className="h-4 w-4" /> },
  { id: 'biometrics', label: 'Biometrics', icon: <ScanFace className="h-4 w-4" /> },
  { id: 'behavior-analytics', label: 'Behavior Analytics', icon: <Activity className="h-4 w-4" /> },
];

interface EchelonLayoutProps {
  currentView: EchelonView;
  onViewChange: (view: EchelonView) => void;
  children: React.ReactNode;
}

export default function EchelonLayout({ currentView, onViewChange, children }: EchelonLayoutProps) {
  return (
    <div className="min-h-screen bg-echelon-obsidian text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/5 bg-black/30 backdrop-blur-xl flex flex-col">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-echelon-purple to-echelon-indigo flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20">
              E
            </div>
            <span className="font-bold text-lg tracking-tight text-white">Echelon Prime</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                currentView === item.id
                  ? 'bg-echelon-purple/20 text-[#9333EA] border border-echelon-purple/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <GlobalHealthMonitor />
        </div>
      </aside>
      {/* Main Viewport */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-full bg-gradient-to-b from-echelon-obsidian via-echelon-obsidian to-[#0f0f18]">
          {children}
        </div>
      </main>
    </div>
  );
}

export { navItems };
