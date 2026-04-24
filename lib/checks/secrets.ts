// lib/checks/secrets.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'

const SECRET_PATTERNS: { label: string; pattern: RegExp; severity: 'high' | 'medium' }[] = [
  { label: 'Stripe Live Key', pattern: /sk_live_[a-zA-Z0-9]{20,}/g, severity: 'high' },
  { label: 'Stripe Test Key', pattern: /sk_test_[a-zA-Z0-9]{20,}/g, severity: 'medium' },
  { label: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g, severity: 'high' },
  { label: 'Google API Key', pattern: /AIza[0-9A-Za-z\\-_]{35}/g, severity: 'high' },
  { label: 'GitHub Token', pattern: /ghp_[a-zA-Z0-9]{36}/g, severity: 'high' },
  { label: 'Slack Token', pattern: /xox[baprs]-[0-9a-zA-Z]{10,}/g, severity: 'high' },
  { label: 'Supabase Anon Key', pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, severity: 'high' },
  { label: 'Firebase API Key', pattern: /AIza[0-9A-Za-z\\-_]{35}/g, severity: 'high' },
  { label: 'Mailgun API Key', pattern: /key-[0-9a-zA-Z]{32}/g, severity: 'high' },
  { label: 'Twilio API Key', pattern: /SK[0-9a-fA-F]{32}/g, severity: 'high' },
  { label: 'Generic Secret', pattern: /(?:secret|api_key|apikey|token|password)\s*[:=]\s*["'][a-zA-Z0-9+/=_\-]{16,}["']/gi, severity: 'high' },
  { label: 'Bearer Token', pattern: /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g, severity: 'medium' },
  { label: 'Private Key Block', pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g, severity: 'high' },
]

export const secretsCheck: Check = {
  id: 'secrets',
  name: 'Exposed Secrets & API Keys',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const found: { label: string; severity: 'high' | 'medium' }[] = []
    const searchTarget = ctx.html

    for (const { label, pattern, severity } of SECRET_PATTERNS) {
      pattern.lastIndex = 0
      if (pattern.test(searchTarget)) {
        // Avoid duplicate labels
        if (!found.find((f) => f.label === label)) {
          found.push({ label, severity })
        }
      }
    }

    if (found.length === 0) {
      return [{
        checkId: 'secrets-ok',
        name: 'No Exposed Secrets',
        severity: 'info',
        status: 'pass',
        detail: 'No API keys, tokens, or secrets detected in page source.',
        score: 0,
      }]
    }

    const highCount = found.filter((f) => f.severity === 'high').length
    const labels = found.map((f) => f.label).join(', ')

    return [{
      checkId: 'secrets-found',
      name: 'Exposed Secrets Detected',
      severity: highCount > 0 ? 'high' : 'medium',
      status: 'fail',
      detail: `Found ${found.length} potential secret(s) in page source: ${labels}.`,
      fix: 'Move all secrets to environment variables. Never hardcode keys in frontend code. Rotate any exposed keys immediately.',
      score: highCount > 0 ? 10 : 6,
      raw: { found },
    }]
  },
}