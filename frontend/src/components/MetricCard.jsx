import { useState, useEffect } from "react";

export default function MetricCard({ label, value, unit, accent, delay = 0 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{
      background: "var(--panel)",
      border: `1px solid ${accent}44`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 8,
      padding: "20px 24px",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "all 0.5s ease",
    }}>
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        color: "var(--text3)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        marginBottom: 8,
      }}>{label}</div>

      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: 28,
        fontWeight: 700,
        color: accent,
      }}>
        {value}
        {unit && (
          <span style={{ fontSize: 13, color: "var(--text3)", marginLeft: 4 }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}