import { useRef } from "react";
import Node           from "./Node.jsx";
import ConnectionLine from "./ConnectionLine.jsx";
import Terminal       from "./Terminal.jsx";
import MetricCard     from "./MetricCard.jsx";
import { useFederation } from "../hooks/useFederation.js";

const STEPS = [
  { n: "01", idle: "Click Hospital 1 to connect",  done: "✓ Hospital 1 connected" },
  { n: "02", idle: "Click Hospital 2 to connect",  done: "✓ Hospital 2 connected" },
  { n: "03", idle: "Click Start Federation",        done: "✓ Round started"        },
  { n: "04", idle: "Watch the network react",       done: "✓ Round complete"       },
];

function PhaseBadge({ phase, guiltyClient }) {
  const color = phase === "done" && guiltyClient ? "var(--red)"
              : phase === "done"                 ? "var(--green)"
              : phase === "running"              ? "var(--amber)"
              :                                   "var(--border)";
  const dimColor = phase === "done" && guiltyClient ? "var(--red-dim)"
                 : phase === "done"                 ? "var(--green-dim)"
                 : phase === "running"              ? "var(--amber-dim)"
                 :                                   "transparent";
  const label = phase === "idle"        ? "● Waiting for clients"
              : phase === "c1connected" ? "● Client 1 connected"
              : phase === "c2connected" ? "● Ready to start"
              : phase === "running"     ? "⟳ Federation running"
              : guiltyClient            ? `⚠ Attack detected — ${guiltyClient}`
              :                           "✓ Round complete — clean";

  return (
    <div style={{
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      padding: "8px 16px",
      borderRadius: 100,
      border: `1px solid ${color}`,
      color,
      background: dimColor,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
    }}>
      {label}
    </div>
  );
}

function Verdict({ guiltyClient, nodeStates, metrics }) {
  const isAttack = !!guiltyClient;
  return (
    <div style={{
      padding: "28px 32px",
      borderRadius: 10,
      border: `1px solid ${isAttack ? "var(--red)" : "var(--green)"}`,
      background: isAttack ? "var(--red-dim)" : "var(--green-dim)",
      display: "flex",
      alignItems: "center",
      gap: 24,
      animation: "fadeUp 0.6s 0.3s ease both",
      opacity: 0,
      animationFillMode: "forwards",
    }}>
      <div style={{ fontSize: 40 }}>{isAttack ? "⚠️" : "✅"}</div>
      <div>
        <div style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 20,
          color: isAttack ? "var(--red)" : "var(--green)",
          marginBottom: 6,
        }}>
          {isAttack
            ? `Attack detected — ${guiltyClient} sent poisoned data`
            : "Round complete — No attack detected"}
        </div>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--text3)",
        }}>
          {isAttack
            ? `GM unmasked via cryptographic signature match. ${metrics?.lossInfo || "Anomalous loss detected."}`
            : "Both hospital clients submitted clean model updates this round."}
        </div>
      </div>

      {isAttack && (
        <div style={{ marginLeft: "auto", textAlign: "center" }}>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text3)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 4,
          }}>Guilty Client</div>
          <div style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 22,
            color: "var(--red)",
            textTransform: "uppercase",
          }}>{guiltyClient}</div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const svgRef = useRef();
  const c1Ref  = useRef();
  const c2Ref  = useRef();
  const srvRef = useRef();
  const gmRef  = useRef();

  const {
    phase, nodeStates, connections, metrics, logs, guiltyClient,
    connectClient1, connectClient2, startFederation,
  } = useFederation();

  const canStart  = phase === "c2connected";
  const isRunning = phase === "running";

  return (
    <section style={{
      minHeight: "100vh",
      padding: "60px 24px",
      maxWidth: 1100,
      margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 48,
        flexWrap: "wrap",
        gap: 16,
      }}>
        <div>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--green)",
            letterSpacing: "0.15em",
            marginBottom: 6,
          }}>// NETWORK MONITOR</div>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 32,
            letterSpacing: "-0.02em",
          }}>Federation Control</h2>
        </div>
        <PhaseBadge phase={phase} guiltyClient={guiltyClient} />
      </div>

      {/* Step instructions */}
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--text3)",
        marginBottom: 32,
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
      }}>
        {STEPS.map(({ n, idle, done }, i) => {
          const isDone = (i === 0 && phase !== "idle")
                      || (i === 1 && ["c2connected","running","done"].includes(phase))
                      || (i === 2 && ["running","done"].includes(phase))
                      || (i === 3 && phase === "done");
          return (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--green)", opacity: 0.5 }}>{n}</span>
              <span style={{ color: isDone ? "var(--green)" : "var(--text3)" }}>
                {isDone ? done : idle}
              </span>
            </div>
          );
        })}
      </div>

      {/* Network diagram */}
      <div style={{
        position: "relative",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "48px 32px",
        marginBottom: 32,
        overflow: "hidden",
      }}>
        {/* Dot grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `radial-gradient(circle, rgba(0,255,136,0.04) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          pointerEvents: "none",
        }} />

        {/* SVG lines */}
        <svg ref={svgRef} style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          pointerEvents: "none",
          overflow: "visible",
        }}>
          <ConnectionLine from={c1Ref}  to={srvRef} active={connections.c1ToServer} attacking={nodeStates.client1 === "attacked"} svgRef={svgRef} />
          <ConnectionLine from={c2Ref}  to={srvRef} active={connections.c2ToServer} attacking={nodeStates.client2 === "attacked"} svgRef={svgRef} />
          <ConnectionLine from={srvRef} to={gmRef}  active={connections.serverToGm} attacking={false}                             svgRef={svgRef} />
          <ConnectionLine from={gmRef}  to={srvRef} active={connections.gmToServer} attacking={true}                              svgRef={svgRef} />
        </svg>

        {/* Nodes — 3 col grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "auto auto",
          gap: "40px 20px",
          alignItems: "center",
          justifyItems: "center",
          position: "relative",
          zIndex: 1,
        }}>
          <Node nodeRef={c1Ref}  label="Hospital 1"   sublabel="f1_client.py"   state={nodeStates.client1} icon="🏥" clickable={phase === "idle"}         onClick={connectClient1} />
          <Node nodeRef={srvRef} label="FL Server"     sublabel="flower server"  state={nodeStates.server}  icon="⚙️" clickable={false} />
          <Node nodeRef={c2Ref}  label="Hospital 2"   sublabel="f2_client.py"   state={nodeStates.client2} icon="🏥" clickable={phase === "c1connected"}   onClick={connectClient2} />
          <div />
          <Node nodeRef={gmRef}  label="Global Master" sublabel="gm_server.py"  state={nodeStates.gm}      icon="🛡️" clickable={false} />
          <div />
        </div>
      </div>

      {/* Start button */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 48 }}>
        <button
          onClick={startFederation}
          disabled={!canStart}
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color:      canStart ? "var(--bg)"    : "var(--text3)",
            background: canStart ? "var(--green)" : "var(--panel)",
            border: `1px solid ${canStart ? "var(--green)" : "var(--border)"}`,
            borderRadius: 6,
            padding: "14px 48px",
            cursor: canStart ? "pointer" : "not-allowed",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: canStart ? "0 0 30px rgba(0,255,136,0.25)" : "none",
          }}
        >
          {isRunning && (
            <div style={{
              width: 14, height: 14,
              border: "2px solid transparent",
              borderTopColor: "var(--text3)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
          )}
          {isRunning ? "Running Federation..." : "Start Federation Round"}
        </button>
      </div>

      {/* Live logs */}
      {phase !== "idle" && (
        <div style={{ marginBottom: 48 }}>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text3)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}>// Live Output</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Terminal title="hospital1.log" content={logs.client1} accent="#3b82f6" />
            <Terminal title="hospital2.log" content={logs.client2} accent="#3b82f6" />
            <Terminal title="gm_output.log" content={logs.gm}      accent="#00ff88" />
          </div>
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div style={{ animation: "fadeUp 0.6s ease" }}>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text3)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}>// Round Metrics</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
            <MetricCard label="Final Accuracy"  value={metrics.lastAccuracy} unit="%" accent="var(--blue)"  delay={0}   />
            <MetricCard label="Loss Spike Round" value={metrics.spikeRound || "—"} unit="" accent="var(--red)"   delay={80}  />
            <MetricCard label="Spike Loss Value" value={metrics.spikeValue ? metrics.spikeValue.toFixed(2) : "—"} unit="" accent="var(--red)"   delay={160} />
            <MetricCard label="Total Rounds"     value={metrics.roundMetrics?.length || "—"} unit="" accent="var(--blue)"  delay={240} />
          </div>

          {/* Per-round breakdown table */}
          {metrics.roundMetrics && metrics.roundMetrics.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 11,
                color: "var(--text3)", letterSpacing: "0.12em",
                textTransform: "uppercase", marginBottom: 12,
              }}>// Per-Round Breakdown</div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${metrics.roundMetrics.length}, 1fr)`, gap: 12 }}>
                {metrics.roundMetrics.map(r => {
                  const isSpike = r.round === metrics.spikeRound;
                  return (
                    <div key={r.round} style={{
                      background: isSpike ? "var(--red-dim)" : "var(--panel)",
                      border: `1px solid ${isSpike ? "var(--red)" : "var(--border)"}`,
                      borderRadius: 8, padding: "14px 16px", textAlign: "center",
                    }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text3)", marginBottom: 8 }}>
                        ROUND {r.round} {isSpike ? "⚠️" : ""}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: isSpike ? "var(--red)" : "var(--green)", marginBottom: 4 }}>
                        Loss: {r.loss.toFixed(4)}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text2)" }}>
                        Acc: {(r.accuracy * 100).toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Verdict guiltyClient={guiltyClient} nodeStates={nodeStates} metrics={metrics} />
        </div>
      )}
    </section>
  );
}