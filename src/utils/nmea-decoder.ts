/**
 * Minimal NMEA 2000 PGN decoder for maritime engine monitoring.
 * Supports a subset of PGNs relevant to propulsion telemetry.
 */

export interface NmeaFrame {
  pgn: number;
  source: number;
  data: Uint8Array;
}

export interface DecodedValue {
  pgn: number;
  field: string;
  value: number;
  unit: string;
}

const PGN_ENGINE_RAPID = 127488;
const PGN_TEMPERATURE = 130312;

function readUint16LE(buf: Uint8Array, offset: number): number {
  return buf[offset] | (buf[offset + 1] << 8);
}

function decodeEngineRapid(frame: NmeaFrame): DecodedValue {
  const instance = frame.data[0];
  const rpmRaw = readUint16LE(frame.data, 1);
  const rpm = rpmRaw * 0.25;
  return { pgn: PGN_ENGINE_RAPID, field: `engine_${instance}_rpm`, value: rpm, unit: 'RPM' };
}

function decodeTemperature(frame: NmeaFrame): DecodedValue {
  const source = frame.data[1];
  const tempRaw = readUint16LE(frame.data, 2);
  const tempKelvin = tempRaw * 0.01;
  const tempCelsius = tempKelvin - 273.15;
  return { pgn: PGN_TEMPERATURE, field: `temp_source_${source}`, value: tempCelsius, unit: 'C' };
}

export function decodeNmeaFrame(frame: NmeaFrame): DecodedValue | null {
  switch (frame.pgn) {
    case PGN_ENGINE_RAPID:
      return decodeEngineRapid(frame);
    case PGN_TEMPERATURE:
      return decodeTemperature(frame);
    default:
      return null;
  }
}

export function isSupported(pgn: number): boolean {
  return pgn === PGN_ENGINE_RAPID || pgn === PGN_TEMPERATURE;
}
