import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Header from './components/Header';
import SystemSidebar from './components/SystemSidebar';
import GaugeWidget from './components/GaugeWidget';
import ShipModel from './components/ShipModel';
import TrendChart from './components/TrendChart';
import AlarmPanel from './components/AlarmPanel';
import VoyagePerformance from './components/VoyagePerformance';
import { useWebSocket } from './hooks/useWebSocket';
import { useVesselStore } from './store/useVesselStore';
import type {
  AlarmSeverity,
  LiveSnapshot,
  SensorReading,
  SystemName,
  SystemStatus,
} from './types/sensor';

const VESSEL_NAME = import.meta.env.VITE_VESSEL_NAME ?? 'M/V AEGIS PIONEER';
const WS_URL =
  import.meta.env.VITE_WS_URL ?? `ws://${window.location.hostname}:3001/ws`;

/** Rolling window kept in memory; nothing is persisted between reloads. */
const HISTORY_LIMIT = 300;

/** Marine diesel oil, used to convert volumetric fuel flow into mass flow. */
const FUEL_DENSITY_G_PER_L = 980;

type Direction = 'high' | 'low';

interface Channel {
  key: Exclude<keyof LiveSnapshot, 'timestamp'>;
  label: string;
  unit: string;
  min: number;
  max: number;
  warning: number;
  critical: number;
  direction: Direction;
  /** J1939 PGN when the bundled decoder covers this parameter, 0 otherwise. */
  pgn: number;
}

const CHANNELS: Channel[] = [
  { key: 'engineRpm', label: 'ME Speed', unit: 'rpm', min: 0, max: 130, warning: 112, critical: 120, direction: 'high', pgn: 61444 },
  { key: 'oilPressureKpa', label: 'LO Pressure', unit: 'kPa', min: 0, max: 600, warning: 350, critical: 300, direction: 'low', pgn: 65263 },
  { key: 'coolantTempC', label: 'HT CW Temp', unit: '°C', min: 20, max: 110, warning: 84, critical: 92, direction: 'high', pgn: 65262 },
  { key: 'exhaustTempC', label: 'Exh Gas Temp', unit: '°C', min: 100, max: 500, warning: 350, critical: 400, direction: 'high', pgn: 0 },
  { key: 'fuelRateLph', label: 'FO Flow', unit: 'L/h', min: 0, max: 1400, warning: 1220, critical: 1300, direction: 'high', pgn: 0 },
  { key: 'shaftPowerKw', label: 'Shaft Power', unit: 'kW', min: 0, max: 8000, warning: 6500, critical: 7000, direction: 'high', pgn: 0 },
];

const SYSTEM_NAMES: SystemName[] = [
  'Main Engine',
  'Generators',
  'Pumps',
  'Steering Gear',
  'HVAC',
  'Fuel System',
  'Ballast System',
];

function evaluate(value: number, channel: Channel): AlarmSeverity | null {
  if (channel.direction === 'low') {
    if (value <= channel.critical) return 'Critical';
    if (value <= channel.warning) return 'Warning';
    return null;
  }
  if (value >= channel.critical) return 'Critical';
  if (value >= channel.warning) return 'Warning';
  return null;
}

/** Trapezoidal integration of a per-hour rate over the buffered samples. */
function integrate(history: LiveSnapshot[], pick: (s: LiveSnapshot) => number): number {
  let total = 0;
  for (let i = 1; i < history.length; i += 1) {
    const prev = history[i - 1];
    const current = history[i];
    const hours = (current.timestamp - prev.timestamp) / 3_600_000;
    total += ((pick(prev) + pick(current)) / 2) * hours;
  }
  return total;
}

function sfoc(snapshot: LiveSnapshot): number {
  if (snapshot.shaftPowerKw <= 0) return 0;
  return (snapshot.fuelRateLph * FUEL_DENSITY_G_PER_L) / snapshot.shaftPowerKw;
}

function toReadings(history: LiveSnapshot[], channel: Channel): SensorReading[] {
  return history.map((snapshot) => ({
    sensorId: channel.key,
    pgn: channel.pgn,
    value: Number(snapshot[channel.key].toFixed(2)),
    unit: channel.unit,
    timestamp: snapshot.timestamp,
  }));
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-slate-200 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function NoDataNotice() {
  return (
    <div className="bg-slate-800 border border-dashed border-slate-600 rounded-lg p-8 text-center">
      <p className="text-slate-300 text-sm font-medium">No telemetry received yet</p>
      <p className="text-slate-500 text-xs mt-2">
        The dashboard renders live WebSocket frames only. Start the bundled mock data
        server with <code className="text-sky-400">npm run server</code>, or point{' '}
        <code className="text-sky-400">VITE_WS_URL</code> at a real gateway.
      </p>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [history, setHistory] = useState<LiveSnapshot[]>([]);
  const lastSeverity = useRef<Record<string, AlarmSeverity | null>>({});

  const selectedSystem = useVesselStore((s) => s.selectedSystem);
  const selectSystem = useVesselStore((s) => s.selectSystem);
  const alarms = useVesselStore((s) => s.alarms);
  const addAlarm = useVesselStore((s) => s.addAlarm);
  const acknowledgeAlarm = useVesselStore((s) => s.acknowledgeAlarm);
  const setConnectionStatus = useVesselStore((s) => s.setConnectionStatus);

  const { lastMessage, status } = useWebSocket<LiveSnapshot>({ url: WS_URL });

  useEffect(() => {
    setConnectionStatus(status);
  }, [status, setConnectionStatus]);

  useEffect(() => {
    if (!lastMessage) return;

    setHistory((prev) => [...prev, lastMessage].slice(-HISTORY_LIMIT));

    for (const channel of CHANNELS) {
      const severity = evaluate(lastMessage[channel.key], channel);
      if (severity && severity !== lastSeverity.current[channel.key]) {
        addAlarm({
          id: `${channel.key}-${lastMessage.timestamp}`,
          severity,
          message: `${channel.label} ${lastMessage[channel.key].toFixed(1)} ${channel.unit}`,
          source: 'Main Engine',
          timestamp: lastMessage.timestamp,
          acknowledged: false,
        });
      }
      lastSeverity.current[channel.key] = severity;
    }
  }, [lastMessage, addAlarm]);

  const latest = history.length > 0 ? history[history.length - 1] : null;

  const systems = useMemo<SystemStatus[]>(
    () =>
      SYSTEM_NAMES.map((name) => ({
        name,
        // The mock gateway only streams main engine telemetry; the rest have no source.
        state: name === 'Main Engine' && latest ? 'Running' : 'Offline',
        activeSensors: name === 'Main Engine' && latest ? CHANNELS.length : 0,
        activeAlarms: alarms.filter((a) => a.source === name && !a.acknowledged).length,
      })),
    [alarms, latest],
  );

  const voyage = useMemo(() => {
    if (history.length === 0) {
      return { current: 0, average: 0, fuel: 0, distance: 0 };
    }
    const values = history.map(sfoc).filter((v) => v > 0);
    return {
      current: sfoc(history[history.length - 1]),
      average: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      fuel: integrate(history, (s) => s.fuelRateLph),
      distance: integrate(history, (s) => s.speedKnots),
    };
  }, [history]);

  const fuelData = useMemo(
    () =>
      history.map((s) => ({
        timestamp: s.timestamp,
        consumptionLph: Number(s.fuelRateLph.toFixed(1)),
        speedKnots: Number(s.speedKnots.toFixed(2)),
      })),
    [history],
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-white">
      <Header
        vesselName={VESSEL_NAME}
        connectionStatus={status}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className="flex flex-1 overflow-hidden">
        <SystemSidebar
          systems={systems}
          selectedSystem={selectedSystem}
          onSelect={selectSystem}
        />
        <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {activeTab === 'Overview' && (
            <>
              {latest ? (
                <Panel title={`Main Engine — live readings (${CHANNELS.length} channels)`}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {CHANNELS.map((channel) => (
                      <GaugeWidget
                        key={channel.key}
                        label={channel.label}
                        value={latest[channel.key]}
                        min={channel.min}
                        max={channel.max}
                        unit={channel.unit}
                        warningThreshold={channel.warning}
                        criticalThreshold={channel.critical}
                        direction={channel.direction}
                      />
                    ))}
                  </div>
                </Panel>
              ) : (
                <NoDataNotice />
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Panel title={`Vessel sections${selectedSystem ? ` — ${selectedSystem}` : ''}`}>
                  <ShipModel onSystemClick={selectSystem} />
                </Panel>
                <Panel title="Active alarms">
                  <AlarmPanel alarms={alarms} onAcknowledge={acknowledgeAlarm} />
                </Panel>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {CHANNELS.slice(0, 2).map((channel) => (
                  <Panel key={channel.key} title={`${channel.label} trend`}>
                    <TrendChart
                      data={toReadings(history, channel)}
                      label={`${channel.label} (${channel.unit})`}
                    />
                  </Panel>
                ))}
              </div>
            </>
          )}

          {activeTab === 'Voyage' &&
            (latest ? (
              <VoyagePerformance
                fuelData={fuelData}
                currentSfoc={voyage.current}
                averageSfoc={voyage.average}
                totalFuelConsumed={voyage.fuel}
                distanceNm={voyage.distance}
              />
            ) : (
              <NoDataNotice />
            ))}

          {activeTab === 'Alarms' && (
            <Panel title="Alarm list (current session)">
              <AlarmPanel alarms={alarms} onAcknowledge={acknowledgeAlarm} />
              <p className="text-xs text-slate-500 mt-3">
                Alarms are evaluated in the browser from the live threshold table and are
                held in memory only -- they are lost on reload.
              </p>
            </Panel>
          )}
        </main>
      </div>
    </div>
  );
}
