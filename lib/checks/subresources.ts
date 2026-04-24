// lib/checks/subresources.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'

export const subresourcesCheck: Check = {
  id: 'subresources',
  name: 'Subresource Integrity & Third Parties',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []
    const html = ctx.html

    // Scripts loaded from CDNs without SRI
    const externalScripts = html.match(/<script[^>]*src=["']https?:\/\/(?!(?:www\.)?${new URL(ctx.url).hostname})[^"']+["'][^>]*>/gi) || []
    const scriptsWithoutSri = externalScripts.filter((s) => !/integrity=["']/i.test(s))

    if (scriptsWithoutSri.length > 0) {
      results.push({
        checkId: 'sri-missing',
        name: 'Subresource Integrity Missing',
        severity: 'medium',
        status: 'fail',
        detail: `${scriptsWithoutSri.length} external script(s) loaded without integrity= attribute. A compromised CDN could inject malicious code.`,
        fix: 'Add integrity="sha384-..." and crossorigin="anonymous" to external scripts. Generate hashes at srihash.org.',
        score: 5,
      })
    } else if (externalScripts.length > 0) {
      results.push({
        checkId: 'sri-ok',
        name: 'Subresource Integrity Present',
        severity: 'info',
        status: 'pass',
        detail: `All ${externalScripts.length} external script(s) have SRI integrity hashes.`,
        score: 0,
      })
    }

    // Count unique third-party domains
    const thirdPartyDomains = new Set<string>()
    const allSrcs = html.match(/(?:src|href)=["'](https?:\/\/[^/"']+)/gi) || []
    const ownHost = new URL(ctx.url).hostname

    for (const src of allSrcs) {
      try {
        const match = src.match(/["'](https?:\/\/[^/"']+)/)
        if (match) {
          const host = new URL(match[1]).hostname
          if (host !== ownHost && !host.endsWith(`.${ownHost}`)) {
            thirdPartyDomains.add(host)
          }
        }
      } catch { /* skip */ }
    }

    if (thirdPartyDomains.size > 10) {
      results.push({
        checkId: 'third-party-heavy',
        name: 'High Third-Party Load',
        severity: 'low',
        status: 'fail',
        detail: `Page loads resources from ${thirdPartyDomains.size} external domains. Each is a potential supply-chain risk and tracking vector.`,
        fix: 'Audit and reduce third-party dependencies. Self-host critical scripts where possible.',
        score: 2,
      })
    } else if (thirdPartyDomains.size > 0) {
      results.push({
        checkId: 'third-party-ok',
        name: 'Third-Party Resources',
        severity: 'info',
        status: 'pass',
        detail: `Page loads from ${thirdPartyDomains.size} external domain(s) — within acceptable range.`,
        score: 0,
      })
    }

    // Google Analytics / tracking pixels check
    const trackers = [
      { pattern: /google-analytics\.com|gtag\(|ga\(/i, label: 'Google Analytics' },
      { pattern: /facebook\.com\/tr|fbq\(/i, label: 'Facebook Pixel' },
      { pattern: /hotjar\.com/i, label: 'Hotjar' },
      { pattern: /intercom\.io/i, label: 'Intercom' },
      { pattern: /fullstory\.com/i, label: 'FullStory (session recording)' },
    ]

    const foundTrackers = trackers.filter(({ pattern }) => pattern.test(html)).map((t) => t.label)
    if (foundTrackers.length > 0) {
      results.push({
        checkId: 'trackers-found',
        name: 'Tracking Scripts Detected',
        severity: 'low',
        status: 'fail',
        detail: `Found: ${foundTrackers.join(', ')}. Ensure GDPR/CCPA consent mechanisms are in place.`,
        fix: 'Add a cookie consent banner. Load tracking scripts only after user consent.',
        score: 2,
      })
    }

    return results
  },
}