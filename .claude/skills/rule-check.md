# rule-check

## Trigger

`/rule`

## Description

Before writing any code, verify compliance with project rules by consulting the project charter and domain knowledge files. After completing a task, self-audit against the same rules.

## Behavior

### Pre-Task (invoked before coding)

1. **Read project-charter.md** — load the full file from the project root.
2. **Read all docs/** — load every `.md` file under `docs/` (recursively).
3. **Summarize constraints** — output a concise "Constraint Check" block listing:
   - Each rule/constraint discovered from the charter and docs
   - How you will comply with it in the upcoming task
   - Any potential conflicts or edge cases

Format:
```
## Constraint Check

| Rule | How I Will Comply |
|---|---|
| No Edge runtime for email | /api/generate-pdf will use `export const runtime = 'nodejs'` |
| Never hardcode secrets | Will read from process.env, no inline credentials |
| Tests must not be modified | Will fix source only, never touch test files |
| Link payload backward compatibility | New fields will be optional |
| ... | ... |
```

4. **Flag unknowns** — if a constraint is unclear or inapplicable to the current task, state that explicitly.

### Post-Task (invoked after completing code)

1. **Re-read project-charter.md** and `docs/` files.
2. **Audit every file changed/created** against each rule.
3. Output a "Self-Audit" block:

```
## Self-Audit

| Rule | Status | Notes |
|---|---|---|
| No Edge runtime for email | ✓ Pass | route.js has `runtime = 'nodejs'` |
| API routes | ✓ Pass | /api/generate-pdf unchanged, /api/store-pdf added |
| Link backward compat | ⚠ Review | Added `e` field — optional, but check old-link decoding |
| ... | ... | ... |
```

4. **List potential violations** even if uncertain — flag them for human review.

## Rules Extracted from project-charter.md

These are the canonical rules discovered from the codebase and documented in the charter:

1. **Edge Runtime Prohibition**: API routes that send email MUST declare `export const runtime = 'nodejs'`.
2. **No Hardcoded Secrets**: Email addresses, API keys, credentials → `.env` only.
3. **Test Integrity**: Tests are specification. Never modify test files; only fix source code.
4. **Backward Compatibility**: New link payload fields must be optional. Old links must continue to work.
5. **No Database**: State travels via URL parameters, sessionStorage, localStorage, or Vercel Blob. Never introduce a database without explicit approval.
6. **Email Non-Blocking**: Email failure must not block PDF generation. Return `emailSent: false` + `emailError`.
7. **Link Expiry**: All sign links must have a 7-day expiry encoded in the payload.
8. **Template Validation**: Template ID must be validated against known templates before use.
9. **Signature Fallback Chain**: Visual boxes → text anchors → fallback coordinates. Never remove a fallback without replacing it.
10. **i18n Coverage**: Any new user-facing text must have en/zh/bm translations.
11. **Single Signature Principle**: Client signs once — the same signature is placed at all configured positions.
12. **No Authentication**: No user accounts. The link IS the authority.
