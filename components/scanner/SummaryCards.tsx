'use client'

import { useEffect, useRef } from 'react'
import { ScanSummary } from '@/lib/types'

interface Props { summary: ScanSummary; url: string; timestamp: string }

function scoreColor(s: number) { return s >= 80 ? 'var(--accent)' : s >= 50 ? 'var(--yellow)' : 'var(--red)' }
function scoreColorRaw(s: number) { return s >= 80 ? '#00d4aa' : s >= 50 ? '#ffc94d' : '#ff4d6a' }
function scoreLabel(s: number) { return s >= 80 ? 'Secure' : s >= 50 ? 'Fair' : 'At Risk' }
function scoreGrade(s: number) { return s >= 90 ? 'A' : s >= 80 ? 'B' : s >= 65 ? 'C' : s >= 50 ? 'D' : 'F' }

const RadioSVG = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2"/>
    <path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/>
  </svg>
)

function AnimatedScoreRing({ score }: { score: number }) {
  const color = scoreColorRaw(score)
  const r = 42
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ

  return (
    <svg width="108" height="108" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
      <defs>
        <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.7"/>
          <stop offset="100%" stopColor={color} stopOpacity="1"/>
        </linearGradient>
      </defs>
      {/* Track */}
      <circle
        cx="54" cy="54" r={r}
        fill="none"
        stroke="rgba(100,140,220,0.07)"
        strokeWidth="8"
      />
      {/* Fill — animated via CSS */}
      <circle
        cx="54" cy="54" r={r}
        fill="none"
        stroke={`url(#ringGrad)`}
        strokeWidth="8"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        filter="url(#ringGlow)"
        style={{
          animation: 'ringFill 1.2s cubic-bezier(0.22,1,0.36,1) forwards',
          transition: 'stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1)',
        }}
      />
    </svg>
  )
}

function StatCard({
  label,
  value,
  color,
  bg,
  border,
  delay,
  icon,
}: {
  label: string
  value: number
  color: string
  bg: string
  border: string
  delay: number
  icon: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onEnter = () => {
      el.style.transform = 'translateY(-4px) scale(1.02)'
      el.style.borderColor = border.replace('0.18', '0.45')
      el.style.boxShadow = `0 8px 32px ${border.replace('0.18', '0.2')}, var(--shadow-card)`
    }
    const onLeave = () => {
      el.style.transform = 'translateY(0) scale(1)'
      el.style.borderColor = border
      el.style.boxShadow = 'var(--shadow-card)'
    }
    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [border])

  return (
    <div
      ref={ref}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${border}`,
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minWidth: '82px',
        flex: '1',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        boxShadow: 'var(--shadow-card)',
        transition: 'transform 0.22s cubic-bezier(0.22,1,0.36,1), border-color 0.22s ease, box-shadow 0.22s ease',
        animation: 'cardReveal 0.45s cubic-bezier(0.22,1,0.36,1) both',
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Glow wash */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 0%, ${bg} 0%, transparent 65%)`,
        pointerEvents: 'none',
        opacity: value > 0 ? 1 : 0.4,
      }} />

      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '2px',
        background: value > 0
          ? `linear-gradient(90deg, ${color}00 0%, ${color} 50%, ${color}00 100%)`
          : 'transparent',
        opacity: 0.8,
      }} />

      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: '1.1rem', marginBottom: '8px', opacity: 0.75 }}>{icon}</div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '2rem',
          fontWeight: 600,
          color: value > 0 ? color : 'var(--text-dim)',
          lineHeight: 1,
          letterSpacing: '-0.04em',
          animation: 'countUp 0.5s cubic-bezier(0.22,1,0.36,1) both',
          animationDelay: `${delay + 100}ms`,
        }}>{value}</div>
        <div style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          marginTop: '6px',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>{label}</div>
      </div>
    </div>
  )
}

export default function SummaryCards({ summary, url, timestamp }: Props) {
  const color = scoreColor(summary.score)
  const colorRaw = scoreColorRaw(summary.score)
  const label = scoreLabel(summary.score)
  const grade = scoreGrade(summary.score)

  const stats = [
    { label: 'Critical', value: summary.high,   color: 'var(--red)',    bg: 'var(--red-dim)',    border: 'rgba(255,77,106,0.18)',  icon: '🔴' },
    { label: 'Medium',   value: summary.medium, color: 'var(--orange)', bg: 'var(--orange-dim)', border: 'rgba(255,140,66,0.18)',  icon: '🟠' },
    { label: 'Low',      value: summary.low,    color: 'var(--yellow)', bg: 'var(--yellow-dim)', border: 'rgba(255,201,77,0.18)',  icon: '🟡' },
    { label: 'Passed',   value: summary.passed, color: 'var(--accent)', bg: 'var(--accent-dim)', border: 'rgba(0,212,170,0.18)',   icon: '✅' },
    { label: 'Info',     value: summary.info,   color: 'var(--blue)',   bg: 'var(--blue-dim)',   border: 'rgba(77,166,255,0.18)',  icon: 'ℹ️' },
  ]

  return (
    <>
      <style>{`
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(16px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ringFill {
          from { stroke-dasharray: 0 999; }
        }
        @keyframes urlSlide {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .score-card-inner:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 32px rgba(0,212,170,0.1) !important;
        }
      `}</style>

      <div style={{ marginBottom: '1.8rem' }}>

        {/* URL bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 18px',
          marginBottom: '14px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-mid)',
          borderRadius: 'var(--radius)',
          animation: 'urlSlide 0.35s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          <span style={{ color: 'var(--accent)', display: 'flex', flexShrink: 0 }}>
            <RadioSVG />
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.82rem',
            color: 'var(--accent)',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{url}</span>
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            flexShrink: 0,
          }}>
            {new Date(timestamp).toLocaleString()}
          </span>
        </div>

        {/* Cards row */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', flexWrap: 'wrap' }}>

          {/* Score card */}
          <div
            className="score-card-inner"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-mid)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              minWidth: '230px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
              transition: 'transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease',
              animation: 'cardReveal 0.4s cubic-bezier(0.22,1,0.36,1) both',
              cursor: 'default',
            }}
          >
            {/* Background glow */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 70% 50%, ${colorRaw}09 0%, transparent 65%)`,
              pointerEvents: 'none',
            }} />

            {/* Top gradient line */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '2px',
              background: `linear-gradient(90deg, transparent 0%, ${colorRaw} 50%, transparent 100%)`,
              opacity: 0.7,
            }} />

            {/* Score ring + number */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <AnimatedScoreRing score={summary.score} />
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.6rem',
                  fontWeight: 700,
                  color,
                  lineHeight: 1,
                  letterSpacing: '-0.05em',
                }}>
                  {summary.score}
                </span>
                <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  /100
                </span>
              </div>
            </div>

            {/* Label + grade */}
            <div style={{ position: 'relative' }}>
              <div style={{
                fontWeight: 700,
                fontSize: '1rem',
                color: 'var(--text)',
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
              }}>
                Security Score
              </div>

              {/* Grade badge */}
              <div style={{
                marginTop: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 12px',
                  background: `${colorRaw}16`,
                  border: `1px solid ${colorRaw}30`,
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase' as const,
                }}>{label}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color,
                  opacity: 0.7,
                }}>
                  {grade}
                </span>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          {stats.map((s, i) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              color={s.color}
              bg={s.bg}
              border={s.border}
              delay={80 + i * 55}
              icon={s.icon}
            />
          ))}
        </div>
      </div>
    </>
  )
}