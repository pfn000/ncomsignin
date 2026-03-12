import { fft } from 'fft-js';

type HapticBurst = { durationMs: number; gapAfterMs: number; intensity: number };
type UltrasonicBand = { frequencyHz: number; gain: number };

type PhysicalFallbackChallenge = {
  challengeId: string;
  issuedAtMs: number;
  expiresAtMs: number;
  expectedBands: UltrasonicBand[];
  hapticBursts: HapticBurst[];
};

type PhysicalFallbackProof = {
  challengeId: string;
  deviceId: string;
  issuedAtMs: number;
  compressedHaptics: string;
  ultrasonicBands: UltrasonicBand[];
};

const CHALLENGE_TTL_MS = 60_000;

const decodeHaptics = (compressedHaptics: string): HapticBurst[] => {
  const bursts: HapticBurst[] = [];
  for (let i = 0; i + 7 <= compressedHaptics.length; i += 7) {
    const durationMs = parseInt(compressedHaptics.slice(i, i + 3), 16);
    const gapAfterMs = parseInt(compressedHaptics.slice(i + 3, i + 6), 16);
    const intensity = parseInt(compressedHaptics.slice(i + 6, i + 7), 16) / 15;
    bursts.push({ durationMs, gapAfterMs, intensity });
  }
  return bursts;
};

const spectralMagnitude = (samples: number[], sampleRateHz: number, frequencyHz: number): number => {
  const bins = fft(samples);
  const binIndex = Math.round((frequencyHz / sampleRateHz) * samples.length);
  const [re, im] = bins[Math.min(Math.max(binIndex, 0), bins.length - 1)] ?? [0, 0];
  return Math.hypot(re, im);
};

export const createPhysicalFallbackChallenge = (): PhysicalFallbackChallenge => {
  const issuedAtMs = Date.now();
  return {
    challengeId: `fallback-${issuedAtMs}`,
    issuedAtMs,
    expiresAtMs: issuedAtMs + CHALLENGE_TTL_MS,
    expectedBands: [
      { frequencyHz: 18250, gain: 0.35 },
      { frequencyHz: 19400, gain: 0.3 }
    ],
    hapticBursts: [
      { durationMs: 120, gapAfterMs: 70, intensity: 0.35 },
      { durationMs: 180, gapAfterMs: 80, intensity: 0.66 },
      { durationMs: 220, gapAfterMs: 120, intensity: 1 }
    ]
  };
};

export const verifyPhysicalFallback = (
  challenge: PhysicalFallbackChallenge,
  proof: PhysicalFallbackProof,
  microphoneSamples: number[],
  sampleRateHz: number
) => {
  if (Date.now() > challenge.expiresAtMs) {
    return { accepted: false, reason: 'challenge-expired' };
  }

  if (proof.challengeId !== challenge.challengeId) {
    return { accepted: false, reason: 'challenge-mismatch' };
  }

  const decodedBursts = decodeHaptics(proof.compressedHaptics);
  if (decodedBursts.length !== challenge.hapticBursts.length) {
    return { accepted: false, reason: 'haptic-pattern-mismatch' };
  }

  const hapticError = decodedBursts.reduce((acc, burst, idx) => {
    const expected = challenge.hapticBursts[idx];
    return (
      acc +
      Math.abs(burst.durationMs - expected.durationMs) +
      Math.abs(burst.gapAfterMs - expected.gapAfterMs) +
      Math.abs(burst.intensity - expected.intensity) * 100
    );
  }, 0);

  const hapticScore = Math.max(0, 1 - hapticError / 600);

  const ultrasonicScores = challenge.expectedBands.map((band) => {
    const magnitude = spectralMagnitude(microphoneSamples, sampleRateHz, band.frequencyHz);
    const normalized = magnitude / microphoneSamples.length;
    return normalized;
  });

  const ultrasonicScore = ultrasonicScores.reduce((a, b) => a + b, 0) / ultrasonicScores.length;
  const tapProximityScore = Math.min(1, Math.max(...microphoneSamples.map((sample) => Math.abs(sample))) * 1.8);

  const accepted = hapticScore >= 0.7 && ultrasonicScore >= 0.015 && tapProximityScore >= 0.55;

  return {
    accepted,
    scores: {
      hapticScore,
      ultrasonicScore,
      tapProximityScore
    }
  };
};
