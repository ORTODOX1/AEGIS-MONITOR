import React, { useEffect, useState } from 'react';
import type { ConnectionStatus } from '../hooks/useWebSocket';

interface HeaderProps {
  vesselName: string;
  connectionStatus: ConnectionStatus;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = ['Overview', 'Voyage', 'Alarms', 'Diagnostics'] as const;

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: 'CONNECTING',
  open: 'CONNECTED',
  closed: 'DISCONNECTED',
  error: 'ERROR',
};

const STATUS_DOT: Record<ConnectionStatus, string> = {
  connecting: 'bg-yellow-500 animate-pulse',
  open: 'bg-green-500',
  closed: 'bg-red-500',
  error: 'bg-red-500 animate-pulse',
};

const STATUS_TEXT: Record<ConnectionStatus, string> = {
  connecting: 'text-yellow-400',
  open: 'text-green-400',
  closed: 'text-red-400',
  error: 'text-red-400',
};

const Header: React.FC<HeaderProps> = ({ vesselName, connectionStatus, activeTab, onTabChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateString = currentTime.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-bold text-white tracking-wide">{vesselName}</h1>
        <nav className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === tab
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-sm text-slate-300 font-mono">{timeString}</div>
          <div className="text-xs text-slate-500">{dateString}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[connectionStatus]}`} />
          <span className={`text-xs font-medium ${STATUS_TEXT[connectionStatus]}`}>
            {STATUS_LABEL[connectionStatus]}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
