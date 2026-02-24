import { useRef, useEffect } from "react";

const DOTS = ["#ff5f57", "#febc2e", "#28c840"];

export default function Terminal({ title, content, accent }) {
  const ref = useRef();

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [content]);

  return (
    <div style={{
      background: "#030608",
      border: `1px solid ${accent}33`,
      borderRadius: 8,
      overflow: "hidden",
    }}>
      {/* Title bar */}
      <div style={{
        background: `${accent}11`,
        borderBottom: `1px solid ${accent}22`,
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          {DOTS.map(c => (
            <div key={c} style={{
              width: 10, height: 10,
              borderRadius: "50%",
              background: c,
              opacity: 0.7,
            }} />
          ))}
        </div>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: accent,
          letterSpacing: "0.08em",
          marginLeft: 4,
        }}>{title}</span>
      </div>

      {/* Content */}
      <div ref={ref} style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "#4a9060",
        padding: "12px 16px",
        height: 160,
        overflowY: "auto",
        whiteSpace: "pre-wrap",
        lineHeight: 1.7,
      }}>
        {content || (
          <span style={{ color: "var(--text3)" }}>// awaiting output...</span>
        )}
      </div>
    </div>
  );
}