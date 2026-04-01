import React, { useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea,
} from 'recharts';
import type { SensorReading } from '../types/sensor';

interface TrendChartProps {
  data: SensorReading[];
  label: string;
  color?: string;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, label, color = '#38bdf8' }) => {
  const [refLeft, setRefLeft] = useState<number | null>(null);
  const [refRight, setRefRight] = useState<number | null>(null);
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);

  const handleMouseDown = useCallback((e: { activeLabel?: number }) => {
    if (e.activeLabel != null) setRefLeft(e.activeLabel);
  }, []);

  const handleMouseMove = useCallback((e: { activeLabel?: number }) => {
    if (refLeft != null && e.activeLabel != null) setRefRight(e.activeLabel);
  }, [refLeft]);

  const handleMouseUp = useCallback(() => {
    if (refLeft != null && refRight != null) {
      const [left, right] = refLeft < refRight ? [refLeft, refRight] : [refRight, refLeft];
      setZoomDomain([left, right]);
    }
    setRefLeft(null);
    setRefRight(null);
  }, [refLeft, refRight]);

  const resetZoom = () => setZoomDomain(null);

  const domain = zoomDomain ?? undefined;

  return (
    <div className="bg-slate-900 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-slate-300">{label}</h3>
        {zoomDomain && (
          <button onClick={resetZoom} className="text-xs text-sky-400 hover:underline">Reset zoom</button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart
          data={data}
          onMouseDown={handleMouseDown as never}
          onMouseMove={handleMouseMove as never}
          onMouseUp={handleMouseUp}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="timestamp" domain={domain} type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', fontSize: 11 }} />
          <Line type="monotone" dataKey="value" stroke={color} dot={false} strokeWidth={1.5} />
          {refLeft != null && refRight != null && (
            <ReferenceArea x1={refLeft} x2={refRight} strokeOpacity={0.3} fill="#38bdf8" fillOpacity={0.15} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
