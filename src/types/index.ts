export interface WaterLevel {
  gateway_id: string;
  pkt_count: number;
  rssi_gw: number;
  snr_gw: number;
  timestamp: number;
  water_level_cm: number;
}

export interface Node {
  history: Record<string, HistoryEntry>;
  latest: WaterLevel;
}

// History entries use `ts` not `timestamp`
export interface HistoryEntry {
  rssi_gw: number;
  snr_gw: number;
  ts: number;
  water_level_cm: number;
}

export interface HistoryRecord extends HistoryEntry {
  id: string;
}

// Firebase structure: gateway.status.{ gateway_id, ... }
export interface GatewayStatus {
  gateway_id: string;
  last_activity: number;
  total_failed: number;
  total_received: number;
  wifi_rssi: number;
}

export interface Gateway {
  status: GatewayStatus;
}

export interface FloodData {
  gateway: Gateway;
  nodes: Record<string, Node>;
}
