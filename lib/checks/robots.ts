// lib/checks/robots.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'
import { fetchPath } from '@/lib/scanner/fetcher'

export const robotsCheck: Check = {
  id: 'robots',
  name: 'Robots.txt & Sitemap Analysis',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []

    // Fetch robots.txt
    let robotsTxt = ''
    try {
      const res = await fetchPath(ctx.url, '/robots.txt')
      if (res.statusCode === 200 && res.html) {
        robotsTxt = res.html
      }
    } catch { /* not found */ }

    if (!robotsTxt) {
      results.push({
        checkId: 'robots-missing',
        name: 'robots.txt Missing',
        severity: 'low',
        status: 'fail',
        detail: 'No robots.txt found. Search engines and crawlers have no guidance on what not to index.',
        fix: 'Create a /robots.txt file. At minimum: User-agent: * Disallow: /admin/',
        score: 1,
      })
    } else {
      // Check if robots.txt leaks sensitive paths via Disallow
      const disallowLines = robotsTxt.match(/^Disallow:\s*.+/gim) || []
      const sensitiveLeaks = disallowLines.filter((line) => {
        const path = line.replace(/^Disallow:\s*/i, '').trim().toLowerCase()
        return [
          '/admin', '/api', '/backup', '/config', '/database',
          '/private', '/secret', '/internal', '/staging', '/dev',
          '/wp-admin', '/phpmyadmin', '/.env',
        ].some((s) => path.startsWith(s))
      })

      if (sensitiveLeaks.length > 0) {
        results.push({
          checkId: 'robots-leaks-paths',
          name: 'robots.txt Leaks Sensitive Paths',
          severity: 'medium',
          status: 'fail',
          detail: `robots.txt Disallow entries reveal ${sensitiveLeaks.length} sensitive path(s): ${sensitiveLeaks.slice(0, 3).map((l) => l.replace(/^Disallow:\s*/i, '')).join(', ')}`,
          fix: 'Remove sensitive paths from robots.txt — Disallow does not protect them, it only advertises them to attackers.',
          score: 4,
        })
      } else {
        results.push({
          checkId: 'robots-ok',
          name: 'robots.txt Found',
          severity: 'info',
          status: 'pass',
          detail: `robots.txt present with ${disallowLines.length} Disallow rule(s). No obvious sensitive path leaks.`,
          score: 0,
        })
      }

      // Check for sitemap reference
      const hasSitemap = /sitemap/i.test(robotsTxt)
      if (hasSitemap) {
        results.push({
          checkId: 'robots-sitemap-ref',
          name: 'Sitemap Referenced in robots.txt',
          severity: 'info',
          status: 'pass',
          detail: 'robots.txt references a sitemap — good for SEO and crawler guidance.',
          score: 0,
        })
      }
    }

    // Fetch sitemap.xml
    let sitemapFound = false
    for (const path of ['/sitemap.xml', '/sitemap_index.xml', '/sitemap/sitemap.xml']) {
      try {
        const res = await fetchPath(ctx.url, path)
        if (res.statusCode === 200) {
          sitemapFound = true
          // Check if sitemap leaks internal/staging URLs
          const stagingUrls = (res.html || '').match(/https?:\/\/(staging|dev|test|internal|admin)\./gi) || []
          if (stagingUrls.length > 0) {
            results.push({
              checkId: 'sitemap-staging-urls',
              name: 'Sitemap Contains Staging URLs',
              severity: 'medium',
              status: 'fail',
              detail: `Sitemap references ${stagingUrls.length} staging/dev URL(s). These environments may have weaker security.`,
              fix: 'Remove staging and dev URLs from your production sitemap.',
              score: 4,
            })
          }
          break
        }
      } catch { /* not found */ }
    }

    if (!sitemapFound) {
      results.push({
        checkId: 'sitemap-missing',
        name: 'Sitemap Not Found',
        severity: 'info',
        status: 'pass',
        detail: 'No sitemap.xml found — not a security issue, but may affect SEO.',
        score: 0,
      })
    }

    return results
  },
}