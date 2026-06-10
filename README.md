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

Then open the Wi-Fi URL from the phone. On this machine right now, that is:

```text
http://192.168.10.96:3001
```

If the page does not load, verify the phone is on the same Wi-Fi network, disable phone VPN/private relay/cellular fallback, and allow Node/Next.js through Windows Firewall for private networks. The computer hostname is `TABLET-S99U1SKK`, but the numeric Wi-Fi IP is usually more reliable.

### HTTPS Requirements for iOS Safari

**iOS Safari requires HTTPS for camera, GPS, and device orientation access.** This is a strict security requirement that cannot be bypassed.

For iOS testing during development, you have several options:

1. **Use ngrok or similar HTTPS tunneling** (Recommended):
   ```powershell
   npm install -g ngrok
   ngrok http 3000
   ```
   Then use the provided HTTPS URL on your iOS device.

2. **Deploy to Vercel** for testing:
   - Push your code to GitHub
   - Deploy to Vercel (free tier provides HTTPS)
   - Test on iOS Safari using the Vercel HTTPS URL

3. **Use local HTTPS with self-signed certificates**:
   - Set up local HTTPS development with tools like `mkcert` or `local-ssl-proxy`
   - Note: iOS may still show certificate warnings

For Android Chrome testing with HTTP, you can enable insecure origins in `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, but this does not work on iOS Safari.

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

Open `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, enable it, add `http://192.168.10.96:3001`, relaunch Chrome, and then reopen the app.

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
