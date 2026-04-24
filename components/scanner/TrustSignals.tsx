'use client'

import { ScanResult, ScanSummary } from '@/lib/types'

interface Props { results: ScanResult[]; summary: ScanSummary }

export default function TrustSignals({ results, summary }: Props) {
  const noSecrets  = results.some(r => r.checkId === 'secrets-ok')
  const hasHttps   = results.some(r => r.checkId === 'https-ok')
  const noXss      = results.some(r => r.checkId === 'injection-xss-ok' || r.checkId === 'xss-dom-ok')
  const noExposed  = results.some(r => r.checkId === 'exposed-files-ok')
  const noTakeover = results.some(r => r.checkId === 'takeover-ok')

  const signals: string[] = []
  if (hasHttps)    signals.push('All traffic encrypted over HTTPS')
  if (noSecrets)   signals.push('No API keys or secrets in source')
  if (noXss)       signals.push('No XSS injection patterns detected')
  if (noExposed)   signals.push('No sensitive files publicly accessible')
  if (noTakeover)  signals.push('No subdomain takeover vulnerabilities')
  if (summary.high === 0) signals.push('No critical vulnerabilities found')

  if (signals.length === 0) return null

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid rgba(0,229,135,0.15)',
      borderRadius: 'var(--radius-lg)',
      padding: '18px 22px',
      marginTop: '1.5rem',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(0,229,135,0.4), transparent)',
      }} />
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: '0.85rem', color: 'var(--accent)', marginBottom: '12px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span>✅</span> What passed
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '6px',
      }}>
        {signals.map(s => (
          <div key={s} style={{
            display: 'flex', alignItems: 'center', gap: '9px',
            fontSize: '0.82rem', color: 'var(--text-muted)',
          }}>
            <span style={{
              color: 'var(--accent)', fontWeight: 700, fontSize: '0.75rem',
              background: 'var(--accent-dim)', width: '18px', height: '18px',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>✓</span>
            {s}
          </div>
        ))}
      </div>
      {summary.high === 0 && summary.medium <= 2 && (
        <div style={{
          marginTop: '14px', paddingTop: '14px',
          borderTop: '1px solid var(--border)',
          fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span>🟢</span> Safe to deploy after fixing the issues above
        </div>
      )}
    </div>
  )
}