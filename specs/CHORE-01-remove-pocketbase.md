# Chore: Remove PocketBase

## Chore Description
Remove PocketBase, authentication, and backend-backed beacon persistence so the app can deploy as a self-contained Next.js PWA on Vercel. Preserve the core beacon placement and management workflow by storing saved beacons in the browser.

## Relevant Files
Use these files to resolve the chore:

- `components/SkyBeaconApp.tsx` - Main state orchestration currently depends on PocketBase auth and persistence.
- `components/beacons/BeaconDrawer.tsx` - Drawer currently exposes auth and PocketBase persistence status.
- `components/hud/SensorStatusBar.tsx` - HUD currently reports auth and PocketBase status.
- `lib/beacons/beacon-service.ts` - PocketBase service functions should become browser-local persistence helpers.
- `lib/beacons/beacon-types.ts` - Beacon records should no longer require a backend owner.
- `package.json` and `package-lock.json` - Remove the PocketBase dependency and backend dev script.
- `.env.example`, `.gitignore`, and `eslint.config.mjs` - Remove PocketBase-specific environment and ignore configuration.
- `README.md` - Update setup and deployment notes for a Vercel-ready frontend-only app.
- `tests/unit/beacons.test.ts` - Adjust test fixtures and add coverage for local beacon helpers.

### New Files

- None expected.

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### 1. Replace PocketBase persistence
- Convert `lib/beacons/beacon-service.ts` to use `localStorage`.
- Keep slot assignment, generated names, soft-delete undo, color updates, renames, replacement, and clear-all behavior.
- Validate stored records while reading and ignore invalid persisted values.

### 2. Remove auth and backend UI
- Remove the auth dialog, user state, backend health checks, sign-in/sign-up/sign-out, and PocketBase error handling from `SkyBeaconApp`.
- Update the beacon drawer copy and controls so saving is available without an account.
- Remove auth and PocketBase chips from the sensor status bar.

### 3. Remove PocketBase package and local backend files
- Remove `pocketbase` from dependencies.
- Delete `lib/pocketbase/`, `components/auth/`, and the root `pocketbase/` directory.
- Remove the backend dev script and PocketBase-specific ignore/lint entries.

### 4. Update documentation
- Update README setup, MVP description, and validation commands.
- Remove PocketBase environment variables from `.env.example`.
- Leave historical product/spec docs untouched unless they block validation.

### 5. Run Validation Commands
- Run every command listed in Validation Commands.
- Fix any failures before finishing.

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

- `npm run lint` - Run ESLint.
- `npm run test` - Run unit tests.
- `npm run build` - Verify the app builds for production/Vercel.

## Notes
The deployable app and active docs describe the local-only, Vercel-ready behavior.
