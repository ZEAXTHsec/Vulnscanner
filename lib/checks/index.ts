// lib/checks/index.ts

import { Check } from '@/lib/types'
import { headersCheck } from './headers'
import { httpsCheck } from './https'
import { corsCheck } from './cors'
import { techDetectCheck } from './tech-detect'
import { openDirsCheck } from './open-dirs'
import { sslCertCheck } from './ssl-cert'
import { dnsCheck } from './dns'
import { injectionCheck } from './injection'
import { xssCheck } from './xss'
import { secretsCheck } from './secrets'
import { exposedFilesCheck } from './exposed-files'
import { cookiesCheck } from './cookies'
import { permissionsCheck } from './permissions'
import { formsCheck } from './forms'
import { redirectsCheck } from './redirects'
import { subresourcesCheck } from './subresources'
import { robotsCheck } from './robots'
import { rateLimitCheck } from './rate-limit'
import { cspDeepCheck } from './csp-deep'
import { infrastructureCheck } from './infrastructure'
import { mixedContentCheck } from './mixed-content'
import { emailSecurityCheck } from './email-security'
import { subdomainTakeoverCheck } from './subdomain-takeover'
// Note: sqli.ts exists but is not wired in — SQL injection detection
// is covered by injectionCheck and xssCheck. Remove sqli.ts if not needed.

export const checks: Check[] = [
  httpsCheck,
  sslCertCheck,
  mixedContentCheck,
  secretsCheck,
  cookiesCheck,
  headersCheck,
  dnsCheck,
  corsCheck,
  injectionCheck,
  xssCheck,
  exposedFilesCheck,
  techDetectCheck,
  openDirsCheck,
  permissionsCheck,
  formsCheck,
  redirectsCheck,
  subresourcesCheck,
  robotsCheck,
  rateLimitCheck,
  cspDeepCheck,
  infrastructureCheck,
  emailSecurityCheck,
  subdomainTakeoverCheck,
]