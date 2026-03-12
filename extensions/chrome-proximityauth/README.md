# ProximityAuth Chrome Extension

Tap-N-Sign browser companion for local daemon handshake and consented autofill.

## Features
- Polls daemon health endpoint (`http://127.0.0.1:8787/health`) every minute.
- Verifies short-lived TNS handshake sessions from daemon (`/extension/session/:sessionId`).
- Autofills the active login form only after successful handshake.
- Supports direct extension-first flow (no website tab required).

## Security behavior
- Autofill is blocked unless handshake is verified.
- Optional origin lock from daemon can restrict autofill to a trusted site.
- Credentials are looked up per-origin from extension local storage.

## Install locally
1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Click **Load unpacked** and select `extensions/chrome-proximityauth`.
