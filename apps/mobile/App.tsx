import { useColorScheme } from 'react-native';
import { Button, Provider as PaperProvider, Text } from 'react-native-paper';
import { appTheme } from './src/theme/paperTheme';
import { useEffect, useState } from 'react';
import { discoverDaemons } from './src/services/zeroconf';
import { runPhysicalFallbackChallenge } from './src/services/physicalFallback';

const demoChallenge = {
  challengeId: 'demo-fallback-session',
  issuedAtMs: Date.now(),
  expiresAtMs: Date.now() + 60_000,
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

export default function App() {
  const scheme = useColorScheme();
  const [status, setStatus] = useState('Scanning for desktop daemon...');

  useEffect(() => {
    const stop = discoverDaemons((found) => setStatus(`Found ${found.length} daemon(s)`));
    return stop;
  }, []);

  const handlePhoneTapAuth = async () => {
    try {
      setStatus('Run TNS fallback: hold phone to screen. In noisy rooms vibration intensity auto-scales.');
      const proof = await runPhysicalFallbackChallenge(demoChallenge, 'mobile-demo-device');
      setStatus(`Fallback proof generated: ${proof.challengeId}`);
    } catch (error) {
      setStatus(`Fallback failed: ${(error as Error).message}`);
    }
  };

  return (
    <PaperProvider theme={appTheme(scheme === 'dark')}>
      <Text variant="headlineMedium">ProximityAuth Mobile</Text>
      <Text>{status}</Text>
      <Button mode="contained" onPress={handlePhoneTapAuth} style={{ marginTop: 12 }}>
        Tap Phone To Screen (Fallback Auth)
      </Button>
    </PaperProvider>
  );
}
