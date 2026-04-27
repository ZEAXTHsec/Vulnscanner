'use client'

import { useState, useEffect } from 'react'
import { useScan } from '@/hooks/useScan'
import SummaryCards from './SummaryCards'
import TechBadges from './TechBadges'
import ResultsTable from './ResultsTable'
import TopIssues from './TopIssues'
import FixAllBanner from './FixAllBanner'
import TrustSignals from './TrustSignals'

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const ArrowRightSVG = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)
const GlobeSVG = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
  </svg>
)
const SpinnerSVG = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.7s linear infinite' }}>
    <path d="M21 12a9 9 0 11-6.219-8.56"/>
  </svg>
)
const ZapSVG = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const ShieldSVG = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const ClockSVG = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const SearchSVG = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const WarnSVG = ({ color }: { color: string }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const AlertCircleSVG = ({ color }: { color: string }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

// ─── Terminal data ────────────────────────────────────────────────────────────
const TERMINAL_LINES = [
  { num: '01', tokens: [{ c: '#7dd3fc', v: 'export default function ' }, { c: '#c084fc', v: 'PaymentHandler' }, { c: '#94a3b8', v: '() {' }] },
  { num: '02', tokens: [{ c: '#3d5060', v: '  // TODO: Refactor this later' }] },
  { num: '03', tokens: [{ c: '#7dd3fc', v: '  const ' }, { c: '#94a3b8', v: 'stripeKey = ' }, { c: '#86efac', v: '"sk_live_············"' }, { c: '#94a3b8', v: ';' }], badge: { label: 'Exposed API Key', color: '#f0516a', bg: 'rgba(240,81,106,0.13)' } },
  { num: '04', tokens: [{ c: '#7dd3fc', v: '  const ' }, { c: '#94a3b8', v: 'headers = {' }] },
  { num: '05', tokens: [{ c: '#86efac', v: '    "Authorization"' }, { c: '#94a3b8', v: ': `Bearer ${stripeKey}`' }] },
  { num: '06', tokens: [{ c: '#94a3b8', v: '  };' }] },
  { num: '07', tokens: [{ c: '#7dd3fc', v: '  await ' }, { c: '#c084fc', v: 'fetch' }, { c: '#94a3b8', v: '(' }, { c: '#86efac', v: '"/api/charge"' }, { c: '#94a3b8', v: ', { method: ' }, { c: '#86efac', v: '"POST"' }, { c: '#94a3b8', v: ', headers });' }] },
  { num: '08', tokens: [{ c: '#94a3b8', v: '}' }] },
  { num: '09', tokens: [{ c: '#7dd3fc', v: 'export const ' }, { c: '#94a3b8', v: 'config = { ' }, { c: '#86efac', v: '"cors"' }, { c: '#94a3b8', v: ': ' }, { c: '#7dd3fc', v: 'false' }, { c: '#94a3b8', v: ' };' }], badge: { label: 'CORS Misconfigured', color: '#fbbf24', bg: 'rgba(251,191,36,0.11)' } },
]

const STATS = [
  { icon: <SearchSVG />, value: '23+', label: 'Checks' },
  { icon: <ClockSVG />, value: '<10s', label: 'Scan time' },
  { icon: <ShieldSVG />, value: '0', label: 'Data stored' },
]

export default function ScanInput() {
  const [url, setUrl] = useState('')
  const { scan, reset, isLoading, report, error } = useScan()
  const [activeBadge, setActiveBadge] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const t = setInterval(() => setActiveBadge(p => (p + 1) % 2), 2700)
    return () => clearInterval(t)
  }, [])

  const handleScan = () => { if (url.trim()) scan(url) }

  const handleRescan = () => {
    // Re-scan the same URL — scroll to top for visual feedback
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (url.trim()) scan(url)
    else reset()
  }

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      {!report && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 0 2rem',
          animation: mounted ? 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both' : 'none',
        }}>
          {/* Eyebrow pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 13px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(34,211,168,0.18)',
            borderRadius: '999px',
            marginBottom: '1.5rem',
            fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            <span style={{ animation: 'pulse 2s infinite', display: 'flex' }}><ZapSVG /></span>
            AI-Powered Security Scanner
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2rem, 5.5vw, 3.4rem)',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.04em',
            marginBottom: '1rem',
            color: 'var(--text)',
            fontFamily: 'var(--font-ui)',
          }}>
            Find security issues<br />
            <span style={{
              background: 'linear-gradient(100deg, var(--accent) 0%, var(--accent-2) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>before attackers do</span>
          </h1>

          <p style={{ fontSize: '0.97rem', color: 'var(--text-sub)', marginBottom: '2.2rem', lineHeight: 1.7 }}>
            Instant vulnerability scan · Stack-aware AI fixes · No sign-up
          </p>

          {/* Search bar */}
          <div style={{
            display: 'flex', maxWidth: '540px', margin: '0 auto 0.7rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-mid)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: '0 0 0 0 transparent',
          }}>
            <span style={{
              padding: '0 14px', display: 'flex', alignItems: 'center',
              color: 'var(--text-muted)', borderRight: '1px solid var(--border)', flexShrink: 0,
            }}><GlobeSVG /></span>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="yourdomain.com"
              style={{
                flex: 1, padding: '13px 14px',
                background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)',
                letterSpacing: '0.01em',
              }}
            />
            <button
              onClick={handleScan}
              disabled={isLoading}
              style={{
                padding: '0 22px',
                background: isLoading ? 'var(--bg-elevated)' : 'var(--accent)',
                color: isLoading ? 'var(--text-muted)' : '#04060d',
                border: 'none', fontWeight: 700, fontSize: '0.84rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '7px',
                transition: 'background 0.15s', whiteSpace: 'nowrap',
                letterSpacing: '-0.01em', fontFamily: 'var(--font-ui)',
              }}
            >
              {isLoading ? <><SpinnerSVG /> Scanning…</> : <><ArrowRightSVG /> Scan</>}
            </button>
          </div>

          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '2.5rem', fontFamily: 'var(--font-mono)' }}>
            free · no login · results in ~10s
          </p>

          {/* Stats row */}
          <div style={{
            display: 'inline-flex', gap: '0', marginBottom: '3rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            {STATS.map((s, i) => (
              <div key={s.label} style={{
                padding: '12px 24px', textAlign: 'center',
                borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)',
                  lineHeight: 1, letterSpacing: '-0.03em', marginBottom: '3px',
                  fontFamily: 'var(--font-mono)',
                }}>{s.value}</div>
                <div style={{
                  fontSize: '0.68rem', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                }}>
                  <span style={{ color: 'var(--text-dim)', display: 'flex' }}>{s.icon}</span>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Animated terminal */}
          <div style={{
            maxWidth: '680px', margin: '0 auto',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-mid)',
            background: '#06080f',
            boxShadow: '0 0 0 1px rgba(34,211,168,0.04), 0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
            overflow: 'hidden', textAlign: 'left',
          }}>
            {/* Title bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '10px 16px',
              background: '#04060d',
              borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f57', flexShrink: 0 }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#febc2e', flexShrink: 0 }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28c840', flexShrink: 0 }} />
              <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                analysis_result.ts
              </span>
              <span style={{
                padding: '2px 8px', background: 'var(--accent)', color: '#04060d',
                borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700,
                letterSpacing: '0.06em', animation: 'pulse 2s ease-in-out infinite',
              }}>LIVE</span>
            </div>

            {/* Code body */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Scan sweep line */}
              <div style={{
                position: 'absolute', left: 0, right: 0, height: '1.5px',
                background: 'linear-gradient(90deg, transparent 0%, var(--accent) 30%, var(--accent-2) 70%, transparent 100%)',
                animation: 'scanLine 3s ease-in-out infinite',
                zIndex: 2, opacity: 0.6,
              }} />

              {TERMINAL_LINES.map((line, i) => {
                const b = line.badge
                const active = b
                  ? (line.num === '03' && activeBadge === 0) || (line.num === '09' && activeBadge === 1)
                  : false

                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center',
                    padding: '3px 16px', minHeight: '27px',
                    background: active
                      ? (line.num === '03' ? 'rgba(240,81,106,0.05)' : 'rgba(251,191,36,0.04)')
                      : 'transparent',
                    transition: 'background 0.4s',
                  }}>
                    <span style={{
                      minWidth: '24px', color: 'var(--text-dim)',
                      fontSize: '0.67rem', fontFamily: 'var(--font-mono)',
                      userSelect: 'none', marginRight: '16px', flexShrink: 0,
                    }}>{line.num}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.77rem', flex: 1, letterSpacing: '0.01em' }}>
                      {line.tokens.map((tk, j) => (
                        <span key={j} style={{ color: tk.c }}>{tk.v}</span>
                      ))}
                    </span>
                    {b && (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '2px 8px',
                        background: b.bg,
                        color: b.color,
                        border: `1px solid ${b.color}30`,
                        borderRadius: '5px',
                        fontSize: '0.64rem', fontWeight: 700, whiteSpace: 'nowrap',
                        fontFamily: 'var(--font-mono)',
                        opacity: active ? 1 : 0,
                        transform: active ? 'translateX(0)' : 'translateX(8px)',
                        transition: 'opacity 0.4s, transform 0.4s',
                      }}>
                        <WarnSVG color={b.color} />
                        {b.label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: 'var(--red-dim)', border: '1px solid rgba(240,81,106,0.2)',
          color: 'var(--red)', padding: '11px 16px', borderRadius: 'var(--radius)',
          marginBottom: '1.5rem', fontSize: '0.84rem', fontFamily: 'var(--font-mono)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <AlertCircleSVG color="var(--red)" /> {error}
        </div>
      )}

      {/* ── Compact rescan ────────────────────────────────────────── */}
      {report && (
        <div style={{
          display: 'flex', margin: '2rem 0 1.5rem',
          background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden', maxWidth: '520px',
        }}>
          <span style={{
            padding: '0 12px', display: 'flex', alignItems: 'center',
            color: 'var(--text-muted)', borderRight: '1px solid var(--border)', flexShrink: 0,
          }}><GlobeSVG /></span>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleScan()}
            placeholder="scan another domain…"
            style={{
              flex: 1, padding: '10px 13px',
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)',
            }}
          />
          <button onClick={handleScan} disabled={isLoading} style={{
            padding: '0 18px',
            background: isLoading ? 'var(--bg-elevated)' : 'var(--accent)',
            color: isLoading ? 'var(--text-muted)' : '#04060d',
            border: 'none', fontWeight: 700, fontSize: '0.8rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'background 0.15s', fontFamily: 'var(--font-ui)',
          }}>
            {isLoading ? <SpinnerSVG /> : <ArrowRightSVG />}
            {isLoading ? 'Scanning…' : 'Rescan'}
          </button>
        </div>
      )}

      {/* ── Report ────────────────────────────────────────────────── */}
      {report && (
        <div style={{ animation: 'fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
          <SummaryCards summary={report.summary} url={report.url} timestamp={report.timestamp} onRescan={handleRescan} />
          <TechBadges results={report.results} />
          <FixAllBanner results={report.results} summary={report.summary} url={report.url} />
          <TopIssues results={report.results} summary={report.summary} />
          <ResultsTable results={report.results} url={report.url} timestamp={report.timestamp} />
          <TrustSignals results={report.results} summary={report.summary} />
        </div>
      )}
    </div>
  )
}