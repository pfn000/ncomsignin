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
import { Provider as PaperProvider, Text } from 'react-native-paper';
import { appTheme } from './src/theme/paperTheme';
import { useEffect, useState } from 'react';
import { discoverDaemons } from './src/services/zeroconf';

export default function App() {
  const scheme = useColorScheme();
  const [status, setStatus] = useState('Scanning for desktop daemon...');

  useEffect(() => {
    const stop = discoverDaemons((found) => setStatus(`Found ${found.length} daemon(s)`));
    return stop;
  }, []);

  return (
    <PaperProvider theme={appTheme(scheme === 'dark')}>
      <Text variant="headlineMedium">ProximityAuth Mobile</Text>
      <Text>{status}</Text>
    </PaperProvider>
  );
}
