import { useState } from "react";

interface SystemItem {
  id: string;
  label: string;
  status: "normal" | "warning" | "critical";
}

interface GaugeProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  status: "normal" | "warning" | "critical";
}

const VESSEL_NAME = "M/V AEGIS PIONEER";

const SYSTEMS: SystemItem[] = [
  { id: "me", label: "Main Engine", status: "normal" },
  { id: "dg1", label: "Diesel Generator No.1", status: "normal" },
  { id: "dg2", label: "Diesel Generator No.2", status: "warning" },
  { id: "dg3", label: "Diesel Generator No.3", status: "normal" },
  { id: "boiler", label: "Auxiliary Boiler", status: "normal" },
  { id: "comp", label: "Air Compressors", status: "normal" },
  { id: "purifier", label: "FO/LO Purifiers", status: "normal" },
  { id: "cooling", label: "Cooling Water System", status: "normal" },
  { id: "steering", label: "Steering Gear", status: "normal" },
  { id: "bilge", label: "Bilge & Ballast", status: "critical" },
];

const GAUGES: GaugeProps[] = [
  { label: "ME RPM", value: 105, unit: "rpm", min: 0, max: 130, status: "normal" },
  { label: "ME Exhaust Temp", value: 347, unit: "\u00b0C", min: 200, max: 500, status: "normal" },
  { label: "LO Pressure", value: 3.2, unit: "bar", min: 0, max: 6, status: "normal" },
  { label: "CW Temp In", value: 36, unit: "\u00b0C", min: 20, max: 50, status: "normal" },
  { label: "DG2 Load", value: 87, unit: "%", min: 0, max: 100, status: "warning" },
  { label: "FO Flow Rate", value: 142, unit: "L/h", min: 0, max: 250, status: "normal" },
  { label: "Bilge Well Level", value: 78, unit: "cm", min: 0, max: 100, status: "critical" },
  { label: "Air Receiver", value: 28.5, unit: "bar", min: 0, max: 30, status: "normal" },
];

const STATUS_COLORS: Record<string, string> = {
  normal: "bg-green-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

const STATUS_BORDER: Record<string, string> = {
  normal: "border-green-700",
  warning: "border-amber-600",
  critical: "border-red-600",
};

const STATUS_TEXT: Record<string, string> = {
  normal: "text-green-400",
  warning: "text-amber-400",
  critical: "text-red-400",
};

function GaugeCard({ label, value, unit, min, max, status }: GaugeProps) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className={`bg-slate-800 border ${STATUS_BORDER[status]} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400 font-medium">{label}</span>
        <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className={`text-3xl font-mono font-bold ${STATUS_TEXT[status]}`}>
          {value}
        </span>
        <span className="text-sm text-slate-500">{unit}</span>
      </div>
      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${STATUS_COLORS[status]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-slate-600">{min}</span>
        <span className="text-xs text-slate-600">{max}</span>
      </div>
    </div>
  );
}

function Sidebar({
  systems,
  selected,
  onSelect,
}: {
  systems: SystemItem[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Systems
        </h2>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {systems.map((sys) => (
          <button
            key={sys.id}
            onClick={() => onSelect(sys.id)}
            className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
              selected === sys.id
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            }`}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[sys.status]}`} />
            <span className="text-sm">{sys.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-500">
          Active Alarms: <span className="text-red-400 font-bold">2</span>
        </div>
      </div>
    </aside>
  );
}

function Header() {
  const now = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-white tracking-wide">{VESSEL_NAME}</h1>
        <span className="text-xs text-slate-500 border-l border-slate-700 pl-4">
          AEGIS-MONITOR v0.1
        </span>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-sm text-slate-400 font-mono">{now}</span>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-400">CONNECTED</span>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [selectedSystem, setSelectedSystem] = useState("me");

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          systems={SYSTEMS}
          selected={selectedSystem}
          onSelect={setSelectedSystem}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Engine Room Overview</h2>
            <p className="text-sm text-slate-500 mt-1">
              Real-time sensor readings -- last update: just now
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {GAUGES.map((gauge) => (
              <GaugeCard key={gauge.label} {...gauge} />
            ))}
          </div>
          <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg p-6 h-64 flex items-center justify-center">
            <p className="text-slate-500 text-sm">
              3D vessel cross-section will render here (Three.js / React Three Fiber)
            </p>
          </div>
          <div className="mt-4 bg-slate-800 border border-slate-700 rounded-lg p-6 h-48 flex items-center justify-center">
            <p className="text-slate-500 text-sm">
              Time-series trend chart will render here (Recharts)
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
