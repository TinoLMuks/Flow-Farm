// Analytics.jsx
import { useState, useEffect } from "react";
import PerformanceChart from "./PerformanceChart";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const C = {
  bg:     "#f0f2f5",
  card:   "#ffffff",
  text:   "#1a2035",
  muted:  "#8a94a6",
  border: "#e4e8f0",
  temp:   "#93c5e8",
  ph:     "#a8d672",
  water:  "#4f6ef7",
  up:     "#4caf88",
  down:   "#e06b6b",
};

// Sparkline
function Sparkline({ data, color }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const W = 80, H = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Animated counter
function AnimatedValue({ value, decimals = 0, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = null;
    const end = parseFloat(value);
    if (isNaN(end)) { setDisplay(value); return; }
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 900, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay((e * end).toFixed(decimals));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display}{suffix}</>;
}

// Stat Card
function StatCard({ label, value, suffix, decimals, delta, color, sparkData }) {
  const isUp = delta >= 0;
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: "20px 20px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 2,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ margin: "8px 0 0", fontSize: 30, fontWeight: 800, color: C.text, letterSpacing: "-0.03em", lineHeight: 1 }}>
        <AnimatedValue value={value} suffix={suffix} decimals={decimals} />
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: isUp ? C.up : C.down,
          background: isUp ? "rgba(76,175,136,0.1)" : "rgba(224,107,107,0.1)",
          padding: "3px 8px", borderRadius: 20,
        }}>
          {isUp ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
        </span>
        <Sparkline data={sparkData} color={color} />
      </div>
    </div>
  );
}

// Analytics Page
export default function Analytics() {
  const [stats, setStats] = useState([
    { label: "Temperature", value: 0, suffix: "°C", decimals: 1, delta: 0, color: C.temp, sparkData: [] },
    { label: "Water Level", value: 0, suffix: "%", decimals: 0, delta: 0, color: C.water, sparkData: [] },
    { label: "pH Level", value: 0, suffix: "", decimals: 1, delta: 0, color: C.ph, sparkData: [] },
  ]);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        // Fetch latest readings
        const latestRes = await fetch(`${API_URL}/sensors/readings/latest/1`);
        const latestJson = await latestRes.json();

        // Fetch historical data for sparklines (last 6 hours)
        const now = new Date();
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        const rangeRes = await fetch(
          `${API_URL}/sensors/readings/range/1?start=${sixHoursAgo.toISOString()}&end=${now.toISOString()}`
        );
        const rangeJson = await rangeRes.json();

        const newStats = [...stats];

        if (latestJson.success && latestJson.data) {
          for (const r of latestJson.data) {
            if (r.type_name === "temperature") newStats[0].value = parseFloat(r.value);
            if (r.type_name === "water_level") newStats[1].value = parseFloat(r.value);
            if (r.type_name === "ph") newStats[2].value = parseFloat(r.value);
          }
        }

        if (rangeJson.success && rangeJson.data) {
          newStats[0].sparkData = rangeJson.data.tempData;
          newStats[1].sparkData = rangeJson.data.waterData;
          newStats[2].sparkData = rangeJson.data.phData;

          // Compute delta from sparkline data
          for (const s of newStats) {
            if (s.sparkData.length >= 2) {
              const first = s.sparkData[0];
              const last = s.sparkData[s.sparkData.length - 1];
              s.delta = first !== 0 ? ((last - first) / first) * 100 : 0;
            }
          }
        }

        setStats(newStats);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <div style={{ padding: "28px", background: C.bg, minHeight: "100%", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: C.text, margin: 0 }}>
          Analytics
        </h1>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 4, margin: 0 }}>
          Real-time performance monitoring
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        gap: 14,
        marginBottom: 20,
      }}>
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Performance Chart */}
      <PerformanceChart />
    </div>
  );
}
