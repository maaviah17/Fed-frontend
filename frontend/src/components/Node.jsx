const STATE_COLORS = {
  idle:      { border: "#1e2d4a", bg: "#0d1428", dot: "#1e2d4a", text: "#4a6080" },
  active:    { border: "#00ff88", bg: "#001a0e", dot: "#00ff88", text: "#00ff88" },
  warning:   { border: "#ffb800", bg: "#1a1000", dot: "#ffb800", text: "#ffb800" },
  attacked:  { border: "#ff3b5c", bg: "#1a0008", dot: "#ff3b5c", text: "#ff3b5c" },
  connected: { border: "#3b82f6", bg: "#000d1a", dot: "#3b82f6", text: "#3b82f6" },
};

const PULSE = {
  active:   "pulse-green",
  attacked: "pulse-red",
  warning:  "pulse-amber",
};

export default function Node({ nodeRef, label, sublabel, state, icon, onClick, clickable }) {
  const c = STATE_COLORS[state] || STATE_COLORS.idle;
  const pulse = PULSE[state] || "none";

  return (
    <div
      ref={nodeRef}
      onClick={clickable ? onClick : undefined}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        cursor: clickable ? "pointer" : "default",
        userSelect: "none",
      }}
    >
      {/* Circle */}
      <div style={{
        width: 80, height: 80,
        borderRadius: "50%",
        border: `2px solid ${c.border}`,
        background: c.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 28,
        transition: "all 0.4s ease",
        animation: pulse !== "none" ? `${pulse} 1.8s ease-in-out infinite` : "none",
        boxShadow: state !== "idle"
          ? `0 0 20px ${c.border}44, inset 0 0 20px ${c.border}11`
          : "none",
      }}>
        {icon}
      </div>

      {/* Status dot */}
      <div style={{
        position: "absolute", top: 4, right: 4,
        width: 10, height: 10,
        borderRadius: "50%",
        background: c.dot,
        border: "2px solid var(--bg)",
        transition: "background 0.4s ease",
        boxShadow: state !== "idle" ? `0 0 6px ${c.dot}` : "none",
      }} />

      {/* Labels */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: "0.08em",
          color: c.text,
          textTransform: "uppercase",
          transition: "color 0.4s ease",
        }}>{label}</div>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--text3)",
          marginTop: 2,
        }}>{sublabel}</div>
      </div>

      {/* Click hint */}
      {clickable && state === "idle" && (
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          color: "var(--text3)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          padding: "2px 6px",
          letterSpacing: "0.05em",
        }}>CLICK TO CONNECT</div>
      )}
    </div>
  );
}