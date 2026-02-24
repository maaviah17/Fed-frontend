import { useState, useRef, useEffect } from "react";

// ── Point this at your FastAPI backend ──────────────────────────
const API = "http://localhost:8000"
// NOTE: React talks to localhost:8000 (your laptop).
// Colab talks to ngrok. They are separate connections!
// ────────────────────────────────────────────────────────────────

const INITIAL_NODE_STATES = {
  client1: "idle",
  client2: "idle",
  server:  "active",  // server is always green on load
  gm:      "idle",
};

const INITIAL_CONNECTIONS = {
  c1ToServer: false,
  c2ToServer: false,
  serverToGm: false,
  gmToServer: false,
};

export function useFederation() {
  const [phase, setPhase]           = useState("idle");
  const [nodeStates, setNodeStates] = useState(INITIAL_NODE_STATES);
  const [connections, setConnections] = useState(INITIAL_CONNECTIONS);
  const [metrics, setMetrics]       = useState(null);
  const [logs, setLogs]             = useState({ client1: "", client2: "", gm: "", server: "" });
  const [guiltyClient, setGuiltyClient] = useState(null);

  const pollRef = useRef();

  // Cleanup on unmount
  useEffect(() => () => clearInterval(pollRef.current), []);

  /* ── connect client 1 ── */
  function connectClient1() {
    if (nodeStates.client1 !== "idle") return;
    setNodeStates(s => ({ ...s, client1: "connected" }));
    setConnections(c => ({ ...c, c1ToServer: true }));
    setPhase("c1connected");
  }

  /* ── connect client 2 ── */
  function connectClient2() {
    if (phase !== "c1connected") return;
    setNodeStates(s => ({ ...s, client2: "connected" }));
    setConnections(c => ({ ...c, c2ToServer: true }));
    setPhase("c2connected");
  }

  /* ── animate nodes when round finishes ── */
  function finishRound(guilty, roundMetrics, spikeRound, spikeValue) {
    const guiltyLabel = guilty === "none" || !guilty ? null : guilty;

    // Step 1 — GM turns amber (processing)
    setTimeout(() => {
      setNodeStates(s => ({ ...s, gm: "warning" }));
      setConnections(c => ({ ...c, serverToGm: true }));
    }, 400);

    // Step 2 — GM identifies guilty client, server turns red
    setTimeout(() => {
      if (guiltyLabel) {
        setConnections(c => ({ ...c, gmToServer: true }));
        setNodeStates(s => ({
          ...s,
          server:  "attacked",
          gm:      "active",
          client1: guiltyLabel === "hospital1" ? "attacked" : "active",
          client2: guiltyLabel === "hospital2" ? "attacked" : "active",
        }));
      } else {
        setNodeStates(s => ({
          ...s,
          gm:      "active",
          client1: "active",
          client2: "active",
        }));
      }
    }, 1200);

    // Step 3 — Show real metrics from your actual FL round
    setTimeout(() => {
      setGuiltyClient(guiltyLabel);
      const rounds = roundMetrics || [];
      const lastRound = rounds[rounds.length - 1] || {};
      setMetrics({
        roundMetrics: rounds,
        spikeRound,
        spikeValue,
        lastAccuracy: lastRound.accuracy
          ? (lastRound.accuracy * 100).toFixed(1)
          : "N/A",
        lossInfo: spikeValue
          ? `Loss spike at round ${spikeRound}: ${spikeValue} (normal ~0.65)`
          : "No anomalous loss detected",
      });
      setPhase("done");
    }, 2000);
  }

  /* ── demo mode — runs when backend is offline ── */
  function simulateDemo() {
    const guilty = Math.random() > 0.5 ? "hospital1" : "hospital2";
    const demoMetrics = [
      { round: 1, accuracy: 0.6106, loss: 0.6533 },
      { round: 2, accuracy: 0.3816, loss: 376.048 },
      { round: 3, accuracy: 0.6259, loss: 0.6415 },
    ];
    setTimeout(() => {
      setLogs({
        client1: `INFO:Hospital1:✅ [Round 1] Train Loss: 0.5333 | Acc: 0.7948\nINFO:Hospital1:✅ [Round 2] Train Loss: 0.4808 | Acc: 0.8046\nINFO:Hospital1:✅ [Round 3] Train Loss: 0.5384 | Acc: 0.8046`,
        client2: `INFO:Hospital2:✅ [Round 1] Train Loss: 0.5823 | Acc: 0.7664\nWARNING:Hospital2:🚨 [Round 2] Injecting NOISE Attack...\nINFO:Hospital2:✅ [Round 3] Train Loss: 0.5584 | Acc: 0.7664`,
        gm:      `[REGISTER] Client hospital1 registered.\n[REGISTER] Client hospital2 registered.\n[OPEN] Received unmasking request...\n ++ [MATCH] Signature matches Client ID: ${guilty}\n[AUDIT] Written: {'action': 'open', 'cid': '${guilty}', 'status': 'UNMASKED'}`,
        server:  `metrics_distributed {'accuracy': [(1, 0.6106), (2, 0.3816), (3, 0.6259)], 'loss': [(1, 0.6533), (2, 376.048), (3, 0.6415)]}`,
      });
      finishRound(guilty, demoMetrics, 2, 376.048);
    }, 3000);
  }

  /* ── main — called when user clicks Start Federation ── */
  async function startFederation() {
    if (phase !== "c2connected") return;
    setPhase("running");
    setNodeStates(s => ({ ...s, client1: "active", client2: "active" }));

    // Check if backend is reachable
    let backendOnline = false;
    try {
      const check = await fetch(`${API}/health`, { signal: AbortSignal.timeout(3000) });
      backendOnline = check.ok;
    } catch {
      backendOnline = false;
    }

    if (!backendOnline) {
      console.warn("Backend offline — running demo mode");
      simulateDemo();
      return;
    }

    // Backend online — poll /results and /logs every 2.5s
    // Colab calls /start and /finish on its own via colab_reporter
    // Frontend just listens for when status becomes "done"
    pollRef.current = setInterval(async () => {
      try {
        const [resR, logR] = await Promise.all([
          fetch(`${API}/results`),
          fetch(`${API}/logs`),
        ]);
        const data    = await resR.json();
        const logData = await logR.json();

        // Update live terminal content
        setLogs({
          client1: logData.client1 || "",
          client2: logData.client2 || "",
          gm:      logData.gm      || "",
          server:  logData.server  || "",
        });

        // When Colab finishes and posts to /finish, status becomes "done"
        if (data.status === "done") {
          clearInterval(pollRef.current);
          finishRound(
            data.guilty_client,
            data.round_metrics,
            data.loss_spike_round,
            data.loss_spike_value,
          );
        }
      } catch { /* network hiccup — retry next tick */ }
    }, 2500);
  }

  return {
    phase,
    nodeStates,
    connections,
    metrics,
    logs,
    guiltyClient,
    connectClient1,
    connectClient2,
    startFederation,
  };
}