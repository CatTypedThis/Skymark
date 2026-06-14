# Chore: LAN Origin Regression Tests

## Chore Description
Add focused regression tests that prove the phone `Start camera` unresponsiveness bug is fixed at the development-server layer. The tests should cover the exact failure modes found in `BUG-06`: a manual/stale `next dev` process without `NEXT_ALLOWED_DEV_ORIGINS`, and a `dev:lan` command that can be bypassed when port 3001 is already occupied.

These tests should confirm that:

- LAN origins are computed even when `NEXT_ALLOWED_DEV_ORIGINS` is empty.
- Manual origin entries are still merged and normalized.
- The LAN wrapper refuses to start when the target port is already occupied.
- The hydrated camera-button behavior remains covered by the existing Playwright smoke test.

## Relevant Files
Use these files to resolve the chore:

- `specs/BUG-06-stale-lan-dev-server-origin-block.md` - Source bug evidence and expected fix behavior.
- `next.config.ts` - The production of `allowedDevOrigins` must become testable for the manual/stale dev-server case.
- `scripts/dev-lan.mjs` - The LAN wrapper needs testable origin helpers and a port preflight.
- `tests/unit/dev-lan-origin.test.ts` - Existing wrapper dry-run coverage should be extended.
- `tests/e2e/sky-beacon.smoke.spec.ts` - Existing hydrated `Start camera` click coverage should remain part of validation.
- `vitest.config.ts` - Unit tests run in Node and can cover config/helper behavior.
- `README.md` - The tested workflow should match documented phone testing instructions.

### New Files

- `lib/dev/allowed-dev-origins.ts` - Shared helper for discovering and normalizing local development origins, if implementation wants TypeScript unit coverage instead of duplicating logic in config and scripts.
- `tests/unit/allowed-dev-origins.test.ts` - Unit tests for local origin discovery, normalization, merging, and no-env defaults.
- `tests/unit/dev-lan-port.test.ts` - Unit/integration tests for `scripts/dev-lan.mjs` port preflight behavior, if this is clearer than extending `dev-lan-origin.test.ts`.

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### 1. Extract testable origin logic
- Move origin normalization and local address discovery into a helper that can be imported by tests.
- Keep `next.config.ts` using the same helper or equivalent tested function.
- Keep `scripts/dev-lan.mjs` using the same behavior or an adapter over the helper.
- Preserve support for bare hosts, full URLs, wildcard subdomains, `host:port`, whitespace, and duplicate entries.

### 2. Test no-env LAN defaults
- Add a unit test that simulates local addresses with no `NEXT_ALLOWED_DEV_ORIGINS`.
- Assert the computed origins include `localhost`, `127.0.0.1`, the test hostname, and the simulated Wi-Fi IP such as `192.168.10.96`.
- Assert the computed origins are unique and normalized to lowercase.
- This is the regression test for stale/manual `next dev` commands that previously had no allowed LAN origins.

### 3. Test manual origin merging
- Add or keep coverage that passes manual values like `http://phone.local:3001`, `manual.local:3001`, and `*.test.local`.
- Assert manual entries merge with detected local defaults rather than replacing them.
- Assert normalized output contains `phone.local`, `manual.local`, and `*.test.local`.

### 4. Test wrapper dry-run output
- Keep `node scripts/dev-lan.mjs --print-origins` side-effect free.
- Add a test that invokes the script with deterministic env overrides.
- Assert JSON output includes allowed origins, bind host, port, and phone URLs.
- Assert the generated URL list uses detected LAN addresses and the requested port.

### 5. Test occupied-port preflight
- Add a test that opens a temporary TCP server with Node's `net` module.
- Run `node scripts/dev-lan.mjs --port <occupied-port>`.
- Assert the command exits non-zero before spawning Next.
- Assert stderr or stdout includes a clear stale-server/port-in-use message and does not print Next's normal ready output.
- Use a random test port rather than port 3001 so the test is safe to run on developer machines.

### 6. Keep camera hydration coverage
- Preserve the existing Playwright test `shows a helpful camera error when permission is denied`.
- Treat that test as the end-to-end proof that when the page is hydrated, the `Start camera` button invokes its handler.
- Do not add a real camera permission prompt test in automation; keep camera access mocked.

### 7. Run Validation Commands
- Run every command listed in Validation Commands.
- Fix any failures before considering the chore complete.

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

- `node scripts/dev-lan.mjs --print-origins` - Confirm the current machine still reports LAN origins and phone URLs.
- `npm run test -- tests/unit/allowed-dev-origins.test.ts tests/unit/dev-lan-origin.test.ts tests/unit/dev-lan-port.test.ts` - Run focused LAN-origin regression tests.
- `npm run test` - Run all unit tests.
- `npm run lint` - Run ESLint.
- `npm run build` - Verify Next config changes do not break production build.
- `npm run test:e2e` - Verify the hydrated camera-button flow still works.

## Notes
The official Next.js docs say development requests from hosts other than the initialized hostname must be allowed with `allowedDevOrigins`: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins.

The tests should avoid hard-coding the live Wi-Fi IP except as a simulated fixture value. The real active IP can change between Wi-Fi sessions.
