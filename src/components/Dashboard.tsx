import { useEffect, useState, useRef } from "react";
import { ref, onValue, onChildAdded, onChildRemoved } from "firebase/database";
import { database } from "../firebase";
import type {
  Gateway,
  NodeLatest,
  HistoryEntry,
  HistoryRecord,
} from "../types";
import { GatewayStatus } from "./GatewayStatus";
import { WaterLevelCard } from "./WaterLevelCard";
import { HistoryChart } from "./HistoryChart";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface NodeState {
  latest: NodeLatest | null;
  history: Record<string, HistoryEntry>;
}

export function Dashboard() {
  const [gateway, setGateway] = useState<Gateway | null>(null);
  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tick every 10 seconds so gateway online/offline status stays fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(interval);
  }, []);

  // Track per-node unsubscribe functions so we can clean up
  const nodeUnsubs = useRef<Record<string, (() => void)[]>>({});

  useEffect(() => {
    let gatewayReady = false;
    let nodesReady = false;

    const markLoaded = () => {
      if (gatewayReady && nodesReady) setLoading(false);
    };

    // --- Subscribe to /gateway ---
    const gatewayRef = ref(database, "gateway");
    const unsubGateway = onValue(
      gatewayRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            setGateway(data as Gateway);
            setError(null);
          }
        } catch (err) {
          setError("Failed to parse gateway data");
          console.error(err);
        }
        gatewayReady = true;
        markLoaded();
      },
      (err) => {
        setError("Failed to connect to gateway data");
        console.error(err);
        gatewayReady = true;
        markLoaded();
      },
    );

    // --- Helper: subscribe to a single node's latest + history ---
    const subscribeToNode = (nodeId: string) => {
      // Don't double-subscribe
      if (nodeUnsubs.current[nodeId]) return;

      const unsubs: (() => void)[] = [];

      // Listen to /nodes/<nodeId>/latest for realtime water level
      const latestRef = ref(database, `nodes/${nodeId}/latest`);
      const unsubLatest = onValue(latestRef, (snapshot) => {
        try {
          const data = snapshot.val();
          setNodeStates((prev) => ({
            ...prev,
            [nodeId]: {
              ...prev[nodeId],
              latest: data as NodeLatest | null,
              history: prev[nodeId]?.history ?? {},
            },
          }));
          setError(null);
        } catch (err) {
          console.error(`Failed to parse latest for ${nodeId}`, err);
        }
      });
      unsubs.push(unsubLatest);

      // Listen to /nodes/<nodeId>/history for chart data
      const historyRef = ref(database, `nodes/${nodeId}/history`);
      const unsubHistory = onValue(historyRef, (snapshot) => {
        try {
          const data = snapshot.val();
          setNodeStates((prev) => ({
            ...prev,
            [nodeId]: {
              ...prev[nodeId],
              latest: prev[nodeId]?.latest ?? null,
              history: (data as Record<string, HistoryEntry>) ?? {},
            },
          }));
        } catch (err) {
          console.error(`Failed to parse history for ${nodeId}`, err);
        }
      });
      unsubs.push(unsubHistory);

      nodeUnsubs.current[nodeId] = unsubs;
    };

    // --- Helper: unsubscribe from a single node ---
    const unsubscribeFromNode = (nodeId: string) => {
      if (nodeUnsubs.current[nodeId]) {
        nodeUnsubs.current[nodeId].forEach((unsub) => unsub());
        delete nodeUnsubs.current[nodeId];
      }
      setNodeStates((prev) => {
        const next = { ...prev };
        delete next[nodeId];
        return next;
      });
    };

    // --- Auto-discover nodes via child events on /nodes ---
    const nodesRef = ref(database, "nodes");

    // When a new node appears, subscribe to it
    const unsubChildAdded = onChildAdded(nodesRef, (snapshot) => {
      const nodeId = snapshot.key;
      if (nodeId) {
        subscribeToNode(nodeId);
      }
      nodesReady = true;
      markLoaded();
    });

    // When a node is removed, clean up
    const unsubChildRemoved = onChildRemoved(nodesRef, (snapshot) => {
      const nodeId = snapshot.key;
      if (nodeId) {
        unsubscribeFromNode(nodeId);
      }
    });

    // If there are no nodes at all, we still need to mark as loaded
    // Use a one-time read to check
    const unsubNodesCheck = onValue(
      nodesRef,
      () => {
        nodesReady = true;
        markLoaded();
      },
      { onlyOnce: true },
    );

    return () => {
      unsubGateway();
      unsubChildAdded();
      unsubChildRemoved();
      unsubNodesCheck();
      // Clean up all per-node subscriptions
      Object.keys(nodeUnsubs.current).forEach((nodeId) => {
        nodeUnsubs.current[nodeId].forEach((unsub) => unsub());
      });
      nodeUnsubs.current = {};
    };
  }, []);

  const getHistoryArray = (nodeState: NodeState): HistoryRecord[] => {
    if (!nodeState.history) return [];
    return Object.entries(nodeState.history).map(([id, value]) => ({
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
            Menghubungkan ke Firebase...
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
            Periksa konfigurasi Firebase Anda
          </p>
        </div>
      </div>
    );
  }

  const nodeEntries = Object.entries(nodeStates).filter(
    ([, state]) => state && typeof state === "object",
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Top bar */}
      <header className="border-b border-green-100 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg">
              <img src="logo.png" className="w-10" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                LoRa Monitoring
              </h1>
              <p className="text-xs text-gray-400">
                Sistem Pemantauan Ketinggian Air
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {gateway && (
          <section>
            <SectionLabel label="Gateway" />
            <GatewayStatus gateway={gateway} />
          </section>
        )}

        <hr className="border-green-100" />

        <section>
          <SectionLabel label="Level Air Terkini" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {nodeEntries.map(([nodeId, state]) => (
              <WaterLevelCard
                key={nodeId}
                nodeId={nodeId}
                data={state.latest}
              />
            ))}
          </div>
        </section>

        <hr className="border-green-100" />

        <section>
          <SectionLabel label="Riwayat" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {nodeEntries.map(([nodeId, state]) => (
              <HistoryChart
                key={`history-${nodeId}`}
                nodeId={nodeId}
                history={getHistoryArray(state)}
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
