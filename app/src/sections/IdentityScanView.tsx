import { Fingerprint } from 'lucide-react';
import NewApplicationWizard from '@/components/NewApplicationWizard';

export default function IdentityScanView() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Fingerprint className="h-7 w-7 text-[#9333EA]" />
          Identity Scan
        </h1>
        <p className="text-slate-400 mt-1">New Application wizard: PII → Liveness → Age → Unified Trust.</p>
      </div>
      <NewApplicationWizard />
    </div>
  );
}
