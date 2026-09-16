# Audit Remediation Execution Checklist

Baseline: `main` commit `b39d5add64699b11e7b436b0eff34f7c1f24dea5`
Remediation branch: `audit-remediation-20260916`

## 1. GitHub / Code

- [x] Create isolated remediation branch.
- [x] Add ESLint scripts and Next.js ESLint configuration.
- [x] Add explicit dependency security audit to CI.
- [x] Add lint to CI.
- [x] Align `tsconfig.json` with Next.js 16 generated settings.
- [x] Add baseline security headers.
- [x] Add application-level rate limiting for admin login.
- [x] Add application-level rate limiting for consultation submissions.
- [x] Require admin authentication for `/internal/catalog-audit`.
- [x] Disallow `/admin/` and `/internal/` in robots rules.
- [ ] Generate and commit `package-lock.json`.
- [ ] Change CI dependency install from `npm install` to `npm ci` after lockfile is committed.
- [ ] Run PR CI and resolve all lint/type/build/audit failures.
- [ ] Review 26 cross-product duplicate detail-image URLs for legitimate shared assets vs mismatches.
- [ ] Merge only after required CI checks pass.

## 2. Vercel

- [ ] Confirm merged `main` commit is the production deployment commit.
- [ ] Confirm `NEXT_PUBLIC_SITE_URL=https://welfare.atomcare.co.kr` in Production.
- [ ] Confirm required server-only variables are present without exposing values: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.
- [ ] Confirm runtime error count after deployment.
- [ ] Add/confirm edge or firewall rate limiting as a distributed layer in addition to the code-level limiter.

## 3. Domain / DNS

- [ ] Complete `welfare.atomcare.co.kr` DNS record.
- [ ] Confirm Vercel domain verification.
- [ ] Confirm HTTPS certificate.
- [ ] Confirm production canonical URL, `robots.txt`, and `sitemap.xml` use the custom domain.

## 4. Production Smoke Test

- [ ] Home page.
- [ ] Products page.
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

Production sign-off requires:

- GitHub CI: PASS
- Vercel deployment: PASS
- Custom domain: VERIFIED
- Critical findings: 0
- High findings: 0 or explicitly mitigated
