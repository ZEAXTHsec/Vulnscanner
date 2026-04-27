// lib/checks/forms.ts

import { Check, ScanContext, ScanResult } from '@/lib/types'

export const formsCheck: Check = {
  id: 'forms',
  name: 'Form & Input Security',
  phase: 'passive',

  run: async (ctx: ScanContext): Promise<ScanResult[]> => {
    const results: ScanResult[] = []
    const html = ctx.html

    // Password fields without autocomplete=off
    const passwordFields = html.match(/<input[^>]*type=["']password["'][^>]*>/gi) || []
    const autocompleteOff = passwordFields.filter((f) =>
      /autocomplete=["'](off|new-password|current-password)["']/i.test(f)
    )

    if (passwordFields.length > 0 && autocompleteOff.length < passwordFields.length) {
      results.push({
        checkId: 'forms-password-autocomplete',
        name: 'Password Autocomplete Enabled',
        severity: 'low',
        status: 'fail',
        detail: `${passwordFields.length - autocompleteOff.length} password field(s) without autocomplete="off" or "new-password". Passwords may be stored in browser history.`,
        fix: 'Add autocomplete="new-password" or autocomplete="current-password" to password inputs.',
      })
    } else if (passwordFields.length > 0) {
      results.push({
        checkId: 'forms-password-autocomplete-ok',
        name: 'Password Autocomplete Controlled',
        severity: 'info',
        status: 'pass',
        detail: 'All password fields have autocomplete attributes set.',
      })
    }

    // Forms submitting over HTTP
    const formActions = html.match(/action=["']([^"']+)["']/gi) || []
    const httpActions = formActions.filter((a) => /action=["']http:\/\//i.test(a))

    if (httpActions.length > 0) {
      results.push({
        checkId: 'forms-http-action',
        name: 'Form Submits Over HTTP',
        severity: 'high',
        status: 'fail',
        detail: `${httpActions.length} form(s) submit data to plain HTTP URLs. Credentials and data sent in cleartext.`,
        fix: 'Change all form action URLs from http:// to https://.',
      })
    }

    // Hidden fields that might leak internal data
    const hiddenFields: string[] = html.match(/<input[^>]*type=["']hidden["'][^>]*>/gi) || []
    const suspiciousHidden = hiddenFields.filter((f: string) => {
      const nameMatch = f.match(/name=["']([^"']+)["']/i)
      const name = nameMatch ? nameMatch[1].toLowerCase() : ''
      return ['user_id', 'admin', 'role', 'is_admin', 'price', 'amount', 'discount'].some(
        (s) => name.includes(s)
      )
    })

    if (suspiciousHidden.length > 0) {
      results.push({
        checkId: 'forms-hidden-fields',
        name: 'Suspicious Hidden Fields',
        severity: 'medium',
        status: 'fail',
        detail: `Found ${suspiciousHidden.length} hidden field(s) with potentially sensitive names (e.g. role, price, user_id). These can be tampered with client-side.`,
        fix: 'Never trust hidden field values for security decisions. Validate all values server-side.',
      })
    }

    // Input fields without labels (accessibility + phishing signal)
    const inputCount = (html.match(/<input[^>]*type=["'](text|email|tel|number)["'][^>]*>/gi) || []).length
    const labelCount = (html.match(/<label[^>]*>/gi) || []).length

    if (inputCount > 0 && labelCount === 0) {
      results.push({
        checkId: 'forms-no-labels',
        name: 'Form Inputs Without Labels',
        severity: 'low',
        status: 'fail',
        detail: `${inputCount} input field(s) found with no <label> elements. Reduces accessibility and may indicate rushed/insecure form construction.`,
        fix: 'Add <label for="..."> elements to all form inputs.',
      })
    }

    if (results.length === 0) {
      results.push({
        checkId: 'forms-ok',
        name: 'Form Security',
        severity: 'info',
        status: 'pass',
        detail: 'No form-related security issues detected.',
      })
    }

    return results
  },
}