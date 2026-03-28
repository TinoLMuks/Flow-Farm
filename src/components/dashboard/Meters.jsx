import { useState, useEffect, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CX = 70, CY = 70, R = 58;
const START_ANG = Math.PI * 1.1;
const END_ANG   = Math.PI * 1.9;
const TOTAL_ANG = END_ANG - START_ANG;

function polarToXY(cx, cy, r, angle) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function arcPath(cx, cy, r, startAng, endAng) {
  const s = polarToXY(cx, cy, r, startAng);
  const e = polarToXY(cx, cy, r, endAng);
  const large = (endAng - startAng) > Math.PI ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

function getStatusStyle(status) {
  if (status === "Optimal") return { bg: "rgba(99,153,34,0.12)", text: "#3B6D11" };
  if (status === "Warning") return { bg: "rgba(239,159,39,0.12)", text: "#854F0B" };
  return { bg: "rgba(226,75,74,0.12)", text: "#A32D2D" };
}

function getArcColor(status) {
  if (status === "Optimal") return "#639922";
  if (status === "Warning") return "#EF9F27";
  return "#E24B4A";
}

function phStatus(v) {
  v = parseFloat(v);
  if (v >= 6.5 && v <= 7.5) return "Optimal";
  if ((v >= 6.0 && v < 6.5) || (v > 7.5 && v <= 8.0)) return "Warning";
  return "Critical";
}

function tempStatus(v) {
  v = parseFloat(v);
  if (v >= 22 && v <= 28) return "Optimal";
  if ((v >= 18 && v < 22) || (v > 28 && v <= 31)) return "Warning";
  return "Critical";
}

function levelStatus(v) {
  v = parseFloat(v);
  if (v >= 40 && v <= 80) return "Optimal";
  if ((v >= 20 && v < 40) || (v > 80 && v <= 90)) return "Warning";
  return "Critical";
}

function ArcMeter({ value, min, max, status }) {
  const t = (value - min) / (max - min);
  const endAng = START_ANG + t * TOTAL_ANG;
  const fullArc = arcPath(CX, CY, R, START_ANG, END_ANG);
  const activeArc = arcPath(CX, CY, R, START_ANG, endAng);
  const dot = polarToXY(CX, CY, R, endAng);
  const color = getArcColor(status);

  const ticks = Array.from({ length: 9 }, (_, i) => {
    const ang = START_ANG + (i / 8) * TOTAL_ANG;
    const inner = polarToXY(CX, CY, R - 8, ang);
    const outer = polarToXY(CX, CY, R + 2, ang);
    return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
  });

  return (
    <svg width="140" height="78" viewBox="0 0 140 78" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="grad-track" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#E24B4A" />
          <stop offset="30%"  stopColor="#EF9F27" />
          <stop offset="50%"  stopColor="#639922" />
          <stop offset="70%"  stopColor="#EF9F27" />
          <stop offset="100%" stopColor="#E24B4A" />
        </linearGradient>
      </defs>

      {ticks.map((tk, i) => (
        <line key={i} x1={tk.x1.toFixed(1)} y1={tk.y1.toFixed(1)}
          x2={tk.x2.toFixed(1)} y2={tk.y2.toFixed(1)}
          stroke="#e4e8f0" strokeWidth="1" />
      ))}

      <path d={fullArc} fill="none" stroke="url(#grad-track)"
        strokeWidth="10" strokeLinecap="round" opacity="0.25" />
      <path d={activeArc} fill="none" stroke={color}
        strokeWidth="10" strokeLinecap="round" />
      <circle cx={dot.x.toFixed(2)} cy={dot.y.toFixed(2)} r="6"
        fill="#ffffff" stroke={color} strokeWidth="2.5" />
    </svg>
  );
}

function MeterCard({ label, value, unit, min, max, step, rangeLabel, onChange, getStatus }) {
  const status = getStatus(value);
  const sc = getStatusStyle(status);

  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e4e8f0",
      borderRadius: 16,
      padding: "20px 16px 16px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "#8a94a6", width: "100%", textAlign: "center" }}>
        {label}
      </div>

      <ArcMeter value={value} min={min} max={max} status={status} />

      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 26,
          fontWeight: 500, color: "#1a2035", lineHeight: 1 }}>
          {typeof value === "number" && step < 1 ? value.toFixed(1) : Math.round(value)}
        </div>
        <div style={{ fontSize: 11, color: "#8a94a6", marginTop: 2 }}>{unit}</div>
      </div>

      <div style={{
        fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
        background: sc.bg, color: sc.text, letterSpacing: "0.04em",
      }}>
        {status}
      </div>

      <div style={{ fontSize: 11, color: "#8a94a6", display: "flex",
        justifyContent: "space-between", width: "100%" }}>
        <span>{min}{unit === "°C" ? "°" : ""}</span>
        <span>{rangeLabel}</span>
        <span>{max}{unit === "°C" ? "°" : ""}</span>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 11, color: "#8a94a6" }}>Adjust</label>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))} style={{ width: "100%" }} />
      </div>
    </div>
  );
}

export default function Meters() {
  const [ph,    setPh]    = useState(7.0);
  const [temp,  setTemp]  = useState(25);
  const [level, setLevel] = useState(65);

  useEffect(() => {
    async function fetchReadings() {
      try {
        const res = await fetch(`${API_URL}/sensors/readings/latest/1`);
        const json = await res.json();
        if (json.success && json.data) {
          for (const r of json.data) {
            if (r.type_name === "ph") setPh(parseFloat(r.value));
            if (r.type_name === "temperature") setTemp(parseFloat(r.value));
            if (r.type_name === "water_level") setLevel(parseFloat(r.value));
          }
        }
      } catch (err) {
        console.error("Failed to fetch meter readings:", err);
      }
    }
    fetchReadings();
  }, []);

  return (
    <div style={{ padding: "28px", background: "#f0f2f5", minHeight: "100%" }}>
     <div style={{ marginBottom: 24, textAlign: "center" }}>
  <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em",
    color: "#1a2035", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
    Environment
  </h1>
  <p style={{ fontSize: 13, color: "#8a94a6", marginTop: 4,
    fontFamily: "'DM Sans', sans-serif" }}>
    Real-time sensor readings
  </p>
</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <MeterCard
          label="pH Level" value={ph} unit="pH" min={5} max={9} step={0.1}
          rangeLabel="Optimal: 6.5–7.5"
          onChange={setPh} getStatus={phStatus}
        />
        <MeterCard
          label="Water Temperature" value={temp} unit="°C" min={15} max={35} step={0.5}
          rangeLabel="Optimal: 22–28°C"
          onChange={setTemp} getStatus={tempStatus}
        />
        <MeterCard
          label="Water Level" value={level} unit="%" min={0} max={100} step={1}
          rangeLabel="Optimal: 40–80%"
          onChange={setLevel} getStatus={levelStatus}
        />
      </div>
    </div>
  );
}
