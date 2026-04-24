// lib/types.ts

import { DetectedStack } from '@/lib/utils/detect-stack'

export type Severity = 'high' | 'medium' | 'low' | 'info'
export type ScanStatus = 'fail' | 'pass' | 'skip'
export type Phase = 'passive' | 'active'
export type ScanJobStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface ScanResult {
  checkId: string
  name: string
  severity: Severity
  status: ScanStatus
  detail: string
  fix?: string
  fixPrompt?: string      // AI-ready prompt — paste into ChatGPT/Claude for a fix
  score: number           // 0-10, higher = worse
  raw?: Record<string, unknown>
}

export interface ScanContext {
  scanId: string
  url: string
  html: string
  headers: Record<string, string>   // always lowercase keys
  statusCode: number
  timestamp: string
  stack: DetectedStack    // detected before checks run so prompts are stack-aware
}

export interface ScanReport {
  scanId: string
  url: string
  timestamp: string
  status: ScanJobStatus
  results: ScanResult[]
  summary: ScanSummary
}

export interface ScanSummary {
  total: number
  high: number
  medium: number
  low: number
  passed: number   // scored checks that passed (high/medium/low severity)
  info: number     // informational checks (severity: 'info') — don't affect score
  skipped: number
  score: number    // 0-100, higher = safer
}

export interface Check {
  id: string
  name: string
  phase: Phase
  run: (ctx: ScanContext) => Promise<ScanResult[]>
}

export interface FetchResult {
  url: string
  html: string
  headers: Record<string, string>
  statusCode: number
  error?: string
}