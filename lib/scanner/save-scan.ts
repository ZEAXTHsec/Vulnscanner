// lib/scanner/save-scan.ts

import { supabase } from '@/lib/supabase'
import { ScanReport } from '@/lib/types'

export async function saveScan(report: ScanReport): Promise<void> {
  const { error } = await supabase.from('scans').insert({
    id: report.scanId,
    url: report.url,
    score: report.summary.score,
    high: report.summary.high,
    medium: report.summary.medium,
    low: report.summary.low,
    passed: report.summary.passed,
    info: report.summary.info,
    results: report.results,
    created_at: report.timestamp,
  })

  if (error) {
    console.error('[save-scan] Failed to save:', error.message)
  }
}