# AEGIS-MONITOR -- Ship Systems Monitoring Dashboard

![Status](https://img.shields.io/badge/status-in%20development-orange?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r170-000000?style=flat-square&logo=threedotjs&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-real--time-010101?style=flat-square)

---

Real-time monitoring dashboard for ship power plant and auxiliary systems. Built for bridge and engine control room displays aboard vessels of any class. AEGIS-MONITOR ingests live sensor telemetry over WebSocket, decodes industrial bus protocols (CAN J1939, NMEA 2000, Modbus TCP), and renders operational data as gauges, time-series charts, 3D cross-section overlays, and alarm panels -- giving watchkeepers immediate situational awareness of machinery health.

Designed by a marine engineer, for marine engineers.

---

## Table of Contents

- [Features](#features)
- [Data Interfaces](#data-interfaces)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [IMO e-Navigation Compliance](#imo-e-navigation-compliance)
- [Project Structure](#project-structure)
- [About the Author](#about-the-author)
- [License](#license)

---

## Features

### Real-Time Sensor Visualization
Circular gauges, bar indicators, and sparkline micro-charts update at sub-second intervals. Each sensor widget shows current value, unit, operating range, and alarm thresholds. Color-coded status (green / yellow / red) follows standard engine room conventions.

### 3D Ship Cross-Section Model
Interactive Three.js model of the vessel's general arrangement. Click on any compartment -- engine room, auxiliary machinery space, steering gear room, cargo holds -- to drill down into the systems installed there. Sensor overlays are projected directly onto the 3D geometry, giving spatial context to numerical data.

### Engine Room Overview
Dedicated layout for the main propulsion plant: main engine cylinder pressures and exhaust temperatures, turbocharger RPM, generator load sharing, cooling water and lubricating oil circuits, fuel oil system, compressed air system, bilge and ballast pumps. Each subsystem is a self-contained widget panel.

### Alarm Management Panel
Centralized alarm list with severity levels (Critical / Warning / Caution / Status). Alarms are timestamped, categorized by system, and support acknowledgement by the duty engineer. Alarm history is persisted and searchable. Audible alerts with configurable tones per severity.

### Historical Trend Viewer
Time-series explorer with zoom and pan controls. Overlay multiple sensor channels on a single axis. Query historical data by time range, system, or specific sensor tag. Export to CSV for shore-side reporting. Powered by TimescaleDB continuous aggregates for fast range queries over months of data.

### CAN Bus Message Decoder
Built-in parsers for J1939 and NMEA 2000 protocol frames. Raw PGN (Parameter Group Number) messages are decoded into human-readable values with correct units and scaling factors. SPN (Suspect Parameter Number) and FMI (Failure Mode Identifier) codes are resolved to plain-text descriptions per SAE J1939-73 diagnostic definitions.

### Voyage Performance Dashboard
Fuel consumption rate, specific fuel oil consumption (SFOC), vessel speed over ground and through water, weather correlation (wind, sea state, current), and hull/propeller fouling trend indicators. Noon report data aggregation. Benchmarking against design-condition baselines.

### Multi-Vessel Fleet View
Shore-side operations center layout displaying fleet-wide status at a glance. Each vessel card shows position, heading, speed, main engine load, and active alarm count. Click through to any vessel's full dashboard. Designed for fleet managers and technical superintendents.

---

## Data Interfaces

| Interface | Protocol | Purpose |
|---|---|---|
| **WebSocket** | `ws://` / `wss://` | Real-time sensor streams from the shipboard data gateway. Binary or JSON frames at configurable intervals (100 ms -- 10 s). |
| **REST API** | HTTP/HTTPS | Historical data queries, alarm log retrieval, configuration management, user authentication. |
| **NMEA 2000 Parser** | CAN 2.0B | Built-in decoder for PGN messages per NMEA 2000 standard. Supports engine, generator, tank, and navigation PGNs. |
| **J1939 Parser** | CAN 2.0B | SPN/FMI interpretation per SAE J1939. Covers propulsion engine, transmission, and auxiliary equipment diagnostics. |
| **Modbus TCP Client** | TCP/IP | Direct polling of PLCs, VFDs, and other Modbus-compatible devices in the engine room automation network. Register map configuration via JSON. |

---

## Tech Stack

### Frontend
- **React 19** -- component architecture, concurrent features
- **TypeScript 5** -- strict type safety across the entire codebase
- **Tailwind CSS 4** -- utility-first styling, dark theme by default
- **Three.js / React Three Fiber** -- 3D vessel model rendering
- **Recharts / D3.js** -- time-series charts, gauges, sparklines
- **Zustand** -- lightweight global state management

### Backend
- **Node.js 22** -- server runtime
- **Express** -- REST API framework
- **ws** -- WebSocket server for real-time data relay
- **TimescaleDB** -- time-series optimized PostgreSQL for sensor history

### Tooling
- **Vite** -- build and dev server
- **ESLint / Prettier** -- code quality
- **Docker Compose** -- containerized deployment

---

## Architecture

```
                         Shore Network / Ship LAN
                                  |
                    +-------------+-------------+
                    |                           |
              [REST API]                  [WebSocket]
              Port 3001                   Port 3002
                    |                           |
           +--------+---------+        +--------+---------+
           |  Express Server  |        |   WS Relay Server |
           |  (historical)    |        |   (real-time)      |
           +--------+---------+        +--------+---------+
                    |                           |
                    +-------------+-------------+
                                  |
                          [TimescaleDB]
                           Port 5432
                                  |
              +-------------------+-------------------+
              |                   |                   |
        [NMEA 2000         [J1939 Parser]      [Modbus TCP
         Parser]                                 Client]
              |                   |                   |
              +-------------------+-------------------+
                                  |
                     Shipboard Sensor Network
                    (CAN bus / Modbus / Serial)
```

The frontend connects to both the WebSocket relay (for live data) and the REST API (for historical queries, alarm logs, configuration). The backend services decode raw industrial bus traffic into normalized JSON, persist readings to TimescaleDB, and fan out to connected dashboard clients.

---

## Screenshots

> Screenshots will be added as the UI components are completed.

| View | Description |
|---|---|
| Engine Room Overview | Main engine, generators, and auxiliary systems at a glance |
| 3D Cross-Section | Interactive vessel model with sensor overlays |
| Alarm Panel | Active alarms with severity and acknowledgement controls |
| Trend Viewer | Multi-channel time-series with zoom and pan |
| Fleet View | Shore-side multi-vessel operations dashboard |

---

## Getting Started

### Prerequisites

- Node.js >= 22
- Docker and Docker Compose (for TimescaleDB)
- npm >= 10

### Installation

```bash
git clone https://github.com/anthropic-maritime/AEGIS-MONITOR.git
cd AEGIS-MONITOR
npm install
```

### Development

```bash
# Start TimescaleDB
docker compose up -d timescaledb

# Start the backend API and WebSocket server
npm run server

# Start the frontend dev server
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
TIMESCALE_HOST=localhost
TIMESCALE_PORT=5432
TIMESCALE_DB=aegis
TIMESCALE_USER=aegis
TIMESCALE_PASSWORD=<your-password>

# WebSocket
WS_PORT=3002

# API
API_PORT=3001

# Ship identity
VESSEL_NAME=M/V AEGIS PIONEER
VESSEL_IMO=9876543
```

---

## Deployment

Production deployment uses Docker Compose to orchestrate three services:

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Services

| Service | Image | Port | Description |
|---|---|---|---|
| `dashboard` | `aegis-monitor/dashboard` | 80 | Nginx serving the built React app |
| `api` | `aegis-monitor/api` | 3001 | Express REST API + WebSocket relay |
| `timescaledb` | `timescale/timescaledb` | 5432 | TimescaleDB with continuous aggregates |

### Hardware Recommendations

- **Bridge / ECR display**: Any modern x86 or ARM device with a browser. Chromium-based browsers recommended for WebGL performance.
- **Shipboard server**: Fanless industrial PC, 8 GB RAM minimum. SSD storage for TimescaleDB.
- **Shore-side**: Standard server or cloud VM for fleet view aggregation.

---

## IMO e-Navigation Compliance

AEGIS-MONITOR is designed with awareness of the IMO e-Navigation strategy and relevant guidelines:

- **MSC.1/Circ.1512** -- Guideline on Software Quality Assurance and Human-Centred Design for e-Navigation. The dashboard follows human-centred design principles: high-contrast color schemes for bridge use, minimal cognitive load layouts, consistent alarm presentation.
- **IEC 62923** -- Maritime navigation and radiocommunication equipment -- Bridge alert management. The alarm panel implements alert categories (Emergency, Alarm, Warning, Caution) consistent with IEC 62923 definitions.
- **IEC 61162-450** -- Maritime digital interfaces. Data models are aligned with IEC 61162-450 lightweight Ethernet sentence structures where applicable.
- **Class society requirements** -- Alarm and monitoring system outputs are structured to support documentation requirements from DNV, Lloyd's Register, Bureau Veritas, and other classification societies.

> Note: AEGIS-MONITOR is a visualization and monitoring tool. It does not replace certified alarm and monitoring systems (AMS) required by SOLAS Chapter II-1 Regulation 48-56. It is intended as a supplementary decision-support tool.

---

## Project Structure

```
AEGIS-MONITOR/
  src/
    components/
      gauges/          -- Circular gauge, bar indicator, sparkline
      charts/          -- Time-series chart, trend viewer
      alarms/          -- Alarm panel, alarm card, alarm history
      model3d/         -- Three.js vessel cross-section
      fleet/           -- Multi-vessel fleet view components
      layout/          -- Header, sidebar, main content area
    services/
      websocket.ts     -- WebSocket client manager
      api.ts           -- REST API client
      parsers/
        nmea2000.ts    -- NMEA 2000 PGN decoder
        j1939.ts       -- J1939 SPN/FMI decoder
        modbus.ts      -- Modbus TCP register reader
    stores/
      sensorStore.ts   -- Zustand store for live sensor state
      alarmStore.ts    -- Zustand store for alarm management
      vesselStore.ts   -- Zustand store for vessel metadata
    types/
      sensor.ts        -- Sensor data type definitions
      alarm.ts         -- Alarm type definitions
      vessel.ts        -- Vessel and fleet type definitions
      protocol.ts      -- Protocol message type definitions
    App.tsx
    main.tsx
  server/
    index.ts           -- Express + WebSocket server entry point
    routes/
      sensors.ts       -- Historical sensor data endpoints
      alarms.ts        -- Alarm log endpoints
      vessels.ts       -- Vessel registry endpoints
    decoders/
      nmea2000.ts      -- Server-side NMEA 2000 decoder
      j1939.ts         -- Server-side J1939 decoder
      modbus.ts        -- Modbus TCP polling service
    db/
      schema.sql       -- TimescaleDB hypertable definitions
      migrations/      -- Database migration scripts
  docker-compose.yml
  docker-compose.prod.yml
  package.json
  tsconfig.json
  vite.config.ts
  tailwind.config.ts
  README.md
```

---

## About the Author

Marine engineer building the tools I wish I had in the engine room. Years of watchkeeping aboard vessels -- from general cargo ships to modern cruise liners -- made it clear that the gap between raw machinery data and actionable insight is where software should live. AEGIS-MONITOR is part of a broader effort to bring modern web technology to maritime engineering operations, where reliable real-time visualization can make the difference between a routine watch and an emergency.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
