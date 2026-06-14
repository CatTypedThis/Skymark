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
- Browser-local beacon persistence with no backend service required.
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

The LAN script starts Next on port 3001, discovers the computer's local IPv4 addresses, and automatically allows those hosts for Next.js development resources. Then open one of the printed Wi-Fi URLs from the phone:

```text
http://<your-wifi-ip>:3001
```

The LAN HTTP URL is useful for layout, beacon drawer, and non-sensor flows. Camera, GPS, and compass APIs require a secure context, so plain `http://<your-wifi-ip>:3001` will show HTTPS guidance instead of opening the camera unless the browser has been explicitly configured to trust that development origin.

You can inspect the computed hosts without starting the dev server:

```powershell
node scripts/dev-lan.mjs --print-origins
```

Use the network URL printed by `npm run dev:lan`, or run `ipconfig` and use the IPv4 address for the active Wi-Fi adapter. If you use a custom hostname, add it to `NEXT_ALLOWED_DEV_ORIGINS` in `.env.local` as a comma-separated value, then restart the dev server.

If `npm run dev:lan` reports that port 3001 is already in use, stop the old dev server first. A stale server can keep serving an older Next config to the phone even after the code has been fixed.

If the page loads but buttons do not respond, clear the phone browser's site data for the LAN URL, restart `npm run dev:lan`, and check the dev server log for blocked-origin warnings. If the page does not load, verify the phone is on the same Wi-Fi network, disable phone VPN/private relay/cellular fallback, and allow Node/Next.js through Windows Firewall for private networks. The computer hostname can work on some networks, but the numeric Wi-Fi IP is usually more reliable.

### HTTPS Requirements for Camera and Sensors

**Camera, GPS, and device orientation access require HTTPS or another browser-trusted secure context.** This is a browser security requirement that cannot be bypassed from app code. iOS Safari requires HTTPS; Android Chrome can use an insecure-origin exception for local development only.

For full sensor testing during development, use one of these options:

1. **Use ngrok or similar HTTPS tunneling** (Recommended):
   ```powershell
   npm install -g ngrok
   ngrok http 3001
   ```
   Then use the provided HTTPS URL on your iOS device while `npm run dev:lan` is running. Use port 3000 instead if you are running `npm run dev`.

2. **Deploy to Vercel** for testing:
   - Push your code to GitHub
   - Deploy to Vercel (free tier provides HTTPS)
   - Test on iOS Safari using the Vercel HTTPS URL

3. **Use local HTTPS with self-signed certificates**:
   - Set up local HTTPS development with tools like `mkcert` or `local-ssl-proxy`
   - Note: iOS may still show certificate warnings

For Android Chrome testing with HTTP, you can enable insecure origins in `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, add the exact `http://<your-wifi-ip>:3001` origin, relaunch Chrome, and reopen the app. This does not work on iOS Safari.

### iOS Safari Testing Checklist

When testing on iOS Safari, verify:

- [ ] Camera permission is granted and camera feed works
- [ ] GPS location permission is granted and location is accurate
- [ ] Device orientation/compass permission is granted
- [ ] Compass heading provides accurate readings
- [ ] Complete beacon placement workflow works end-to-end
- [ ] App installs as PWA from iOS "Add to Home Screen"
- [ ] All sensor errors show helpful iOS-specific messages

### Android Chrome Testing

For Android Chrome development testing, you can enable insecure origins:

Open `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, enable it, add the `http://<your-wifi-ip>:3001` URL, relaunch Chrome, and then reopen the app.

For production or normal demos, use HTTPS.

Run validation:

```powershell
npm run lint
npm run test
npm run build
```

## Deployment

The app is ready to deploy to Vercel as a standard Next.js project. It does not require a database, backend process, persistent server disk, or runtime environment variables for beacon storage. Saved beacons live in each browser's `localStorage`, so they remain device-local.

```powershell
npm run build
```

Use Vercel's default install and build settings for Next.js.

**Important for iOS Users**: Vercel provides automatic HTTPS, which is required for iOS Safari to access camera, GPS, and compass sensors.

## Platform Compatibility

- **iOS Safari 13+**: Full support with HTTPS required
- **Android Chrome**: Full support with optional HTTP for development
- **Desktop browsers**: Simulated compass, limited camera support

## Source Documents

- `PRD.md` - product requirements.
- `SRS.md` - software requirements.
- `technical-specification.md` - implementation architecture.
- `UI.html` - high-definition visual mockups.
- `assets/` - visual assets used by the mockups.
