import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ShieldScan — Instant Security Analysis',
  description: 'Find vulnerabilities in 30 seconds. AI-powered fixes for your stack.',
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
            /* Core backgrounds — deep navy, not pure black, for trust */
            --bg:            #060b18;
            --bg-card:       #0a1020;
            --bg-elevated:   #0e1628;
            --bg-hover:      #121d34;

            /* Borders */
            --border:        rgba(100,140,220,0.08);
            --border-mid:    rgba(100,140,220,0.13);
            --border-bright: rgba(100,140,220,0.22);

            /* Text — slightly warm white for readability */
            --text:          #e8eef8;
            --text-sub:      #7d92b5;
            --text-muted:    #455470;
            --text-dim:      #1e2d48;

            /* Primary accent — electric cyan (trust + tech) */
            --accent:        #00d4aa;
            --accent-2:      #3b9eff;
            --accent-dim:    rgba(0,212,170,0.07);
            --accent-glow:   rgba(0,212,170,0.20);

            /* Accent 2 — strong blue for links / info */
            --blue:          #4da6ff;
            --blue-dim:      rgba(77,166,255,0.09);

            /* Severity colours — higher contrast than before */
            --red:           #ff4d6a;
            --red-dim:       rgba(255,77,106,0.09);
            --orange:        #ff8c42;
            --orange-dim:    rgba(255,140,66,0.09);
            --yellow:        #ffc94d;
            --yellow-dim:    rgba(255,201,77,0.09);

            /* Typography */
            --font-ui:       'DM Sans', -apple-system, sans-serif;
            --font-mono:     'JetBrains Mono', 'Fira Code', monospace;

            /* Radii */
            --radius:        10px;
            --radius-lg:     16px;
            --radius-xl:     22px;

            /* Shadows */
            --shadow-card:   0 2px 16px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.3);
            --shadow-glow:   0 0 28px rgba(0,212,170,0.14);
          }

          html {
            font-size: 16px;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }

          body {
            background: var(--bg);
            /* Subtle grid texture for depth — not flat black */
            background-image:
              radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,100,200,0.12) 0%, transparent 60%),
              linear-gradient(rgba(100,140,220,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100,140,220,0.025) 1px, transparent 1px);
            background-size: auto, 48px 48px, 48px 48px;
            color: var(--text);
            font-family: var(--font-ui);
            font-size: 0.9rem;
            line-height: 1.65;
            min-height: 100vh;
          }

          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(100,140,220,0.15); border-radius: 99px; }
          ::selection { background: rgba(0,212,170,0.2); color: var(--accent); }

          /* ─── Animations ──────────────────────────────────── */

          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }

          @keyframes cardReveal {
            from { opacity: 0; transform: translateY(14px) scale(0.98); }
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

          @keyframes borderGlow {
            0%, 100% { opacity: 0.5; }
            50%       { opacity: 1; }
          }

          @keyframes countUp {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          @keyframes ringFill {
            from { stroke-dasharray: 0 999; }
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}