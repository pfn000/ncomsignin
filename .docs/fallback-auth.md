# Physical Fallback Authentication

For older devices lacking UWB or mDNS, ProximityAuth supports Tap-N-Sign:

1. Daemon derives ambient noise profile from mic samples.
2. Challenge is scaled (`suggestedIntensityScale`) so haptics can be stronger in loud rooms.
3. User taps phone to screen and mobile emits compressed haptics + mixed ultrasonic bands.
4. Daemon verifies with filtering:
   - noise gate,
   - ultrasonic band-pass emphasis,
   - haptic timing decode,
   - near-field impulse score.
5. On success daemon issues short-lived extension handshake session for gated autofill.
