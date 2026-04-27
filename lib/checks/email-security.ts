// lib/checks/email-security.ts
// Uses Cloudflare DNS-over-HTTPS (1.1.1.1) instead of Node's dns module,
// which is unavailable in Next.js edge/serverless runtimes.

import { Check, ScanContext, ScanResult } from '@/lib/types'
import { dmarcMissingPrompt, spfMissingPrompt } from '@/lib/utils/fix-prompts'

async function resolveTxt(domain: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=TXT`,
      { headers: { Accept: 'application/dns-json' } }
    )
    if (!res.ok) return []
    const data = await res.json()
    if (!data.Answer) return []
    return (data.Answer as { data: string }[])
      .map((r) => r.data.replace(/^"|"$/g, '').replace(/"\s*"/g, '')) // strip quotes DoH adds
  } catch {
    return []
  }
}

async function resolveMx(domain: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
      { headers: { Accept: 'application/dns-json' } }
    )
    if (!res.ok) return false
    const data = await res.json()
    return Array.isArray(data.Answer) && data.Answer.length > 0
  } catch {
    return false
  }
}

export const emailSecurityCheck: Check = {
  id: 'email-security',
  name: 'Email Security (SPF / DMARC)',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []

    let domain: string
    try {
      domain = new URL(ctx.url).hostname.replace(/^www\./, '')
    } catch {
      return []
    }

    const [rootTxt, dmarcTxt, hasMx] = await Promise.all([
      resolveTxt(domain),
      resolveTxt(`_dmarc.${domain}`),
      resolveMx(domain),
    ])

    // ── SPF ──────────────────────────────────────────────────────────────────
    const spfRecord = rootTxt.find((r) => r.startsWith('v=spf1'))

    if (!spfRecord) {
      results.push({
        checkId: 'email-spf-missing',
        name: 'SPF Record Missing',
        severity: 'medium',
        status: 'fail',
        detail: `No SPF TXT record found for ${domain}. Without SPF, anyone can send email appearing to come from your domain.`,
        fix: 'Add a DNS TXT record: v=spf1 include:_spf.yourmailprovider.com ~all',
        fixPrompt: spfMissingPrompt(ctx.stack),
      })
    } else {
      const isAllowAll = /\+all\b/.test(spfRecord) || /\ball\b/.test(spfRecord) && !/[~\-]all/.test(spfRecord)
      const isSoftFail = /~all/.test(spfRecord)
      const isHardFail = /-all/.test(spfRecord)

      if (isAllowAll) {
        results.push({
          checkId: 'email-spf-permissive',
          name: 'SPF Record Too Permissive',
          severity: 'high',
          status: 'fail',
          detail: `SPF record ends with "+all" — any server can send mail as ${domain}. SPF is effectively disabled.`,
          fix: 'Change to end with "-all" (hard fail) or "~all" (soft fail).',
        })
      } else if (isHardFail) {
        results.push({
          checkId: 'email-spf-ok',
          name: 'SPF Record Valid (-all)',
          severity: 'info',
          status: 'pass',
          detail: `SPF configured with hard fail: "${spfRecord}"`,
        })
      } else if (isSoftFail) {
        results.push({
          checkId: 'email-spf-softfail',
          name: 'SPF Uses Soft Fail (~all)',
          severity: 'low',
          status: 'fail',
          detail: `SPF uses "~all" (soft fail). Unauthorized senders are marked suspicious but not rejected.`,
          fix: 'Consider upgrading to "-all" once all legitimate senders are listed.',
        })
      } else {
        results.push({
          checkId: 'email-spf-present',
          name: 'SPF Record Present',
          severity: 'info',
          status: 'pass',
          detail: `SPF record found: "${spfRecord}"`,
        })
      }
    }

    // ── DMARC ─────────────────────────────────────────────────────────────────
    const dmarcRecord = dmarcTxt.find((r) => r.startsWith('v=DMARC1'))

    if (!dmarcRecord) {
      results.push({
        checkId: 'email-dmarc-missing',
        name: 'DMARC Record Missing',
        severity: 'high',
        status: 'fail',
        detail: `No DMARC record at _dmarc.${domain}. Receiving servers have no policy for SPF/DKIM failures — your domain can be spoofed.`,
        fix: 'Add a TXT record at _dmarc.' + domain + ': v=DMARC1; p=quarantine; rua=mailto:dmarc@' + domain,
        fixPrompt: dmarcMissingPrompt(ctx.stack),
      })
    } else {
      const policyMatch = dmarcRecord.match(/p=(none|quarantine|reject)/i)
      const policy = policyMatch?.[1]?.toLowerCase()

      if (policy === 'none') {
        results.push({
          checkId: 'email-dmarc-none',
          name: 'DMARC Policy: None (Monitor Only)',
          severity: 'medium',
          status: 'fail',
          detail: `DMARC found but policy is "p=none" — only monitors, does not block spoofed emails.`,
          fix: 'Upgrade to p=quarantine or p=reject after reviewing rua reports.',
        })
      } else if (policy === 'quarantine') {
        results.push({
          checkId: 'email-dmarc-quarantine',
          name: 'DMARC Policy: Quarantine',
          severity: 'low',
          status: 'fail',
          detail: `DMARC set to "p=quarantine". Spoofed emails go to spam rather than being rejected outright.`,
          fix: 'Upgrade to p=reject for full enforcement once SPF/DKIM are stable.',
        })
      } else if (policy === 'reject') {
        results.push({
          checkId: 'email-dmarc-ok',
          name: 'DMARC Policy: Reject',
          severity: 'info',
          status: 'pass',
          detail: `DMARC configured with p=reject — spoofed emails are rejected outright.`,
        })
      } else {
        results.push({
          checkId: 'email-dmarc-present',
          name: 'DMARC Record Present',
          severity: 'info',
          status: 'pass',
          detail: `DMARC record: "${dmarcRecord}"`,
        })
      }

      if (!dmarcRecord.includes('rua=')) {
        results.push({
          checkId: 'email-dmarc-no-rua',
          name: 'DMARC Missing Reporting Address',
          severity: 'low',
          status: 'fail',
          detail: 'No rua= URI in DMARC record — you won\'t receive spoofing/failure reports.',
          fix: 'Add rua=mailto:dmarc@' + domain + ' to your DMARC record.',
        })
      }
    }

    // ── MX ────────────────────────────────────────────────────────────────────
    if (!hasMx) {
      results.push({
        checkId: 'email-no-mx',
        name: 'No MX Records Found',
        severity: 'info',
        status: 'pass',
        detail: `No MX records for ${domain}. Domain may not send email — SPF/DMARC still recommended to block spoofing.`,
      })
    }

    return results
  },
}