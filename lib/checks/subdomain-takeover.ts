// lib/checks/subdomain-takeover.ts
// Passive signals for subdomain takeover risk.
// Detects dangling CNAMEs and known "unclaimed" service response fingerprints
// in the page HTML/headers without sending any payloads.

import { Check, ScanContext, ScanResult } from '@/lib/types'
import { promises as dns } from 'dns'

// Known service fingerprints that appear when a subdomain is unclaimed
// Source: can-i-take-over-xyz / common public research
const TAKEOVER_FINGERPRINTS: { label: string; pattern: RegExp }[] = [
  { label: 'GitHub Pages', pattern: /there isn['']t a github pages site here/i },
  { label: 'Heroku', pattern: /no such app|herokucdn\.com\/error-pages\/no-such-app/i },
  { label: 'Netlify', pattern: /not found - request id/i },
  { label: 'Vercel', pattern: /the deployment could not be found on vercel/i },
  { label: 'Shopify', pattern: /sorry, this shop is currently unavailable/i },
  { label: 'Fastly', pattern: /fastly error: unknown domain/i },
  { label: 'AWS S3', pattern: /nosuchbucket|the specified bucket does not exist/i },
  { label: 'AWS CloudFront', pattern: /bad request.*cloudfront|the request could not be satisfied.*cloudfront/i },
  { label: 'Azure', pattern: /404 web site not found.*azure|this azure website is not configured/i },
  { label: 'Tumblr', pattern: /there['']s nothing here|whatever you were looking for doesn['']t currently exist at this address/i },
  { label: 'WordPress.com', pattern: /do you want to register .+\.wordpress\.com/i },
  { label: 'Ghost', pattern: /the thing you were looking for is no longer here/i },
  { label: 'Cargo', pattern: /if you['']re moving your domain away from cargo/i },
  { label: 'Surge.sh', pattern: /project not found/i },
  { label: 'Unbounce', pattern: /the page you['']re looking for doesn['']t exist/i },
  { label: 'HubSpot', pattern: /domain not configured for hubspot/i },
  { label: 'Zendesk', pattern: /help center closed/i },
  { label: 'Intercom', pattern: /this page is reserved for artistic dogs/i },
  { label: 'Bitbucket', pattern: /repository not found/i },
]

// CNAMEs that point to known cloud/SaaS services — a CNAME to these with no
// active resource behind it is a takeover risk
const TAKEOVER_CNAME_SUFFIXES = [
  'github.io',
  'herokudns.com',
  'netlify.app',
  'netlify.com',
  'vercel.app',
  'myshopify.com',
  'fastly.net',
  's3.amazonaws.com',
  's3-website',
  'cloudfront.net',
  'azurewebsites.net',
  'blob.core.windows.net',
  'azureedge.net',
  'tumblr.com',
  'wordpress.com',
  'ghost.io',
  'surge.sh',
  'unbounce.com',
  'hubspot.net',
  'zendesk.com',
  'intercom.help',
]

async function getCname(hostname: string): Promise<string | null> {
  try {
    const records = await dns.resolveCname(hostname)
    return records[0] ?? null
  } catch {
    return null
  }
}

export const subdomainTakeoverCheck: Check = {
  id: 'subdomain-takeover',
  name: 'Subdomain Takeover Signals',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []
    const html = ctx.html

    let hostname: string
    try {
      hostname = new URL(ctx.url).hostname
    } catch {
      return []
    }

    // ── 1. Check current page HTML for unclaimed-service fingerprints ────────
    const matched = TAKEOVER_FINGERPRINTS.filter(({ pattern }) => pattern.test(html))
    if (matched.length > 0) {
      results.push({
        checkId: 'takeover-fingerprint',
        name: 'Unclaimed Service Response Detected',
        severity: 'high',
        status: 'fail',
        detail: `Page response matches known "unclaimed resource" fingerprint(s) for: ${matched.map((m) => m.label).join(', ')}. This strongly suggests the subdomain is pointing to a service with no active resource — a subdomain takeover may be possible.`,
        fix: 'Either (a) claim the resource on the target service, or (b) remove the dangling DNS record pointing to it. Investigate immediately.',
      })
    }

    // ── 2. CNAME lookup — does hostname CNAME to a known risky service? ──────
    const cname = await getCname(hostname)
    if (cname) {
      const riskyTarget = TAKEOVER_CNAME_SUFFIXES.find((suffix) =>
        cname.toLowerCase().includes(suffix)
      )

      if (riskyTarget) {
        // Only flag as high if we also got a fingerprint match — otherwise medium signal
        const severity = matched.length > 0 ? 'high' : 'medium'

        results.push({
          checkId: 'takeover-cname-risky',
          name: 'CNAME Points to Claimable Service',
          severity,
          status: 'fail',
          detail: `${hostname} has a CNAME record pointing to "${cname}" (${riskyTarget}). If the corresponding resource on that service is unclaimed, an attacker could register it and serve content from your domain.`,
          fix: 'Verify the target resource is actively claimed under your account. If the service is no longer used, remove the CNAME from DNS.',
        })
      } else {
        results.push({
          checkId: 'takeover-cname-ok',
          name: 'CNAME Target',
          severity: 'info',
          status: 'pass',
          detail: `${hostname} CNAMEs to "${cname}" — not a known takeover-risk service.`,
        })
      }
    }

    // ── 3. Scan page HTML for references to subdomains pointing to risky CNAMEs
    // (catches widgets / embeds pointing to unclaimed subdomains)
    const subdomain_refs = (html.match(/https?:\/\/([a-z0-9\-]+\.[a-z0-9\-\.]+)/gi) || [])
    const riskyRefs: string[] = []

    for (const ref of subdomain_refs) {
      try {
        const refHost = new URL(ref).hostname
        if (refHost === hostname) continue // skip self
        const refCname = await getCname(refHost)
        if (refCname) {
          const isRisky = TAKEOVER_CNAME_SUFFIXES.some((s) => refCname.toLowerCase().includes(s))
          if (isRisky && !riskyRefs.includes(refHost)) {
            riskyRefs.push(refHost)
          }
        }
      } catch { /* skip */ }
    }

    if (riskyRefs.length > 0) {
      results.push({
        checkId: 'takeover-embedded-cname',
        name: 'Embedded Subdomains With Risky CNAMEs',
        severity: 'medium',
        status: 'fail',
        detail: `Page references ${riskyRefs.length} subdomain(s) that CNAME to claimable services: ${riskyRefs.slice(0, 5).join(', ')}${riskyRefs.length > 5 ? ` (+${riskyRefs.length - 5} more)` : ''}. If any are unclaimed, an attacker could serve content that your page loads.`,
        fix: 'Audit all embedded subdomains. Verify each CNAME target is actively claimed.',
      })
    }

    if (results.length === 0) {
      results.push({
        checkId: 'takeover-ok',
        name: 'No Subdomain Takeover Signals',
        severity: 'info',
        status: 'pass',
        detail: 'No unclaimed-service fingerprints or dangling CNAME patterns detected.',
      })
    }

    return results
  },
}