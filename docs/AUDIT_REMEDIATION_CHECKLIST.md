# Audit Remediation Execution Checklist

Baseline: `main` commit `82f62915a8af8d4bc4beaa223cb0de6135d879a4`
Remediation branch: `audit-remediation-20260916-v2`

## 1. GitHub / Code

- [x] Rebase remediation work onto the latest `main` hardening commit.
- [x] Preserve existing `package-lock.json`, `npm ci`, vulnerability audit, Node/npm pinning, and internal catalog authentication.
- [x] Add ESLint scripts and Next.js ESLint configuration.
- [x] Add lint as a CI release gate.
- [x] Refresh `package-lock.json` for ESLint tooling.
- [x] Align `tsconfig.json` with Next.js 16 generated settings.
- [x] Extend baseline response security headers.
- [x] Add application-level rate limiting for admin login.
- [x] Add application-level rate limiting for consultation submissions.
- [x] Disallow `/admin/` and `/internal/` in robots rules.
- [x] Replace lint-blocking internal `<a>` navigation with Next.js `Link`.
- [x] Normalize guide-page local metadata fallback to port 5000.
- [x] PR CI passed dependency audit, lint, image audits, typecheck, production build, and rendered-site audits.
- [x] CI merge gate satisfied; all required checks passed before merge.
- [ ] Review 26 cross-product duplicate detail-image URL groups for legitimate shared assets vs mismatches. Non-blocking data QA.
- [ ] Resolve 11 non-blocking ESLint warnings: image optimization and admin client navigation cleanup.
- [ ] Track migration from ESLint 9.39.5 when the Next.js lint dependency chain supports the newer major version.
- [ ] Add/verify detail images for `catalog-s03090178005-electric-bed`; current rendered audit passes because it is not a required-detail product.

## 2. Vercel

- [ ] Confirm merged `main` commit is the production deployment commit.
- [ ] Confirm `NEXT_PUBLIC_SITE_URL=https://welfare.atomcare.co.kr` in Production.
- [ ] Confirm required server-only variables are present without exposing values: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.
- [ ] Confirm runtime error count after deployment.
- [ ] Add or confirm platform-level distributed rate limiting / firewall protection.

## 3. Domain / DNS

- [ ] Complete `welfare.atomcare.co.kr` DNS record.
- [ ] Confirm Vercel domain verification.
- [ ] Confirm HTTPS certificate.
- [ ] Confirm production canonical URL, `robots.txt`, and `sitemap.xml` use the custom domain.

## 4. Production Smoke Test

- [ ] Home page.
- [ ] Products page and filtering/pagination.
- [ ] Category pages.
- [ ] Representative product detail pages.
- [ ] AI guided recommendation flow.
- [ ] Product comparison.
- [ ] Consultation cart.
- [ ] Consultation submission error/success behavior.
- [ ] Admin login and unauthenticated redirect.
- [ ] Internal catalog audit authentication.
- [ ] Persistent purchase/inquiry phone CTA.
- [ ] Mobile viewport check.

## Release Gate

Production sign-off requires GitHub CI and Vercel deployment to pass, the custom domain to be verified, and no unresolved critical or high-severity finding without an explicit mitigation.
