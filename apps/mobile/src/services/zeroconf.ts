import Zeroconf, { type Service } from 'react-native-zeroconf';

type FoundCallback = (services: Service[]) => void;

export const discoverDaemons = (onFound: FoundCallback) => {
  const zeroconf = new Zeroconf();
  const services: Service[] = [];

  zeroconf.on('resolved', (service: Service) => {
    services.push(service);
    onFound(services);
  });

  zeroconf.scan('proximityauth', 'tcp', 'local.');

  return () => {
    zeroconf.stop();
    zeroconf.removeDeviceListeners();
  };
};
