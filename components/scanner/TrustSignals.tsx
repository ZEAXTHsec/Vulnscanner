'use client'

import { ScanResult, ScanSummary } from '@/lib/types'

interface Props { results: ScanResult[]; summary: ScanSummary }

const ShieldCheckSVG = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
)
const CheckCircleSVG = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const GreenDotSVG = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="8" fill="rgba(34,211,168,0.10)" stroke="rgba(34,211,168,0.28)" strokeWidth="1"/>
    <polyline points="5.5 9 7.5 11 12.5 6.5" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function TrustSignals({ results, summary }: Props) {
  const noSecrets  = results.some(r => r.checkId === 'secrets-ok')
  const hasHttps   = results.some(r => r.checkId === 'https-ok')
  const noXss      = results.some(r => r.checkId === 'injection-xss-ok' || r.checkId === 'xss-dom-ok')
  const noExposed  = results.some(r => r.checkId === 'exposed-files-ok')
  const noTakeover = results.some(r => r.checkId === 'takeover-ok')

  const signals: string[] = []
  if (hasHttps)           signals.push('All traffic encrypted over HTTPS')
  if (noSecrets)          signals.push('No API keys or secrets in source')
  if (noXss)              signals.push('No XSS injection patterns detected')
  if (noExposed)          signals.push('No sensitive files publicly accessible')
  if (noTakeover)         signals.push('No subdomain takeover vulnerabilities')
  if (summary.high === 0) signals.push('No critical vulnerabilities found')

  if (signals.length === 0) return null

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid rgba(34,211,168,0.14)',
      borderRadius: 'var(--radius-lg)',
      padding: '22px 26px',
      marginTop: '1.8rem',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(34,211,168,0.4), transparent)',
      }} />

      <div style={{
        fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent)',
        marginBottom: '14px',
        display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.01em',
      }}>
        <ShieldCheckSVG /> What passed
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(275px, 1fr))',
        gap: '9px',
      }}>
        {signals.map(s => (
          <div key={s} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '0.88rem', color: 'var(--text-sub)',
          }}>
            <span style={{ flexShrink: 0, display: 'flex' }}><GreenDotSVG /></span>
            {s}
          </div>
        ))}
      </div>

      {summary.high === 0 && summary.medium <= 2 && (
        <div style={{
          marginTop: '16px', paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          fontSize: '0.88rem', color: 'var(--accent)', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <CheckCircleSVG /> Safe to deploy after addressing the issues above
        </div>
      )}
    </div>
  )
}