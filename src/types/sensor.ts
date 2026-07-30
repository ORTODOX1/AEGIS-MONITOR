export type AlarmSeverity = 'Critical' | 'Warning' | 'Caution';

export type SystemName =
  | 'Main Engine'
  | 'Generators'
  | 'Pumps'
  | 'Steering Gear'
  | 'HVAC'
  | 'Fuel System'
  | 'Ballast System';

export type SystemState = 'Running' | 'Standby' | 'Fault' | 'Offline';

export interface SensorReading {
  sensorId: string;
  pgn: number;
  value: number;
  unit: string;
  timestamp: number;
}

/** Frame pushed over WebSocket by the mock data server in `server/index.ts`. */
export interface LiveSnapshot {
  timestamp: number;
  engineRpm: number;
  oilPressureKpa: number;
  coolantTempC: number;
  fuelRateLph: number;
  exhaustTempC: number;
  speedKnots: number;
  shaftPowerKw: number;
}

export interface EngineData {
  rpm: number;
  oilPressureKpa: number;
  coolantTempC: number;
  fuelRateLph: number;
  runningHours: number;
}

export interface AlarmEvent {
  id: string;
  severity: AlarmSeverity;
  message: string;
  source: SystemName;
  timestamp: number;
  acknowledged: boolean;
}

export interface SystemStatus {
  name: SystemName;
  state: SystemState;
  activeSensors: number;
  activeAlarms: number;
}

export interface VesselStatus {
  vesselId: string;
  systems: SystemStatus[];
  engines: EngineData[];
  alarms: AlarmEvent[];
  lastUpdate: number;
}
