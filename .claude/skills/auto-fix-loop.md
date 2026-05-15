# auto-fix-loop

## Trigger

`/auto-fix`

## Description

Automated fix loop that runs type-checking and end-to-end tests, repairs failures, and repeats until clean. Designed for projects using TypeScript + Playwright (or similar E2E framework).

## Behavior

When invoked, execute the following loop:

### Phase 1: Type Check
1. Run `npx tsc --noEmit` (or `tsc --noEmit` if globally available).
2. If there are errors:
   - Parse each error (file, line, message).
   - Fix one error at a time by editing the source file.
   - Re-run `tsc --noEmit` after each fix.
   - Continue until zero errors.
3. If the project has no `tsconfig.json` (e.g., JavaScript-only project), skip this phase and report "No TypeScript config found — skipping type check."

### Phase 2: E2E Tests
1. Run `npm run test:e2e`.
2. If all tests pass → report success and exit.
3. If any tests fail:
   - Read the failure output carefully.
   - Identify the source code responsible (NOT the test file — tests are spec, never modify them).
   - Fix the source code.
   - Re-run `npm run test:e2e`.
   - Repeat until all pass, OR until 3 consecutive failures on the same test without progress.
4. If 3 consecutive failures on the same test → stop and request human intervention. Report:
   - The failing test name and assertion
   - What was tried in each attempt
   - A hypothesis for what might be wrong

### Phase 3: Token Report
After each full loop iteration (type-check pass + E2E pass, or abort), estimate and report:
- Tokens used this iteration
- Number of fixes applied
- Number of test runs

## Rules

- **Tests are specification.** Never modify test files to make them pass. Only fix source code.
- **One fix at a time.** After each source edit, re-run the relevant check before making another edit.
- **Stop after 3 consecutive same-test failures.** Requesting human help is better than thrashing.
- **Report clearly.** Every iteration should output a 1-line summary: "Type check: passed. E2E: 3/5 passed, fixing test X..."

## Example Session

```
User: /auto-fix

Claude:
[Type Check] Running tsc --noEmit...
  Error: src/lib/mailer.js:19 — Property 'to' does not exist on type...
  Fixed: added type annotation.
[Type Check] Passed ✓

[E2E] Running npm run test:e2e...
  4/5 passed. Failed: "signature appears on page 2"
  Root cause: page index off by one in pdf-generator.js
  Fixed: corrected page index.
[E2E] Running npm run test:e2e...
  5/5 passed ✓

Iteration complete: 2 fixes, 3 test runs, ~15K tokens used.
```
