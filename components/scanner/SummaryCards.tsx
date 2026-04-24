'use client'

import { ScanSummary } from '@/lib/types'

interface Props { summary: ScanSummary; url: string; timestamp: string }

function scoreColor(s: number) { return s >= 80 ? '#00e587' : s >= 50 ? '#f5c842' : '#ff4d6a' }
function scoreLabel(s: number) { return s >= 80 ? 'Good' : s >= 50 ? 'Fair' : 'At Risk' }

function ScoreRing({ score }: { score: number }) {
  const r = 40, circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = scoreColor(score)
  return (
    <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 8px ${color}60)` }}
      />
    </svg>
  )
}

export default function SummaryCards({ summary, url, timestamp }: Props) {
  const color = scoreColor(summary.score)
  const label = scoreLabel(summary.score)

  const stats = [
    { label: 'Critical', value: summary.high, color: 'var(--red)', bg: 'var(--red-dim)', border: 'rgba(255,77,106,0.2)' },
    { label: 'Medium', value: summary.medium, color: 'var(--orange)', bg: 'var(--orange-dim)', border: 'rgba(255,140,66,0.2)' },
    { label: 'Low', value: summary.low, color: 'var(--yellow)', bg: 'var(--yellow-dim)', border: 'rgba(245,200,66,0.2)' },
    { label: 'Passed', value: summary.passed, color: 'var(--accent)', bg: 'var(--accent-dim)', border: 'rgba(0,229,135,0.2)' },
    { label: 'Info', value: summary.info, color: 'var(--blue)', bg: 'var(--blue-dim)', border: 'rgba(77,166,255,0.2)' },
  ]

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Scanned URL bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 16px', marginBottom: '16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
      }}>
        <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>📡</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
          color: 'var(--accent)', fontWeight: 500,
        }}>{url}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {new Date(timestamp).toLocaleString()}
        </span>
      </div>

      {/* Score + stat cards */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap' }}>
        {/* Score card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-mid)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 28px',
          display: 'flex', alignItems: 'center', gap: '20px',
          minWidth: '220px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at 80% 50%, ${color}08 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative' }}>
            <ScoreRing score={summary.score} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              transform: 'rotate(0deg)',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>
                {summary.score}
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px' }}>/100</span>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
              Security Score
            </div>
            <div style={{
              marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px',
              background: `${color}18`,
              border: `1px solid ${color}30`,
              borderRadius: '999px',
              fontSize: '0.72rem', fontWeight: 700, color,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>{label}</div>
          </div>
        </div>

        {/* Stat cards */}
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)',
            border: `1px solid ${s.border}`,
            borderRadius: 'var(--radius)',
            padding: '16px 20px',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center',
            minWidth: '80px',
            flex: '1',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              background: s.value > 0 ? s.color : 'transparent',
              opacity: 0.6,
            }} />
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem', fontWeight: 800,
              color: s.value > 0 ? s.color : 'var(--text-dim)',
              lineHeight: 1,
            }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}