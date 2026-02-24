const STATS = [
  { val: "2",  label: "Hospital Clients" },
  { val: "EC", label: "Key Crypto"       },
  { val: "GM", label: "Global Master"    },
  { val: "∞",  label: "Rounds"           },
];

export default function Landing({ onEnter }) {
  return (
    <section style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      padding: "60px 24px",
    }}>
      {/* Grid background */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      {/* Scanline */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: 0, right: 0,
          height: "2px",
          background: "linear-gradient(transparent, rgba(0,255,136,0.06), transparent)",
          animation: "scanline 6s linear infinite",
        }} />
      </div>

      {/* Badge */}
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--green)",
        border: "1px solid var(--green-dim)",
        borderRadius: 100,
        padding: "6px 16px",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        marginBottom: 32,
        background: "var(--green-dim)",
        animation: "fadeUp 0.6s ease both",
      }}>
        ◈ Federated Learning Security Monitor
      </div>

      {/* Headline */}
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: "clamp(40px, 8vw, 88px)",
        lineHeight: 0.95,
        textAlign: "center",
        letterSpacing: "-0.03em",
        marginBottom: 24,
        animation: "fadeUp 0.6s 0.1s ease both",
        opacity: 0,
        animationFillMode: "forwards",
      }}>
        <span style={{ color: "var(--text)" }}>FED</span>
        <span style={{ color: "var(--green)" }}>SHIELD</span>
        <br />
        <span style={{
          fontSize: "clamp(20px, 3.5vw, 36px)",
          fontWeight: 400,
          color: "var(--text2)",
          letterSpacing: "0.02em",
        }}>Detect. Isolate. Protect.</span>
      </h1>

      {/* Description */}
      <p style={{
        fontFamily: "var(--font-mono)",
        fontSize: "clamp(12px, 1.5vw, 14px)",
        color: "var(--text3)",
        textAlign: "center",
        maxWidth: 480,
        lineHeight: 1.8,
        marginBottom: 48,
        animation: "fadeUp 0.6s 0.2s ease both",
        opacity: 0,
        animationFillMode: "forwards",
      }}>
        Real-time federated learning network monitor.<br />
        Identifies poisoned model updates from malicious clients<br />
        using cryptographic signatures &amp; loss anomaly detection.
      </p>

      {/* Stats */}
      <div style={{
        display: "flex",
        gap: 32,
        marginBottom: 48,
        flexWrap: "wrap",
        justifyContent: "center",
        animation: "fadeUp 0.6s 0.3s ease both",
        opacity: 0,
        animationFillMode: "forwards",
      }}>
        {STATS.map(({ val, label }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 28,
              fontWeight: 700,
              color: "var(--green)",
            }}>{val}</div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text3)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginTop: 2,
            }}>{label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onEnter}
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--bg)",
          background: "var(--green)",
          border: "none",
          borderRadius: 6,
          padding: "16px 40px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          animation: "fadeUp 0.6s 0.4s ease both",
          opacity: 0,
          animationFillMode: "forwards",
          boxShadow: "0 0 30px rgba(0,255,136,0.3)",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 0 50px rgba(0,255,136,0.5)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 0 30px rgba(0,255,136,0.3)";
        }}
      >
        Launch Monitor →
      </button>

      {/* Scroll indicator */}
      <div style={{
        position: "absolute", bottom: 32,
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        color: "var(--text3)",
        letterSpacing: "0.1em",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        animation: "fadeUp 0.6s 0.8s ease both",
        opacity: 0,
        animationFillMode: "forwards",
      }}>
        <span>SCROLL DOWN</span>
        <div style={{ width: 1, height: 40, background: "linear-gradient(var(--green), transparent)" }} />
      </div>
    </section>
  );
}