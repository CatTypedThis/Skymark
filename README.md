# Sky Beacon

Sky Beacon is a mobile-first progressive web app for placing tall, sky-reaching GPS beacons through a live camera interface.

## MVP

- Next.js App Router with TypeScript.
- Tailwind CSS visual system based on the instrument mockups.
- PWA manifest, app icon, service worker, and cached app shell.
- First-run onboarding.
- Camera feed with desktop fallback.
- Progressive camera, GPS, and orientation permission flows.
- 100-meter-ahead beacon placement math.
- Directional DOM/CSS beacon rendering with off-screen indicators.
- Five curated beacon colors.
- PocketBase email/password auth and SQLite-backed beacon persistence.
- Drawer management for selecting, renaming, recoloring, deleting, undoing delete, replacing, and clearing beacons.

## Development

Install dependencies:

```powershell
npm install
```

Run the app:

```powershell
npm run dev
```

Run for phone testing on the same Wi-Fi:

```powershell
npm run dev:lan
```

Run PocketBase for login and saved beacons:

```powershell
npm run dev:backend
```

Then open the Wi-Fi URL from the phone. On this machine right now, that is:

```text
http://192.168.10.96:3001
```

If the page does not load, verify the phone is on the same Wi-Fi network, disable phone VPN/private relay/cellular fallback, and allow Node/Next.js through Windows Firewall for private networks. The computer hostname is `TABLET-S99U1SKK`, but the numeric Wi-Fi IP is usually more reliable.

For camera and GPS testing on a phone, plain LAN HTTP is not a secure browser context. On Android Chrome for local development, open `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, enable it, add `http://192.168.10.96:3001`, relaunch Chrome, and then reopen the app. For production or normal demos, use HTTPS.

Run validation:

```powershell
npm run lint
npm run test
npm run build
```

PocketBase setup lives in `pocketbase/README.md`. The frontend defaults to `http://127.0.0.1:8090` for desktop localhost.

Login and beacon saves require PocketBase to be running. For desktop testing, start it on `127.0.0.1:8090`. For phone/LAN testing, start PocketBase so it is reachable from the phone and either set:

```powershell
$env:NEXT_PUBLIC_POCKETBASE_URL="http://192.168.10.96:8090"
```

or rely on the app fallback, which uses `http://<frontend-host>:8090` when opened through a LAN hostname or IP.

## Source Documents

- `PRD.md` - product requirements.
- `SRS.md` - software requirements.
- `technical-specification.md` - implementation architecture.
- `UI.html` - high-definition visual mockups.
- `assets/` - visual assets used by the mockups.
