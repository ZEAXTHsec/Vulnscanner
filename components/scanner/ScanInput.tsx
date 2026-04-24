'use client'

import { useState, useEffect } from 'react'
import { useScan } from '@/hooks/useScan'
import SummaryCards from './SummaryCards'
import TechBadges from './TechBadges'
import ResultsTable from './ResultsTable'
import TopIssues from './TopIssues'
import FixAllBanner from './FixAllBanner'
import TrustSignals from './TrustSignals'

// Animated terminal lines that cycle while idle
const TERMINAL_LINES = [
  { num: '01', type: 'keyword', text: 'export default function ', bold: 'PaymentHandler', rest: '() {' },
  { num: '02', type: 'comment', text: '// TODO: Refactor this later', bold: '', rest: '' },
  { num: '03', type: 'normal', text: 'const stripeKey = ', bold: '"sk_live_············"', rest: ' ;' },
  { num: '04', type: 'normal', text: 'const headers = {', bold: '', rest: '' },
  { num: '05', type: 'string', text: '"Authorization"', bold: '', rest: ' : `Bearer ${stripeKey}`' },
  { num: '06', type: 'normal', text: '};', bold: '', rest: '' },
  { num: '07', type: 'normal', text: 'await fetch( ', bold: '"/api/charge"', rest: ', { method: "POST", headers });' },
  { num: '08', type: 'normal', text: '}', bold: '', rest: '' },
  { num: '09', type: 'keyword', text: 'export const config = { ', bold: '"cors"', rest: ' : false };' },
]

const SCANNING_BADGES = [
  { line: 3, label: '⚠ Exposed API Key', color: '#ff4d6a', bg: 'rgba(255,77,106,0.15)' },
  { line: 7, label: '⚠ CORS Misconfigured', color: '#f5c842', bg: 'rgba(245,200,66,0.12)' },
]

const STATS = [
  { value: '23+', label: 'Security Checks' },
  { value: '<10s', label: 'Scan Time' },
  { value: '100%', label: 'Free to Use' },
]

export default function ScanInput() {
  const [url, setUrl] = useState('')
  const { scan, isLoading, report, error } = useScan()
  const [activeBadge, setActiveBadge] = useState(0)
  const [scanLinePos, setScanLinePos] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Cycle scan badges
    const t = setInterval(() => setActiveBadge(p => (p + 1) % SCANNING_BADGES.length), 2800)
    return () => clearInterval(t)
  }, [])

  const handleScan = () => { if (url.trim()) scan(url) }

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      {!report && (
        <div style={{
          textAlign: 'center',
          padding: '5rem 0 3rem',
          animation: mounted ? 'fadeUp 0.6s ease both' : 'none',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '5px 14px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(0,229,135,0.2)',
            borderRadius: '999px',
            marginBottom: '1.8rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--accent)',
            letterSpacing: '0.03em',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s infinite' }} />
            AI-powered security analysis
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.4rem, 6vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '1.2rem',
            color: 'var(--text)',
          }}>
            Find security issues<br />
            <span style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>before attackers do</span>
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: '1rem',
            color: 'var(--text-muted)',
            marginBottom: '2.5rem',
            fontWeight: 300,
          }}>
            23 security checks · AI-powered fixes · Results in under 10 seconds
          </p>

          {/* Input */}
          <div style={{
            display: 'flex',
            maxWidth: '580px',
            margin: '0 auto 1rem',
            gap: '0',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-mid)',
            background: 'var(--bg-card)',
            overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}
            onFocus={() => {}}
          >
            <span style={{
              padding: '0 14px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              borderRight: '1px solid var(--border)',
              flexShrink: 0,
            }}>https://</span>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="yourdomain.com"
              style={{
                flex: 1,
                padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text)',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-mono)',
              }}
            />
            <button
              onClick={handleScan}
              disabled={isLoading}
              style={{
                padding: '0 24px',
                background: isLoading ? 'var(--bg-elevated)' : 'var(--accent)',
                color: isLoading ? 'var(--text-muted)' : '#07090f',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.2s',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.01em',
              }}
            >
              {isLoading ? (
                <>
                  <span style={{
                    width: '14px', height: '14px',
                    border: '2px solid var(--text-dim)',
                    borderTopColor: 'var(--accent)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block',
                    flexShrink: 0,
                  }} />
                  Scanning...
                </>
              ) : '→ Scan Site'}
            </button>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2.5rem',
            marginTop: '2rem',
          }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--accent)',
                  lineHeight: 1,
                  marginBottom: '3px',
                }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Animated terminal */}
          <div style={{
            maxWidth: '700px',
            margin: '3.5rem auto 0',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--border-mid)',
            background: '#0a0e18',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            textAlign: 'left',
            position: 'relative',
          }}>
            {/* Title bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              background: '#080c14',
            }}>
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ff5f56' }} />
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ffbd2e' }} />
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#27c93f' }} />
              <span style={{
                marginLeft: 'auto',
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
                fontFamily: 'var(--font-mono)',
              }}>analysis_result.json</span>
              {/* Live scanning badge */}
              <span style={{
                padding: '2px 8px',
                background: 'var(--accent)',
                color: '#07090f',
                borderRadius: '4px',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                animation: 'pulse 2s ease-in-out infinite',
              }}>SCANNING</span>
            </div>

            {/* Code area */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Scan line sweep */}
              <div style={{
                position: 'absolute',
                left: 0, right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                animation: 'scanLine 3s ease-in-out infinite',
                zIndex: 2,
                opacity: 0.6,
              }} />

              {TERMINAL_LINES.map((line, i) => {
                const badge = SCANNING_BADGES.find(b => b.line === parseInt(line.num))
                const showBadge = badge && activeBadge === SCANNING_BADGES.indexOf(badge)

                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px 16px',
                      background: line.num === '03' && activeBadge === 0
                        ? 'rgba(255,77,106,0.07)'
                        : line.num === '09' && activeBadge === 1
                        ? 'rgba(245,200,66,0.06)'
                        : 'transparent',
                      transition: 'background 0.3s',
                      minHeight: '28px',
                    }}
                  >
                    <span style={{
                      minWidth: '28px',
                      color: 'var(--text-dim)',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      userSelect: 'none',
                      marginRight: '12px',
                    }}>{line.num}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', flex: 1 }}>
                      <span style={{
                        color: line.type === 'keyword' ? '#7dd3fc'
                          : line.type === 'comment' ? '#4d6a7a'
                          : line.type === 'string' ? '#86efac'
                          : '#94a3b8'
                      }}>{line.text}</span>
                      {line.bold && (
                        <span style={{
                          color: line.num === '03' ? '#ff4d6a'
                            : line.type === 'keyword' ? '#f0abfc'
                            : '#fbbf24',
                          fontWeight: 500,
                        }}>{line.bold}</span>
                      )}
                      <span style={{ color: '#94a3b8' }}>{line.rest}</span>
                    </span>
                    {/* Issue badge */}
                    {badge && (
                      <span style={{
                        padding: '2px 10px',
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.color}40`,
                        borderRadius: '5px',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        opacity: showBadge ? 1 : 0,
                        transform: showBadge ? 'translateX(0)' : 'translateX(8px)',
                        transition: 'all 0.4s ease',
                        fontFamily: 'var(--font-mono)',
                      }}>{badge.label}</span>
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
          background: 'var(--red-dim)',
          border: '1px solid rgba(255,77,106,0.25)',
          color: 'var(--red)',
          padding: '12px 18px',
          borderRadius: 'var(--radius)',
          marginBottom: '1.5rem',
          fontSize: '0.88rem',
          fontFamily: 'var(--font-mono)',
        }}>⚠ {error}</div>
      )}

      {/* ── Compact input bar after scan ──────────────────────────── */}
      {report && (
        <div style={{
          display: 'flex',
          gap: '0',
          margin: '2rem 0 2rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-mid)',
          background: 'var(--bg-card)',
          overflow: 'hidden',
          maxWidth: '600px',
        }}>
          <span style={{
            padding: '0 14px',
            display: 'flex', alignItems: 'center',
            color: 'var(--text-muted)', fontSize: '0.85rem',
            borderRight: '1px solid var(--border)', flexShrink: 0,
          }}>https://</span>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleScan()}
            placeholder="scan another domain..."
            style={{
              flex: 1, padding: '11px 14px',
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: '0.88rem', fontFamily: 'var(--font-mono)',
            }}
          />
          <button onClick={handleScan} disabled={isLoading} style={{
            padding: '0 20px',
            background: isLoading ? 'var(--bg-elevated)' : 'var(--accent)',
            color: isLoading ? 'var(--text-muted)' : '#07090f',
            border: 'none', fontWeight: 700, fontSize: '0.82rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: 'var(--font-display)',
          }}>
            {isLoading ? (
              <span style={{
                width: '12px', height: '12px', border: '2px solid var(--text-dim)',
                borderTopColor: 'var(--accent)', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', display: 'inline-block',
              }} />
            ) : '→'} {isLoading ? 'Scanning...' : 'Rescan'}
          </button>
        </div>
      )}

      {/* ── Report ────────────────────────────────────────────────── */}
      {report && (
        <div style={{ animation: 'fadeUp 0.5s ease both' }}>
          <SummaryCards summary={report.summary} url={report.url} timestamp={report.timestamp} />
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