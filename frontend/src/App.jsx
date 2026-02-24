import { useRef } from "react";
import Landing   from "./components/Landing.jsx";
import Dashboard from "./components/Dashboard.jsx";

export default function App() {
  const dashRef = useRef();

  function goToDashboard() {
    dashRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div>
      <Landing onEnter={goToDashboard} />

      <div
        ref={dashRef}
        style={{
          borderTop: "1px solid var(--border)",
          background: "var(--bg)",
        }}
      >
        <Dashboard />
      </div>
    </div>
  );
}