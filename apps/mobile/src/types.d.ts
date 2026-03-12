declare module 'react-native-zeroconf' {
  export type Service = {
    name: string;
    host?: string;
    addresses?: string[];
    port?: number;
    fqdn?: string;
    txt?: Record<string, string>;
  };

  export default class Zeroconf {
    on(event: 'resolved', cb: (service: Service) => void): void;
    scan(type: string, protocol: string, domain?: string): void;
    stop(): void;
    removeDeviceListeners(): void;
  }
}
