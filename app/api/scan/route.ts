// app/api/scan/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { crawlTarget } from '@/lib/scanner/crawler'
import { runScan } from '@/lib/scanner/runner'
import { saveScan } from '@/lib/scanner/save-scan'
import { ScanContext } from '@/lib/types'
import { detectStack } from '@/lib/utils/detect-stack'
import crypto from 'crypto'

// Vercel serverless functions have a 10s wall limit on hobby/pro plans.
// We race the scan against a 9s timeout so we can return a clean error
// rather than a silent 504.
const SCAN_TIMEOUT_MS = 9_000

function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Scan timed out')), ms)
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: 'Only http and https URLs are allowed' },
        { status: 400 }
      )
    }

    const crawl = await crawlTarget(url)
    const { primary, stats: crawlStats } = crawl

    if (primary.error) {
      return NextResponse.json(
        { error: primary.error },
        { status: 502 }
      )
    }

    const stack = detectStack(primary.headers, primary.html)

    const ctx: ScanContext = {
      scanId: crypto.randomUUID(),
      url: primary.url,
      html: primary.html,
      headers: primary.headers,
      statusCode: primary.statusCode,
      timestamp: new Date().toISOString(),
      stack,
      crawlStats,
    }

    let report
    try {
      report = await Promise.race([
        runScan(ctx),
        timeoutPromise(SCAN_TIMEOUT_MS),
      ])
    } catch (err) {
      const isTimeout = err instanceof Error && err.message === 'Scan timed out'
      return NextResponse.json(
        { error: isTimeout ? 'Scan timed out — target may be slow or unresponsive.' : 'Scan failed.' },
        { status: isTimeout ? 504 : 500 }
      )
    }

    // Save to Supabase (non-blocking — won't fail the scan if DB is down)
    saveScan(report).catch((err) =>
      console.error('[scan] Save to Supabase failed:', err)
    )

    // Cache-Control: no-store ensures Next.js route cache never serves a
    // stale scan result — each POST must always hit the runner fresh.
    return NextResponse.json(report, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    })

  } catch (err) {
    console.error('[scan] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}