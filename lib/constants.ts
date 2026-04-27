// lib/constants.ts

export const SCAN_CONFIG = {
  FETCH_TIMEOUT_MS:        10_000,
  CHECK_TIMEOUT_MS:         4_000,  // per-check hard timeout (issue #10)
  MAX_CRAWL_DEPTH:              2,
  MAX_PAGES:                    5,
  MAX_CONCURRENT_CHECKS:        4,
  EXPOSED_FILES_CONCURRENCY:    6,  // batched, not Promise.all (issue #11)
  USER_AGENT: 'VulnScanner/1.0 (security-audit-bot)',
} as const

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