// lib/checks/exposed-files.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'
import { fetchPath } from '@/lib/scanner/fetcher'
import { exposedFilesHighPrompt, exposedFilesMediumPrompt } from '@/lib/utils/fix-prompts'

const EXPOSED_FILE_PATHS: {
  path: string
  label: string
  severity: 'high' | 'medium' | 'low'
  contentSignal?: RegExp
  // Secondary signal — BOTH must match for high-confidence PHP files
  // to avoid matching generic error pages that contain one stray "$" or "<?".
  secondarySignal?: RegExp
}[] = [
  { path: '/.git/HEAD',           label: '.git directory',             severity: 'high',   contentSignal: /^ref: refs\//m },
  { path: '/.git/config',         label: '.git config',                severity: 'high',   contentSignal: /\[core\]/i },
  { path: '/.svn/entries',        label: '.svn directory',             severity: 'high',   contentSignal: /svn|working copy/i },
  { path: '/.env',                label: '.env file',                  severity: 'high',   contentSignal: /^[A-Z_]+=.+/m },
  { path: '/.env.local',          label: '.env.local',                 severity: 'high',   contentSignal: /^[A-Z_]+=.+/m },
  { path: '/.env.production',     label: '.env.production',            severity: 'high',   contentSignal: /^[A-Z_]+=.+/m },

  // PHP files — require BOTH a PHP open tag AND a meaningful PHP construct
  // to avoid matching Next.js/Vercel error pages that echo back the path
  {
    path: '/config.php',
    label: 'config.php',
    severity: 'high',
    contentSignal: /<\?php/i,
    secondarySignal: /\$(?:db|host|user|pass|database|config|conn)\s*=/i,
  },
  {
    path: '/configuration.php',
    label: 'configuration.php (Joomla)',
    severity: 'high',
    contentSignal: /<\?php/i,
    secondarySignal: /class\s+JConfig|var\s+\$(?:db|host|secret|password)/i,
  },
  {
    path: '/test.php',
    label: 'test.php',
    severity: 'low',
    contentSignal: /<\?php/i,
    secondarySignal: /phpinfo\s*\(|echo\s+['"]|var_dump/i,
  },
  {
    path: '/phpinfo.php',
    label: 'phpinfo() exposed',
    severity: 'high',
    contentSignal: /PHP Version/i,
    secondarySignal: /phpinfo|php\.ini/i,
  },
  {
    path: '/info.php',
    label: 'PHP info page',
    severity: 'high',
    contentSignal: /PHP Version/i,
    secondarySignal: /phpinfo|php\.ini/i,
  },

  { path: '/config.yml',          label: 'config.yml',                 severity: 'high',   contentSignal: /^[a-z_]+:\s+.+/m },
  { path: '/config.json',         label: 'config.json',                severity: 'high',   contentSignal: /^\s*[{[]/m },
  { path: '/database.yml',        label: 'database.yml',               severity: 'high',   contentSignal: /adapter:|database:|password:/i },
  { path: '/composer.json',       label: 'composer.json',              severity: 'medium', contentSignal: /"require"|"name"/i },
  { path: '/composer.lock',       label: 'composer.lock',              severity: 'medium', contentSignal: /"packages"/i },
  { path: '/package.json',        label: 'package.json',               severity: 'medium', contentSignal: /"dependencies"|"scripts"|"name"/i },
  { path: '/package-lock.json',   label: 'package-lock.json',          severity: 'low',    contentSignal: /"lockfileVersion"/i },
  { path: '/Gemfile',             label: 'Gemfile',                    severity: 'medium', contentSignal: /^source |^gem /m },
  { path: '/requirements.txt',    label: 'requirements.txt',           severity: 'low',    contentSignal: /^[a-zA-Z][\w\-]+(==|>=|<=|~=)/m },
  { path: '/backup.zip',          label: 'backup.zip',                 severity: 'high',   contentSignal: /^PK/ },
  { path: '/backup.sql',          label: 'backup.sql',                 severity: 'high',   contentSignal: /CREATE TABLE|INSERT INTO/i },
  { path: '/db.sql',              label: 'db.sql',                     severity: 'high',   contentSignal: /CREATE TABLE|INSERT INTO/i },
  { path: '/dump.sql',            label: 'dump.sql',                   severity: 'high',   contentSignal: /CREATE TABLE|INSERT INTO/i },
  { path: '/site.zip',            label: 'site.zip',                   severity: 'high',   contentSignal: /^PK/ },
  { path: '/wp-config.php.bak',   label: 'wp-config backup',           severity: 'high',   contentSignal: /DB_NAME|DB_PASSWORD/i },
  // Log files — require actual log-format patterns (timestamps, IP addresses,
  // HTTP method strings) not just the words "error" or "debug", which match
  // any error page that Cloudflare/Vercel/Next.js returns for missing paths.
  {
    path: '/error.log',
    label: 'error.log',
    severity: 'medium',
    // Must look like an actual log line: timestamp bracket OR IP + HTTP method
    contentSignal: /\[\d{4}-\d{2}-\d{2}|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}.+(GET|POST|PUT|DELETE)|PHP (Fatal|Warning|Notice|Parse) error/i,
  },
  {
    path: '/access.log',
    label: 'access.log',
    severity: 'medium',
    // Apache/Nginx combined log format: IP - - [date] "METHOD /path HTTP/x.x" status
    contentSignal: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}.+\[.+\].+"(GET|POST|HEAD|PUT|DELETE) \//i,
  },
  {
    path: '/debug.log',
    label: 'debug.log',
    severity: 'medium',
    // Require timestamped debug entries — [YYYY-MM-DD or [timestamp] prefix
    contentSignal: /\[\d{4}-\d{2}-\d{2}|^\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}/m,
  },
  { path: '/php_errors.log',      label: 'php_errors.log',             severity: 'medium', contentSignal: /PHP (Fatal|Warning|Notice|Parse)/i },
  { path: '/wp-json/wp/v2/users', label: 'WordPress user enumeration', severity: 'medium', contentSignal: /"slug"|"name"|"id"/ },
  { path: '/xmlrpc.php',          label: 'WordPress XML-RPC',          severity: 'medium', contentSignal: /XML-RPC server accepts POST|xmlrpc/i },
  { path: '/.DS_Store',           label: '.DS_Store',                  severity: 'low',    contentSignal: /Bud1/ },
  { path: '/.idea/workspace.xml', label: 'JetBrains IDE files',        severity: 'low',    contentSignal: /<project|<component/i },
  { path: '/.vscode/settings.json', label: 'VS Code settings',         severity: 'low',    contentSignal: /\{[\s\S]*"[\w.]+"\s*:/ },
]

export const exposedFilesCheck: Check = {
  id: 'exposed-files',
  name: 'Exposed Sensitive Files',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []

    // Fetch homepage fingerprint for soft-404 detection
    let homepageFingerprint = ''
    try {
      const home = await fetchPath(ctx.url, '/')
      homepageFingerprint = home.html.slice(0, 500)
    } catch { /* skip */ }

    const exposed: { path: string; label: string; severity: string }[] = []

    await Promise.all(
      EXPOSED_FILE_PATHS.map(async ({ path, label, severity, contentSignal, secondarySignal }) => {
        try {
          const res = await fetchPath(ctx.url, path)
          if (res.statusCode !== 200) return

          const body = res.html

          // Reject soft-404s — body matches homepage
          if (homepageFingerprint && body.slice(0, 500) === homepageFingerprint) return

          // Reject generic error pages
          if (/404|not found|page not found|does not exist/i.test(body.slice(0, 300))) return

          // Require primary content signal
          if (contentSignal && !contentSignal.test(body)) return

          // Require secondary signal if defined (double-confirmation for PHP files)
          if (secondarySignal && !secondarySignal.test(body)) return

          exposed.push({ path, label, severity })
        } catch { /* not accessible */ }
      })
    )

    if (exposed.length === 0) {
      results.push({
        checkId: 'exposed-files-ok',
        name: 'No Exposed Sensitive Files',
        severity: 'info',
        status: 'pass',
        detail: `Checked ${EXPOSED_FILE_PATHS.length} common sensitive file paths — none accessible.`,
        score: 0,
      })
      return results
    }

    const highSeverity = exposed.filter((e) => e.severity === 'high')
    const others = exposed.filter((e) => e.severity !== 'high')

    if (highSeverity.length > 0) {
      results.push({
        checkId: 'exposed-files-critical',
        name: 'Critical Files Exposed',
        severity: 'high',
        status: 'fail',
        detail: `High-risk files are publicly accessible: ${highSeverity.map((e) => e.label).join(', ')}. An attacker can download these right now to extract credentials, API keys, or source code.`,
        fix: 'Block access to these files immediately via .htaccess or nginx config. Rotate any credentials that may have been exposed.',
        fixPrompt: exposedFilesHighPrompt(ctx.stack),
        score: 10,
        raw: { exposed: highSeverity },
      })
    }

    if (others.length > 0) {
      results.push({
        checkId: 'exposed-files-medium',
        name: 'Sensitive Files Accessible',
        severity: others[0].severity as 'medium' | 'low',
        status: 'fail',
        detail: `Accessible files: ${others.map((e) => e.label).join(', ')}. These reveal your dependency versions and tech stack, helping attackers identify known CVEs.`,
        fix: 'Restrict access to config and dependency files via server config.',
        fixPrompt: exposedFilesMediumPrompt(ctx.stack),
        score: 3,
        raw: { exposed: others },
      })
    }

    return results
  },
}