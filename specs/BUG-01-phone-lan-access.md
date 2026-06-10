# Bug: Phone LAN Access

## Bug Description
The Sky Beacon dev app is reachable on the computer at `http://localhost:3001/`, but the user reports it is not loading from a phone on the same network.

## Problem Statement
Mobile testing needs a reliable LAN URL and clear setup notes. Without explicit LAN instructions, the user may try the hostname, a VPN adapter address, or a browser context where camera/location APIs are unavailable.

## Solution Statement
Verify the Next dev server is bound to the Wi-Fi interface, document the correct Wi-Fi IP URL, add an explicit LAN dev script, and note the mobile browser secure-context limitation for camera and geolocation.

## Steps to Reproduce
- Start the Sky Beacon dev server.
- Open `http://localhost:3001/` on the computer.
- Try to open the app from a phone on the same network.

## Root Cause Analysis
The server is healthy and responds locally through both `localhost` and `192.168.10.96`. `netstat` also shows LAN devices connecting to `192.168.10.96:3001`, so the phone traffic reaches the computer. The remaining likely causes are using the wrong adapter/URL, phone VPN/cellular/private relay behavior, Windows public network/firewall policy, or mobile browser secure-context limits. Camera and geolocation APIs will not work on a phone over plain `http://192.168.x.x` without a dev exception or HTTPS.

## Relevant Files
Use these files to fix the bug:

- `package.json` - Add a repeatable LAN dev command.
- `README.md` - Document LAN phone testing steps and secure-context caveats.

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### 1. Verify local reachability
- Confirm `http://localhost:3001/` returns HTTP 200.
- Confirm `http://192.168.10.96:3001/` returns HTTP 200 from the computer.
- Confirm port 3001 is listening on `0.0.0.0`.

### 2. Document LAN access
- Add a `dev:lan` script that binds Next to `0.0.0.0`.
- Add README instructions for finding the Wi-Fi IP and opening the app from a phone.
- Add notes for Android Chrome secure-origin development when testing camera/GPS.

### 3. Validate
- Run lint after editing project metadata/docs.

## Validation Commands
Execute every command to validate the bug is fixed with zero regressions.

- `npm run lint` - Run ESLint.

## Notes
The current Wi-Fi IP is `192.168.10.96`; it can change when reconnecting to Wi-Fi.
