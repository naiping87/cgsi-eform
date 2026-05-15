# auto-fix-loop

## Trigger

`/auto-fix`

## Description

Automated fix loop for the CGSI E-Form project. Runs linting and end-to-end tests, repairs failures, and repeats until clean. Stops after 3 consecutive failures on the same test and requests human intervention.

## Behavior

When invoked, execute the following loop:

### Phase 1: Code Quality Check

1. Run `npm run lint` (ESLint via eslint-config-next).
2. If there are errors:
   - Parse each error (file, line, rule, message).
   - Fix one error at a time by editing the source file.
   - Re-run `npm run lint` after each fix.
   - Continue until zero errors.
3. If `npm run lint` is not available, fall back to: `npx eslint src/ --ext .js,.jsx`

### Phase 2: E2E Tests

1. Check if `npm run test:e2e` script exists (via `npm run` listing or package.json).
2. If no test:e2e script exists:
   - Report: "No test:e2e script found. E2E testing is not configured. To add Playwright: `npm init playwright` and add `test:e2e` to package.json scripts."
   - Skip this phase.
3. If test:e2e script exists, run `npm run test:e2e`.
4. If all tests pass → report success and exit.
5. If any tests fail:
   - Read the full failure output carefully.
   - Identify the source code responsible (NEVER modify test files — tests are specification).
   - Fix the source code only.
   - Re-run `npm run test:e2e`.
   - Repeat until all pass, OR until 3 consecutive failures on the same test without progress.
6. If 3 consecutive failures on the same test → stop and request human intervention. Report:
   - The failing test name and assertion
   - What was attempted in each of the 3 attempts
   - Hypothesis for what might be wrong

### Phase 3: Token Report

After each full loop iteration (lint pass + E2E pass or abort), estimate and report:
- Approximate tokens used this iteration
- Number of fixes applied
- Number of test runs executed
- Final status: GREEN (all pass) / RED (aborted, needs human)

## Rules

- **Tests are specification.** Never modify test files to make them pass. Only fix source code.
- **One fix at a time.** After each source edit, re-run the relevant check before making another edit.
- **Stop after 3 consecutive same-test failures.** Requesting human help is better than infinite thrashing.
- **Report clearly.** Every iteration outputs: "Lint: passed. E2E: 3/5 passed, fixing test X..."
- **Project is JavaScript.** This is NOT a TypeScript project — skip tsc checks. Use ESLint instead.

## Project-Specific Notes

- This project uses `eslint-config-next` (core-web-vitals).
- PDF operations (pdf-lib, pdfjs-dist) are sensitive to coordinate changes — be careful when modifying `src/lib/coordinates.js`.
- Email API route (`src/app/api/generate-pdf/route.js`) MUST retain `export const runtime = 'nodejs'`.
- Signature placement follows priority: visual boxes > text anchors > fallback coordinates. Do not break this chain.

## Example Session

```
User: /auto-fix

Assistant:
[Lint] Running npm run lint...
  Error: src/lib/mailer.js:42 — 'err' is defined but never used
  Fixed: removed unused variable.
[Lint] Passed ✓

[E2E] Running npm run test:e2e...
  4/5 passed. Failed: "signature appears on page 2"
  Root cause: page index off by one in pdf-generator.js (page 0 vs page 1)
  Fixed: corrected page index to use 0-based.
[E2E] Running npm run test:e2e...
  5/5 passed ✓

Iteration complete: 2 fixes, 2 lint runs, 2 test runs, ~12K tokens used.
Status: GREEN ✓
```
