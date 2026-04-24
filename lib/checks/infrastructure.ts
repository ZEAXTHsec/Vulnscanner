// lib/checks/infrastructure.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'

export const infrastructureCheck: Check = {
  id: 'infrastructure',
  name: 'Infrastructure & Hosting Security',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []
    const headers = ctx.headers
    const html = ctx.html

    // CDN / WAF detection — header-based signals
    const cdnHeaderSignals: Record<string, string[]> = {
      'Cloudflare':    ['cf-ray', 'cf-cache-status', '__cfduid'],
      'Fastly':        ['x-fastly-request-id', 'x-served-by'],
      'Akamai':        ['x-akamai-transformed', 'akamai-grn'],
      'AWS CloudFront':['x-amz-cf-id', 'x-amz-cf-pop'],
      'Vercel':        ['x-vercel-id', 'x-vercel-cache'],
      'Netlify':       ['x-nf-request-id'],
      'Google':        ['x-goog-generation', 'x-guploader-uploadid', 'server-timing'],
    }

    // Server header values that indicate the site IS the infrastructure
    // (large platforms that run their own CDN/edge network)
    const selfCdnServerValues: Record<string, RegExp> = {
      'Google (gws)':     /^gws$/i,
      'Google ESF':       /^ESF$/i,
      'Cloudflare':       /cloudflare/i,
      'Facebook':         /proxygen|haproxy/i,
      'Microsoft Azure':  /microsoft-iis/i,
      'GitHub':           /github\.com/i,
      'Shopify':          /shopify/i,
      'Squarespace':      /squarespace/i,
    }

    const server = headers['server'] ?? ''

    const detectedByHeader = Object.entries(cdnHeaderSignals).find(([, headerList]) =>
      headerList.some((h) => headers[h])
    )

    const detectedByServer = Object.entries(selfCdnServerValues).find(([, pattern]) =>
      pattern.test(server)
    )

    const detected = detectedByHeader?.[0] ?? detectedByServer?.[0] ?? null

    if (detected) {
      results.push({
        checkId: 'infra-cdn-ok',
        name: `CDN/WAF Detected: ${detected}`,
        severity: 'info',
        status: 'pass',
        detail: `Site is served through ${detected} — provides DDoS protection and edge caching.`,
        score: 0,
      })
    } else {
      results.push({
        checkId: 'infra-no-cdn',
        name: 'No CDN or WAF Detected',
        severity: 'medium',
        status: 'fail',
        detail: 'No CDN or WAF signals found. Origin server may be directly exposed to DDoS and scraping attacks.',
        fix: 'Put your site behind Cloudflare (free tier available). This hides your origin IP and adds DDoS protection.',
        score: 4,
      })
    }

    // Debug / development mode signals
    const debugSignals = [
      { pattern: /Whoops|SymfonyException|Laravel.*exception/i,   label: 'Laravel/Symfony debug error page' },
      { pattern: /React.*DevTools|__NEXT_DATA__|__NUXT__/i,        label: 'Frontend framework dev artifacts' },
      { pattern: /django\.debug|DEBUG\s*=\s*True/i,                label: 'Django DEBUG mode' },
      { pattern: /wp-debug|WP_DEBUG/i,                             label: 'WordPress debug mode' },
      { pattern: /\bstack trace\b|\bTraceback\b/i,                 label: 'Stack trace exposed' },
      { pattern: /\bException\b.*\bline \d+\b/i,                   label: 'Exception details in response' },
    ]

    const foundDebug = debugSignals.filter(({ pattern }) => pattern.test(html))
    if (foundDebug.length > 0) {
      results.push({
        checkId: 'infra-debug-mode',
        name: 'Debug Mode / Error Details Exposed',
        severity: 'high',
        status: 'fail',
        detail: `Debug signals found: ${foundDebug.map((d) => d.label).join(', ')}. Reveals internal paths, versions, and logic to attackers.`,
        fix: 'Disable debug mode in production. Set APP_DEBUG=false, WP_DEBUG=false, etc. Use generic error pages.',
        score: 9,
      })
    }

    // Cloudflare Bot Management
    const cfEnabled = headers['cf-ray'] || headers['cf-cache-status']
    if (cfEnabled && headers['cf-mitigated']) {
      results.push({
        checkId: 'infra-cf-bot-ok',
        name: 'Cloudflare Bot Management Active',
        severity: 'info',
        status: 'pass',
        detail: 'Cloudflare Bot Management is actively mitigating requests.',
        score: 0,
      })
    }

    // HTTP Response Splitting signal
    if (headers['content-length'] && headers['transfer-encoding']) {
      results.push({
        checkId: 'infra-response-splitting',
        name: 'Potential HTTP Response Splitting',
        severity: 'medium',
        status: 'fail',
        detail: 'Both Content-Length and Transfer-Encoding headers present. Can indicate HTTP response splitting vulnerability.',
        fix: 'Ensure your web server sends only one of Content-Length or Transfer-Encoding per response.',
        score: 4,
      })
    }

    // Version numbers in HTML comments
    const versionComments: string[] = html.match(/<!--[^>]*v?\d+\.\d+[\.\d]*[^>]*-->/gi) || []
    if (versionComments.length > 0) {
      results.push({
        checkId: 'infra-version-comments',
        name: 'Version Numbers in HTML Comments',
        severity: 'low',
        status: 'fail',
        detail: `Found ${versionComments.length} HTML comment(s) containing version numbers. Helps attackers identify vulnerable software versions.`,
        fix: 'Remove version numbers from HTML comments in production builds.',
        score: 2,
      })
    }

    return results
  },
}