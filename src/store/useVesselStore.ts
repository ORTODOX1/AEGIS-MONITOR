import { create } from 'zustand';
import type { EngineData, AlarmEvent, SystemName, SystemStatus } from '../types/sensor';
import type { ConnectionStatus } from '../hooks/useWebSocket';

interface VesselState {
  vesselId: string;
  connectionStatus: ConnectionStatus;
  selectedSystem: SystemName | null;
  engines: EngineData[];
  alarms: AlarmEvent[];
  systems: SystemStatus[];

  setConnectionStatus: (status: ConnectionStatus) => void;
  selectSystem: (system: SystemName | null) => void;
  updateEngineData: (index: number, data: Partial<EngineData>) => void;
  addAlarm: (alarm: AlarmEvent) => void;
  acknowledgeAlarm: (alarmId: string) => void;
  updateSystems: (systems: SystemStatus[]) => void;
  setVesselId: (id: string) => void;
}

export const useVesselStore = create<VesselState>((set) => ({
  vesselId: '',
  connectionStatus: 'connecting',
  selectedSystem: null,
  engines: [],
  alarms: [],
  systems: [],

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  selectSystem: (system) => set({ selectedSystem: system }),

  updateEngineData: (index, data) =>
    set((state) => {
      if (index < 0 || index >= state.engines.length) {
        return state;
      }
      const engines = [...state.engines];
      if (engines[index]) {
        engines[index] = { ...engines[index], ...data };
      }
      return { engines };
    }),

  addAlarm: (alarm) =>
    set((state) => ({
      alarms: [alarm, ...state.alarms].slice(0, 500),
    })),

  acknowledgeAlarm: (alarmId) =>
    set((state) => ({
      alarms: state.alarms.map((a) =>
        a.id === alarmId ? { ...a, acknowledged: true } : a
      ),
    })),

  updateSystems: (systems) => set({ systems }),

  setVesselId: (id) => set({ vesselId: id }),
}));
