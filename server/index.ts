/**
 * AEGIS-MONITOR mock data server.
 *
 * This is a development stand-in for a shipboard data gateway. It does NOT talk
 * to a CAN bus, a PLC or a database -- every value below is randomly generated
 * in-process and nothing is persisted. Its only job is to give the dashboard a
 * realistic-looking stream to render against while the real acquisition layer
 * does not exist yet.
 */
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'node:http';

const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(express.json());

interface SensorSnapshot {
  timestamp: number;
  engineRpm: number;
  oilPressureKpa: number;
  coolantTempC: number;
  fuelRateLph: number;
  exhaustTempC: number;
  speedKnots: number;
  shaftPowerKw: number;
}

function generateMockSensor(): SensorSnapshot {
  return {
    timestamp: Date.now(),
    engineRpm: 95 + Math.random() * 20,
    oilPressureKpa: 380 + Math.random() * 40,
    coolantTempC: 78 + Math.random() * 8,
    // Fuel flow and shaft power are kept mutually consistent so that the SFOC
    // the dashboard derives from them lands in a realistic 160-200 g/kWh band.
    fuelRateLph: 1100 + Math.random() * 150,
    exhaustTempC: 320 + Math.random() * 40,
    speedKnots: 13.5 + Math.random() * 1.5,
    shaftPowerKw: 6200 + Math.random() * 400,
  };
}

// REST endpoints -- all responses are generated, none are read from storage.
app.get('/api/v1/vessels', (_req, res) => {
  res.json([
    { vesselId: 'aegis-001', name: 'M/V AEGIS PIONEER', imo: 'IMO9876543' },
  ]);
});

app.get('/api/v1/vessels/:vesselId/status', (req, res) => {
  const snapshot = generateMockSensor();
  res.json({
    vesselId: req.params.vesselId,
    lastUpdate: snapshot.timestamp,
    engines: [{ rpm: snapshot.engineRpm, oilPressureKpa: snapshot.oilPressureKpa,
      coolantTempC: snapshot.coolantTempC, fuelRateLph: snapshot.fuelRateLph, runningHours: 12450.5 }],
    systems: [],
    alarms: [],
  });
});

app.get('/api/v1/vessels/:vesselId/history', (req, res) => {
  const from = Number(req.query.from) || Date.now() - 3600000;
  const to = Number(req.query.to) || Date.now();
  const points = 60;
  const step = (to - from) / points;
  const data = Array.from({ length: points }, (_, i) => ({
    sensorId: String(req.query.sensorId ?? 'rpm'),
    pgn: 61444,
    value: 95 + Math.random() * 20,
    unit: 'RPM',
    timestamp: Math.round(from + i * step),
  }));
  res.json(data);
});

app.get('/api/v1/vessels/:vesselId/alarms', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const alarms = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
    id: `alarm-${i}`,
    severity: i === 0 ? 'Critical' : 'Warning',
    message: `Mock alarm event #${i + 1}`,
    source: 'Main Engine',
    timestamp: Date.now() - i * 60000,
    acknowledged: i > 2,
  }));
  res.json(alarms);
});

// WebSocket server streaming the generated snapshots once per second.
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  console.log('[AEGIS-WS] Client connected');

  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(generateMockSensor()));
    }
  }, 1000);

  ws.on('error', (err) => {
    console.error('[AEGIS-WS] Error:', err.message);
  });

  ws.on('close', () => {
    clearInterval(interval);
    console.log('[AEGIS-WS] Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`[AEGIS] Mock data server running on http://localhost:${PORT}`);
  console.log(`[AEGIS] WebSocket available at ws://localhost:${PORT}/ws`);
});
