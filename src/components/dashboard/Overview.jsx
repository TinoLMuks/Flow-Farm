import { useState, useEffect } from "react";
import StatCard from "./StatCard";
import RecentIssuesTable from "./RecentIssuesTable";
import Meters from "./Meters";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Overview() {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const [stats, setStats] = useState({
    systemHealth: "--",
    ph: "--",
    waterLevel: "--",
    waterTemp: "--",
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch latest readings for tank 1 and system health
        const [readingsRes, healthRes] = await Promise.all([
          fetch(`${API_URL}/sensors/readings/latest/1`),
          fetch(`${API_URL}/system-health/1`),
        ]);
        const readingsData = await readingsRes.json();
        const healthData = await healthRes.json();

        const newStats = { ...stats };

        if (healthData.success && healthData.data) {
          newStats.systemHealth = healthData.data.overall_score;
        }

        if (readingsData.success && readingsData.data) {
          for (const r of readingsData.data) {
            if (r.type_name === "ph") newStats.ph = r.value;
            if (r.type_name === "water_level") newStats.waterLevel = r.value + "%";
            if (r.type_name === "temperature") newStats.waterTemp = r.value + "°C";
          }
        }

        setStats(newStats);
      } catch (err) {
        console.error("Failed to fetch overview stats:", err);
      }
    }
    fetchStats();
  }, []);

  return (
    <>
      {/* GREETING */}
      <div className="relative mb-10 px-2">
        {/* Accent glow blob */}
        <div
          style={{
            position: "absolute",
            top: "-10px",
            left: "-20px",
            width: "220px",
            height: "90px",
            background:
              "radial-gradient(ellipse at center, rgba(175,208,110,0.18) 0%, transparent 75%)",
            pointerEvents: "none",
            filter: "blur(8px)",
          }}
        />

        {/* Date badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(175,208,110,0.15)",
            border: "1px solid rgba(175,208,110,0.3)",
            borderRadius: "999px",
            padding: "3px 12px",
            marginBottom: "14px",
          }}
        >
          <span style={{ color: "rgba(175,208,110,1)", fontSize: "11px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase" }}>
            {dateStr}
          </span>
        </div>

        {/* Main heading */}
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 800,
            color: "rgba(175,208,110,1)",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          Welcome!{" "}

        </h1>

        {/* Subtitle */}
        <p
          style={{
            marginTop: "10px",
            fontSize: "1.05rem",
            color: "rgba(156,163,175,1)",
            fontWeight: 400,
            letterSpacing: "0.01em",
            lineHeight: 1.6,
            maxWidth: "420px",
          }}
        >
          Your aquaponics system is{" "}
          <span
            style={{
              color: "rgba(175,208,110,1)",
              fontWeight: 800,
              background: "rgba(175,208,110,0.15)",
              borderRadius: "4px",
              padding: "1px 6px",
            }}
          >
            running smoothly
          </span>{" "}
          — here's today's overview.
        </p>

        <style>{`
          @keyframes wave {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(18deg); }
            75% { transform: rotate(-10deg); }
          }
        `}</style>
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="System Health" value={stats.systemHealth} />
        <StatCard title="pH Level" value={stats.ph} />
        <StatCard title="Water Level" value={stats.waterLevel} />
        <StatCard title="Water Temp" value={stats.waterTemp} />
      </div>

      {/* Meters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-3">
          <Meters />
        </div>
      </div>

      <div className="mt-6">
        <RecentIssuesTable />
      </div>
    </>
  );
}
