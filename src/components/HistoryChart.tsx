import type { HistoryRecord } from "../types";
import { BarChart2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HistoryChartProps {
  history: HistoryRecord[];
  nodeId: string;
}

export function HistoryChart({ history, nodeId }: HistoryChartProps) {
  if (history.length === 0) {
    return (
      <Card className="bg-white border-green-100">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-32 text-gray-300">
            <BarChart2 className="w-8 h-8 mb-2" />
            <p className="text-sm">No history data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by `ts` field (history uses ts, not timestamp)
  const sortedHistory = [...history].sort((a, b) => a.ts - b.ts);
  const last24 = sortedHistory.slice(-24);

  const maxLevel = Math.max(...last24.map((h) => h.water_level_cm));
  const minLevel = Math.min(...last24.map((h) => h.water_level_cm));
  const avgLevel =
    last24.reduce((s, h) => s + h.water_level_cm, 0) / last24.length;
  const range = maxLevel - minLevel || 1;

  // Trend
  const firstHalf = last24.slice(0, Math.floor(last24.length / 2));
  const secondHalf = last24.slice(Math.floor(last24.length / 2));
  const firstAvg =
    firstHalf.reduce((s, h) => s + h.water_level_cm, 0) /
    (firstHalf.length || 1);
  const secondAvg =
    secondHalf.reduce((s, h) => s + h.water_level_cm, 0) /
    (secondHalf.length || 1);
  const trend = secondAvg - firstAvg;

  const TrendIcon = trend > 2 ? TrendingUp : trend < -2 ? TrendingDown : Minus;
  const trendColor =
    trend > 2
      ? "text-red-500"
      : trend < -2
        ? "text-green-500"
        : "text-gray-400";

  return (
    <Card className="bg-white border-green-100 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-green-500" />
            {nodeId}
          </CardTitle>
          <Badge
            variant="outline"
            className="border-green-200 text-gray-500 bg-green-50"
          >
            <TrendIcon className={`w-3 h-3 mr-1 ${trendColor}`} />
            {trend > 0 ? "+" : ""}
            {trend.toFixed(1)} cm trend
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bar chart */}
        <div className="relative h-48 bg-green-50 rounded-lg border border-green-100 p-3">
          {/* Grid lines */}
          <div className="absolute inset-3 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-full border-t border-green-100" />
            ))}
          </div>

          {/* Bars */}
          <div className="relative h-full flex items-end gap-0.5">
            {last24.map((record, index) => {
              const normalized =
                ((record.water_level_cm - minLevel) / range) * 100;
              const date = new Date(record.ts * 1000);
              const level = record.water_level_cm;

              const barColor =
                level > 300
                  ? "bg-red-400"
                  : level > 200
                    ? "bg-orange-400"
                    : level > 100
                      ? "bg-yellow-400"
                      : "bg-green-400";

              return (
                <div
                  key={record.id || index}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                    <div className="bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                      {record.water_level_cm.toFixed(1)} cm
                      <br />
                      <span className="text-gray-300">
                        {date.getHours()}:00
                      </span>
                    </div>
                    <div className="w-1.5 h-1.5 bg-gray-700 rotate-45 -mt-0.5" />
                  </div>

                  <div
                    className={`w-full ${barColor} rounded-t-sm transition-all duration-300 hover:brightness-110`}
                    style={{ height: `${Math.max(normalized, 2)}%` }}
                  />

                  {index % 6 === 0 && (
                    <span className="absolute -bottom-5 text-[10px] text-gray-400">
                      {date.getHours()}:00
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 pt-4">
          {[
            { label: "Max", value: maxLevel.toFixed(1), color: "text-red-500" },
            {
              label: "Avg",
              value: avgLevel.toFixed(1),
              color: "text-green-500",
            },
            {
              label: "Min",
              value: minLevel.toFixed(1),
              color: "text-green-600",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-green-50 rounded-md p-2.5 text-center border border-green-100"
            >
              <p className="text-xs text-gray-400 mb-0.5">{stat.label}</p>
              <p className={`text-sm font-bold tabular-nums ${stat.color}`}>
                {stat.value}{" "}
                <span className="text-xs font-normal text-gray-400">cm</span>
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
