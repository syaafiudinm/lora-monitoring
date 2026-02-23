import type { GatewayStatus as GatewayStatusType } from "../types";
import { Activity, Wifi, CheckCircle, AlertCircle, Radio } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GatewayStatusProps {
  gateway: GatewayStatusType | null;
  isOnline: boolean;
}

export function GatewayStatus({ gateway, isOnline }: GatewayStatusProps) {
  if (!gateway) {
    return (
      <Card className="bg-white border-green-100">
        <CardContent className="pt-6">
          <p className="text-gray-400">Loading gateway status...</p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: "Gateway ID",
      value: gateway.gateway_id ?? "—",
      icon: <Radio className="w-4 h-4 text-green-500" />,
      mono: true,
    },
    {
      label: "WiFi RSSI",
      value: gateway.wifi_rssi !== undefined ? `${gateway.wifi_rssi} dBm` : "—",
      icon: <Wifi className="w-4 h-4 text-green-400" />,
    },
    {
      label: "Last Activity",
      value:
        gateway.last_activity !== undefined
          ? `${gateway.last_activity}s ago`
          : "—",
      icon: <Activity className="w-4 h-4 text-green-600" />,
    },
    {
      label: "Packets Received",
      value:
        gateway.total_received !== undefined
          ? String(gateway.total_received)
          : "—",
      valueClass: "text-green-600",
    },
    {
      label: "Failed Packets",
      value:
        gateway.total_failed !== undefined ? String(gateway.total_failed) : "—",
      valueClass: "text-red-500",
    },
  ];

  return (
    <Card className="bg-white border-green-100 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-700">
            Gateway Status
          </CardTitle>
          <Badge
            variant="outline"
            className={
              isOnline
                ? "border-green-400 text-green-600 bg-green-50"
                : "border-red-400 text-red-500 bg-red-50"
            }
          >
            {isOnline ? (
              <CheckCircle className="w-3 h-3 mr-1.5" />
            ) : (
              <AlertCircle className="w-3 h-3 mr-1.5" />
            )}
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
