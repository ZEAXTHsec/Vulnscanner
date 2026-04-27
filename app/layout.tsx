import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ShieldScan — Free Website Security Scanner',
  description:
    'Instant security analysis for any website. Detect missing headers, XSS vulnerabilities, mixed content, DMARC issues, and more. Get AI-powered fix prompts tailored to your stack.',
  keywords: [
    'website security scanner',
    'free security audit',
    'HTTP security headers check',
    'DMARC checker',
    'XSS vulnerability scanner',
    'CSP checker',
    'web security analysis',
  ],
  openGraph: {
    title: 'ShieldScan — Free Website Security Scanner',
    description: 'Detect security vulnerabilities in under 10 seconds. 23 checks. AI-generated fixes. No account needed.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          :root {
            --bg:            #060b18;
            --bg-card:       #0b1122;
            --bg-elevated:   #101828;
            --bg-hover:      #141f36;
            --border:        rgba(100,140,220,0.12);
            --border-mid:    rgba(100,140,220,0.20);
            --border-bright: rgba(100,140,220,0.35);
            --text:          #edf2fc;
            --text-sub:      #92aacf;
            --text-muted:    #566d8c;
            --text-dim:      #243350;
            --accent:        #00d4aa;
            --accent-2:      #3b9eff;
            --accent-dim:    rgba(0,212,170,0.10);
            --accent-glow:   rgba(0,212,170,0.25);
            --blue:          #4da6ff;
            --blue-dim:      rgba(77,166,255,0.12);
            --red:           #ff4d6a;
            --red-dim:       rgba(255,77,106,0.12);
            --orange:        #ff8c42;
            --orange-dim:    rgba(255,140,66,0.12);
            --yellow:        #ffc94d;
            --yellow-dim:    rgba(255,201,77,0.12);
            --font-ui:       'DM Sans', -apple-system, sans-serif;
            --font-mono:     'JetBrains Mono', 'Fira Code', monospace;
            --radius:        12px;
            --radius-lg:     18px;
            --radius-xl:     24px;
            --shadow-card:   0 4px 32px rgba(0,0,0,0.6), 0 1px 6px rgba(0,0,0,0.4);
            --shadow-glow:   0 0 40px rgba(0,212,170,0.18);
          }

          html {
            font-size: 17px;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }

          body {
            background: var(--bg);
            background-image:
              radial-gradient(ellipse 90% 55% at 50% -8%, rgba(0,110,220,0.18) 0%, transparent 65%),
              linear-gradient(rgba(100,140,220,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100,140,220,0.04) 1px, transparent 1px);
            background-size: auto, 48px 48px, 48px 48px;
            color: var(--text);
            font-family: var(--font-ui);
            font-size: 1rem;
            font-weight: 400;
            line-height: 1.7;
            min-height: 100vh;
          }

          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(100,140,220,0.15); border-radius: 99px; }
          ::selection { background: rgba(0,212,170,0.2); color: var(--accent); }
          details > summary::-webkit-details-marker { display: none; }

          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes heroFadeUp {
            from { opacity: 0; transform: translateY(28px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes cardReveal {
            from { opacity: 0; transform: translateY(14px) scale(0.985); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes shimmer {
            0%   { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes scanLine {
            0%   { top: -2px; opacity: 0; }
            4%   { opacity: 0.9; }
            96%  { opacity: 0.9; }
            100% { top: calc(100% + 2px); opacity: 0; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.3; }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes badgePop {
            from { opacity: 0; transform: translateX(10px) scale(0.95); }
            to   { opacity: 1; transform: translateX(0)    scale(1); }
          }
          @keyframes glowPulse {
            0%, 100% { opacity: 0.3; }
            50%       { opacity: 0.7; }
          }
          @keyframes glowLine {
            0%, 100% { opacity: 0.4; }
            50%       { opacity: 1; }
          }
          @keyframes countUp {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes ringFill {
            from { stroke-dasharray: 0 999; }
          }
          @keyframes orbitSpin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}