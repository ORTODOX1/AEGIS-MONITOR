import React, { useState } from 'react';
import type { AlarmEvent, AlarmSeverity } from '../types/sensor';

interface AlarmPanelProps {
  alarms: AlarmEvent[];
  onAcknowledge: (alarmId: string) => void;
}

const SEVERITY_COLORS: Record<AlarmSeverity, string> = {
  Critical: 'bg-red-900 border-red-500',
  Warning: 'bg-yellow-900 border-yellow-500',
  Caution: 'bg-blue-900 border-blue-400',
};

const AlarmPanel: React.FC<AlarmPanelProps> = ({ alarms, onAcknowledge }) => {
  const [filter, setFilter] = useState<AlarmSeverity | 'All'>('All');

  const filtered = filter === 'All'
    ? alarms
    : alarms.filter((a) => a.severity === filter);

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-900 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-sm font-semibold text-slate-200">Alarms</h2>
        {(['All', 'Critical', 'Warning', 'Caution'] as const).map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`text-xs px-2 py-0.5 rounded ${
              filter === level ? 'bg-slate-600 text-white' : 'text-slate-400'
            }`}
          >
            {level}
          </button>
        ))}
      </div>
      <ul className="flex flex-col gap-1 max-h-64 overflow-y-auto">
        {filtered.map((alarm) => (
          <li
            key={alarm.id}
            className={`flex items-center justify-between border-l-2 px-2 py-1 rounded text-xs ${SEVERITY_COLORS[alarm.severity]}`}
          >
            <div>
              <span className="text-slate-300">{new Date(alarm.timestamp).toLocaleTimeString()}</span>
              <span className="ml-2 text-slate-100">{alarm.message}</span>
            </div>
            {!alarm.acknowledged && (
              <button
                onClick={() => onAcknowledge(alarm.id)}
                className="ml-2 text-xs px-2 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-200"
              >
                ACK
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AlarmPanel;
