import { ScanFace } from 'lucide-react';

export default function BiometricsView() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <ScanFace className="h-7 w-7 text-[#6366F1]" />
          Biometrics
        </h1>
        <p className="text-slate-400 mt-1">Liveness stream (port 8000) and age/gender (port 5000) are used inside the New Application wizard.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 max-w-lg">
        <p className="text-slate-400 text-sm">
          Start a <strong className="text-slate-300">New Application</strong> from <strong className="text-slate-300">Identity Scan</strong> to run the full flow: webcam frames stream to the Liveness service (port 8000), then a snapshot is sent to Age Detection (port 5000).
        </p>
      </div>
    </div>
  );
}
