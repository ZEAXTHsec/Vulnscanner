// lib/checks/sqli.ts
// Passive SQLi signal detection — identifies patterns in HTML source that suggest
// SQL errors, raw query exposure, or unsafe input handling. Does NOT send payloads.

import { Check, ScanContext, ScanResult } from '@/lib/types'
import { sqliErrorLeakPrompt, sqliParamPrompt } from '@/lib/utils/fix-prompts'

// SQL error messages leaked in page output
const SQL_ERROR_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /you have an error in your sql syntax/i, label: 'MySQL syntax error' },
  { pattern: /warning: mysql_/i, label: 'MySQL PHP warning' },
  { pattern: /unclosed quotation mark after the character string/i, label: 'MSSQL syntax error' },
  { pattern: /quoted string not properly terminated/i, label: 'Oracle syntax error' },
  { pattern: /pg_query\(\).*error/i, label: 'PostgreSQL query error' },
  { pattern: /supplied argument is not a valid (mysql|pg)/i, label: 'DB argument error' },
  { pattern: /ORA-\d{4,5}:/i, label: 'Oracle ORA error code' },
  { pattern: /Microsoft OLE DB Provider for SQL Server/i, label: 'MSSQL OLE DB error' },
  { pattern: /SQLSTATE\[\w+\]/i, label: 'PDO SQLSTATE error' },
  { pattern: /sqlite_\w+\(\).*error/i, label: 'SQLite error' },
  { pattern: /Syntax error or access violation/i, label: 'Generic DB access violation' },
]

// Patterns suggesting raw SQL in page (query strings, debug output)
const SQL_EXPOSURE_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /SELECT\s+[\w\*,\s]+FROM\s+\w+/i, label: 'Raw SELECT statement in page' },
  { pattern: /INSERT\s+INTO\s+\w+/i, label: 'Raw INSERT statement in page' },
  { pattern: /UPDATE\s+\w+\s+SET\s+/i, label: 'Raw UPDATE statement in page' },
  { pattern: /DELETE\s+FROM\s+\w+/i, label: 'Raw DELETE statement in page' },
]

// URL query params with names commonly used unescaped in SQL
const RISKY_PARAM_NAMES = [
  'id', 'user_id', 'product_id', 'page', 'cat', 'category',
  'item', 'order', 'sort', 'filter', 'search', 'q', 'query',
]

export const sqliCheck: Check = {
  id: 'sqli',
  name: 'SQL Injection Signals',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []
    const html = ctx.html

    // 1. SQL error messages in page output
    const foundErrors = SQL_ERROR_PATTERNS.filter(({ pattern }) => pattern.test(html))
    if (foundErrors.length > 0) {
      results.push({
        checkId: 'sqli-error-leak',
        name: 'SQL Error Messages Exposed',
        severity: 'high',
        status: 'fail',
        detail: `Database error message(s) found in page output: ${foundErrors.map((e) => e.label).join(', ')}. This confirms a SQL backend and reveals query structure — an attacker can use these errors to map your schema and craft targeted injection payloads.`,
        fix: 'Disable detailed error output in production. Use generic error pages and log DB errors server-side only.',
        fixPrompt: sqliErrorLeakPrompt(ctx.stack),
        score: 9,
      })
    }

    // 2. Raw SQL statements visible in HTML
    const foundExposed = SQL_EXPOSURE_PATTERNS.filter(({ pattern }) => pattern.test(html))
    if (foundExposed.length > 0) {
      results.push({
        checkId: 'sqli-raw-exposure',
        name: 'Raw SQL Visible in Page Source',
        severity: 'high',
        status: 'fail',
        detail: `SQL statement patterns found in page HTML: ${foundExposed.map((e) => e.label).join(', ')}. Queries may be leaking through debug output or template rendering.`,
        fix: 'Remove all debug/query output from production. Ensure no ORM debug mode is active.',
        score: 8,
      })
    }

    // 3. Risky URL parameters (passive signal — not a confirmed vuln, but flagged for manual review)
    try {
      const url = new URL(ctx.url)
      const riskyParams = [...url.searchParams.keys()].filter((k) =>
        RISKY_PARAM_NAMES.includes(k.toLowerCase())
      )
      if (riskyParams.length > 0) {
        results.push({
          checkId: 'sqli-param-signal',
          name: 'URL Parameters May Be DB-Bound',
          severity: 'low',
          status: 'fail',
          detail: `Query parameters commonly passed to SQL queries found in URL: ${riskyParams.join(', ')}. These are worth testing manually with SQLi payloads like ' OR 1=1-- to confirm.`,
          fix: 'Use parameterised queries / prepared statements for all user-supplied inputs. Never interpolate URL params directly into SQL.',
          fixPrompt: sqliParamPrompt(ctx.stack),
          score: 3,
        })
      }
    } catch { /* invalid URL — skip */ }

    // 4. Forms with numeric-only default values (classic id= pattern)
    const numericInputs = (html.match(/<input[^>]+value=["']\d+["'][^>]*>/gi) || [])
      .filter((i) => /type=["']?(hidden|text)/i.test(i) && /name=["']?(id|user|item|order)/i.test(i))
    if (numericInputs.length > 0) {
      results.push({
        checkId: 'sqli-id-inputs',
        name: 'Numeric ID Fields in Forms',
        severity: 'low',
        status: 'fail',
        detail: `Found ${numericInputs.length} form field(s) with numeric ID-style values (name=id/user/item). These are common SQLi targets if not parameterised.`,
        fix: 'Ensure all form inputs are processed with parameterised queries. Consider UUIDs instead of sequential integer IDs.',
        score: 2,
      })
    }

    if (results.length === 0) {
      results.push({
        checkId: 'sqli-ok',
        name: 'No SQL Injection Signals',
        severity: 'info',
        status: 'pass',
        detail: 'No SQL error messages, raw query exposure, or high-risk parameter patterns detected in page source.',
        score: 0,
      })
    }

    return results
  },
}