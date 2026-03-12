# Architecture

ProximityAuth consists of:

1. **Mobile App (Expo/React Native)**: user identity bootstrap, local secure keys, proximity and fallback proof generation.
2. **Desktop Daemon (Node.js)**: mDNS presence, challenge orchestration, token verification, and microphone-based signal analysis.
3. **Web Portal (Next.js)**: account onboarding, trust management, and distribution entrypoints.

## Why this differs from OAuth-only systems

Traditional OAuth validates *identity and consent*, but not *physical presence*. ProximityAuth adds near-field assurance with local signal and contact checks.
