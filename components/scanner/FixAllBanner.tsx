'use client'

import { useState } from 'react'
import { ScanResult, ScanSummary } from '@/lib/types'

interface Props { results: ScanResult[]; summary: ScanSummary; url: string }

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
      border: '1px solid rgba(0,229,135,0.2)',
      background: 'linear-gradient(135deg, #051510 0%, #061820 50%, #050f18 100%)',
      padding: '20px 24px',
      marginBottom: '1.5rem',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '-40px', left: '-40px',
        width: '200px', height: '200px',
        background: 'radial-gradient(circle, rgba(0,229,135,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Shimmer bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)',
        opacity: 0.5,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px',
          }}>
            <span style={{ fontSize: '1.1rem' }}>🚀</span>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text)',
            }}>Fix everything in one go</span>
            <span style={{
              padding: '2px 10px',
              background: 'var(--accent-dim)',
              border: '1px solid rgba(0,229,135,0.25)',
              borderRadius: '999px',
              fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)',
              letterSpacing: '0.04em',
            }}>{fixable.length} AI FIXES READY</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Score improves from{' '}
            <span style={{ color: 'var(--red)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{summary.score}</span>
            {' → '}
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{projectedScore}</span>
            {' '}
            <span style={{ color: 'var(--accent)', fontSize: '0.78rem' }}>↑{totalGain}pts</span>
          </div>
        </div>

        <button onClick={handleCopy} style={{
          padding: '11px 24px',
          background: copied ? 'rgba(0,229,135,0.15)' : 'var(--accent)',
          color: copied ? 'var(--accent)' : '#07090f',
          border: copied ? '1px solid rgba(0,229,135,0.3)' : 'none',
          borderRadius: 'var(--radius)',
          fontWeight: 700, fontSize: '0.85rem',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '7px',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.01em',
        }}>
          {copied ? '✓ Copied — paste into AI' : '📋 Copy Full Fix Prompt'}
        </button>
      </div>

      {/* Issue pills */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '14px' }}>
        {fixable.slice(0, 6).map(r => (
          <span key={r.checkId} style={{
            padding: '3px 10px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '999px',
            fontSize: '0.72rem', color: sevColors[r.severity] ?? 'var(--text-muted)',
            fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sevColors[r.severity], flexShrink: 0 }} />
            {r.name}
          </span>
        ))}
        {fixable.length > 6 && (
          <span style={{
            padding: '3px 10px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '999px',
            fontSize: '0.72rem', color: 'var(--text-muted)',
          }}>+{fixable.length - 6} more</span>
        )}
      </div>
    </div>
  )
}