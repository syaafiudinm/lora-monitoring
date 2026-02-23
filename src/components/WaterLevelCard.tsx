import type { WaterLevel } from "../types";
import { Droplets, Signal, Zap, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface WaterLevelCardProps {
  data: WaterLevel | null;
  nodeId: string;
}

const STATUS_CONFIG = {
  CRITICAL: {
    label: "Critical",
    color: "text-red-500",
    border: "border-red-200",
    badge: "border-red-300 text-red-500 bg-red-50",
  },
  WARNING: {
    label: "Warning",
    color: "text-orange-500",
    border: "border-orange-200",
    badge: "border-orange-300 text-orange-500 bg-orange-50",
  },
  MODERATE: {
    label: "Moderate",
    color: "text-yellow-500",
    border: "border-yellow-200",
    badge: "border-yellow-300 text-yellow-500 bg-yellow-50",
  },
  NORMAL: {
    label: "Normal",
    color: "text-green-500",
    border: "border-green-200",
    badge: "border-green-300 text-green-600 bg-green-50",
  },
} as const;

function getStatus(level: number): keyof typeof STATUS_CONFIG {
  if (level > 300) return "CRITICAL";
  if (level > 200) return "WARNING";
  if (level > 100) return "MODERATE";
  return "NORMAL";
}

export function WaterLevelCard({ data, nodeId }: WaterLevelCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setIsUpdating(true);
    const timer = setTimeout(() => setIsUpdating(false), 600);
    return () => clearTimeout(timer);
  }, [data]);

  if (!data || typeof data !== "object" || !("water_level_cm" in data)) {
    return (
      <Card className="bg-white border-green-100">
        <CardContent className="pt-6">
          <p className="text-gray-400 text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const statusKey = getStatus(data.water_level_cm);
  const cfg = STATUS_CONFIG[statusKey];
  const date = new Date(data.timestamp * 1000);
  const progressValue = Math.min((data.water_level_cm / 400) * 100, 100);

  return (
    <Card
      className={`bg-white border ${cfg.border} shadow-sm transition-all duration-300 ${isUpdating ? "ring-2 ring-green-300/50" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {nodeId}
          </CardTitle>
          <Badge variant="outline" className={cfg.badge}>
            <Droplets className="w-3 h-3 mr-1" />
            {cfg.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Big number */}
        <div
          className={`transition-transform duration-300 ${isUpdating ? "scale-105" : "scale-100"}`}
        >
          <span className={`text-6xl font-black tabular-nums ${cfg.color}`}>
            {data.water_level_cm.toFixed(1)}
          </span>
          <span className="text-gray-400 text-lg font-medium ml-2">cm</span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <Progress value={progressValue} className="h-2 bg-green-50" />
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
                {data.rssi_gw} dBm
              </p>
            </div>
          </div>

          <div className="bg-green-50 rounded-md p-2.5 flex items-center gap-2 border border-green-100">
            <Zap className="w-3.5 h-3.5 text-green-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">SNR</p>
              <p className="text-sm font-semibold text-gray-700">
                {data.snr_gw}
              </p>
            </div>
          </div>

          <div className="col-span-2 bg-green-50 rounded-md p-2.5 flex items-center gap-2 border border-green-100">
            <Clock className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Last Update</p>
              <p className="text-xs font-medium text-gray-600">
                {date.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
