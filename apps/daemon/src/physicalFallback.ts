import { fft } from 'fft-js';

type HapticBurst = { durationMs: number; gapAfterMs: number; intensity: number };
type UltrasonicBand = { frequencyHz: number; gain: number };
type NoiseProfile = { rms: number; peak: number; suggestedIntensityScale: number; filteredRms: number };

type PhysicalFallbackChallenge = {
  challengeId: string;
  issuedAtMs: number;
  expiresAtMs: number;
  expectedBands: UltrasonicBand[];
  hapticBursts: HapticBurst[];
  noiseProfile?: NoiseProfile;
};

type PhysicalFallbackProof = {
  challengeId: string;
  deviceId: string;
  issuedAtMs: number;
  compressedHaptics: string;
  ultrasonicBands: UltrasonicBand[];
};

const CHALLENGE_TTL_MS = 60_000;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

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

const calculateRms = (samples: number[]) => {
  const energy = samples.reduce((acc, sample) => acc + sample * sample, 0);
  return Math.sqrt(energy / Math.max(samples.length, 1));
};

const applyNoiseGate = (samples: number[], gate = 0.02) =>
  samples.map((sample) => (Math.abs(sample) < gate ? 0 : sample));

const applySimpleBandPass = (samples: number[], sampleRateHz: number, lowHz: number, highHz: number) => {
  const bins = fft(samples);
  const binWidth = sampleRateHz / Math.max(samples.length, 1);
  const filteredBins = bins.map((pair: [number, number], idx: number) => {
    const freq = idx * binWidth;
    if (freq >= lowHz && freq <= highHz) {
      return pair;
    }
    return [0, 0] as [number, number];
  });

  return filteredBins.map((pair: [number, number]) => pair[0] / samples.length);
};

export const deriveNoiseProfile = (microphoneSamples: number[], sampleRateHz: number): NoiseProfile => {
  const peak = Math.max(...microphoneSamples.map((sample) => Math.abs(sample)), 0);
  const rms = calculateRms(microphoneSamples);
  const filtered = applySimpleBandPass(applyNoiseGate(microphoneSamples), sampleRateHz, 17_500, 20_500);
  const filteredRms = calculateRms(filtered);
  const suggestedIntensityScale = clamp(1 + rms * 2.2 + peak * 0.8, 1, 1.8);

  return { rms, peak, suggestedIntensityScale, filteredRms };
};

export const createPhysicalFallbackChallenge = (noiseProfile?: NoiseProfile): PhysicalFallbackChallenge => {
  const issuedAtMs = Date.now();
  const scale = noiseProfile?.suggestedIntensityScale ?? 1;

export const createPhysicalFallbackChallenge = (): PhysicalFallbackChallenge => {
  const issuedAtMs = Date.now();
  return {
    challengeId: `fallback-${issuedAtMs}`,
    issuedAtMs,
    expiresAtMs: issuedAtMs + CHALLENGE_TTL_MS,
    expectedBands: [
      { frequencyHz: 18250, gain: clamp(0.35 * scale, 0.2, 0.7) },
      { frequencyHz: 19400, gain: clamp(0.3 * scale, 0.2, 0.7) }
    ],
    hapticBursts: [
      { durationMs: 120, gapAfterMs: 70, intensity: clamp(0.35 * scale, 0.2, 1) },
      { durationMs: 180, gapAfterMs: 80, intensity: clamp(0.66 * scale, 0.35, 1) },
      { durationMs: 220, gapAfterMs: 120, intensity: clamp(1 * scale, 0.6, 1) }
    ],
    noiseProfile
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

  const denoised = applySimpleBandPass(applyNoiseGate(microphoneSamples), sampleRateHz, 17_500, 20_500);
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
    const magnitude = spectralMagnitude(denoised, sampleRateHz, band.frequencyHz);
    const normalized = magnitude / denoised.length;
    const magnitude = spectralMagnitude(microphoneSamples, sampleRateHz, band.frequencyHz);
    const normalized = magnitude / microphoneSamples.length;
    return normalized;
  });

  const ultrasonicScore = ultrasonicScores.reduce((a, b) => a + b, 0) / ultrasonicScores.length;
  const tapProximityScore = Math.min(1, Math.max(...microphoneSamples.map((sample) => Math.abs(sample))) * 1.8);

  const accepted = hapticScore >= 0.7 && ultrasonicScore >= 0.008 && tapProximityScore >= 0.55;
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
