// lib/checks/redirects.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'
import { openRedirectPrompt } from '@/lib/utils/fix-prompts'

const OPEN_REDIRECT_PARAMS = [
  'redirect', 'redirect_to', 'redirect_uri', 'return', 'returnTo',
  'return_url', 'next', 'url', 'goto', 'target', 'destination', 'redir',
  'r', 'u', 'link', 'continue', 'forward',
]

export const redirectsCheck: Check = {
  id: 'redirects',
  name: 'Open Redirect & URL Safety',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []
    const html = ctx.html

    // Check for open redirect params in links
    const allLinks: string[] = html.match(/href=["'][^"']*["']/gi) || []
    const suspiciousLinks: string[] = []

    for (const link of allLinks) {
      for (const param of OPEN_REDIRECT_PARAMS) {
        const pattern = new RegExp(`[?&]${param}=https?://`, 'i')
        if (pattern.test(link)) {
          suspiciousLinks.push(link.slice(0, 100))
          break
        }
      }
    }

    if (suspiciousLinks.length > 0) {
      results.push({
        checkId: 'redirects-open',
        name: 'Potential Open Redirect',
        severity: 'medium',
        status: 'fail',
        detail: `Found ${suspiciousLinks.length} link(s) with redirect parameters pointing to external URLs. Attackers use this to send victims to phishing pages via your trusted domain — e.g. yourdomain.com?redirect=evil.com.`,
        fix: 'Validate redirect destinations server-side. Use an allowlist of permitted redirect URLs.',
        fixPrompt: openRedirectPrompt(ctx.stack),
        score: 5,
        raw: { examples: suspiciousLinks.slice(0, 3) },
      })
    } else {
      results.push({
        checkId: 'redirects-ok',
        name: 'No Open Redirects Detected',
        severity: 'info',
        status: 'pass',
        detail: 'No obvious open redirect parameters found in page links.',
        score: 0,
      })
    }

    // Check for meta refresh redirects
    const metaRefresh: string[] = html.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*>/gi) || []
    if (metaRefresh.length > 0) {
      const externalRefresh = metaRefresh.filter((m) => /url=https?:\/\//i.test(m))
      if (externalRefresh.length > 0) {
        results.push({
          checkId: 'redirects-meta-refresh',
          name: 'Meta Refresh to External URL',
          severity: 'medium',
          status: 'fail',
          detail: 'Page uses <meta http-equiv="refresh"> to redirect to an external URL. Often used in phishing.',
          fix: 'Remove meta refresh redirects. Use proper HTTP 301/302 redirects instead.',
          score: 4,
        })
      }
    }

    // Check for javascript: hrefs (XSS vector)
    const jsLinks = allLinks.filter((l) => /href=["']javascript:/i.test(l))
    if (jsLinks.length > 0) {
      results.push({
        checkId: 'redirects-js-href',
        name: 'javascript: Links Found',
        severity: 'medium',
        status: 'fail',
        detail: `${jsLinks.length} link(s) use javascript: protocol in href. These are XSS vectors and bypass CSP in some browsers.`,
        fix: 'Replace javascript: href links with proper button elements and event handlers.',
        score: 4,
      })
    }

    return results
  },
}