import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface FuelDataPoint {
  timestamp: number;
  consumptionLph: number;
  speedKnots: number;
}

interface VoyagePerformanceProps {
  fuelData: FuelDataPoint[];
  currentSfoc: number;
  averageSfoc: number;
  totalFuelConsumed: number;
  distanceNm: number;
}

function formatTimeTick(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

const VoyagePerformance: React.FC<VoyagePerformanceProps> = ({
  fuelData, currentSfoc, averageSfoc, totalFuelConsumed, distanceNm,
}) => {
  const sfocDelta = useMemo(() => currentSfoc - averageSfoc, [currentSfoc, averageSfoc]);
  const sfocSign = sfocDelta >= 0 ? '+' : '';
  const sfocColor = sfocDelta <= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-slate-200 mb-4">Voyage Performance</h2>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="bg-slate-900 rounded p-3">
          <div className="text-xs text-slate-500 mb-1">Current SFOC</div>
          <div className="text-xl font-mono font-bold text-sky-400">{currentSfoc.toFixed(1)}</div>
          <div className="text-xs text-slate-500">g/kWh</div>
        </div>
        <div className="bg-slate-900 rounded p-3">
          <div className="text-xs text-slate-500 mb-1">SFOC vs Average</div>
          <div className={`text-xl font-mono font-bold ${sfocColor}`}>
            {sfocSign}{sfocDelta.toFixed(1)}
          </div>
          <div className="text-xs text-slate-500">g/kWh</div>
        </div>
        <div className="bg-slate-900 rounded p-3">
          <div className="text-xs text-slate-500 mb-1">Total Fuel</div>
          <div className="text-xl font-mono font-bold text-slate-200">{totalFuelConsumed.toFixed(0)}</div>
          <div className="text-xs text-slate-500">litres</div>
        </div>
        <div className="bg-slate-900 rounded p-3">
          <div className="text-xs text-slate-500 mb-1">Distance</div>
          <div className="text-xl font-mono font-bold text-slate-200">{distanceNm.toFixed(1)}</div>
          <div className="text-xs text-slate-500">NM</div>
        </div>
      </div>

      <div className="mb-2 text-xs text-slate-400">Fuel Consumption / Speed Over Ground</div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={fuelData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="timestamp" tickFormatter={formatTimeTick} tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis yAxisId="fuel" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis yAxisId="speed" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', fontSize: 11 }} />
          <Area yAxisId="fuel" type="monotone" dataKey="consumptionLph" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} />
          <Area yAxisId="speed" type="monotone" dataKey="speedKnots" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.1} />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-3 p-3 bg-slate-900 rounded border border-dashed border-slate-700">
        <span className="text-xs text-slate-500">Weather overlay: wind, sea state, current data (pending API integration)</span>
      </div>
    </div>
  );
};

export default VoyagePerformance;
