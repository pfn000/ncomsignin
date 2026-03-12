import { useColorScheme } from 'react-native';
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
