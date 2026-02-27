import type { NodeLatest } from "../types";
import { Droplets, Signal, Zap, Clock, Hash } from "lucide-react";
import { useMemo } from "react";
import { formatIsoDateTime } from "@/lib/time";

interface WaterLevelCardProps {
  data: NodeLatest | null;
  nodeId: string;
}

const STATUS_CONFIG = {
  CRITICAL: {
    label: "Critical",
    color: "text-red-500",
    border: "border-red-200",
    badge: "border-red-300 text-red-500 bg-red-50",
    progress: "bg-red-500",
  },
  WARNING: {
    label: "Warning",
    color: "text-orange-500",
    border: "border-orange-200",
    badge: "border-orange-300 text-orange-500 bg-orange-50",
    progress: "bg-orange-500",
  },
  MODERATE: {
    label: "Moderate",
    color: "text-yellow-500",
    border: "border-yellow-200",
    badge: "border-yellow-300 text-yellow-500 bg-yellow-50",
    progress: "bg-yellow-500",
  },
  NORMAL: {
    label: "Normal",
    color: "text-green-500",
    border: "border-green-200",
    badge: "border-green-300 text-green-600 bg-green-50",
    progress: "bg-green-500",
  },
} as const;

function getStatus(level: number): keyof typeof STATUS_CONFIG {
  if (level < 50) return "CRITICAL";
  if (level < 200) return "WARNING";
  if (level > 300) return "MODERATE";
  return "NORMAL";
}

export function WaterLevelCard({ data, nodeId }: WaterLevelCardProps) {
  const animationKey = useMemo(
    () => (data ? `${data.timestamp_epoch}-${data.water_level_cm}` : "empty"),
    [data],
  );

  if (!data || typeof data !== "object" || !("water_level_cm" in data)) {
    return (
      <div className="bg-white border border-green-100 rounded-xl shadow-sm">
        <div className="px-6 pt-6">
          <p className="text-gray-400 text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const statusKey = getStatus(data.water_level_cm);
  const cfg = STATUS_CONFIG[statusKey];

  const formattedDate = formatIsoDateTime(
    data.timestamp_iso,
    data.timestamp_epoch,
  );

  const progressValue = Math.min((data.water_level_cm / 400) * 100, 100);

  const packetLabel = data.boot_count !== undefined ? "Boot Count" : "Packets";
  const packetValue = data.boot_count ?? data.packet_num;

  return (
    <div
      key={animationKey}
      className={`bg-white border ${cfg.border} rounded-xl shadow-sm transition-all duration-300`}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {nodeId.replace("_", " ")}
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.badge}`}
          >
            <Droplets className="w-3 h-3 mr-1" />
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6 space-y-4">
        {/* Big number */}
        <div>
          <span className={`text-6xl font-black tabular-nums ${cfg.color}`}>
            {data.water_level_cm.toFixed(1)}
          </span>
          <span className="text-gray-400 text-lg font-medium ml-2">cm</span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-green-50">
            <div
              className={`h-full rounded-full transition-all duration-300 ${cfg.progress}`}
              style={{ width: `${progressValue}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-right">
            {progressValue.toFixed(0)}% of 400cm max
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-green-50 rounded-md p-2.5 flex items-center gap-2 border border-green-100">
            <Signal className="w-3.5 h-3.5 text-green-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">RSSI</p>
              <p className="text-sm font-semibold text-gray-700">
                {data.rssi_dbm} dBm
              </p>
            </div>
          </div>

          <div className="bg-green-50 rounded-md p-2.5 flex items-center gap-2 border border-green-100">
            <Zap className="w-3.5 h-3.5 text-green-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">SNR</p>
              <p className="text-sm font-semibold text-gray-700">
                {data.snr_db} dB
              </p>
            </div>
          </div>

          {packetValue !== undefined && (
            <div className="bg-green-50 rounded-md p-2.5 flex items-center gap-2 border border-green-100">
              <Hash className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">{packetLabel}</p>
                <p className="text-sm font-semibold text-gray-700">
                  {packetValue}
                </p>
              </div>
            </div>
          )}

          <div
            className={`${packetValue !== undefined ? "" : "col-span-2"} bg-green-50 rounded-md p-2.5 flex items-center gap-2 border border-green-100`}
          >
            <Clock className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Last Update</p>
              <p className="text-xs font-medium text-gray-600">
                {formattedDate}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
