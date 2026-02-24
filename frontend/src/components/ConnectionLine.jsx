import { useState, useEffect } from "react";

export default function ConnectionLine({ from, to, active, attacking, svgRef }) {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!svgRef.current || !from.current || !to.current) return;
    const update = () => {
      const svg   = svgRef.current.getBoundingClientRect();
      const fRect = from.current.getBoundingClientRect();
      const tRect = to.current.getBoundingClientRect();
      setCoords({
        x1: fRect.left + fRect.width  / 2 - svg.left,
        y1: fRect.top  + fRect.height / 2 - svg.top,
        x2: tRect.left + tRect.width  / 2 - svg.left,
        y2: tRect.top  + tRect.height / 2 - svg.top,
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [from, to, svgRef]);

  if (!coords || !active) return null;

  const color = attacking ? "#ff3b5c" : "#00ff88";
  const { x1, y1, x2, y2 } = coords;

  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth="1.5" strokeOpacity="0.15" />
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth="1.5"
        strokeDasharray="6 4"
        strokeOpacity="0.6"
        style={{ animation: "dash 0.8s linear infinite" }} />
      <circle r="3" fill={color} opacity="0.9">
        <animateMotion dur="1.2s" repeatCount="indefinite"
          path={`M${x1},${y1} L${x2},${y2}`} />
      </circle>
    </>
  );
}