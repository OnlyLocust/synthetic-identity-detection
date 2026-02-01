/**
 * Echelon Prime – Hub API
 * Orchestrates: Port 3001 (Identity & Behavior), Port 5000 (Age/Gender), Port 8000 (Liveness WebSocket)
 * Service Diagnostic: logs and disconnect info via debugStore for Admin Debug panel.
 */

import { debugLog, setDisconnect } from '@/lib/debugStore';

const HUB_3001 = import.meta.env.VITE_HUB_3001 || 'http://localhost:3001';
const HUB_5000 = import.meta.env.VITE_HUB_5000 || 'http://localhost:5000';
const HUB_8000_WS = import.meta.env.VITE_HUB_8000_WS || 'ws://localhost:8000';

export type ServiceStatus = 'online' | 'offline' | 'checking';

export interface GlobalHealth {
  port3001: ServiceStatus;
  port5000: ServiceStatus;
  port8000: ServiceStatus;
}

/** Check Port 3001 – Identity & Behavior (GET /api/dashboard/stats or /api/health) */
export async function checkPort3001(): Promise<boolean> {
  try {
    const res = await fetch(`${HUB_3001}/api/health`, { method: 'GET', signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Check Port 5000 – Age/Gender (probe by GET or OPTIONS) */
export async function checkPort5000(): Promise<boolean> {
  try {
    const res = await fetch(`${HUB_5000}/`, { method: 'GET', signal: AbortSignal.timeout(2000) });
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

/** Check Port 8000 – Liveness WebSocket (probe by opening WS) */
export function checkPort8000(): Promise<boolean> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`${HUB_8000_WS}/ws/liveness`);
    const t = setTimeout(() => {
      ws.close();
      resolve(false);
    }, 2500);
    ws.onopen = () => {
      clearTimeout(t);
      ws.close();
      resolve(true);
    };
    ws.onerror = () => {
      clearTimeout(t);
      resolve(false);
    };
  });
}

/** Fetch Global Health for sidebar */
export async function fetchGlobalHealth(): Promise<GlobalHealth> {
  const [port3001, port5000, port8000] = await Promise.all([
    checkPort3001().then((ok) => (ok ? 'online' : 'offline')),
    checkPort5000().then((ok) => (ok ? 'online' : 'offline')),
    checkPort8000().then((ok) => (ok ? 'online' : 'offline')),
  ]);
  return { port3001, port5000, port8000 };
}

// —— KYC / Identity (Port 3001) ——

/** POST /api/kyc/start – start new application */
export async function kycStart(onServiceOffline?: () => void): Promise<{ applicationId: string } | null> {
  try {
    const res = await fetch(`${HUB_3001}/api/kyc/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 404 || res.status >= 500) {
      const errMsg = `Identity (3001): ${res.status}`;
      setDisconnect({ port: 3001, service: 'Identity (3001)', error: errMsg, ts: Date.now() });
      debugLog({ service: 'Identity (3001)', direction: 'error', error: errMsg, port: 3001 });
      onServiceOffline?.();
      return null;
    }
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    debugLog({ service: 'Identity (3001)', direction: 'response', payload: data });
    return data;
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Network Error';
    setDisconnect({ port: 3001, service: 'Identity (3001)', error: errMsg, ts: Date.now() });
    debugLog({ service: 'Identity (3001)', direction: 'error', error: errMsg, port: 3001 });
    onServiceOffline?.();
    return null;
  }
}

/** GET /api/dashboard/stats */
export async function dashboardStats(onServiceOffline?: () => void): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${HUB_3001}/api/dashboard/stats`, { signal: AbortSignal.timeout(5000) });
    if (res.status === 404 || res.status >= 500) {
      setDisconnect({ port: 3001, service: 'Identity (3001)', error: `Dashboard stats: ${res.status}`, ts: Date.now() });
      debugLog({ service: 'Identity (3001)', direction: 'error', error: `GET /api/dashboard/stats ${res.status}`, port: 3001 });
      onServiceOffline?.();
      return null;
    }
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    debugLog({ service: 'Identity (3001)', direction: 'response', payload: { endpoint: '/api/dashboard/stats', ...data } });
    return data;
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Network Error';
    setDisconnect({ port: 3001, service: 'Identity (3001)', error: errMsg, ts: Date.now() });
    debugLog({ service: 'Identity (3001)', direction: 'error', error: errMsg, port: 3001 });
    onServiceOffline?.();
    return null;
  }
}

// —— Age (Port 5000) – /api/predict-age or /detect ——

export interface PredictAgeResult {
  startAge: number;
  endAge: number;
  /** Average age for trust score */
  averageAge: number;
}

/** POST image to Port 5000 – /api/predict-age (or /detect). Snapshot taken after liveness; average (start+end)/2 passed to aggregator. */
export async function predictAge(
  imageBlob: Blob,
  onServiceOffline?: () => void
): Promise<PredictAgeResult | null> {
  const form = new FormData();
  form.append('image', imageBlob, 'capture.jpg');
  debugLog({ service: 'Age (5000)', direction: 'request', payload: { note: 'Snapshot (post-liveness) sent to Age Detection', size: imageBlob.size } });
  try {
    let res = await fetch(`${HUB_5000}/api/predict-age`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) {
      res = await fetch(`${HUB_5000}/detect`, { method: 'POST', body: form, signal: AbortSignal.timeout(10000) });
    }
    if (res.status === 404 || res.status >= 500) {
      setDisconnect({ port: 5000, service: 'Age (5000)', error: `Age (5000): ${res.status}`, ts: Date.now() });
      debugLog({ service: 'Age (5000)', direction: 'error', error: `Port 5000 returned ${res.status}`, port: 5000 });
      onServiceOffline?.();
      return null;
    }
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const startAge = data.detectAge?.startAge ?? data.startAge ?? 25;
    const endAge = data.detectAge?.endAge ?? data.endAge ?? 32;
    const averageAge = Math.round((startAge + endAge) / 2);
    debugLog({
      service: 'Age (5000)',
      direction: 'response',
      payload: { startAge, endAge, averageAge, note: '(startAge + endAge) / 2 passed to main aggregator as faceAge/visualAge', raw: data },
    });
    return { startAge, endAge, averageAge };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Network Error';
    setDisconnect({ port: 5000, service: 'Age (5000)', error: errMsg, ts: Date.now() });
    debugLog({ service: 'Age (5000)', direction: 'error', error: errMsg, port: 5000 });
    onServiceOffline?.();
    return null;
  }
}

// —— Document Processing (Port 3001) – /api/analyze/document ——

export interface DocumentAnalyzeOptions {
  docIssueDate?: string; // YYYY-MM-DD for Document Age Validation
  mockSuccess?: boolean; // If true, skip real OCR and return mock success for testing
}

export interface DocumentAnalyzeResult {
  forgeryScore: number;
  confidence: number;
  isAuthentic: boolean;
  documentType: string;
  flags: string[];
  docIssueDateValid?: boolean;
}

/** POST /api/analyze/document – with optional docIssueDate and mockSuccess for testing */
export async function analyzeDocument(
  file: File | Blob,
  options: DocumentAnalyzeOptions = {},
  onServiceOffline?: () => void
): Promise<DocumentAnalyzeResult | null> {
  const { docIssueDate, mockSuccess } = options;
  const form = new FormData();
  form.append('document', file, file instanceof File ? file.name : 'document.jpg');
  if (docIssueDate) form.append('docIssueDate', docIssueDate);
  const url = new URL(`${HUB_3001}/api/analyze/document`);
  if (mockSuccess) url.searchParams.set('mockSuccess', 'true');
  debugLog({ service: 'Document (3001)', direction: 'request', payload: { docIssueDate: docIssueDate ?? '(none)', mockSuccess: !!mockSuccess } });
  try {
    const res = await fetch(url.toString(), { method: 'POST', body: form, signal: AbortSignal.timeout(15000) });
    if (res.status === 404 || res.status >= 500) {
      setDisconnect({ port: 3001, service: 'Document (3001)', error: `Document: ${res.status}`, ts: Date.now() });
      debugLog({ service: 'Document (3001)', direction: 'error', error: `POST /api/analyze/document ${res.status}`, port: 3001 });
      onServiceOffline?.();
      return null;
    }
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    debugLog({ service: 'Document (3001)', direction: 'response', payload: data });
    return data;
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Network Error';
    setDisconnect({ port: 3001, service: 'Document (3001)', error: errMsg, ts: Date.now() });
    debugLog({ service: 'Document (3001)', direction: 'error', error: errMsg, port: 3001 });
    onServiceOffline?.();
    return null;
  }
}

// —— Liveness (Port 8000) – WebSocket ——

export function createLivenessWebSocket(): WebSocket {
  return new WebSocket(`${HUB_8000_WS}/ws/liveness`);
}

// —— Submit full package to Port 3001 (unified) ——

export interface UnifiedPayload {
  record: {
    name: string;
    email: string;
    dob: string;
    phone?: string;
    faceAge: number;
    formTime: number;
    deviceId: string;
    ip?: string;
    userId?: string;
  };
  behavior: { events: unknown[] };
  biometric: { visualAge: number; livenessVerified: boolean };
}

export interface UnifiedResult {
  success: boolean;
  compositeScore: number;
  breakdown: {
    identityScore: number;
    behaviorScore: number;
    ageMatchScore: number;
    isSynthetic: boolean;
  };
  details?: unknown[];
}

/** POST /api/unified – record.faceAge must be average (start+end)/2 from Age (5000). */
export async function submitUnified(
  payload: UnifiedPayload,
  onServiceOffline?: () => void
): Promise<UnifiedResult | null> {
  debugLog({ service: 'Identity (3001)', direction: 'request', payload: { endpoint: '/api/unified', faceAge: payload.record.faceAge, visualAge: payload.biometric.visualAge, behaviorEventCount: payload.behavior.events?.length } });
  try {
    const res = await fetch(`${HUB_3001}/api/unified`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 404 || res.status >= 500) {
      setDisconnect({ port: 3001, service: 'Identity (3001)', error: `Unified: ${res.status}`, ts: Date.now() });
      debugLog({ service: 'Identity (3001)', direction: 'error', error: `POST /api/unified ${res.status}`, port: 3001 });
      onServiceOffline?.();
      return null;
    }
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    debugLog({ service: 'Identity (3001)', direction: 'response', payload: { endpoint: '/api/unified', compositeScore: data.compositeScore, breakdown: data.breakdown } });
    return data;
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Network Error';
    setDisconnect({ port: 3001, service: 'Identity (3001)', error: errMsg, ts: Date.now() });
    debugLog({ service: 'Identity (3001)', direction: 'error', error: errMsg, port: 3001 });
    onServiceOffline?.();
    return null;
  }
}
