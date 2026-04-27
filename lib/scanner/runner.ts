// lib/scanner/runner.ts

import { checks } from '@/lib/checks/index'
import { ScanContext, ScanResult, ScanReport, ScanSummary, CrawlStats } from '@/lib/types'
import { SCAN_CONFIG } from '@/lib/constants'

// ─── Per-check timeout ────────────────────────────────────────────────────────
// Wraps each check in a race against CHECK_TIMEOUT_MS so a single slow check
// (DNS lookups, subdomain takeover, etc.) can't consume the whole 9s budget.

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Check "${label}" timed out after ${ms}ms`)), ms)
    ),
  ])
}

async function runWithConcurrency(
  ctx: ScanContext,
  limit: number
): Promise<ScanResult[]> {
  const results: ScanResult[] = []
  const queue = [...checks]

  async function runNext(): Promise<void> {
    const check = queue.shift()
    if (!check) return

    try {
      const found = await withTimeout(
        check.run(ctx),
        SCAN_CONFIG.CHECK_TIMEOUT_MS,
        check.name
      )
      results.push(...found)
    } catch {
      results.push({
        checkId: check.id,
        name:    check.name,
        severity: 'info',
        status:  'skip',
        detail:  'Check failed to run or timed out.',
      })
    }

    await runNext()
  }

  const workers = Array.from(
    { length: Math.min(limit, checks.length) },
    () => runNext()
  )

  await Promise.all(workers)
  return results
}

// ─── Scoring ──────────────────────────────────────────────────────────────────
//
// Formula: penalty-based deduction from 100.
//   score = max(0, 100 - (high_fails×12 + medium_fails×6 + low_fails×2))
//
// Penalty weights (calibrated against real scans):
//   high   → 12 pts  — critical (DMARC missing, SQL injection, etc.)
//   medium → 6  pts  — important (CSP missing, CORS wildcard, etc.)
//   low    → 2  pts  — hardening (missing Referrer-Policy, X-Frame, etc.)
//   info   → 0  pts  — informational only, not scored either way
//
// Score capping: each critical hard-caps the ceiling.
//   1 critical → max 60 | 2 → max 48 | 3+ → max 36

const PENALTY: Record<string, number> = {
  high:   12,
  medium:  6,
  low:     2,
  info:    0,
}

function computeSummary(results: ScanResult[], crawlStats: CrawlStats): ScanSummary {
  const summary: ScanSummary = {
    total:    results.length,
    high:     0,
    medium:   0,
    low:      0,
    passed:   0,
    info:     0,
    skipped:  0,
    score:    100,
    crawlStats,
  }

  let penalty = 0

  for (const r of results) {
    if (r.status === 'pass') {
      if (r.severity === 'info') summary.info++
      else                       summary.passed++
    } else if (r.status === 'skip') {
      summary.skipped++
    } else {
      if      (r.severity === 'high')   { summary.high++;   penalty += PENALTY.high   }
      else if (r.severity === 'medium') { summary.medium++; penalty += PENALTY.medium }
      else if (r.severity === 'low')    { summary.low++;    penalty += PENALTY.low    }
    }
  }

  let score = Math.max(0, 100 - penalty)

  if (summary.high >= 1) {
    const cap = Math.max(36, 60 - (summary.high - 1) * 12)
    score = Math.min(score, cap)
  }

  summary.score = score
  return summary
}

export async function runScan(ctx: ScanContext): Promise<ScanReport> {
  const results = await runWithConcurrency(ctx, SCAN_CONFIG.MAX_CONCURRENT_CHECKS)
  const summary = computeSummary(results, ctx.crawlStats)

  return {
    scanId:    ctx.scanId,
    url:       ctx.url,
    timestamp: ctx.timestamp,
    status:    'completed',
    results,
    summary,
  }
}