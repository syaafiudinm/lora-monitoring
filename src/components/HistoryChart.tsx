import type { HistoryRecord } from "../types";
import { BarChart2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { formatIsoTime, extractIsoHour, extractIsoDate } from "@/lib/time";

interface HistoryChartProps {
  history: HistoryRecord[];
  nodeId: string;
}

type ViewMode = "default" | "hourly";

interface HourlyDataPoint {
  label: string;
  avg: number;
  min: number;
  max: number;
  count: number;
  sortKey: string;
}

export function HistoryChart({ history, nodeId }: HistoryChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("default");

  const handleViewChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  // Sort all history by timestamp_epoch ascending
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => a.timestamp_epoch - b.timestamp_epoch),
    [history],
  );

  // Aggregate data into hourly buckets
  const hourlyData = useMemo<HourlyDataPoint[]>(() => {
    if (sortedHistory.length === 0) return [];

    const buckets = new Map<
      string,
      {
        sum: number;
        min: number;
        max: number;
        count: number;
        date: string;
        hour: number;
      }
    >();

    for (const r of sortedHistory) {
      const date = extractIsoDate(r.timestamp_iso, r.timestamp_epoch);
      const hour = extractIsoHour(r.timestamp_iso, r.timestamp_epoch);
      const key = `${date}-${String(hour).padStart(2, "0")}`;

      const existing = buckets.get(key);
      if (existing) {
        existing.sum += r.wl_cm;
        existing.min = Math.min(existing.min, r.wl_cm);
        existing.max = Math.max(existing.max, r.wl_cm);
        existing.count += 1;
      } else {
        buckets.set(key, {
          sum: r.wl_cm,
          min: r.wl_cm,
          max: r.wl_cm,
          count: 1,
          date,
          hour,
        });
      }
    }

    const points: HourlyDataPoint[] = [];
    for (const [key, bucket] of buckets) {
      const dateParts = bucket.date.match(/(\d{4})-(\d{2})-(\d{2})/);
      const dayMonth = dateParts
        ? `${dateParts[3]}/${dateParts[2]}`
        : bucket.date;
      const hourStr = String(bucket.hour).padStart(2, "0");

      points.push({
        label: `${dayMonth} ${hourStr}:00`,
        avg: parseFloat((bucket.sum / bucket.count).toFixed(1)),
        min: parseFloat(bucket.min.toFixed(1)),
        max: parseFloat(bucket.max.toFixed(1)),
        count: bucket.count,
        sortKey: key,
      });
    }

    points.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    return points;
  }, [sortedHistory]);

  // ── Derived data based on view mode ──

  const categories = useMemo(() => {
    if (viewMode === "hourly") {
      return hourlyData.map((d) => d.label);
    }
    return sortedHistory.map((r) =>
      formatIsoTime(r.timestamp_iso, r.timestamp_epoch),
    );
  }, [viewMode, hourlyData, sortedHistory]);

  const seriesData = useMemo(() => {
    if (viewMode === "hourly") {
      return hourlyData.map((d) => d.avg);
    }
    return sortedHistory.map((r) => parseFloat(r.wl_cm.toFixed(1)));
  }, [viewMode, hourlyData, sortedHistory]);

  const dataLength =
    viewMode === "hourly" ? hourlyData.length : sortedHistory.length;

  // Stats
  const { maxLevel, minLevel, avgLevel } = useMemo(() => {
    if (viewMode === "hourly") {
      if (hourlyData.length === 0)
        return { maxLevel: 0, minLevel: 0, avgLevel: 0 };
      const max = Math.max(...hourlyData.map((h) => h.max));
      const min = Math.min(...hourlyData.map((h) => h.min));
      const avg = hourlyData.reduce((s, h) => s + h.avg, 0) / hourlyData.length;
      return {
        maxLevel: parseFloat(max.toFixed(1)),
        minLevel: parseFloat(min.toFixed(1)),
        avgLevel: parseFloat(avg.toFixed(1)),
      };
    }
    if (sortedHistory.length === 0)
      return { maxLevel: 0, minLevel: 0, avgLevel: 0 };
    const max = Math.max(...sortedHistory.map((h) => h.wl_cm));
    const min = Math.min(...sortedHistory.map((h) => h.wl_cm));
    const avg =
      sortedHistory.reduce((s, h) => s + h.wl_cm, 0) / sortedHistory.length;
    return {
      maxLevel: parseFloat(max.toFixed(1)),
      minLevel: parseFloat(min.toFixed(1)),
      avgLevel: parseFloat(avg.toFixed(1)),
    };
  }, [viewMode, hourlyData, sortedHistory]);

  // Trend
  const trend = useMemo(() => {
    if (viewMode === "hourly") {
      if (hourlyData.length < 2) return 0;
      const mid = Math.floor(hourlyData.length / 2);
      const firstAvg =
        hourlyData.slice(0, mid).reduce((s, h) => s + h.avg, 0) / mid;
      const secondAvg =
        hourlyData.slice(mid).reduce((s, h) => s + h.avg, 0) /
        (hourlyData.length - mid);
      return secondAvg - firstAvg;
    }
    if (sortedHistory.length < 2) return 0;
    const mid = Math.floor(sortedHistory.length / 2);
    const firstAvg =
      sortedHistory.slice(0, mid).reduce((s, h) => s + h.wl_cm, 0) / mid;
    const secondAvg =
      sortedHistory.slice(mid).reduce((s, h) => s + h.wl_cm, 0) /
      (sortedHistory.length - mid);
    return secondAvg - firstAvg;
  }, [viewMode, hourlyData, sortedHistory]);

  // Chart options
  const chartOptions = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: "line",
        height: 300,
        toolbar: {
          show: true,
          offsetX: 0,
          offsetY: -8,
          tools: {
            download: false,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
          autoSelected: "zoom",
        },
        zoom: {
          enabled: true,
          type: "x",
          autoScaleYaxis: true,
        },
        fontFamily: "inherit",
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 400,
        },
      },
      title: { text: undefined },
      dataLabels: { enabled: false },
      colors: ["#16a34a"],
      stroke: {
        lineCap: "round",
        curve: "smooth",
        width: 3,
      },
      markers: {
        size: dataLength <= 30 ? 4 : dataLength <= 60 ? 2 : 0,
        strokeWidth: 0,
        hover: { size: 7, sizeOffset: 3 },
      },
      xaxis: {
        axisTicks: { show: false },
        axisBorder: { show: false },
        labels: {
          show: dataLength <= 40,
          style: {
            colors: "#616161",
            fontSize: "11px",
            fontFamily: "inherit",
            fontWeight: 400,
          },
          rotate: -45,
          rotateAlways: dataLength > 6,
        },
        categories,
        tooltip: { enabled: false },
      },
      yaxis: {
        labels: {
          style: {
            colors: "#616161",
            fontSize: "12px",
            fontFamily: "inherit",
            fontWeight: 400,
          },
          formatter: (val: number) => `${val.toFixed(1)}`,
        },
        title: {
          text: "cm",
          style: {
            color: "#9ca3af",
            fontSize: "12px",
            fontWeight: 400,
          },
        },
      },
      grid: {
        show: true,
        borderColor: "#e5e7eb",
        strokeDashArray: 5,
        xaxis: { lines: { show: true } },
        padding: { top: 5, right: 20 },
      },
      fill: { opacity: 0.8 },
      tooltip:
        viewMode === "hourly"
          ? {
              enabled: true,
              shared: true,
              intersect: false,
              theme: "dark",
              custom: ({
                dataPointIndex,
              }: {
                series: number[][];
                seriesIndex: number;
                dataPointIndex: number;
                w: unknown;
              }) => {
                const point = hourlyData[dataPointIndex];
                if (!point) return "";
                return `
                  <div style="padding: 8px 12px; font-size: 12px; line-height: 1.6;">
                    <div style="font-weight: 600; margin-bottom: 4px;">${point.label}</div>
                    <div>Rata²: <b>${point.avg} cm</b></div>
                    <div>Min: ${point.min} cm · Maks: ${point.max} cm</div>
                    <div style="color: #9ca3af; margin-top: 2px;">${point.count} data</div>
                  </div>
                `;
              },
            }
          : {
              enabled: true,
              shared: true,
              intersect: false,
              theme: "dark",
              x: {
                show: true,
              },
              y: {
                formatter: (val: number) => `${val.toFixed(1)} cm`,
              },
              marker: {
                show: true,
              },
            },
    }),
    [categories, dataLength, viewMode, hourlyData],
  );

  const series = useMemo(
    () => [
      {
        name: viewMode === "hourly" ? "Rata² Level Air" : "Level Air",
        data: seriesData,
      },
    ],
    [seriesData, viewMode],
  );

  // Early return AFTER all hooks
  if (history.length === 0) {
    return (
      <div className="bg-white border border-green-100 rounded-xl shadow-sm">
        <div className="px-6 pt-6 pb-6">
          <div className="flex flex-col items-center justify-center h-32 text-gray-300">
            <BarChart2 className="w-8 h-8 mb-2" />
            <p className="text-sm">Tidak ada data riwayat</p>
          </div>
        </div>
      </div>
    );
  }

  const TrendIcon = trend > 2 ? TrendingUp : trend < -2 ? TrendingDown : Minus;
  const trendColor =
    trend > 2
      ? "text-red-500"
      : trend < -2
        ? "text-green-500"
        : "text-gray-400";

  const subtitle =
    viewMode === "hourly" ? "Rata-rata level air per jam" : "Riwayat level air";

  const readingLabel =
    viewMode === "hourly"
      ? `${hourlyData.length} jam · ${history.length} data`
      : `${history.length} data`;

  return (
    <div className="bg-white border border-green-100 shadow-md rounded-xl">
      {/* Header */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-base font-semibold text-gray-900">
                {nodeId.replace("_", " ")}
              </div>
              <p className="text-sm font-normal text-gray-500">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-green-200 text-gray-500 bg-green-50 px-2 py-0.5 text-xs font-medium w-fit">
              <TrendIcon className={`w-3 h-3 mr-1 ${trendColor}`} />
              {trend > 0 ? "+" : ""}
              {trend.toFixed(1)} cm tren
            </span>
            <span className="inline-flex items-center rounded-full border border-gray-200 text-gray-400 bg-gray-50 px-2 py-0.5 text-xs font-medium">
              {readingLabel}
            </span>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit mt-4">
          <button
            onClick={() => handleViewChange("default")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${
              viewMode === "default"
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => handleViewChange("hourly")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${
              viewMode === "hourly"
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Per Jam
          </button>
        </div>
      </div>

      {/* Chart content */}
      <div className="px-6 pb-6 space-y-4">
        {dataLength === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-300">
            <BarChart2 className="w-8 h-8 mb-2" />
            <p className="text-sm">Tidak ada data</p>
          </div>
        ) : (
          <div className="pt-2">
            <Chart
              options={chartOptions}
              series={series}
              type="line"
              height={300}
              width="100%"
            />
          </div>
        )}

        {/* Stats row */}
        {dataLength > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              {
                label: "Maks",
                value: maxLevel.toFixed(1),
                color: "text-red-500",
              },
              {
                label: "Rata²",
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
        )}
      </div>
    </div>
  );
}
