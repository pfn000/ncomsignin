import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const encodeHapticBursts = (bursts: HapticBurst[]): string =>
  bursts
    .map((burst) => {
      const duration = clamp(Math.round(burst.durationMs), 0, 4095).toString(16).padStart(3, '0');
      const gap = clamp(Math.round(burst.gapAfterMs), 0, 4095).toString(16).padStart(3, '0');
      const intensity = clamp(Math.round(burst.intensity * 15), 0, 15).toString(16);
      return `${duration}${gap}${intensity}`;
    })
    .join('');

const applyAdaptiveIntensity = (bursts: HapticBurst[], noiseProfile?: NoiseProfile): HapticBurst[] => {
  const scale = noiseProfile?.suggestedIntensityScale ?? 1;
  return bursts.map((burst) => ({
    ...burst,
    intensity: clamp(burst.intensity * scale, 0.2, 1)
  }));
};

const createMixedUltrasonicTone = async (bands: UltrasonicBand[], durationMs: number) => {
  const sampleRate = 44100;
  const sampleCount = Math.floor((durationMs / 1000) * sampleRate);
  const pcm = new Int16Array(sampleCount);

  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / sampleRate;
    const sample = bands.reduce((acc, band) => acc + Math.sin(2 * Math.PI * band.frequencyHz * t) * band.gain, 0);
    pcm[i] = Math.round(clamp(sample, -1, 1) * 32767);
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false
  });

  return pcm;
};

export const runPhysicalFallbackChallenge = async (
  challenge: PhysicalFallbackChallenge,
  deviceId: string
): Promise<PhysicalFallbackProof> => {
  const now = Date.now();
  if (now > challenge.expiresAtMs) {
    throw new Error('physical fallback challenge expired');
  }

  const adaptiveBursts = applyAdaptiveIntensity(challenge.hapticBursts, challenge.noiseProfile);

  for (const burst of adaptiveBursts) {
    if (burst.intensity >= 0.66) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (burst.intensity >= 0.33) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    await wait(burst.durationMs + burst.gapAfterMs);
  }

  await createMixedUltrasonicTone(challenge.expectedBands, 1200);

  return {
    challengeId: challenge.challengeId,
    deviceId,
    issuedAtMs: now,
    compressedHaptics: encodeHapticBursts(adaptiveBursts),
    ultrasonicBands: challenge.expectedBands
  };
};
