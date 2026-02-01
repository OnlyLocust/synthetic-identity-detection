import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Shield, TrendingUp } from 'lucide-react';
import { dashboardStats } from '@/services/hub';
import { toast } from 'sonner';

const SERVICE_OFFLINE = 'Service Offline';

export default function OverviewView() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dashboardStats(() => toast.error(SERVICE_OFFLINE, { description: 'Identity & Behavior (port 3001) unavailable.' }))
      .then((data) => {
        if (!cancelled) {
          setStats(data ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
        <p className="text-slate-400 mt-1">Dashboard stats from Identity & Behavior service (port 3001).</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 h-28 animate-pulse" />
          ))
        ) : stats ? (
          <>
            <StatCard
              label="Total Verifications"
              value={String(stats.totalVerifications ?? 0)}
              icon={<Shield className="h-5 w-5" />}
            />
            <StatCard
              label="Pending Reviews"
              value={String(stats.pendingReviews ?? 0)}
              icon={<LayoutDashboard className="h-5 w-5" />}
            />
            <StatCard
              label="Avg Risk Score"
              value={String(stats.avgRiskScore ?? 0)}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              label="Verification Rate %"
              value={String(stats.verificationRate ?? 0) + '%'}
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </>
        ) : (
          <div className="col-span-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center text-slate-500">
            No stats available. Ensure the Identity & Behavior service (port 3001) is running.
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</span>
        <span className="text-[#6366F1]">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
