// lib/scanner/runner.ts

import { checks } from '@/lib/checks/index'
import { ScanContext, ScanResult, ScanReport, ScanSummary } from '@/lib/types'
import { SCAN_CONFIG } from '@/lib/constants'

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
      const found = await check.run(ctx)
      results.push(...found)
    } catch {
      results.push({
        checkId: check.id,
        name: check.name,
        severity: 'info',
        status: 'skip',
        detail: 'Check failed to run or timed out.',
        score: 0,
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
// Why NOT a weighted ratio (the previous approach):
//   The ratio formula computed earned/total where info passes earn 0 pts.
//   Since ~20+ of our checks are info-severity passes (HTTPS ok, no secrets, etc.),
//   earnedPoints stayed 0 even on a passing scan → score = 0/52 = 0. Bug.
//
// Penalty weights (calibrated against real scans):
//   high   → 12 pts  — critical (DMARC missing, SQL injection, etc.)
//   medium → 6  pts  — important (CSP missing, CORS wildcard, etc.)
//   low    → 2  pts  — hardening (missing Referrer-Policy, X-Frame, etc.)
//   info   → 0  pts  — informational only, not scored either way
//
// Calibrated scores for reference:
//   Well-configured site (0H, 1M, 2L)  → ~90  (Good)
//   chatgpt.com         (1H, 3M, 4L)  → ~62  (Fair)
//   xsendflow.com       (1H, 6M, 6L)  → ~40  (Poor)
//   Very poor site      (3H, 8M, 8L)  →  ~0  (Poor)

const PENALTY: Record<string, number> = {
  high:   12,
  medium: 6,
  low:    2,
  info:   0,
}

function computeSummary(results: ScanResult[]): ScanSummary {
  const summary: ScanSummary = {
    total: results.length,
    high: 0,
    medium: 0,
    low: 0,
    passed: 0,
    info: 0,
    skipped: 0,
    score: 100,
  }

  let penalty = 0

  for (const r of results) {
    if (r.status === 'pass') {
      // Split passes: info checks go to summary.info, scored checks go to summary.passed
      if (r.severity === 'info') {
        summary.info++
      } else {
        summary.passed++
      }
    } else if (r.status === 'skip') {
      summary.skipped++
    } else {
      // fail — accumulate penalty and count by severity
      if (r.severity === 'high')        { summary.high++;   penalty += PENALTY.high }
      else if (r.severity === 'medium') { summary.medium++; penalty += PENALTY.medium }
      else if (r.severity === 'low')    { summary.low++;    penalty += PENALTY.low }
      // info failures (rare) don't affect score
    }
  }

  summary.score = Math.max(0, 100 - penalty)

  return summary
}

export async function runScan(ctx: ScanContext): Promise<ScanReport> {
  const results = await runWithConcurrency(
    ctx,
    SCAN_CONFIG.MAX_CONCURRENT_CHECKS
  )

  const summary = computeSummary(results)

  return {
    scanId: ctx.scanId,
    url: ctx.url,
    timestamp: ctx.timestamp,
    status: 'completed',
    results,
    summary,
  }
}