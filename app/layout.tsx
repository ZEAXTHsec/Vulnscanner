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
            --bg-card:       #0a1020;
            --bg-elevated:   #0e1628;
            --bg-hover:      #121d34;
            --border:        rgba(100,140,220,0.08);
            --border-mid:    rgba(100,140,220,0.13);
            --border-bright: rgba(100,140,220,0.24);
            --text:          #e8eef8;
            --text-sub:      #8096b8;
            --text-muted:    #4a5f7a;
            --text-dim:      #1e2d48;
            --accent:        #00d4aa;
            --accent-2:      #3b9eff;
            --accent-dim:    rgba(0,212,170,0.07);
            --accent-glow:   rgba(0,212,170,0.20);
            --blue:          #4da6ff;
            --blue-dim:      rgba(77,166,255,0.09);
            --red:           #ff4d6a;
            --red-dim:       rgba(255,77,106,0.09);
            --orange:        #ff8c42;
            --orange-dim:    rgba(255,140,66,0.09);
            --yellow:        #ffc94d;
            --yellow-dim:    rgba(255,201,77,0.09);
            --font-ui:       'DM Sans', -apple-system, sans-serif;
            --font-mono:     'JetBrains Mono', 'Fira Code', monospace;
            --radius:        10px;
            --radius-lg:     16px;
            --radius-xl:     22px;
            --shadow-card:   0 2px 20px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3);
            --shadow-glow:   0 0 32px rgba(0,212,170,0.14);
          }

          html {
            font-size: 16px;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }

          body {
            background: var(--bg);
            background-image:
              radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,100,200,0.13) 0%, transparent 60%),
              linear-gradient(rgba(100,140,220,0.022) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100,140,220,0.022) 1px, transparent 1px);
            background-size: auto, 52px 52px, 52px 52px;
            color: var(--text);
            font-family: var(--font-ui);
            font-size: 1rem;
            font-weight: 400;
            line-height: 1.65;
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