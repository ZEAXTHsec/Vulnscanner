'use client'

import { useState } from 'react'
import { ScanResult, ScanSummary } from '@/lib/types'

interface Props { results: ScanResult[]; summary: ScanSummary }

const SEV_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1, info: 0 }
const PENALTY: Record<string, number> = { high: 12, medium: 6, low: 2, info: 0 }
const SEV_COLOR: Record<string, string> = {
  high: 'var(--red)', medium: 'var(--orange)', low: 'var(--yellow)', info: 'var(--blue)'
}
const SEV_BG: Record<string, string> = {
  high: 'var(--red-dim)', medium: 'var(--orange-dim)', low: 'var(--yellow-dim)', info: 'var(--blue-dim)'
}

export default function TopIssues({ results, summary }: Props) {
  const [copied, setCopied] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const failures = results.filter(r => r.status === 'fail')
  if (failures.length === 0) return (
    <div style={{
      background: 'var(--accent-dim)', border: '1px solid rgba(0,229,135,0.2)',
      borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: '1.5rem',
      display: 'flex', alignItems: 'center', gap: '10px',
      color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem',
    }}>✅ No issues found — this site is well-configured.</div>
  )

  const top = [...failures]
    .sort((a, b) => (SEV_WEIGHT[b.severity] ?? 0) - (SEV_WEIGHT[a.severity] ?? 0))
    .slice(0, 3)

  const handleCopy = (id: string, prompt: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-mid)',
      borderRadius: 'var(--radius-lg)',
      padding: '18px 20px',
      marginBottom: '1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: '0.9rem', color: 'var(--text)',
          }}>⚡ Fix These First</span>
          <span style={{
            padding: '2px 9px', background: 'rgba(245,200,66,0.1)',
            border: '1px solid rgba(245,200,66,0.2)',
            borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700,
            color: 'var(--yellow)', letterSpacing: '0.04em',
          }}>HIGHEST IMPACT</span>
        </div>
        <button onClick={() => setDismissed(true)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1,
          padding: '2px 6px', borderRadius: '4px',
          transition: 'color 0.15s',
        }}>×</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {top.map((issue, i) => {
          const gain = PENALTY[issue.severity] ?? 0
          const newScore = Math.min(100, summary.score + gain)
          const color = SEV_COLOR[issue.severity] ?? 'var(--text-muted)'
          const bg = SEV_BG[issue.severity] ?? 'var(--bg-elevated)'

          return (
            <div key={issue.checkId} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '12px 16px',
              transition: 'border-color 0.15s',
            }}>
              {/* Rank */}
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                color: 'var(--text-dim)', minWidth: '16px',
              }}>{i + 1}.</span>

              {/* Severity pill */}
              <span style={{
                background: bg, color, padding: '3px 9px',
                borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
              }}>{issue.severity}</span>

              {/* Name */}
              <span style={{ flex: 1, fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>
                {issue.name}
              </span>

              {/* Score delta */}
              {gain > 0 && (
                <span style={{
                  fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600,
                  whiteSpace: 'nowrap', background: 'var(--accent-dim)',
                  padding: '3px 10px', borderRadius: '6px',
                  border: '1px solid rgba(0,229,135,0.2)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {summary.score} → {newScore} <span style={{ opacity: 0.7 }}>↑{gain}pts</span>
                </span>
              )}

              {/* Copy AI button */}
              {issue.fixPrompt ? (
                <button onClick={() => handleCopy(issue.checkId, issue.fixPrompt!)} style={{
                  padding: '6px 13px', fontSize: '0.75rem', fontWeight: 600,
                  border: '1px solid',
                  borderColor: copied === issue.checkId ? 'rgba(0,229,135,0.4)' : 'var(--border-mid)',
                  borderRadius: '8px',
                  background: copied === issue.checkId ? 'var(--accent-dim)' : 'var(--bg-card)',
                  color: copied === issue.checkId ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}>
                  {copied === issue.checkId ? '✓ Copied' : '🤖 Ask AI'}
                </button>
              ) : (
                <span style={{
                  padding: '6px 13px', fontSize: '0.75rem',
                  color: 'var(--text-dim)', fontWeight: 500, whiteSpace: 'nowrap',
                  background: 'var(--bg-elevated)', borderRadius: '8px',
                  border: '1px solid var(--border)',
                }}>
                  {issue.fix ? issue.fix.slice(0, 32) + '…' : 'See below'}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {failures.length > 3 && (
        <p style={{ margin: '10px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '4px' }}>
          +{failures.length - 3} more issue{failures.length - 3 !== 1 ? 's' : ''} in the table below.
        </p>
      )}
    </div>
  )
}