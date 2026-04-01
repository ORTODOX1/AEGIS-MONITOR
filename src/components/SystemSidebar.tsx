import React from 'react';
import type { SystemStatus, SystemState, SystemName } from '../types/sensor';

interface SystemSidebarProps {
  systems: SystemStatus[];
  selectedSystem: SystemName | null;
  onSelect: (system: SystemName) => void;
}

const STATE_INDICATOR: Record<SystemState, string> = {
  Running: 'bg-green-500',
  Standby: 'bg-yellow-500',
  Fault: 'bg-red-500',
  Offline: 'bg-slate-600',
};

const SystemSidebar: React.FC<SystemSidebarProps> = ({ systems, selectedSystem, onSelect }) => (
  <aside className="w-56 bg-slate-900 border-r border-slate-700 p-3 flex flex-col gap-1">
    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
      Ship Systems
    </h2>
    {systems.map((sys) => {
      const isActive = sys.name === selectedSystem;
      return (
        <button
          key={sys.name}
          onClick={() => onSelect(sys.name)}
          className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors ${
            isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${STATE_INDICATOR[sys.state]}`} />
          <span className="flex-1">{sys.name}</span>
          {sys.activeAlarms > 0 && (
            <span className="text-xs bg-red-800 text-red-200 px-1.5 rounded-full">
              {sys.activeAlarms}
            </span>
          )}
        </button>
      );
    })}
  </aside>
);

export default SystemSidebar;
