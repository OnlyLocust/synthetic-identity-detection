import { Activity } from 'lucide-react';

export default function BehaviorAnalyticsView() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Activity className="h-7 w-7 text-[#9333EA]" />
          Behavior Analytics
        </h1>
        <p className="text-slate-400 mt-1">Mouse and keyboard telemetry are captured during the PII step and sent with the unified package to port 3001 (30% weight in Trust Score).</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 max-w-lg">
        <p className="text-slate-400 text-sm">
          In the <strong className="text-slate-300">New Application</strong> wizard, behavior events (keydown, keyup, mousemove, scroll, focus, paste) are recorded while the user types and submitted with the final payload. The Identity & Behavior service uses this for the Unified Trust Score (Identity 40%, Behavior 30%, Biometrics 30%).
        </p>
      </div>
    </div>
  );
}
