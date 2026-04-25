# ShieldScan — Codebase Guide

> **What it is:** ShieldScan (branded "ShieldScan") is a **Next.js web app** that performs automated, passive security scans on any public URL. A user enters a URL, the app fetches the target page server-side, runs 23 security checks against the headers and HTML, computes a 0–100 security score, and displays categorised findings with AI-generated fix prompts. Scan results are saved to Supabase for history.

---

## Tech Stack at a Glance

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Inline CSS + CSS variables (no Tailwind used) |
| Database | Supabase (Postgres) via `@supabase/supabase-js` |
| DNS resolution | Cloudflare DNS-over-HTTPS (1.1.1.1) |
| Deployment target | Vercel (9 s scan timeout matches Vercel's 10 s limit) |

---

## Directory Structure

```
vuln-scanner/
├── app/
│   ├── layout.tsx              # Root HTML shell, global CSS variables, fonts
│   ├── page.tsx                # Home page — nav, mounts ScanInput + ScanHistory
│   └── api/scan/
│       └── route.ts            # POST /api/scan — the single API endpoint
│
├── components/scanner/
│   ├── ScanInput.tsx           # URL input form + results view (main UI)
│   ├── ResultsTable.tsx        # Full findings table with severity filters
│   ├── SummaryCards.tsx        # Score ring + high/medium/low/passed counts
│   ├── TopIssues.tsx           # Top 3 critical issues shown above the table
│   ├── FixAllBanner.tsx        # "Fix All" AI prompt aggregation banner
│   ├── ScanHistory.tsx         # Previous scans list from localStorage
│   ├── TechBadges.tsx          # Detected stack badges (Next.js, Nginx, etc.)
│   └── TrustSignals.tsx        # "23 checks · no data stored" footer badges
│
├── components/ui/
│   ├── Badge.tsx               # Reusable coloured badge pill
│   ├── Card.tsx                # Reusable card wrapper
│   └── Spinner.tsx             # Loading spinner
│
├── hooks/
│   └── useScan.ts              # React hook — scan state machine + API call
│
├── store/
│   └── index.ts                # Pub/sub in-memory store, synced to localStorage
│
├── lib/
│   ├── types.ts                # All shared TypeScript interfaces
│   ├── constants.ts            # SCAN_CONFIG, severity scores, sensitive paths
│   ├── supabase.ts             # Supabase client singleton
│   │
│   ├── scanner/
│   │   ├── fetcher.ts          # HTTP fetcher (with timeout + redirect follow)
│   │   ├── runner.ts           # Orchestrates all checks + computes score
│   │   ├── save-scan.ts        # Persists ScanReport to Supabase
│   │   └── context.ts          # (placeholder for future context extensions)
│   │
│   ├── checks/
│   │   ├── index.ts            # Master list — imports + exports all 23 checks
│   │   ├── https.ts            # HTTPS enforcement
│   │   ├── ssl-cert.ts         # SSL/TLS certificate presence
│   │   ├── mixed-content.ts    # HTTP resources loaded on HTTPS pages
│   │   ├── headers.ts          # Security headers (X-Frame-Options, XCTO, Referrer-Policy)
│   │   ├── csp-deep.ts         # Deep CSP analysis (unsafe-inline, missing directives)
│   │   ├── cors.ts             # CORS wildcard + credential misconfiguration
│   │   ├── cookies.ts          # Cookie flags (HttpOnly, Secure, SameSite)
│   │   ├── secrets.ts          # API keys / tokens leaked in HTML
│   │   ├── exposed-files.ts    # Sensitive paths (.env, .git, phpinfo.php, etc.)
│   │   ├── open-dirs.ts        # Admin panels, API endpoints, directory listings
│   │   ├── injection.ts        # CSRF, eval(), innerHTML, document.write()
│   │   ├── xss.ts              # DOM XSS sinks, javascript: hrefs, postMessage gaps
│   │   ├── sqli.ts             # SQL error patterns in HTML (not wired in — see note)
│   │   ├── redirects.ts        # Open redirect parameters in links
│   │   ├── subresources.ts     # Third-party scripts without SRI (integrity=)
│   │   ├── robots.ts           # robots.txt — disallowed path exposure
│   │   ├── permissions.ts      # Permissions-Policy header
│   │   ├── rate-limit.ts       # Rate-limit headers + CAPTCHA detection
│   │   ├── dns.ts              # Server header version leakage
│   │   ├── tech-detect.ts      # Technology fingerprinting (framework, CDN, CMS)
│   │   ├── infrastructure.ts   # CDN/WAF detection + server info leakage
│   │   ├── email-security.ts   # SPF, DKIM, DMARC DNS records
│   │   └── subdomain-takeover.ts # Dangling CNAME / unclaimed service fingerprints
│   │
│   └── utils/
│       ├── detect-stack.ts     # Detects framework, hosting, web server from headers+HTML
│       └── fix-prompts.ts      # Stack-aware AI fix prompt strings per vulnerability type
│
├── .env.local                  # NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## How a Scan Works — End to End

```
User enters URL
      │
      ▼
hooks/useScan.ts          normalises URL → POST /api/scan
      │
      ▼
app/api/scan/route.ts     validates URL format/protocol
      │
      ├─► lib/scanner/fetcher.ts    fetches target page (10 s timeout, follows redirects)
      │
      ├─► lib/utils/detect-stack.ts detects framework / hosting / web server
      │
      ├─► lib/scanner/runner.ts     runs all 23 checks with concurrency limit of 4
      │         │
      │         └─► lib/checks/*.ts  each check returns ScanResult[]
      │
      ├─► lib/scanner/runner.ts     computeSummary() → score = max(0, 100 − penalties)
      │
      ├─► lib/scanner/save-scan.ts  saves to Supabase (non-blocking, fire-and-forget)
      │
      └─► NextResponse.json(report) → client
                │
                ▼
      store/index.ts        addReport() → persisted to localStorage
                │
                ▼
      components/scanner/   renders SummaryCards, TopIssues, ResultsTable, FixAllBanner
```

---

## File-by-File Reference

### `app/layout.tsx`
Root HTML shell. Loads Space Grotesk + Space Mono fonts from Google Fonts. Defines all global CSS custom properties (colour palette, typography scale) used throughout the app via inline `<style>`. No global stylesheet file — everything lives here.

---

### `app/page.tsx`
Home page component. Renders the sticky nav bar (logo, "live" indicator), the `<main>` area (mounts `ScanInput` and `ScanHistory`), and the footer. No logic — pure layout.

---

### `app/api/scan/route.ts`
The **only API endpoint**. Accepts `POST { url: string }`.

Key behaviours:
- Validates URL is a string and parses to a valid `http:`/`https:` URL
- Races the full scan against a **9-second timeout** (Vercel's limit is 10 s)
- Calls `fetchTarget → detectStack → runScan`
- Saves to Supabase asynchronously (a failure here does NOT fail the scan response)
- Returns `Cache-Control: no-store` to prevent Next.js from caching scan results

---

### `lib/types.ts`
Single source of truth for all TypeScript types:

| Type | Purpose |
|---|---|
| `ScanResult` | One finding: checkId, name, severity, status, detail, fix, fixPrompt, score |
| `ScanContext` | Input to every check: url, html, headers, statusCode, stack |
| `ScanReport` | Full output: scanId, url, timestamp, results[], summary |
| `ScanSummary` | Aggregated counts + overall score |
| `Check` | Interface every check module must implement: `{ id, name, phase, run }` |
| `FetchResult` | Raw output of `fetchTarget` |

---

### `lib/constants.ts`
Central configuration:
- `FETCH_TIMEOUT_MS`: 10,000 ms
- `MAX_CONCURRENT_CHECKS`: 4 (concurrency cap in runner)
- `USER_AGENT`: `VulnScanner/1.0 (security-audit-bot)`
- `SENSITIVE_PATHS`: list of paths probed for exposed file checks
- `SEVERITY_SCORE` and `SCORE_PENALTIES`: scoring weights (note: runner.ts has its own inline penalty table which takes precedence)

---

### `lib/supabase.ts`
Creates and exports a single Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`.

---

### `lib/scanner/fetcher.ts`
`fetchTarget(url)` — fetches a URL with:
- AbortController-based timeout (10 s)
- `redirect: 'follow'` (follows HTTP → HTTPS redirects)
- Returns normalised lowercase headers, raw HTML, status code, and error string if failed

`fetchPath(baseUrl, path)` — helper used by `exposed-files.ts`, `open-dirs.ts`, and `robots.ts` to probe paths relative to the base origin (e.g. `https://example.com/.env`).

---

### `lib/scanner/runner.ts`
Core scan orchestrator.

`runWithConcurrency(ctx, limit)` — processes the checks array with a worker-pool pattern. Runs up to 4 checks simultaneously. A check that throws is recorded as `status: 'skip'`.

`computeSummary(results)` — penalty-based scoring:
- Starts at 100
- Deducts 12 per high-severity fail, 6 per medium, 2 per low
- `info` findings do not affect the score either way
- Clamps to 0 minimum

`runScan(ctx)` — the exported entry point. Runs all checks, computes summary, returns a `ScanReport`.

---

### `lib/scanner/save-scan.ts`
Inserts a completed `ScanReport` into the `scans` Supabase table. Called fire-and-forget from the API route — a DB failure is logged but never surfaces to the user.

---

### `lib/scanner/context.ts`
Currently a placeholder file (empty export). Reserved for future shared context utilities.

---

### `lib/utils/detect-stack.ts`
Analyses HTTP headers and HTML to detect:
- **Framework**: Next.js, Nuxt, Remix, Express, Laravel, Django, Rails, WordPress
- **Hosting**: Vercel, Netlify, Cloudflare, AWS
- **Web server**: Nginx, Apache, IIS

Called once before checks run. The result (`DetectedStack`) is stored on `ScanContext.stack` and passed to fix-prompt generators so suggestions are specific to the detected platform.

---

### `lib/utils/fix-prompts.ts`
Contains ~15 functions that return AI-ready prompt strings, one per vulnerability type. Each prompt is written to be pasted into ChatGPT or Claude and produce a copy-paste-ready fix. Stack hint (framework, hosting, web server) is prepended automatically so the generated code is relevant to the user's actual setup.

Examples: `cspMissingPrompt`, `corsWildcardPrompt`, `dmarcMissingPrompt`, `xFrameOptionsPrompt`.

---

### `lib/checks/index.ts`
Imports all check modules and exports the `checks: Check[]` array in the order they run. **sqli.ts exists but is intentionally not included here** — its functionality overlaps with `injection.ts` and `xss.ts`.

---

## The 23 Security Checks

| File | Check Name | What It Tests | Phase |
|---|---|---|---|
| `https.ts` | HTTPS Enforcement | Whether the URL uses `https://` | passive |
| `ssl-cert.ts` | SSL Certificate | SSL presence; HSTS header age and preload | passive |
| `mixed-content.ts` | Mixed Content | HTTP resources (`<script>`, `<img>`, `<iframe>`) on an HTTPS page | passive |
| `secrets.ts` | Secrets in HTML | Stripe keys, AWS keys, GitHub tokens, Firebase keys, Bearer tokens, private key blocks | passive |
| `cookies.ts` | Cookie Security | Missing `HttpOnly`, `Secure`, `SameSite` flags on `Set-Cookie` | passive |
| `headers.ts` | Security Headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy; server header version leak | passive |
| `csp-deep.ts` | CSP Deep Analysis | Missing CSP, `unsafe-inline`, `unsafe-eval`, missing `upgrade-insecure-requests`, overly permissive `default-src` | passive |
| `cors.ts` | CORS Policy | `Access-Control-Allow-Origin: *` with/without credentials | passive |
| `injection.ts` | Injection Surface | Forms without CSRF tokens, `eval()`, `innerHTML`, `document.write()` in inline scripts | passive |
| `xss.ts` | DOM XSS | `javascript:` hrefs, `location.hash` sinks, `postMessage` without origin check, prototype pollution, `srcdoc` usage | passive |
| `exposed-files.ts` | Exposed Files | Probes `.git`, `.env`, `.svn`, `phpinfo.php`, `wp-config.php`, `backup.sql`, `composer.json`, etc. | active |
| `tech-detect.ts` | Tech Detection | Fingerprints Nginx, Apache, Cloudflare, Next.js, WordPress, Shopify, React, Vue, etc. | passive |
| `open-dirs.ts` | Open Directories | Probes `/admin`, `/phpmyadmin`, `/api/debug`, `/actuator`, `/console`, `/wp-login.php` | active |
| `permissions.ts` | Permissions Policy | Missing `Permissions-Policy` header; missing Feature-Policy fallback | passive |
| `forms.ts` | Form Security | Password fields without `autocomplete` attribute; forms posting over HTTP | passive |
| `redirects.ts` | Open Redirects | Links with unvalidated redirect params (`?redirect=`, `?next=`, `?url=`, etc.) | passive |
| `subresources.ts` | Subresource Integrity | External `<script>` and `<link>` tags without `integrity=` attribute | passive |
| `robots.ts` | Robots.txt | Fetches `/robots.txt`; flags if `Disallow` paths expose sensitive routes | passive |
| `rate-limit.ts` | Rate Limiting | Checks for rate-limit headers; detects login/contact forms without CAPTCHA | passive |
| `dns.ts` | DNS & Headers | Server header leaking version/software name | passive |
| `infrastructure.ts` | Infrastructure | CDN/WAF presence; server software/version exposure; debug headers | passive |
| `email-security.ts` | Email Security | Queries Cloudflare DoH for SPF, DKIM (`_domainkey`), and DMARC TXT records | active |
| `subdomain-takeover.ts` | Subdomain Takeover | Fingerprints unclaimed service pages (GitHub Pages, Heroku, Netlify, Vercel, S3, Azure); dangling CNAME via Node `dns` module | active |

> **Active vs Passive:** Passive checks analyse the already-fetched HTML/headers. Active checks make additional HTTP or DNS requests.

> **sqli.ts** exists but is **not wired in**. It detects SQL error messages leaked in page HTML (MySQL syntax errors, ORA- codes, PDO SQLSTATE, etc.) — a passive approach that does not send payloads.

---

### `hooks/useScan.ts`
Custom React hook that owns all scan state. Implements a simple state machine:

```
idle → loading → success | error
```

- Normalises the URL (prepends `https://` if no protocol)
- POSTs to `/api/scan`
- On success: calls `addReport()` to persist to store + localStorage
- Exposes: `state`, `scan(url)`, `reset()`, `isLoading`, `report`, `error`

---

### `store/index.ts`
Lightweight pub/sub store (no Redux, no Zustand). Keeps the last 20 `ScanReport` objects in memory, synchronised to `localStorage` under `vuln_scanner_history`.

API: `initStore()`, `addReport(report)`, `getHistory()`, `clearHistory()`, `subscribe(fn)`.

Deduplicates by `scanId` to prevent hot-reload double-writes.

---

## UI Components

### `components/scanner/ScanInput.tsx`
The main UI component. Uses `useScan` hook. Handles:
- URL input field + scan button
- Loading state (spinner)
- Error display
- On success: renders `SummaryCards`, `TechBadges`, `TrustSignals`, `TopIssues`, `FixAllBanner`, `ResultsTable`

### `components/scanner/SummaryCards.tsx`
Displays the circular score ring (colour-coded: green ≥ 80, yellow ≥ 50, red < 50) and four count cards: High / Medium / Low / Passed.

### `components/scanner/TopIssues.tsx`
Highlights the top 3 failing results sorted by severity (high first). Each shows an icon, description, and a one-line fix hint.

### `components/scanner/ResultsTable.tsx`
Full findings table with tab-based filtering (All / High / Medium / Low / Passed). Each failing row expands to show the detail, a fix description, and a "Copy AI Prompt" button (copies `fixPrompt` to clipboard).

### `components/scanner/FixAllBanner.tsx`
Aggregates all `fixPrompt` strings from failing checks into a single combined prompt. "Copy All Fixes" lets the user paste one mega-prompt into an AI assistant to address every issue at once.

### `components/scanner/ScanHistory.tsx`
Reads from `store/index.ts` and renders the last 20 scans with URL, score badge, and timestamp. Clicking a previous scan is a re-scan trigger.

### `components/scanner/TechBadges.tsx`
Renders colour-coded pill badges for detected technologies (framework, hosting, CDN, CMS, etc.).

### `components/scanner/TrustSignals.tsx`
Footer row of trust indicators: "23 security checks", scan time, "no data stored" disclaimer.

---

## Scoring Formula

```
score = max(0, 100 − Σ penalties)

Penalty per failing result:
  high   → −12 points
  medium → −6 points
  low    → −2 points
  info   →  0 points (informational, not scored)
```

Passing checks and informational checks do not add points — only failures deduct.

Reference scores:
- Well-configured site (0H, 1M, 2L): ~90
- chatgpt.com (1H, 3M, 4L): ~62
- Poorly configured site (3H, 8M, 8L): ~0

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Set in `.env.local`. The scan runs fine without Supabase — save failures are logged and swallowed.

---

## Notes & Quirks

- **sqli.ts is present but unused.** The file exists under `lib/checks/` but is not imported in `index.ts`. The comment in `index.ts` explains this is intentional — SQL injection is covered by `injection.ts` and `xss.ts`.
- **Concurrency is capped at 4.** The runner uses a worker-pool pattern; no more than 4 checks run in parallel to avoid hammering the target or hitting serverless memory limits.
- **Vercel 9 s timeout.** The API route races the scan against 9,000 ms and returns a clean 504 error rather than a silent gateway timeout.
- **Email checks use Cloudflare DoH**, not Node's `dns` module, because the Node DNS APIs are not available in Next.js serverless/edge runtimes.
- **Subdomain takeover uses Node DNS** via `import { promises as dns } from 'dns'` — this works in standard serverless but would fail in edge runtime.
- **No Tailwind in use.** Despite `tailwind.config.ts` existing in the project, all styling is done with inline style objects and CSS variables defined in `layout.tsx`.
