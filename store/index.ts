// store/index.ts
// Lightweight client-side store for scan history.
// Keeps the last MAX_HISTORY reports in memory and syncs to localStorage.
//
// React Fast Refresh safety: listeners are stored in a stable Set that
// survives HMR module re-evaluation because the Set is initialised once.
// Components must call subscribe() inside useEffect (not render) to avoid
// accumulating phantom listeners across hot reloads.

import { ScanReport } from '@/lib/types'

const STORAGE_KEY = 'vuln_scanner_history'
const MAX_HISTORY = 20

type Listener = () => void

// ─── Internal state ───────────────────────────────────────────────────────────
// Module-level variables are fine here; the store is intentionally a singleton.
// React Fast Refresh re-runs module code but the Set reference is stable because
// the module is cached — new listeners come from fresh component mounts,
// and useEffect cleanup removes stale ones before remount.

let history: ScanReport[] = []
const listeners = new Set<Listener>()

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadFromStorage(): ScanReport[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ScanReport[]) : []
  } catch {
    return []
  }
}

function saveToStorage(reports: ScanReport[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
  } catch {
    // Storage quota exceeded or SSR — silently ignore
  }
}

function notify(): void {
  listeners.forEach((fn) => fn())
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Initialise the store from localStorage. Idempotent — safe to call multiple times. */
export function initStore(): void {
  if (history.length === 0) {
    history = loadFromStorage()
    if (history.length > 0) notify()
  }
}

/** Add a new scan report to the front of history. */
export function addReport(report: ScanReport): void {
  // Deduplicate by scanId — removes exact duplicates (e.g. hot-reload double-submit)
  history = [report, ...history.filter((r) => r.scanId !== report.scanId)]
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY)
  saveToStorage(history)
  notify()
}

/** Return current history (newest first). */
export function getHistory(): ScanReport[] {
  return history
}

/** Clear all history from memory and localStorage. */
export function clearHistory(): void {
  history = []
  saveToStorage([])
  notify()
}

/**
 * Subscribe to store changes.
 * ALWAYS call this inside useEffect so the cleanup runs on unmount.
 * Returns an unsubscribe function.
 */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}