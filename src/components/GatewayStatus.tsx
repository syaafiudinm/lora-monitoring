import type { Gateway as GatewayData } from "../types";
import {
  Activity,
  Wifi,
  CheckCircle,
  AlertCircle,
  Globe,
  Clock,
} from "lucide-react";
import { formatIsoDateTime } from "@/lib/time";

interface GatewayStatusProps {
  gateway: GatewayData | null;
}

export function GatewayStatus({ gateway }: GatewayStatusProps) {
  if (!gateway) {
    return (
      <div className="bg-white border border-green-100 rounded-xl shadow-sm">
        <div className="px-6 pt-6">
          <p className="text-gray-400">Loading gateway status...</p>
        </div>
      </div>
    );
  }

  const isOnline = gateway.status === "ONLINE";

  const lastSeen = formatIsoDateTime(
    gateway.timestamp_iso,
    gateway.timestamp_epoch,
  );

  const wifiStrength =
    gateway.rssi_wifi !== undefined
      ? gateway.rssi_wifi > -50
        ? "Excellent"
        : gateway.rssi_wifi > -60
          ? "Good"
          : gateway.rssi_wifi > -70
            ? "Fair"
            : "Weak"
      : null;

  const stats = [
    {
      label: "Status",
      value: gateway.status ?? "—",
      icon: isOnline ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <AlertCircle className="w-4 h-4 text-red-500" />
      ),
      valueClass: isOnline ? "text-green-600" : "text-red-500",
    },
    {
      label: "IP Address",
      value: gateway.ip ?? "—",
      icon: <Globe className="w-4 h-4 text-green-500" />,
      mono: true,
    },
    {
      label: "WiFi RSSI",
      value: gateway.rssi_wifi !== undefined ? `${gateway.rssi_wifi} dBm` : "—",
      subtitle: wifiStrength,
      icon: <Wifi className="w-4 h-4 text-green-400" />,
    },
    {
      label: "Last Activity",
      value: lastSeen,
      icon: <Clock className="w-4 h-4 text-green-600" />,
    },
  ];

  return (
    <div className="bg-white border border-green-100 rounded-xl shadow-sm">
      <div className="px-6 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" />
            Gateway Status
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
              isOnline
                ? "border-green-400 text-green-600 bg-green-50"
                : "border-red-400 text-red-500 bg-red-50"
            }`}
          >
            {isOnline ? (
              <CheckCircle className="w-3 h-3 mr-1.5" />
            ) : (
              <AlertCircle className="w-3 h-3 mr-1.5" />
            )}
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-green-50 rounded-lg p-3 border border-green-100"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                {stat.icon}
                <p className="text-xs text-gray-400 font-medium">
                  {stat.label}
                </p>
              </div>
              <p
                className={`text-sm font-semibold ${stat.mono ? "font-mono" : ""} ${stat.valueClass ?? "text-gray-700"}`}
              >
                {stat.value}
              </p>
              {stat.subtitle && (
                <p className="text-xs text-gray-400 mt-0.5">{stat.subtitle}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
