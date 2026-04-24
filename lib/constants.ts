// lib/constants.ts

export const SCAN_CONFIG = {
  FETCH_TIMEOUT_MS: 10000,
  MAX_CRAWL_DEPTH: 2,
  MAX_PAGES: 5,
  MAX_CONCURRENT_CHECKS: 4,
  USER_AGENT: 'VulnScanner/1.0 (security-audit-bot)',
} as const

export const SEVERITY_SCORE: Record<string, number> = {
  high:   8,
  medium: 5,
  low:    2,
  info:   0,
}

// Score penalty per finding — used to compute overall site score
export const SCORE_PENALTIES: Record<string, number> = {
  high:   20,
  medium: 10,
  low:    5,
}

export const SECURITY_HEADERS = [
  'content-security-policy',
  'x-frame-options',
  'strict-transport-security',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
] as const

export const SENSITIVE_PATHS = [
  '/.env',
  '/.env.local',
  '/.env.production',
  '/config.json',
  '/admin',
  '/phpinfo.php',
  '/.git/config',
  '/wp-config.php',
  '/debug',
  '/api/debug',
] as const