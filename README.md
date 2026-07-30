# AEGIS-MONITOR -- Ship Systems Monitoring Dashboard

![Status](https://img.shields.io/badge/status-early%20prototype-orange?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r170-000000?style=flat-square&logo=threedotjs&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-real--time-010101?style=flat-square)

---

A single-page dashboard for ship power plant telemetry, written by a marine engineer
learning to build the tools he wanted in the engine room.

**What it is today:** a React 19 / TypeScript front end that connects to a WebSocket,
renders one main-engine data stream as gauges, trend charts and browser-evaluated
alarms, and ships with a **mock data server** that generates that stream. There is no
database, no authentication and no connection to real shipboard hardware.

**What it is not:** a certified alarm and monitoring system, or a product. Everything
under [Planned](#planned) is honest about not existing yet.

---

## Table of Contents

- [Implemented](#implemented)
- [Data Interfaces](#data-interfaces)
- [Planned](#planned)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [IMO e-Navigation Notes](#imo-e-navigation-notes)
- [Project Structure](#project-structure)
- [About the Author](#about-the-author)
- [License](#license)

---

## Implemented

### Live sensor gauges
Six SVG half-arc gauges for the main engine channels carried by the incoming
WebSocket frame: speed, lube oil pressure, HT cooling water temperature, exhaust gas
temperature, fuel flow and shaft power. Each gauge has its own operating range and
warning/critical thresholds, and colours the arc green / amber / red. Pressure gauges
alarm on falling values, temperatures on rising ones.

### Alarm panel
Thresholds are evaluated in the browser on every received frame. Crossing a threshold
raises an alarm with a severity, a timestamp and a source system; the duty engineer can
acknowledge it. Severities are **Critical / Warning / Caution**, matching
`AlarmSeverity` in `src/types/sensor.ts`. Alarms live in a Zustand store capped at 500
entries -- they are **held in memory only and lost on reload**. There is no alarm
history, no search and no audible annunciation.

### Trend charts
Recharts line charts over the rolling in-memory buffer (the last 300 frames, roughly
five minutes at 1 Hz). Drag across the plot to zoom into a time range, then reset. No
historical queries, no CSV export.

### Voyage performance panel
Specific fuel oil consumption computed from the streamed fuel flow and shaft power
(`L/h x 980 g/L / kW`), compared against the session average. Fuel burned and distance
run are trapezoidally integrated over the buffered samples, so both are **totals since
the dashboard connected**, not voyage totals. The weather overlay is an explicit
placeholder.

### 3D section view
A React Three Fiber scene with four clickable blocks standing in for machinery spaces
(main engine, generators, pumps, steering gear), with orbit controls. It is a
navigation affordance and a placeholder for real geometry -- **not** a vessel general
arrangement, and sensor values are not projected onto it.

### CAN frame decoders
Standalone, dependency-free TypeScript functions with bounds-checked buffer reads:

| Decoder | Coverage |
|---|---|
| `src/utils/j1939-decoder.ts` | PGN extraction from a 29-bit CAN ID, plus three PGNs: 61444 (engine speed, SPN 190), 65262 (coolant temperature, SPN 110), 65263 (oil pressure, SPN 100). Each result carries its SPN. **FMI is always `null`** -- diagnostic trouble codes per J1939-73 are not parsed. |
| `src/utils/nmea-decoder.ts` | Two NMEA 2000 PGNs: 127488 (engine parameters, rapid update) and 130312 (temperature). |

The decoders are library code and are not yet fed by the UI, which consumes the mock
server's JSON frames directly.

### Mock data server
`server/index.ts` is an Express + `ws` server that **generates every value it returns
with `Math.random()`**. It exposes `/api/v1/vessels`, `.../status`, `.../history` and
`.../alarms`, and streams a snapshot over `/ws` once per second. It reads no bus, opens
no database and persists nothing. It exists so the dashboard has something to render.

---

## Data Interfaces

| Interface | Status | Notes |
|---|---|---|
| **WebSocket** | Working | JSON frames at 1 Hz from the mock server. Auto-reconnect with a retry cap. Point `VITE_WS_URL` at another gateway that speaks the same frame shape (`LiveSnapshot` in `src/types/sensor.ts`). |
| **REST API** | Endpoints exist, data is generated | Typed client in `src/api/client.ts` for vessel list, status, history and alarm log. Not yet called by the dashboard. |
| **NMEA 2000 parser** | Partial | Two PGNs, decode only. No CAN transport. |
| **J1939 parser** | Partial | Three PGNs, SPN values only, no FMI. No CAN transport. |

---

## Planned

Not started or not wired up. Listed so the feature list above stays honest.

- **Persistence** -- TimescaleDB hypertables and continuous aggregates for sensor
  history and a searchable alarm log. A database container is provisioned in
  `docker-compose.yml`, but nothing connects to it and there is no schema yet.
- **Authentication** -- no user model, no sessions, no access control of any kind.
- **Real acquisition layer** -- a gateway process that actually reads CAN and feeds the
  decoders, replacing the mock generator.
- **Modbus TCP** -- polling PLCs and VFDs in the automation network. No client exists.
- **Multi-vessel fleet view** -- shore-side aggregation. No components exist.
- **Historical queries and CSV export** -- currently the charts only see the in-memory
  buffer.
- **Audible alarm annunciation** and per-severity tones.

---

## Tech Stack

### Frontend
- **React 19** + **TypeScript 5** (strict)
- **Tailwind CSS 4** via `@tailwindcss/vite` -- dark theme
- **Three.js / React Three Fiber / drei** -- 3D section view
- **Recharts** -- trend and voyage charts
- **Zustand** -- global state

### Backend (mock)
- **Node.js 22**, **Express 5**, **ws** -- generated telemetry only

### Tooling
- **Vite 6** -- build and dev server
- **ESLint 9** (flat config) + **Prettier**
- **Docker Compose** -- containerized deployment
- **GitHub Actions** -- `npm ci`, lint, build on every push and PR

---

## Architecture

```
                    Browser (React SPA, Vite build)
                                  |
              +-------------------+-------------------+
              |                                       |
        [WebSocket /ws]                        [REST /api/v1]
        1 Hz JSON frames                       client written,
              |                                not yet called
              |                                       |
              +-------------------+-------------------+
                                  |
                    server/index.ts -- MOCK SERVER
                    Express 5 + ws, port 3001
                    every value from Math.random()
                                  |
                                  X
                    no database, no CAN bus,
                    no persistence  (see Planned)
```

In the browser, `useWebSocket` feeds a rolling buffer in `App.tsx`; thresholds are
evaluated per frame and raised alarms land in the Zustand store that the alarm panel
and the system sidebar read from.

---

## Getting Started

### Prerequisites

- Node.js >= 22, npm >= 10
- Docker and Docker Compose (optional, only for the container workflow)

### Installation

```bash
git clone https://github.com/hermandoronin/AEGIS-MONITOR.git
cd AEGIS-MONITOR
npm install
```

### Development

```bash
cp .env.example .env      # optional, sensible defaults are built in
npm run server            # mock data server on :3001
npm run dev               # dashboard on :5173
```

The dashboard is at `http://localhost:5173`. Without the mock server running it
renders, reports `DISCONNECTED` and tells you no telemetry has arrived -- it never
fabricates readings in the browser.

Other scripts: `npm run build` (`tsc -b` then `vite build`), `npm run lint`,
`npm run preview`, `npm run format`.

### Environment Variables

All optional; see [`.env.example`](.env.example).

| Variable | Default | Used by |
|---|---|---|
| `PORT` | `3001` | mock server |
| `VITE_WS_URL` | `ws://<host>:3001/ws` | dashboard |
| `VITE_VESSEL_NAME` | `M/V AEGIS PIONEER` | dashboard header |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | -- | `docker compose` database container only |

`docker compose` will refuse to start unless `POSTGRES_PASSWORD` is set.

---

## Deployment

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

| Service | Build file | Port | Description |
|---|---|---|---|
| `frontend` | `Dockerfile` | 80 | Nginx serving the built React app with SPA fallback |
| `backend` | `Dockerfile.server` | 3001 | Mock data server (Express + WebSocket) |

The development compose file (`docker-compose.yml`) additionally starts a
`timescale/timescaledb` container. It is provisioned for the planned persistence layer
and is not used by any code in this repository yet.

### Hardware Notes

- **Bridge / ECR display**: any modern x86 or ARM device with a browser; Chromium-based
  browsers give the best WebGL performance for the 3D view.
- **Shipboard server**: a fanless industrial PC is more than enough for the current
  Node process.

---

## IMO e-Navigation Notes

This is a hobby project, not a certified system, and it claims no compliance. These are
the references that shaped the design:

- **MSC.1/Circ.1512** -- software quality assurance and human-centred design for
  e-Navigation. The influence here is the visual language: high contrast for bridge and
  ECR lighting, dense but low-clutter layouts, one consistent colour code for status.
- **IEC 62923** -- bridge alert management. The alarm panel currently uses three
  severities (Critical / Warning / Caution), which is a **subset** of the IEC 62923
  category set (Emergency / Alarm / Warning / Caution) and does not implement its
  escalation, silencing or responsibility-transfer behaviour.
- **IEC 61162-450** -- maritime digital interfaces. Referenced while shaping the sensor
  data model; no 61162-450 transport is implemented.

> AEGIS-MONITOR is a visualization experiment. It does not replace, and must not be
> relied on in place of, the certified alarm and monitoring system required by SOLAS
> Chapter II-1.

---

## Project Structure

```
AEGIS-MONITOR/
  .github/workflows/ci.yml   -- npm ci, lint, build
  public/
    favicon.svg
  server/
    index.ts                 -- mock Express + WebSocket server
  src/
    api/
      client.ts              -- typed REST client (not yet called by the UI)
    components/
      AlarmPanel.tsx
      GaugeWidget.tsx
      Header.tsx
      ShipModel.tsx
      SystemSidebar.tsx
      TrendChart.tsx
      VoyagePerformance.tsx
    hooks/
      useAlarms.ts           -- standalone alarm-state hook
      useWebSocket.ts        -- reconnecting WebSocket client
    store/
      useVesselStore.ts      -- Zustand store (connection, alarms, selection)
    types/
      sensor.ts              -- shared sensor, alarm and system types
    utils/
      formatters.ts
      j1939-decoder.ts
      nmea-decoder.ts
    App.tsx
    main.tsx
    index.css
    vite-env.d.ts
  .env.example
  Dockerfile                 -- frontend build + nginx
  Dockerfile.server          -- mock server
  docker-compose.yml
  docker-compose.prod.yml
  eslint.config.js
  index.html
  package.json
  tsconfig.json / tsconfig.app.json / tsconfig.node.json
  vite.config.ts
```

---

## About the Author

Marine engineer, currently learning software by building the tools I wished I had on
watch. Years of watchkeeping -- general cargo ships through to cruise liners -- made
the gap between raw machinery data and an actionable picture very obvious. This
repository is where I work on closing it. It is early, and the README above is
deliberately blunt about how early.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
