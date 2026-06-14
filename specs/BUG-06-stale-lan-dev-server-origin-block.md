# Bug: Stale LAN Dev Server Keeps Blocking Phone Origin

## Bug Description
After adding the LAN dev wrapper, the phone still shows the camera permission UI but tapping `Start camera` remains unresponsive.

Expected behavior: when the app is opened from `http://192.168.10.96:3001/`, the page should be hydrated and tapping `Start camera` should trigger the camera handler, leading to a browser permission prompt, camera feed, unsupported-camera state, or HTTPS guidance.

Actual behavior: the phone continues to talk to a dev server that blocks `192.168.10.96` from Next.js development resources, leaving visible controls inert.

## Problem Statement
The current LAN fix depends on developers restarting the server through `npm run dev:lan`. If an older `next dev` process is already listening on port 3001, the phone can keep using that stale process. Because `next.config.ts` only sets `allowedDevOrigins` from `NEXT_ALLOWED_DEV_ORIGINS`, a manually started or stale dev server still blocks the phone host.

## Solution Statement
Move local LAN origin discovery into the Next config as a development default, not only into the wrapper environment. Also add a preflight check to `scripts/dev-lan.mjs` so it fails clearly when port 3001 is already occupied by an existing server instead of leaving the user connected to a stale process.

## Steps to Reproduce
- Leave an older dev server running on port 3001 from before the LAN wrapper change.
- Confirm the process owner is a direct Next command rather than the wrapper:
  - `Get-CimInstance Win32_Process -Filter "ProcessId = 7596" | Select-Object ProcessId,ParentProcessId,CommandLine`
  - Observed command line: `"node" "C:\Skymark\node_modules\.bin\\..\next\dist\bin\next" dev -p 3001`
- Confirm the current shell has no `NEXT_ALLOWED_DEV_ORIGINS` set.
- Open `http://192.168.10.96:3001/` from the phone.
- Tap `Start camera`.
- Check `dev-server-3001.err.log`.
- Observe blocked-origin warnings for `192.168.10.96`.

## Root Cause Analysis
The active server on port 3001 was not started by `scripts/dev-lan.mjs`. Process inspection showed the parent process command line as `next dev -p 3001`, and the process was already long-lived. The current shell also has no `NEXT_ALLOWED_DEV_ORIGINS` value.

The wrapper's dry-run output is correct: it includes `localhost`, `127.0.0.1`, the machine hostname, `198.18.0.1`, and the real Wi-Fi host `192.168.10.96`. However, that list only reaches Next when the wrapper is the process that spawns `next dev`.

`next.config.ts` currently applies `allowedDevOrigins` only when `NEXT_ALLOWED_DEV_ORIGINS` is present. That means old/manual dev commands still produce no allowed LAN origins. Next detects changes to `next.config.ts` and restarts internally, but it restarts with the same old process environment, so the phone origin remains blocked.

This is why the `Start camera` button still feels broken: the phone is seeing HTML/CSS from a reachable server, but Next dev resources from the LAN origin are blocked, so the client app can remain unhydrated or partially active.

## Relevant Files
Likely files for a future implementation pass:

- `next.config.ts` - Add development-default local origin discovery so any Next dev server command allows current LAN hosts.
- `scripts/dev-lan.mjs` - Add a port-occupied preflight before spawning Next, with an explicit message when another process already owns port 3001.
- `tests/unit/dev-lan-origin.test.ts` - Extend coverage for port preflight behavior or extracted origin helpers.
- `README.md` - Document that a stale server must be stopped/restarted and that `npm run dev:lan` should show the allowed origins before phone testing.
- `specs/BUG-05-phone-start-camera-unresponsive.md` - Historical context for the initial wrapper fix.

### New Files

- Optional: `tests/unit/allowed-dev-origins.test.ts` - If origin discovery is extracted into a shared testable helper.

## Step by Step Tasks
IMPORTANT: These are instructions for a future implementation pass. Do not execute them while using this skill.

### 1. Preserve the current evidence
- Capture the active port owner with `Get-NetTCPConnection -LocalPort 3001`.
- Capture the parent process command line for the owning process.
- Confirm `dev-server-3001.err.log` still contains blocked-origin warnings for `192.168.10.96`.
- Confirm `node scripts/dev-lan.mjs --print-origins` includes `192.168.10.96`.

### 2. Add development-default LAN origins in Next config
- Update `next.config.ts` to discover local non-internal IPv4 addresses with Node's `os.networkInterfaces()` when the config is loaded.
- Include `localhost`, `127.0.0.1`, the OS hostname, and detected IPv4 addresses in `allowedDevOrigins` during development.
- Merge `NEXT_ALLOWED_DEV_ORIGINS` entries on top of the detected defaults.
- Keep origin normalization forgiving for bare hosts, full URLs, wildcard subdomains, and host:port strings.
- Ensure production builds are not affected by local machine addresses unless explicitly needed for development config.

### 3. Add a wrapper port preflight
- Before spawning Next in `scripts/dev-lan.mjs`, attempt to bind to the configured port.
- If the port is occupied, exit with a clear message explaining that an old dev server is already running on port 3001.
- Include the commands needed to identify and stop the stale process on Windows.
- Do not auto-kill the process by default.
- Keep `--print-origins` side-effect free.

### 4. Add regression coverage
- Extend the origin tests to verify detected local addresses are used even when `NEXT_ALLOWED_DEV_ORIGINS` is empty.
- Add a test for the port preflight helper if it is exposed as a pure/importable function.
- Keep the existing camera e2e test that verifies `Start camera` invokes the handler when the page is hydrated.

### 5. Validate the real-phone path
- Stop the stale process currently owning port 3001.
- Start the server with `npm run dev:lan`.
- Confirm the terminal prints `Allowed Next dev origins` and includes `192.168.10.96`.
- Open `http://192.168.10.96:3001/` from the phone.
- Confirm `dev-server-3001.err.log` no longer receives blocked-origin warnings for `192.168.10.96`.
- Tap `Start camera`.
- Confirm the UI changes state instead of staying inert.

### 6. Run Validation Commands
- Execute every command in the Validation Commands section.

## Validation Commands
Commands a future implementation pass should execute to validate the bug is fixed with zero regressions.

- `node scripts/dev-lan.mjs --print-origins` - Verify local origin discovery includes the active Wi-Fi host.
- `npm run lint` - Run ESLint.
- `npm run test` - Run unit tests.
- `npm run build` - Verify production build still succeeds.
- `npm run test:e2e` - Verify hydrated UI flows still respond to clicks.

## Notes
Immediate local workaround: stop the current stale server process on port 3001 and restart with `npm run dev:lan`. The active process found during investigation was started by `next dev -p 3001`, not by `node scripts/dev-lan.mjs`.

The current active Wi-Fi host is `192.168.10.96`. It can change after reconnecting to Wi-Fi, so the final fix must keep discovering addresses dynamically.
