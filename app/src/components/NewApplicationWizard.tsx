import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import { User, Mail, Calendar, Activity, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  kycStart,
  predictAge,
  submitUnified,
  createLivenessWebSocket,
  type UnifiedResult,
} from '@/services/hub';
import { debugLog, setDisconnect } from '@/lib/debugStore';
import TrustCertificate from './TrustCertificate';
import { cn } from '@/lib/utils';

const SERVICE_OFFLINE_MSG = 'Service Offline';

function showServiceOfflineToast() {
  toast.error(SERVICE_OFFLINE_MSG, { description: 'A required service is unavailable. Please try again later.' });
}

interface BehaviorEvent {
  type: 'keydown' | 'keyup' | 'mousemove' | 'scroll' | 'focus' | 'paste';
  timestamp: number;
  fieldId?: string;
  x?: number;
  y?: number;
  depth?: number;
}

interface PIIFormData {
  name: string;
  email: string;
  dob: string;
}

export default function NewApplicationWizard({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);
  const [pii, setPii] = useState<PIIFormData>({ name: '', email: '', dob: '' });
  const [livenessVerified, setLivenessVerified] = useState(false);
  const [result, setResult] = useState<UnifiedResult | null>(null);
  const [ageMismatchAlert, setAgeMismatchAlert] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [livenessStatus, setLivenessStatus] = useState<string>('WAITING');
  const [livenessChallenge, setLivenessChallenge] = useState('Initializing...');
  const [livenessTimeLeft, setLivenessTimeLeft] = useState(10);
  const [framesSent, setFramesSent] = useState(0);
  const eventsRef = useRef<BehaviorEvent[]>([]);
  const webcamRef = useRef<Webcam>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const logEvent = useCallback((event: BehaviorEvent) => {
    if (eventsRef.current.length >= 2000) eventsRef.current.shift();
    eventsRef.current.push(event);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      logEvent({ type: 'mousemove', timestamp: performance.now(), x: e.clientX, y: e.clientY });
    };
    let moveTimeout: ReturnType<typeof setTimeout>;
    const throttled = (e: MouseEvent) => {
      if (!moveTimeout) {
        moveTimeout = setTimeout(() => { handleMouseMove(e); moveTimeout = null as any; }, 50);
      }
    };
    const handleScroll = () => logEvent({ type: 'scroll', timestamp: performance.now(), depth: window.scrollY });
    window.addEventListener('mousemove', throttled);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousemove', throttled);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [logEvent]);

  const handleFieldEvent = (e: React.BaseSyntheticEvent, type: BehaviorEvent['type']) => {
    logEvent({ type, timestamp: performance.now(), fieldId: e.target?.name });
  };

  // Step 1: Submit PII
  const handlePIISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const appRes = await kycStart(showServiceOfflineToast);
    if (!appRes) return;
    setStep(1);
  };

  // Step 2: Liveness WebSocket + stream frames (base64 data URL – server expects "image" with base64)
  useEffect(() => {
    if (step !== 1) return;
    setFramesSent(0);
    const ws = createLivenessWebSocket();
    wsRef.current = ws;
    ws.onopen = () => {
      setLivenessStatus('CHALLENGE_ACTIVE');
      debugLog({ service: 'Liveness (8000)', direction: 'response', payload: { event: 'WebSocket open', port: 8000 } });
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLivenessStatus(data.state ?? data.status ?? '');
        setLivenessChallenge(data.challenge ?? 'Follow instructions');
        setLivenessTimeLeft(data.remaining_time ?? 10);
        if (data.verified) setLivenessVerified(true);
        debugLog({ service: 'Liveness (8000)', direction: 'response', payload: data });
      } catch (_) {}
    };
    ws.onerror = () => {
      setDisconnect({ port: 8000, service: 'Liveness (8000)', error: 'WebSocket error – Port 8000 unreachable', ts: Date.now() });
      debugLog({ service: 'Liveness (8000)', direction: 'error', error: 'Port 8000 WebSocket error', port: 8000 });
      toast.error(SERVICE_OFFLINE_MSG, { description: 'Liveness service (port 8000) unavailable.' });
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [step]);

  // Stream webcam frames to Liveness WebSocket (frame format: data URL = base64; server strips "data:...;base64,")
  useEffect(() => {
    if (step !== 1) return;
    let sent = 0;
    const interval = setInterval(() => {
      if (webcamRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        const img = webcamRef.current.getScreenshot();
        if (img) {
          wsRef.current!.send(JSON.stringify({ image: img }));
          sent += 1;
          setFramesSent(sent);
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [step]);

  // When liveness verified: take snapshot (webcam still mounted), age, submit, then show result
  const processingTriggerRef = useRef(false);
  useEffect(() => {
    if (step !== 1 || !livenessVerified || processingTriggerRef.current) return;
    processingTriggerRef.current = true;
    setProcessing(true);
    (async () => {
      let visualAge = 0;
      let start = 0, end = 0;
      const screenshot = webcamRef.current?.getScreenshot?.();
      if (screenshot) {
        const blob = await (await fetch(screenshot)).blob();
        const ageRes = await predictAge(blob, showServiceOfflineToast);
        if (ageRes) {
          start = ageRes.startAge;
          end = ageRes.endAge;
          visualAge = ageRes.averageAge;
        } else {
          visualAge = 25;
        }
      }
      const dobYear = pii.dob ? new Date(pii.dob).getFullYear() : null;
      const currentYear = new Date().getFullYear();
      const statedAge = dobYear != null ? currentYear - dobYear : null;
      const camAge = start && end ? (start + end) / 2 : visualAge;
      if (statedAge != null && Math.abs(statedAge - camAge) > 5) {
        setAgeMismatchAlert(`DOB age (${statedAge}) differs from camera age (${Math.round(camAge)}) by more than 5 years.`);
      }
      const payload = {
        record: {
          name: pii.name,
          email: pii.email,
          dob: pii.dob,
          faceAge: visualAge,
          formTime: Math.round(performance.now() / 1000),
          deviceId: 'web_' + Math.random().toString(36).slice(2, 9),
          ip: '127.0.0.1',
          userId: 'user_' + Math.random().toString(36).slice(2, 9),
        },
        behavior: { events: eventsRef.current },
        biometric: { visualAge, livenessVerified: true },
      };
      const unifiedRes = await submitUnified(payload, showServiceOfflineToast);
      setProcessing(false);
      if (unifiedRes) {
        setResult(unifiedRes);
        setStep(2);
      } else {
        toast.error('Submission failed', { description: 'Identity service did not accept the package.' });
        processingTriggerRef.current = false;
      }
    })();
  }, [step, livenessVerified, pii.name, pii.email, pii.dob]);

  const resetWizard = () => {
    setStep(0);
    setResult(null);
    setAgeMismatchAlert(null);
    setLivenessVerified(false);
    eventsRef.current = [];
    processingTriggerRef.current = false;
    onComplete?.();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
              <Activity className="h-5 w-5 text-[#6366F1]" />
              <h2 className="text-lg font-semibold text-slate-200 uppercase tracking-wider">New Application — PII</h2>
            </div>
            <form onSubmit={handlePIISubmit} className="space-y-4">
              {(['name', 'email', 'dob'] as const).map((field) => (
                <div key={field} className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#9333EA]">
                    {field === 'name' && <User size={18} />}
                    {field === 'email' && <Mail size={18} />}
                    {field === 'dob' && <Calendar size={18} />}
                  </div>
                  <input
                    type={field === 'dob' ? 'date' : field === 'email' ? 'email' : 'text'}
                    name={field}
                    placeholder={field === 'dob' ? 'Date of birth' : field.charAt(0).toUpperCase() + field.slice(1)}
                    value={pii[field]}
                    onChange={(e) => setPii((prev) => ({ ...prev, [field]: e.target.value }))}
                    onKeyDown={(e) => handleFieldEvent(e, 'keydown')}
                    onKeyUp={(e) => handleFieldEvent(e, 'keyup')}
                    onFocus={(e) => handleFieldEvent(e, 'focus')}
                    onPaste={(e) => handleFieldEvent(e, 'paste')}
                    required
                    className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-[#9333EA]/50 focus:border-[#9333EA] outline-none transition placeholder-slate-500"
                  />
                </div>
              ))}
              <button
                type="submit"
                className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-[#9333EA] to-[#6366F1] text-white hover:opacity-90 transition shadow-lg shadow-purple-500/20"
              >
                Continue — Liveness
              </button>
            </form>
            <p className="mt-4 text-[10px] font-mono text-slate-500">Events: {eventsRef.current.length}</p>
          </motion.div>
        )}

        {step === 1 && !processing && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-xl"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-300">Liveness — Port 8000</span>
              <span className={cn(
                'px-2 py-1 rounded text-xs font-bold',
                livenessStatus === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
                livenessStatus === 'FAILED' ? 'bg-red-500/20 text-red-400' : 'bg-[#6366F1]/20 text-[#6366F1]'
              )}>
                {livenessStatus}
              </span>
            </div>
            <div className="relative aspect-video bg-black overflow-hidden">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                videoConstraints={{ facingMode: 'user' }}
              />
              {/* Purple 'Scanning' overlay – confirms frontend is capturing and sending frames */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="absolute inset-0 bg-[#9333EA]/20 mix-blend-multiply" />
                <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-[#9333EA]/40 border border-[#9333EA]/50 backdrop-blur-sm">
                  <span className="text-xs font-bold text-white uppercase tracking-wider animate-pulse">Scanning</span>
                </div>
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded bg-black/60 backdrop-blur text-xs font-mono text-slate-300">
                  Frames sent: {framesSent}
                </div>
              </div>
              <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                <div className="bg-black/50 backdrop-blur rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-slate-400 uppercase">Challenge</p>
                  <p className="text-lg font-bold text-white">{livenessChallenge}</p>
                  <p className="text-xs text-slate-500">{livenessTimeLeft.toFixed(1)}s remaining</p>
                </div>
              </div>
            </div>
            <p className="p-3 text-xs text-slate-500 text-center">Video feed preview: frames sent as base64 to Port 8000. Complete the challenge to continue.</p>
          </motion.div>
        )}

        {step === 1 && processing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 flex flex-col items-center justify-center min-h-[280px]"
          >
            <div className="w-14 h-14 rounded-full border-2 border-[#6366F1]/30 border-t-[#6366F1] animate-spin mb-4" />
            <h3 className="text-lg font-bold text-slate-200">Processing</h3>
            <p className="text-sm text-slate-500 mt-1">Snapshot → Age (5000) → Identity (3001)</p>
          </motion.div>
        )}

        {step === 2 && result && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {ageMismatchAlert && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200">{ageMismatchAlert}</p>
              </div>
            )}
            <TrustCertificate
              score={result.compositeScore}
              details={result.breakdown}
            />
            <div className="flex justify-center">
              <button
                onClick={resetWizard}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white border border-white/10 hover:bg-white/5 transition"
              >
                New Application
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
