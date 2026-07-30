import React from 'react';

/** 'high' alarms when the value rises (temperatures), 'low' when it falls (pressures). */
export type GaugeDirection = 'high' | 'low';

interface GaugeWidgetProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  warningThreshold: number;
  criticalThreshold: number;
  direction?: GaugeDirection;
}

function getArcColor(
  value: number,
  warning: number,
  critical: number,
  direction: GaugeDirection,
): string {
  if (direction === 'low') {
    if (value <= critical) return '#ef4444';
    if (value <= warning) return '#eab308';
    return '#22c55e';
  }
  if (value >= critical) return '#ef4444';
  if (value >= warning) return '#eab308';
  return '#22c55e';
}

const GaugeWidget: React.FC<GaugeWidgetProps> = ({
  label, value, min, max, unit, warningThreshold, criticalThreshold, direction = 'high',
}) => {
  const radius = 40;
  const circumference = Math.PI * radius;
  const clamped = Math.min(Math.max(value, min), max);
  const ratio = (clamped - min) / (max - min);
  const offset = circumference * (1 - ratio);
  const color = getArcColor(value, warningThreshold, criticalThreshold, direction);

  return (
    <div className="flex flex-col items-center p-2">
      <svg width="100" height="60" viewBox="0 0 100 60">
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="#334155"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <text x="50" y="48" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="bold">
          {Math.round(value)}
        </text>
        <text x="50" y="58" textAnchor="middle" fill="#94a3b8" fontSize="8">
          {unit}
        </text>
      </svg>
      <span className="text-xs text-slate-400 mt-1">{label}</span>
    </div>
  );
};

export default GaugeWidget;
