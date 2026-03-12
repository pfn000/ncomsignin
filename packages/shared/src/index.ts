export interface ProximityAuthToken {
  sub: string;
  deviceId: string;
  exp: number;
}

export interface SignalVerification {
  normalized: number;
  filteredPeak: number;
}
