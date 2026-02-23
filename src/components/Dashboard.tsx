import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import type { FloodData, Node, HistoryRecord } from "../types";
import { GatewayStatus } from "./GatewayStatus";
import { WaterLevelCard } from "./WaterLevelCard";
import { HistoryChart } from "./HistoryChart";
import { AlertTriangle, RefreshCw, Waves } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function Dashboard() {
  const [floodData, setFloodData] = useState<FloodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const floodRef = ref(database, "flood");
    const unsubscribe = onValue(
      floodRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            setFloodData(data as FloodData);
            setLastUpdate(new Date());
            setError(null);
          }
        } catch (err) {
          setError("Failed to parse data");
          console.error(err);
        }
        setLoading(false);
      },
      (err) => {
        setError("Failed to connect to database");
        console.error(err);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const getHistoryArray = (nodeData: Node): HistoryRecord[] => {
    if (!nodeData.history) return [];
    return Object.entries(nodeData.history).map(([id, value]) => ({
      id,
      ...value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-4">
          <RefreshCw className="w-16 h-16 text-green-500 animate-spin mx-auto" />
          <p className="text-green-700 text-lg font-medium tracking-wide">
            Connecting to Firebase...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-14 h-14 text-red-500 mx-auto" />
          <p className="text-red-500 text-lg font-semibold">{error}</p>
          <p className="text-gray-400 text-sm">
            Check your Firebase configuration
          </p>
        </div>
      </div>
    );
  }

  const nodeEntries = floodData
    ? Object.entries(floodData.nodes).filter(
        ([, nodeData]) => nodeData && typeof nodeData === "object",
      )
    : [];

  const gwStatus = floodData?.gateway?.status;
  const isOnline = gwStatus ? gwStatus.last_activity < 60 : false;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Top bar */}
      <header className="border-b border-green-100 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                FloodWatch
              </h1>
              <p className="text-xs text-gray-400">
                LoRa Sensor Monitoring System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {gwStatus && (
              <Badge
                variant="outline"
                className={
                  isOnline
                    ? "border-green-400 text-green-600 bg-green-50"
                    : "border-red-400 text-red-500 bg-red-50"
                }
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-2 ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                />
                Gateway {isOnline ? "Online" : "Offline"}
              </Badge>
            )}
            {lastUpdate && (
              <span className="text-xs text-gray-400">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {floodData && (
          <section>
            <SectionLabel label="Gateway" />
            <GatewayStatus
              gateway={floodData.gateway.status}
              isOnline={isOnline}
            />
          </section>
        )}

        <Separator className="border-green-100" />

        <section>
          <SectionLabel label="Live Water Levels" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {nodeEntries.map(([nodeId, nodeData]) => (
              <WaterLevelCard
                key={nodeId}
                nodeId={nodeId}
                data={nodeData.latest ?? null}
              />
            ))}
          </div>
        </section>

        <Separator className="border-green-100" />

        <section>
          <SectionLabel label="History" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {nodeEntries.map(([nodeId, nodeData]) => (
              <HistoryChart
                key={`history-${nodeId}`}
                nodeId={nodeId}
                history={getHistoryArray(nodeData)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-1 h-4 bg-green-500 rounded-full" />
      <h2 className="text-sm font-semibold text-green-600 uppercase tracking-widest">
        {label}
      </h2>
    </div>
  );
}
