import ScanInput from '@/components/scanner/ScanInput'
import ScanHistory from '@/components/scanner/ScanHistory'

// ─── JSON-LD Schema ────────────────────────────────────────────────────────────
const schemaWebApp = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ShieldScan',
  url: 'https://shieldscan.app',
  description:
    'Free instant website security scanner. Detects 23 vulnerability classes including missing headers, XSS, mixed content, DMARC, and more. Get AI-generated fix prompts for your exact stack.',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: [
    'HTTP security header analysis',
    'Mixed content detection',
    'DMARC / SPF / email security checks',
    'XSS pattern detection',
    'Technology stack fingerprinting',
    'AI-generated fix prompts',
    'Subresource integrity checks',
    'Cookie security analysis',
  ],
})

const schemaFAQ = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is ShieldScan free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. ShieldScan runs 23 passive security checks on any public URL for free, with no account required.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does ShieldScan store my data?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Scan results are stored locally in your browser. No personal data is collected or shared.',
      },
    },
    {
      '@type': 'Question',
      name: 'What security checks does ShieldScan run?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ShieldScan runs 23 passive checks including HTTP security headers, HTTPS enforcement, mixed content, XSS patterns, DMARC/SPF records, cookie security, subresource integrity, CSP analysis, and technology stack detection.',
      },
    },
  ],
})

// ─── Icons ────────────────────────────────────────────────────────────────────
const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const PulseDot = () => (
  <span style={{
    display: 'inline-block', width: 7, height: 7,
    borderRadius: '50%', background: 'var(--accent)',
    animation: 'pulse 2s ease-in-out infinite',
    boxShadow: '0 0 8px var(--accent)',
  }} />
)

export default function Home() {
  return (
    <>
      {/* ── JSON-LD Schema ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaWebApp }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaFAQ }} />

      <style>{`
        /* ── Page-level animations ── */
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.018; }
          50%       { opacity: 0.038; }
        }
        @keyframes badgeFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes shimmerCard {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes borderRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes countPop {
          0%   { transform: scale(0.8); opacity: 0; }
          60%  { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes scanPing {
          0%   { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes glowLine {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }

        /* ── Feature cards ── */
        .feat-card {
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border-mid);
          border-radius: 20px;
          padding: 28px 26px 24px;
          overflow: hidden;
          cursor: default;
          transition:
            transform 0.28s cubic-bezier(0.22,1,0.36,1),
            border-color 0.28s ease,
            box-shadow 0.28s ease;
          animation: heroFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        .feat-card:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,212,170,0.07);
          border-color: var(--border-bright);
        }
        .feat-card::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 21px;
          background: linear-gradient(
            135deg,
            rgba(0,212,170,0.1) 0%,
            transparent 40%,
            transparent 60%,
            rgba(59,158,255,0.06) 100%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .feat-card:hover::before { opacity: 1; }

        /* ── Scan orbit ring ── */
        .orbit-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(0,212,170,0.15);
          animation: orbitSpin linear infinite;
        }

        /* ── Nav links ── */
        .nav-link {
          font-size: 0.8rem;
          color: var(--text-sub);
          text-decoration: none;
          padding: 5px 10px;
          border-radius: 8px;
          transition: color 0.18s, background 0.18s;
          font-weight: 500;
        }
        .nav-link:hover {
          color: var(--text);
          background: var(--bg-elevated);
        }

        /* ── Stats ticker ── */
        .stat-ticker {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-mid);
          border-radius: 999px;
          font-size: 0.73rem;
          color: var(--text-sub);
          font-family: var(--font-mono);
          white-space: nowrap;
        }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .hero-title { font-size: 2rem !important; }
          .hero-sub   { font-size: 0.95rem !important; }
          .feat-grid  { grid-template-columns: 1fr !important; }
          .trust-row  { flex-direction: column; align-items: flex-start !important; gap: 10px !important; }
          .nav-links  { display: none; }
          .stat-ticker { font-size: 0.65rem; }
          .feat-card  { padding: 22px 18px 20px; }
        }
        @media (max-width: 900px) {
          .feat-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* ──────── NAV ──────── */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 2rem', height: '54px',
          background: 'rgba(6,11,24,0.88)',
          backdropFilter: 'blur(28px)',
          borderBottom: '1px solid var(--border)',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent)', display: 'flex' }}><ShieldIcon /></span>
            <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.03em', color: 'var(--text)' }}>
              Shield<span style={{ color: 'var(--accent)' }}>Scan</span>
            </span>
            <span style={{
              marginLeft: '2px', padding: '2px 8px',
              background: 'var(--accent-dim)',
              border: '1px solid rgba(0,212,170,0.2)',
              borderRadius: '999px',
              fontSize: '0.58rem', fontWeight: 700,
              color: 'var(--accent)', letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>Beta</span>
          </div>

          {/* Nav links */}
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it works</a>
            <a href="#faq" className="nav-link">FAQ</a>
            <a href="/pricing" className="nav-link" style={{
              marginLeft: '8px',
              color: 'var(--accent)',
              background: 'var(--accent-dim)',
              border: '1px solid rgba(0,212,170,0.2)',
            }}>Pricing</a>
          </div>

          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <PulseDot />
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>live</span>
          </div>
        </nav>

        {/* ──────── MAIN ──────── */}
        <main style={{ flex: 1, padding: '0 1.5rem 6rem', maxWidth: '960px', margin: '0 auto', width: '100%' }}>

          {/* ── HERO ── */}
          <section style={{ padding: '72px 0 56px', textAlign: 'center', position: 'relative' }}>

            {/* Background radial glow */}
            <div style={{
              position: 'absolute',
              top: 0, left: '50%', transform: 'translateX(-50%)',
              width: '700px', height: '400px',
              background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,170,0.07) 0%, rgba(59,158,255,0.04) 40%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Eyebrow badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px',
              background: 'rgba(0,212,170,0.06)',
              border: '1px solid rgba(0,212,170,0.18)',
              borderRadius: '999px',
              marginBottom: '28px',
              animation: 'heroFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both',
              animationDelay: '0ms',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', boxShadow: '0 0 6px var(--accent)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                23 security checks · instant · free
              </span>
            </div>

            {/* H1 */}
            <h1
              className="hero-title"
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.4rem)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                color: 'var(--text)',
                marginBottom: '20px',
                animation: 'heroFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both',
                animationDelay: '60ms',
              }}
            >
              Is your website{' '}
              <span style={{
                color: 'var(--accent)',
                position: 'relative',
                display: 'inline-block',
              }}>
                actually secure?
                <span style={{
                  position: 'absolute',
                  bottom: '-4px', left: 0, right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                  animation: 'glowLine 2.5s ease-in-out infinite',
                }} />
              </span>
            </h1>

            {/* H2 sub */}
            <p
              className="hero-sub"
              style={{
                fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                color: 'var(--text-sub)',
                maxWidth: '560px',
                margin: '0 auto 40px',
                lineHeight: 1.7,
                fontWeight: 400,
                animation: 'heroFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both',
                animationDelay: '120ms',
              }}
            >
              Paste any URL and get a full security report in under 10 seconds.
              Headers, XSS, mixed content, email security, and more —
              with AI-generated fixes tailored to your exact stack.
            </p>

            {/* Trust stats row */}
            <div
              className="trust-row"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '12px', flexWrap: 'wrap', marginBottom: '48px',
                animation: 'heroFadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both',
                animationDelay: '180ms',
              }}
            >
              {[
                { val: '23', label: 'Security Checks' },
                { val: '<10s', label: 'Scan Time' },
                { val: '100%', label: 'Passive — Safe' },
                { val: 'Free', label: 'No Account Needed' },
              ].map(s => (
                <div key={s.label} className="stat-ticker">
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{s.val}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* ── SCAN INPUT ── */}
            <div style={{
              animation: 'heroFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both',
              animationDelay: '240ms',
            }}>
              <ScanInput />
            </div>
          </section>

          {/* ── FEATURE CARDS ── */}
          <section id="features" style={{ paddingBottom: '64px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{
                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                fontWeight: 800, letterSpacing: '-0.035em',
                color: 'var(--text)', marginBottom: '10px',
              }}>
                Everything a security audit checks —{' '}
                <span style={{ color: 'var(--accent)' }}>in seconds</span>
              </h2>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.65 }}>
                No plugins, no accounts, no waiting. ShieldScan runs a passive
                deep-scan from outside your server — exactly what attackers see.
              </p>
            </div>

            <div className="feat-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px',
            }}>

              {/* Card 1 — Threat Detection */}
              <div className="feat-card" style={{ animationDelay: '0ms', gridColumn: 'span 1' }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,77,106,0.6), transparent)',
                }} />
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: 'rgba(255,77,106,0.1)',
                  border: '1px solid rgba(255,77,106,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem', marginBottom: '16px',
                }}>🔍</div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                  Threat Detection
                </h3>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
                  Identifies critical vulnerabilities across 23 check categories — from active mixed content to exposed admin paths and SQL injection vectors.
                </p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['XSS', 'Headers', 'CORS', 'Injections'].map(t => (
                    <span key={t} style={{
                      fontSize: '0.65rem', fontWeight: 600, padding: '3px 8px',
                      background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.15)',
                      borderRadius: '999px', color: 'var(--red)', letterSpacing: '0.04em',
                    }}>{t}</span>
                  ))}
                </div>
              </div>

              {/* Card 2 — AI Fix Engine (wide card) */}
              <div className="feat-card" style={{ animationDelay: '70ms', gridColumn: 'span 2', background: 'linear-gradient(135deg, #0a1020 0%, #0a1525 100%)' }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(0,212,170,0.7), transparent)',
                }} />
                {/* Animated orbit rings */}
                <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', width: 100, height: 100, opacity: 0.35, pointerEvents: 'none' }}>
                  <div className="orbit-ring" style={{ inset: 0, animationDuration: '8s' }} />
                  <div className="orbit-ring" style={{ inset: 12, animationDuration: '5s', animationDirection: 'reverse', borderColor: 'rgba(59,158,255,0.2)' }} />
                  <div className="orbit-ring" style={{ inset: 26, animationDuration: '3s', borderColor: 'rgba(0,212,170,0.3)' }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem',
                  }}>🤖</div>
                </div>

                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: 'rgba(0,212,170,0.1)',
                  border: '1px solid rgba(0,212,170,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem', marginBottom: '16px',
                }}>⚡</div>
                <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                  AI-Powered Fix Engine
                </h3>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-sub)', lineHeight: 1.6, maxWidth: '340px' }}>
                  Every failed check ships with a ready-to-paste AI prompt. ShieldScan detects your stack — WordPress, Next.js, Laravel — and generates fixes for your exact environment.
                </p>
                <div style={{
                  marginTop: '18px', padding: '10px 14px',
                  background: 'rgba(0,212,170,0.05)',
                  border: '1px solid rgba(0,212,170,0.12)',
                  borderRadius: 10,
                  fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                  color: 'var(--accent)', lineHeight: 1.5,
                }}>
                  <span style={{ opacity: 0.5 }}>// stack-aware fix prompt</span><br/>
                  Add: <span style={{ color: 'var(--blue)' }}>Strict-Transport-Security</span>: max-age=31536000; includeSubDomains
                </div>
              </div>

              {/* Card 3 — Email Security */}
              <div className="feat-card" style={{ animationDelay: '140ms' }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(77,166,255,0.6), transparent)',
                }} />
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: 'rgba(77,166,255,0.1)',
                  border: '1px solid rgba(77,166,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem', marginBottom: '16px',
                }}>📧</div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                  Email Security
                </h3>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
                  Checks SPF, DKIM alignment, and DMARC policy. Soft-fail SPF and p=none DMARC leave your domain open to spoofing — we flag it.
                </p>
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {[
                    { label: 'SPF', ok: true },
                    { label: 'DMARC p=reject', ok: false },
                    { label: 'DKIM aligned', ok: true },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: item.ok ? 'var(--accent)' : 'var(--red)' }}>{item.ok ? '✓' : '✗'}</span>
                      <span style={{ color: item.ok ? 'var(--text-sub)' : 'var(--red)' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4 — Score & Grade */}
              <div className="feat-card" style={{ animationDelay: '210ms' }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,201,77,0.6), transparent)',
                }} />
                <div style={{
                  position: 'absolute', bottom: 16, right: 16, opacity: 0.06,
                  fontFamily: 'var(--font-mono)', fontSize: '5rem', fontWeight: 700,
                  color: 'var(--accent)', lineHeight: 1, pointerEvents: 'none',
                  userSelect: 'none',
                }}>A</div>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: 'rgba(255,201,77,0.1)',
                  border: '1px solid rgba(255,201,77,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem', marginBottom: '16px',
                }}>📊</div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                  0–100 Security Score
                </h3>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
                  Penalty-based scoring calibrated against real-world sites. Critical failures deduct 12 points, medium 6, low 2. No surprise zeros.
                </p>
              </div>

              {/* Card 5 — Stack Detection */}
              <div className="feat-card" style={{ animationDelay: '280ms' }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,140,66,0.5), transparent)',
                }} />
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: 'rgba(255,140,66,0.1)',
                  border: '1px solid rgba(255,140,66,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem', marginBottom: '16px',
                }}>🧬</div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                  Stack Fingerprinting
                </h3>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
                  Detects CMS, framework, hosting, CDN, and JS libraries from headers and HTML — so every fix prompt speaks your language.
                </p>
                <div style={{ marginTop: '14px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {['WordPress', 'Next.js', 'Laravel', 'Vercel', 'Cloudflare'].map(t => (
                    <span key={t} style={{
                      fontSize: '0.63rem', fontWeight: 600, padding: '2px 8px',
                      background: 'rgba(255,140,66,0.07)', border: '1px solid rgba(255,140,66,0.15)',
                      borderRadius: '999px', color: 'var(--orange)',
                    }}>{t}</span>
                  ))}
                </div>
              </div>

            </div>
          </section>

          {/* ── HOW IT WORKS ── */}
          <section id="how-it-works" style={{ paddingBottom: '64px' }}>
            <h2 style={{
              textAlign: 'center',
              fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
              fontWeight: 800, letterSpacing: '-0.03em',
              color: 'var(--text)', marginBottom: '40px',
            }}>
              How it works
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', position: 'relative' }}>
              {/* Vertical line */}
              <div style={{
                position: 'absolute', left: 21, top: 24, bottom: 24,
                width: '1px',
                background: 'linear-gradient(to bottom, var(--accent), rgba(59,158,255,0.5), transparent)',
                opacity: 0.3,
              }} />
              {[
                { n: '01', title: 'Paste any URL', body: 'Enter a domain or full URL — no account, no install, no setup. Works on any public-facing website.', color: 'var(--accent)' },
                { n: '02', title: 'We fetch and analyse', body: 'ShieldScan fetches your page server-side, reads HTTP headers, scans the HTML, and checks DNS records for email security.', color: 'var(--blue)' },
                { n: '03', title: 'Get your report in seconds', body: 'A scored report with every finding categorised by severity, plus one-click AI fix prompts for your exact tech stack.', color: 'var(--orange)' },
              ].map(step => (
                <div key={step.n} style={{
                  display: 'flex', gap: '20px', alignItems: 'flex-start',
                  padding: '20px 24px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: '10px',
                }}>
                  <div style={{
                    flexShrink: 0,
                    width: 42, height: 42, borderRadius: '50%',
                    background: `${step.color}12`,
                    border: `1px solid ${step.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700,
                    color: step.color,
                  }}>{step.n}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: '0.83rem', color: 'var(--text-sub)', lineHeight: 1.65 }}>
                      {step.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── SCAN HISTORY ── */}
          <ScanHistory />

          {/* ── FAQ ── */}
          <section id="faq" style={{ paddingBottom: '64px' }}>
            <h2 style={{
              textAlign: 'center',
              fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
              fontWeight: 800, letterSpacing: '-0.03em',
              color: 'var(--text)', marginBottom: '32px',
            }}>
              Frequently asked questions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { q: 'Is ShieldScan free to use?', a: 'Yes. All 23 checks run for free on any public URL with no account or sign-up required. A Pro plan with deeper scanning and team features is coming soon.' },
                { q: 'Will scanning my site cause any disruption?', a: 'No. ShieldScan only makes a single HTTP GET request — the same as a browser visit. It never modifies your site, never sends login attempts, and never triggers alerts.' },
                { q: 'What does the score mean?', a: 'The score starts at 100. Each failed check deducts points based on severity: Critical (−12), Medium (−6), Low (−2). A score above 80 is good. Informational checks don\'t affect the score.' },
                { q: 'How are the AI fix prompts generated?', a: 'Each check includes a pre-written, stack-aware prompt you can paste into any AI assistant. ShieldScan detects your CMS, framework, and server from the scan so the fix is specific to your setup.' },
              ].map(item => (
                <details key={item.q} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '0',
                  overflow: 'hidden',
                }}>
                  <summary style={{
                    padding: '16px 20px',
                    fontWeight: 600, fontSize: '0.9rem',
                    color: 'var(--text)', cursor: 'pointer',
                    letterSpacing: '-0.015em',
                    listStyle: 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    {item.q}
                    <span style={{ color: 'var(--accent)', fontSize: '1rem', flexShrink: 0, marginLeft: 12 }}>+</span>
                  </summary>
                  <div style={{
                    padding: '0 20px 16px',
                    fontSize: '0.83rem', color: 'var(--text-sub)', lineHeight: 1.7,
                  }}>{item.a}</div>
                </details>
              ))}
            </div>
          </section>

        </main>

        {/* ──────── FOOTER ──────── */}
        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '1.5rem 2rem',
        }}>
          <div style={{
            maxWidth: '960px', margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span style={{ color: 'var(--accent)', display: 'flex' }}><ShieldIcon /></span>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '-0.02em', color: 'var(--text-sub)' }}>
                Shield<span style={{ color: 'var(--accent)' }}>Scan</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {['Privacy', 'Terms', 'Pricing', 'Contact'].map(l => (
                <a key={l} href={`/${l.toLowerCase()}`} style={{
                  fontSize: '0.75rem', color: 'var(--text-muted)',
                  textDecoration: 'none', transition: 'color 0.15s',
                }}>{l}</a>
              ))}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              © 2025 ShieldScan · 23 checks · passive · no data stored
            </span>
          </div>
        </footer>

      </div>
    </>
  )
}