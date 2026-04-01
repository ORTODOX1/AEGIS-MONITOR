import { useState, useCallback, useMemo } from 'react';
import type { AlarmEvent, AlarmSeverity } from '../types/sensor';

interface UseAlarmsResult {
  alarms: AlarmEvent[];
  filteredAlarms: AlarmEvent[];
  activeFilter: AlarmSeverity | null;
  addAlarm: (alarm: AlarmEvent) => void;
  acknowledge: (alarmId: string) => void;
  setFilter: (severity: AlarmSeverity | null) => void;
  clearAcknowledged: () => void;
  unacknowledgedCount: number;
}

export function useAlarms(): UseAlarmsResult {
  const [alarms, setAlarms] = useState<AlarmEvent[]>([]);
  const [activeFilter, setActiveFilter] = useState<AlarmSeverity | null>(null);

  const addAlarm = useCallback((alarm: AlarmEvent) => {
    setAlarms((prev) => [alarm, ...prev]);
  }, []);

  const acknowledge = useCallback((alarmId: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === alarmId ? { ...a, acknowledged: true } : a)),
    );
  }, []);

  const clearAcknowledged = useCallback(() => {
    setAlarms((prev) => prev.filter((a) => !a.acknowledged));
  }, []);

  const setFilter = useCallback((severity: AlarmSeverity | null) => {
    setActiveFilter(severity);
  }, []);

  const filteredAlarms = useMemo(() => {
    if (!activeFilter) return alarms;
    return alarms.filter((a) => a.severity === activeFilter);
  }, [alarms, activeFilter]);

  const unacknowledgedCount = useMemo(
    () => alarms.filter((a) => !a.acknowledged).length,
    [alarms],
  );

  return {
    alarms, filteredAlarms, activeFilter,
    addAlarm, acknowledge, setFilter, clearAcknowledged, unacknowledgedCount,
  };
}
