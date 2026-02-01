/**
 * Service Diagnostic Mode — Admin Debug store
 * Logs exact JSON response from Identity (3001), Age (5000), Behavior, Liveness.
 * Tracks which PORT disconnected (404 / Network Error) for Amethyst modal.
 */

export type ServiceLabel = 'Identity (3001)' | 'Age (5000)' | 'Liveness (8000)' | 'Document (3001)' | 'Behavior';

export interface DebugLogEntry {
  id: string;
  ts: number;
  service: ServiceLabel;
  direction: 'request' | 'response' | 'error';
  payload?: unknown;
  error?: string;
  port?: number;
}

export interface DisconnectInfo {
  port: number;
  service: ServiceLabel;
  error: string;
  ts: number;
}

const logs: DebugLogEntry[] = [];
const maxLogs = 200;
const listeners: Set<() => void> = new Set();
let disconnectInfo: DisconnectInfo | null = null;

function notify() {
  listeners.forEach((cb) => cb());
}

export function debugLog(entry: Omit<DebugLogEntry, 'id' | 'ts'>) {
  const full: DebugLogEntry = {
    ...entry,
    id: Math.random().toString(36).slice(2, 11),
    ts: Date.now(),
  };
  logs.unshift(full);
  if (logs.length > maxLogs) logs.pop();
  notify();
}

export function setDisconnect(info: DisconnectInfo) {
  disconnectInfo = info;
  notify();
}

export function clearDisconnect() {
  disconnectInfo = null;
  notify();
}

export function getLogs(): DebugLogEntry[] {
  return [...logs];
}

export function getDisconnect(): DisconnectInfo | null {
  return disconnectInfo;
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function clearLogs() {
  logs.length = 0;
  notify();
}
