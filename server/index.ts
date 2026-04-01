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
}

function generateMockSensor(): SensorSnapshot {
  return {
    timestamp: Date.now(),
    engineRpm: 95 + Math.random() * 20,
    oilPressureKpa: 380 + Math.random() * 40,
    coolantTempC: 78 + Math.random() * 8,
    fuelRateLph: 130 + Math.random() * 30,
    exhaustTempC: 320 + Math.random() * 40,
  };
}

// REST endpoints
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
    timestamp: from + i * step,
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

// WebSocket server for real-time sensor streaming
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
  console.log(`[AEGIS] Server running on http://localhost:${PORT}`);
  console.log(`[AEGIS] WebSocket available at ws://localhost:${PORT}/ws`);
});
