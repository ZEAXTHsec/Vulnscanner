// lib/checks/open-dirs.ts
// Probes admin panels, API endpoints, and directory listing paths.
// File-level paths (env, config, logs etc.) are handled by exposed-files.ts.

import { Check, ScanContext, ScanResult } from '@/lib/types'
import { fetchPath } from '@/lib/scanner/fetcher'

const SENSITIVE_PATHS = [
  '/admin', '/admin/',
  '/administrator', '/administrator/',
  '/wp-admin', '/wp-admin/',
  '/wp-login.php',
  '/dashboard',
  '/cpanel',
  '/phpmyadmin', '/phpmyadmin/',
  '/api', '/api/',
  '/api/v1', '/api/v2',
  '/api/debug', '/api/health',
  '/debug', '/console',
  '/actuator', '/actuator/env', '/actuator/health', '/actuator/mappings',
  '/_profiler', '/__debugbar',
  '/telescope', '/horizon',
  '/uploads', '/uploads/',
  '/files', '/files/',
  '/backup', '/backup/',
  '/logs', '/logs/',
  '/tmp', '/temp',
]

// Content signals that confirm real exposure (not a soft-404)
const CONTENT_SIGNALS: Record<string, RegExp> = {
  '/wp-login.php':      /wp-login|user_login|wordpress/i,
  '/wp-admin':          /wp-admin|wordpress/i,
  '/wp-admin/':         /wp-admin|wordpress/i,
  '/phpmyadmin':        /phpmyadmin|phpMyAdmin/i,
  '/phpmyadmin/':       /phpmyadmin|phpMyAdmin/i,
  '/actuator':          /"_links"|"status"|actuator/i,
  '/actuator/env':      /"activeProfiles"|"propertySources"/i,
  '/actuator/health':   /"status"\s*:\s*"(UP|DOWN)"/i,
  '/actuator/mappings': /"dispatcherServlets"|"mappings"/i,
  '/_profiler':         /Symfony|sf-toolbar/i,
  '/__debugbar':        /debugbar|phpdebugbar/i,
  '/telescope':         /Laravel Telescope/i,
  '/horizon':           /Laravel Horizon/i,
  '/api/debug':         /debug|stack|trace/i,
}

const DIRECTORY_LISTING = /Index of|directory listing|<title>\s*Index/i

export const openDirsCheck: Check = {
  id: 'sensitive-paths',
  name: 'Sensitive Path Exposure',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []

    // Homepage fingerprint for soft-404 detection
    let homepageFingerprint = ''
    try {
      const home = await fetchPath(ctx.url, '/')
      homepageFingerprint = home.html.slice(0, 500)
    } catch { /* skip */ }

    const exposed: string[] = []

    await Promise.all(
      SENSITIVE_PATHS.map(async (path) => {
        try {
          const res = await fetchPath(ctx.url, path)
          if (res.statusCode !== 200) return

          const body = res.html

          // Reject soft-404s
          if (homepageFingerprint && body.slice(0, 500) === homepageFingerprint) return
          if (/404|not found|page not found|does not exist/i.test(body.slice(0, 300))) return

          const signal = CONTENT_SIGNALS[path]
          if (signal) {
            if (!signal.test(body)) return
          } else {
            // For generic dirs (uploads/, files/ etc.) require directory listing
            // or a short non-HTML response
            const isListing = DIRECTORY_LISTING.test(body)
            const isRaw = body.length < 5000 && !/<html|<!DOCTYPE/i.test(body)
            if (!isListing && !isRaw) return
          }

          exposed.push(path)
        } catch { /* not accessible */ }
      })
    )

    if (exposed.length === 0) {
      results.push({
        checkId: 'sensitive-paths-ok',
        name: 'Sensitive Path Exposure',
        severity: 'info',
        status: 'pass',
        detail: `Checked ${SENSITIVE_PATHS.length} sensitive paths — none exposed.`,
        score: 0,
      })
    } else {
      results.push({
        checkId: 'sensitive-paths-found',
        name: 'Sensitive Paths Exposed',
        severity: 'high',
        status: 'fail',
        detail: `Exposed paths found: ${exposed.join(', ')}`,
        fix: 'Block access to these paths via server config or .htaccess. Never expose admin panels or debug endpoints publicly.',
        score: 9,
        raw: { exposed },
      })
    }

    return results
  },
}