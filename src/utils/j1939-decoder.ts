/**
 * SAE J1939 CAN frame decoder for marine diesel engine diagnostics.
 * Extracts SPN (Suspect Parameter Number) values from 8-byte CAN data.
 */

export interface CanFrame {
  id: number;
  data: Uint8Array;
}

export interface J1939Parameter {
  spn: number;
  name: string;
  value: number;
  unit: string;
  fmi: number | null;
}

const PGN_MASK = 0x03FFFF00;

export function extractPgn(canId: number): number {
  return (canId & PGN_MASK) >>> 8;
}

function readUint16LE(buf: Uint8Array, offset: number): number {
  if (offset + 1 >= buf.length) {
    throw new RangeError(`Buffer overflow: need offset ${offset + 1}, have ${buf.length}`);
  }
  return buf[offset] | (buf[offset + 1] << 8);
}

/** PGN 61444 - Electronic Engine Controller 1 */
function decodeEec1(data: Uint8Array): J1939Parameter {
  if (data.length < 5) {
    throw new RangeError(`EEC1 requires >= 5 bytes, got ${data.length}`);
  }
  const raw = readUint16LE(data, 3);
  const rpm = raw * 0.125;
  return { spn: 190, name: 'Engine Speed', value: rpm, unit: 'RPM', fmi: null };
}

/** PGN 65262 - Engine Temperature 1 */
function decodeEngineTemp(data: Uint8Array): J1939Parameter {
  if (data.length < 1) {
    throw new RangeError(`EngineTemp requires >= 1 byte, got ${data.length}`);
  }
  const raw = data[0];
  const tempC = raw - 40;
  return { spn: 110, name: 'Engine Coolant Temperature', value: tempC, unit: 'C', fmi: null };
}

/** PGN 65263 - Engine Fluid Level/Pressure */
function decodeOilPressure(data: Uint8Array): J1939Parameter {
  if (data.length < 4) {
    throw new RangeError(`OilPressure requires >= 4 bytes, got ${data.length}`);
  }
  const raw = data[3];
  const pressureKpa = raw * 4;
  return { spn: 100, name: 'Engine Oil Pressure', value: pressureKpa, unit: 'kPa', fmi: null };
}

const DECODERS: Record<number, (data: Uint8Array) => J1939Parameter> = {
  61444: decodeEec1,
  65262: decodeEngineTemp,
  65263: decodeOilPressure,
};

export function decodeJ1939Frame(frame: CanFrame): J1939Parameter | null {
  const pgn = extractPgn(frame.id);
  const decoder = DECODERS[pgn];
  return decoder ? decoder(frame.data) : null;
}

export function isSupportedPgn(pgn: number): boolean {
  return pgn in DECODERS;
}
