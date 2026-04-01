import type { VesselStatus, AlarmEvent, SensorReading } from '../types/sensor';

interface VesselListItem {
  vesselId: string;
  name: string;
  imo: string;
}

interface HistoricalQuery {
  vesselId: string;
  sensorId: string;
  from: number;
  to: number;
}

interface ApiError {
  status: number;
  message: string;
}

const DEFAULT_BASE_URL = '/api/v1';

class AegisApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    if (!response.ok) {
      const error: ApiError = {
        status: response.status,
        message: `Request failed: ${response.statusText}`,
      };
      throw error;
    }

    return response.json() as Promise<T>;
  }

  async fetchVesselList(): Promise<VesselListItem[]> {
    return this.request<VesselListItem[]>('/vessels');
  }

  async fetchVesselStatus(vesselId: string): Promise<VesselStatus> {
    return this.request<VesselStatus>(`/vessels/${encodeURIComponent(vesselId)}/status`);
  }

  async fetchHistoricalData(query: HistoricalQuery): Promise<SensorReading[]> {
    const params = new URLSearchParams({
      sensorId: query.sensorId,
      from: String(query.from),
      to: String(query.to),
    });
    return this.request<SensorReading[]>(
      `/vessels/${encodeURIComponent(query.vesselId)}/history?${params}`
    );
  }

  async fetchAlarmHistory(vesselId: string, limit = 100): Promise<AlarmEvent[]> {
    return this.request<AlarmEvent[]>(
      `/vessels/${encodeURIComponent(vesselId)}/alarms?limit=${limit}`
    );
  }
}

export const apiClient = new AegisApiClient();
export { AegisApiClient };
export type { VesselListItem, HistoricalQuery, ApiError };
