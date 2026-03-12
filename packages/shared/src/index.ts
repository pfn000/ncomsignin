export interface ProximityAuthToken {
  sub: string;
  deviceId: string;
  exp: number;
}

export interface SignalVerification {
  normalized: number;
  filteredPeak: number;
}

export interface HapticBurst {
  durationMs: number;
  gapAfterMs: number;
  intensity: number;
}

export interface UltrasonicBand {
  frequencyHz: number;
  gain: number;
}

export interface PhysicalFallbackChallenge {
  challengeId: string;
  issuedAtMs: number;
  expiresAtMs: number;
  expectedBands: UltrasonicBand[];
  hapticBursts: HapticBurst[];
}

export interface PhysicalFallbackProof {
  challengeId: string;
  deviceId: string;
  issuedAtMs: number;
  compressedHaptics: string;
  ultrasonicBands: UltrasonicBand[];
}
