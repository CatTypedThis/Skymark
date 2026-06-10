# Bug: Login PocketBase Error

## Bug Description
When a user previews a beacon and is prompted to sign in or sign up, submitting email and password shows the vague message `Something went wrong.`

## Problem Statement
Authentication cannot succeed unless PocketBase is running and reachable from the browser. The current app also defaults the PocketBase URL to `127.0.0.1:8090`, which breaks phone/LAN testing because `127.0.0.1` points to the phone, not the development computer.

## Solution Statement
Resolve the default PocketBase URL from the frontend host when the app is opened through a LAN IP, surface backend status and URL in the auth dialog, and map PocketBase/fetch failures to actionable messages.

## Steps to Reproduce
- Run the frontend dev server.
- Do not run PocketBase, or open the app from a phone while PocketBase URL points to `127.0.0.1`.
- Preview a beacon and confirm placement.
- Choose sign up or sign in.
- Submit email and password.

## Root Cause Analysis
`pocketbase/pocketbase.exe` is missing and `http://127.0.0.1:8090/api/health` is not reachable. The frontend catches the thrown PocketBase client error and displays its generic message. For LAN testing, the fallback PocketBase URL must not stay on loopback when the page hostname is a LAN address.

## Relevant Files
Use these files to fix the bug:

- `lib/pocketbase/client.ts` - Resolve the PocketBase URL from the current browser host when needed.
- `lib/pocketbase/auth-service.ts` - Convert PocketBase and network errors into clear messages.
- `components/SkyBeaconApp.tsx` - Pass backend status and URL into auth UI.
- `components/auth/AuthDialog.tsx` - Show backend status and disable vague failure states.
- `README.md` - Document running PocketBase for login.

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### 1. Patch URL resolution
- Keep explicit `NEXT_PUBLIC_POCKETBASE_URL` when provided.
- Use `http://127.0.0.1:8090` on desktop localhost.
- Use `http://<frontend-host>:8090` when the app is opened from a LAN host.

### 2. Improve auth errors
- Detect network failures and PocketBase `ClientResponseError` payloads.
- Show the backend URL in the dialog.
- Show an offline warning before submit when health checks fail.

### 3. Validate
- Run lint and unit tests.
- Verify the computed backend URL from the app.

## Validation Commands
Execute every command to validate the bug is fixed with zero regressions.

- `npm run lint` - Run ESLint.
- `npm run test` - Run unit tests.

## Notes
PocketBase still needs to be installed and started for real sign-up/sign-in. The frontend fix makes that requirement visible and makes LAN host resolution correct.
