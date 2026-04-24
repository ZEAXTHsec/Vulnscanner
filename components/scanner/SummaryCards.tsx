'use client'

import { ScanSummary } from '@/lib/types'

interface Props { summary: ScanSummary; url: string; timestamp: string }

function scoreColor(s: number) { return s >= 80 ? '#22d3a8' : s >= 50 ? '#fbbf24' : '#f0516a' }
function scoreLabel(s: number) { return s >= 80 ? 'Secure' : s >= 50 ? 'Fair' : 'At Risk' }

const RadioSVG = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/>
  </svg>
)

function ScoreRing({ score }: { score: number }) {
  const r = 38, circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = scoreColor(score)
  return (
    <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="7" />
      <circle
        cx="48" cy="48" r={r} fill="none"
        stroke={color} strokeWidth="7"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        filter="url(#glow)"
        style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(0.22,1,0.36,1)' }}
      />
    </svg>
  )
}

export default function SummaryCards({ summary, url, timestamp }: Props) {
  const color = scoreColor(summary.score)
  const label = scoreLabel(summary.score)

  const stats = [
    { label: 'Critical', value: summary.high,   color: 'var(--red)',    bg: 'var(--red-dim)',    border: 'rgba(240,81,106,0.18)' },
    { label: 'Medium',   value: summary.medium, color: 'var(--orange)', bg: 'var(--orange-dim)', border: 'rgba(251,146,60,0.18)' },
    { label: 'Low',      value: summary.low,    color: 'var(--yellow)', bg: 'var(--yellow-dim)', border: 'rgba(251,191,36,0.18)' },
    { label: 'Passed',   value: summary.passed, color: 'var(--accent)', bg: 'var(--accent-dim)', border: 'rgba(34,211,168,0.18)' },
    { label: 'Info',     value: summary.info,   color: 'var(--blue)',   bg: 'var(--blue-dim)',   border: 'rgba(96,165,250,0.18)' },
  ]

  return (
    <div style={{ marginBottom: '1.8rem' }}>
      {/* URL bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 16px', marginBottom: '14px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
      }}>
        <span style={{ color: 'var(--accent)', display: 'flex' }}><RadioSVG /></span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 500 }}>{url}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {new Date(timestamp).toLocaleString()}
        </span>
      </div>

      {/* Cards row */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', flexWrap: 'wrap' }}>
        {/* Score card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-mid)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 26px',
          display: 'flex', alignItems: 'center', gap: '18px',
          minWidth: '210px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at 75% 50%, ${color}07 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative' }}>
            <ScoreRing score={summary.score} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.04em' }}>
                {summary.score}
              </span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px' }}>/100</span>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', letterSpacing: '-0.02em' }}>
              Security Score
            </div>
            <div style={{
              marginTop: '6px', display: 'inline-flex', alignItems: 'center',
              padding: '3px 10px',
              background: `${color}14`,
              border: `1px solid ${color}28`,
              borderRadius: '999px',
              fontSize: '0.68rem', fontWeight: 700, color,
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>{label}</div>
          </div>
        </div>

        {/* Stat cards */}
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)',
            border: `1px solid ${s.border}`,
            borderRadius: 'var(--radius)',
            padding: '14px 18px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            minWidth: '72px', flex: '1',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              background: s.value > 0 ? s.color : 'transparent',
              opacity: 0.55,
            }} />
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.75rem', fontWeight: 700,
              color: s.value > 0 ? s.color : 'var(--text-dim)',
              lineHeight: 1, letterSpacing: '-0.03em',
            }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}