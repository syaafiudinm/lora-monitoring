// Matches the actual Firebase Realtime Database structure
// from digides-lora-default-rtdb-export.json

// --- Gateway ---

export interface Gateway {
  ip: string;
  rssi_wifi: number;
  status: "ONLINE" | "OFFLINE" | string;
  timestamp_epoch: number;
  timestamp_iso: string;
}

// --- Node history entry (stored under nodes/<NODE_ID>/history/<push_id>) ---

export interface HistoryEntry {
  rssi_dbm: number;
  snr_db: number;
  timestamp_epoch: number;
  timestamp_iso: string;
  wl_cm: number;
  // Optional fields that vary per node
  boot_count?: number;
  packet_num?: number;
}

// History entry with its Firebase push-key id attached
export interface HistoryRecord extends HistoryEntry {
  id: string;
}

// --- Node latest reading (stored under nodes/<NODE_ID>/latest) ---

export interface NodeLatest {
  rssi_dbm: number;
  snr_db: number;
  timestamp_epoch: number;
  timestamp_iso: string;
  wl_cm: number;
  // Optional fields that vary per node
  boot_count?: number;
  packet_num?: number;
}

// --- Full node object ---

export interface Node {
  history: Record<string, HistoryEntry>;
  latest: NodeLatest;
}

// --- Root database shape ---

export interface FloodData {
  gateway: Gateway;
  nodes: Record<string, Node>;
}
