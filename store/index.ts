// store/index.ts
// Lightweight client-side store for scan history.
// Keeps the last MAX_HISTORY reports in memory and syncs to localStorage
// so history survives page refreshes without a Supabase round-trip.
// ScanHistory (Supabase) is the source of truth for server-side history;
// this store is the source of truth for the current session's results.

import { ScanReport } from '@/lib/types'

const STORAGE_KEY = 'vuln_scanner_history'
const MAX_HISTORY = 20

// ─── Types ────────────────────────────────────────────────────────────────────

type Listener = () => void

// ─── Internal state ───────────────────────────────────────────────────────────

let history: ScanReport[] = []
const listeners = new Set<Listener>()

// ─── Persistence helpers ──────────────────────────────────────────────────────

function loadFromStorage(): ScanReport[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as ScanReport[]
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

// ─── Notify subscribers ───────────────────────────────────────────────────────

function notify(): void {
  listeners.forEach((fn) => fn())
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Initialise the store from localStorage. Call once on app mount. */
export function initStore(): void {
  history = loadFromStorage()
  notify()
}

/** Add a new scan report to the front of history. */
export function addReport(report: ScanReport): void {
  // Deduplicate by scanId — re-scanning the same URL produces a new scanId,
  // so this only removes exact duplicates (e.g. hot-reload double-submit).
  history = [report, ...history.filter((r) => r.scanId !== report.scanId)]
  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY)
  }
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

/** Subscribe to store changes. Returns an unsubscribe function. */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}