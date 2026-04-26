'use client'

import { useState } from 'react'
import { ScanResult, ScanSummary } from '@/lib/types'

interface Props { results: ScanResult[]; summary: ScanSummary }

const SEV_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1, info: 0 }
const PENALTY: Record<string, number>    = { high: 12, medium: 6, low: 2, info: 0 }
const SEV_COLOR: Record<string, string>  = { high: 'var(--red)', medium: 'var(--orange)', low: 'var(--yellow)', info: 'var(--blue)' }
const SEV_BG: Record<string, string>     = { high: 'var(--red-dim)', medium: 'var(--orange-dim)', low: 'var(--yellow-dim)', info: 'var(--blue-dim)' }
const SEV_BORDER: Record<string, string> = { high: 'rgba(255,77,106,0.13)', medium: 'rgba(255,140,66,0.13)', low: 'rgba(255,201,77,0.13)', info: 'rgba(77,166,255,0.1)' }

const ZapSVG = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const CloseSVG = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const BotSVG = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/>
    <line x1="8" y1="15" x2="8" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/>
  </svg>
)
const CheckSVG = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const CheckCircleSVG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const ChevronSVG = ({ open }: { open: boolean }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const WarnSVG = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const WrenchSVG = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
  </svg>
)

function IssueCard({ issue, rank, score, copied, onCopy }: {
  issue: ScanResult
  rank: number
  score: number
  copied: boolean
  onCopy: () => void
}) {
  const [open, setOpen] = useState(false)
  const color  = SEV_COLOR[issue.severity] ?? 'var(--text-muted)'
  const bg     = SEV_BG[issue.severity] ?? 'var(--bg-elevated)'
  const border = SEV_BORDER[issue.severity] ?? 'var(--border)'
  const gain   = PENALTY[issue.severity] ?? 0
  const newScore = Math.min(100, score + gain)
  const hasDetail = issue.detail || issue.fix

  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: `1px solid ${border}`,
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      {/* Header row */}
      <div
        onClick={() => hasDetail && setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '11px',
          padding: '11px 15px',
          cursor: hasDetail ? 'pointer' : 'default',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
          color: 'var(--text-dim)', minWidth: '14px', flexShrink: 0,
        }}>{rank}</span>

        <span style={{
          background: bg, color, padding: '3px 8px',
          borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
        }}>{issue.severity}</span>

        <span style={{ flex: 1, fontWeight: 600, fontSize: '0.86rem', color: 'var(--text)', letterSpacing: '-0.01em' }}>
          {issue.name}
        </span>

        {gain > 0 && (
          <span style={{
            fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700,
            whiteSpace: 'nowrap', background: 'var(--accent-dim)',
            padding: '3px 9px', borderRadius: '6px',
            border: '1px solid rgba(34,211,168,0.18)',
            fontFamily: 'var(--font-mono)', letterSpacing: '0.01em',
          }}>
            {score} → {newScore}
          </span>
        )}

        {issue.fixPrompt && (
          <button
            onClick={(e) => { e.stopPropagation(); onCopy() }}
            style={{
              padding: '5px 11px', fontSize: '0.73rem', fontWeight: 600,
              border: '1px solid',
              borderColor: copied ? 'rgba(34,211,168,0.35)' : 'var(--border-mid)',
              borderRadius: '7px',
              background: copied ? 'var(--accent-dim)' : 'var(--bg-card)',
              color: copied ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            {copied ? <CheckSVG /> : <BotSVG />}
            {copied ? 'Copied' : 'Ask AI'}
          </button>
        )}

        {!issue.fixPrompt && issue.fix && (
          <span style={{
            padding: '5px 11px', fontSize: '0.73rem',
            color: 'var(--text-dim)', fontWeight: 500, whiteSpace: 'nowrap',
            background: 'var(--bg-elevated)', borderRadius: '7px',
            border: '1px solid var(--border)',
          }}>
            {issue.fix.slice(0, 28)}…
          </span>
        )}

        {hasDetail && (
          <span style={{ color: 'var(--text-dim)', display: 'flex' }}>
            <ChevronSVG open={open} />
          </span>
        )}
      </div>

      {/* Expanded detail + fix */}
      {open && hasDetail && (
        <div style={{
          borderTop: `1px solid ${border}`,
          padding: '13px 15px 13px 44px',
          display: 'flex', gap: '14px', flexWrap: 'wrap',
          background: 'rgba(0,0,0,0.12)',
        }}>
          {issue.detail && (
            <div style={{ flex: '1', minWidth: '160px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px',
                color, fontSize: '0.62rem', fontWeight: 700,
                letterSpacing: '0.07em', textTransform: 'uppercase',
              }}>
                <WarnSVG /> Risk
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-sub)', lineHeight: '1.6' }}>
                {issue.detail}
              </p>
            </div>
          )}

          {issue.detail && issue.fix && (
            <div style={{ width: '1px', background: 'var(--border)', alignSelf: 'stretch', flexShrink: 0 }} />
          )}

          {issue.fix && (
            <div style={{ flex: '1', minWidth: '160px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px',
                color: 'var(--accent)', fontSize: '0.62rem', fontWeight: 700,
                letterSpacing: '0.07em', textTransform: 'uppercase',
              }}>
                <WrenchSVG /> Fix
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-sub)', lineHeight: '1.6' }}>
                {issue.fix}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TopIssues({ results, summary }: Props) {
  const [copied, setCopied] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const failures = results.filter(r => r.status === 'fail')
  if (failures.length === 0) return (
    <div style={{
      background: 'var(--accent-dim)', border: '1px solid rgba(34,211,168,0.18)',
      borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: '1.5rem',
      display: 'flex', alignItems: 'center', gap: '10px',
      color: 'var(--accent)', fontWeight: 600, fontSize: '0.88rem',
    }}>
      <CheckCircleSVG /> No issues found — this site is well-configured.
    </div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--yellow)', display: 'flex' }}><ZapSVG /></span>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', letterSpacing: '-0.02em' }}>Fix These First</span>
          <span style={{
            padding: '2px 9px', background: 'rgba(251,191,36,0.09)',
            border: '1px solid rgba(251,191,36,0.18)',
            borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700,
            color: 'var(--yellow)', letterSpacing: '0.05em',
          }}>HIGHEST IMPACT</span>
        </div>
        <button onClick={() => setDismissed(true)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', display: 'flex', padding: '4px',
          borderRadius: '6px', transition: 'color 0.15s',
        }}><CloseSVG /></button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {top.map((issue, i) => (
          <IssueCard
            key={issue.checkId}
            issue={issue}
            rank={i + 1}
            score={summary.score}
            copied={copied === issue.checkId}
            onCopy={() => issue.fixPrompt && handleCopy(issue.checkId, issue.fixPrompt)}
          />
        ))}
      </div>

      {failures.length > 3 && (
        <p style={{ margin: '10px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)', paddingLeft: '2px' }}>
          +{failures.length - 3} more issue{failures.length - 3 !== 1 ? 's' : ''} in the table below.
        </p>
      )}
    </div>
  )
}