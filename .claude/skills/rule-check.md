# rule-check

## Trigger

`/rule`

## Description

Pre-task and post-task compliance verification against the CGSI E-Form project charter and domain knowledge. Ensures every code change respects architectural constraints, security rules, and known prohibitions.

## Behavior

### Pre-Task (invoked before writing code)

1. **Read project-charter.md** — load the full file from the project root.
2. **Read all docs/** — load every `.md` file under `docs/` recursively (design specs, plans).
3. **Summarize constraints** — output a "Constraint Check" block:

```
## Constraint Check

### Task: [brief description of what you're about to do]

| Rule | Source | How I Will Comply |
|---|---|---|
| No Edge runtime for email | Charter §11.1 | /api/generate-pdf keeps `runtime = 'nodejs'` |
| Never hardcode secrets | Charter §11.2 | All credentials from process.env |
| Tests must not be modified | Charter §11.3 | Fix source only |
| Backward compat | Charter §11.7 | New link payload fields optional |
| i18n coverage | Charter §12 | New text → en/zh/bm keys |
| ... | ... | ... |
```

4. **Flag conflicts** — if a constraint is unclear, inapplicable, or conflicts with the task, state it explicitly.

### Post-Task (invoked after completing code)

1. **Re-read project-charter.md** and `docs/` files.
2. **Audit every file changed or created** against each rule.
3. **Output a "Self-Audit" block:**

```
## Self-Audit

### Files Changed: [list]

| Rule | Status | Evidence |
|---|---|---|
| No Edge runtime for email | ✓ Pass | route.js L12: `export const runtime = 'nodejs'` |
| API routes unchanged | ✓ Pass | Only modified src/components/TemplateSelector.jsx |
| Link backward compat | ✓ Pass | New field `f` is optional, old links decode fine |
| No database | ✓ Pass | No new dependencies or storage added |
| i18n coverage | ⚠ Review | Added UI text "Download All" — check en/zh/bm keys added |
| Signature fallback chain | ⚠ Review | Changed coordinate in coordinates.js — verify fallback still works |
| ... | ... | ... |
```

4. **List potential violations** even if uncertain — flag them for human review with ⚠.

## Canonical Rules (from project-charter.md)

These are automatically loaded on every `/rule` invocation:

1. **Edge Runtime Prohibition (§11.1):** `/api/generate-pdf` MUST use `export const runtime = 'nodejs'`. Nodemailer requires Node.js APIs.
2. **No Hardcoded Secrets (§11.2):** Email addresses, API keys, credentials → `.env` variables only.
3. **Test Integrity (§11.3):** Tests are specification. Never modify test files; only fix source code.
4. **No Database (§11.5):** State travels via URL parameters, sessionStorage, localStorage, or Vercel Blob. Never introduce a database without explicit approval.
5. **Email Non-Blocking (§8.5):** Email failure MUST NOT block PDF generation. Always return `{ pdfBase64, emailSent, emailError }`.
6. **Link Expiry (§10.2):** All sign links must have a 7-day expiry timestamp (`x` field in payload).
7. **Template Validation (§10.5):** Template ID must be validated against `KNOWN_TEMPLATES` before use.
8. **Signature Fallback Chain (§9.1):** Visual boxes → text anchors → fallback coordinates. Never remove a fallback without replacing it.
9. **i18n Coverage (§12):** Any new user-facing text must have en/zh/bm translations in `src/lib/i18n.js`.
10. **Single Signature Principle (§9.2):** Client signs once — the same signature is placed at all configured positions.
11. **No Authentication for Sign Flow (§5):** `/sign` and `/api/generate-pdf` are public. Only dealer routes are protected.
12. **Backward Compatibility (§11.7):** New link payload fields must be optional. Old links must continue to decode and work.

## Edge Cases to Always Check

- When adding a new template: does coordinates.js have field positions AND signature anchors?
- When modifying mailer.js: does the API still return `emailSent` on failure?
- When changing link payload: does old `?d=` still decode correctly?
- When adding UI text: are en/zh/bm keys all present in i18n.js?
- When touching routes: is the runtime declaration correct (nodejs for email routes)?
