'use client'

import { useState } from 'react'
import { ScanResult, ScanSummary } from '@/lib/types'

interface Props { results: ScanResult[]; summary: ScanSummary; url: string }

const RocketSVG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/>
    <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
)
const ClipboardSVG = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
)
const CheckSVG = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function FixAllBanner({ results, summary, url }: Props) {
  const [copied, setCopied] = useState(false)

  const fixable = results.filter(r => r.status === 'fail' && r.fixPrompt)
  const totalGain = fixable.reduce((sum, r) => {
    const w: Record<string, number> = { high: 12, medium: 6, low: 2, info: 0 }
    return sum + (w[r.severity] ?? 0)
  }, 0)
  const projectedScore = Math.min(100, summary.score + totalGain)

  if (fixable.length === 0) return null

  const combinedPrompt = [
    `I scanned ${url} for security issues and found ${results.filter(r => r.status === 'fail').length} problems. Please help me fix all of them. My current security score is ${summary.score}/100.\n`,
    ...fixable.map((r, i) => `--- Issue ${i + 1}: ${r.name} (${r.severity.toUpperCase()}) ---\n${r.fixPrompt}`)
  ].join('\n\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(combinedPrompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const sevColors: Record<string, string> = {
    high: 'var(--red)', medium: 'var(--orange)', low: 'var(--yellow)', info: 'var(--blue)'
  }

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid rgba(34,211,168,0.20)',
      background: 'linear-gradient(140deg, #041210 0%, #051a20 55%, #04101a 100%)',
      padding: '24px 28px',
      marginBottom: '1.8rem',
    }}>
      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: '-50px', left: '-50px',
        width: '240px', height: '240px',
        background: 'radial-gradient(circle, rgba(34,211,168,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Top shimmer */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(34,211,168,0.6) 50%, transparent 100%)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '7px' }}>
            <span style={{ color: 'var(--accent)', display: 'flex' }}><RocketSVG /></span>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', letterSpacing: '-0.025em' }}>
              Fix everything in one go
            </span>
            <span style={{
              padding: '3px 11px',
              background: 'var(--accent-dim)',
              border: '1px solid rgba(34,211,168,0.25)',
              borderRadius: '999px',
              fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)',
              letterSpacing: '0.05em',
            }}>{fixable.length} AI FIXES</span>
          </div>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-sub)' }}>
            Score improves from{' '}
            <span style={{ color: 'var(--red)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{summary.score}</span>
            <span style={{ color: 'var(--text-muted)', margin: '0 5px' }}>→</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{projectedScore}</span>
            <span style={{ color: 'var(--accent)', fontSize: '0.8rem', marginLeft: '5px' }}>+{totalGain}pts</span>
          </div>
        </div>

        <button onClick={handleCopy} style={{
          padding: '13px 26px',
          background: copied ? 'rgba(34,211,168,0.12)' : 'var(--accent)',
          color: copied ? 'var(--accent)' : '#04060d',
          border: copied ? '1px solid rgba(34,211,168,0.30)' : 'none',
          borderRadius: 'var(--radius)',
          fontWeight: 700, fontSize: '0.9rem',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s',
          letterSpacing: '-0.01em', fontFamily: 'var(--font-ui)',
        }}>
          {copied ? <CheckSVG /> : <ClipboardSVG />}
          {copied ? 'Copied — paste into AI' : 'Copy Full Fix Prompt'}
        </button>
      </div>

      {/* Issue pills */}
      <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginTop: '16px' }}>
        {fixable.slice(0, 6).map(r => (
          <span key={r.checkId} style={{
            padding: '4px 12px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '999px',
            fontSize: '0.76rem', color: sevColors[r.severity] ?? 'var(--text-muted)',
            fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sevColors[r.severity], flexShrink: 0 }} />
            {r.name}
          </span>
        ))}
        {fixable.length > 6 && (
          <span style={{
            padding: '4px 12px', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '999px', fontSize: '0.76rem', color: 'var(--text-muted)',
          }}>+{fixable.length - 6} more</span>
        )}
      </div>
    </div>
  )
}