import { useState, useEffect } from "react";
import StatCard from "./StatCard";
import RecentIssuesTable from "./RecentIssuesTable";
import Meters from "./Meters";
import { useSocket } from "../../hooks/useSocket";

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
    tds: "--",
  });

  const [systemStatus, setSystemStatus] = useState("running smoothly");
  const [apiAvailable, setApiAvailable] = useState(true);
  
  // Real-time socket connection (global, not tank-specific)
  const { isConnected, latestReadings, latestAlert } = useSocket();

  // Initial fetch
  useEffect(() => {
    async function fetchStats() {
      try {
        const [readingsRes, healthRes] = await Promise.all([
          fetch(`${API_URL}/sensors/readings/latest/1`),
          fetch(`${API_URL}/system-health/1`),
        ]);
        
        if (!readingsRes.ok || !healthRes.ok) {
          throw new Error('API not available');
        }
        
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
            if (r.type_name === "tds") newStats.tds = r.value + " ppm";
          }
        }

        setStats(newStats);
        setApiAvailable(true);
      } catch (err) {
        // Use demo values when API is not available
        setStats({
          systemHealth: "85%",
          ph: "7.0",
          waterLevel: "65%",
          waterTemp: "25°C",
          tds: "300 ppm",
        });
        setApiAvailable(false);
      }
    }
    fetchStats();
  }, []);

  // Update from real-time socket data
  useEffect(() => {
    if (latestReadings && latestReadings.readings) {
      const readings = latestReadings.readings;
      setStats(prev => ({
        ...prev,
        ph: readings.ph !== undefined ? readings.ph : prev.ph,
        waterTemp: readings.temperature !== undefined ? readings.temperature + "°C" : prev.waterTemp,
        waterLevel: readings.water_level !== undefined ? readings.water_level + "%" : prev.waterLevel,
        tds: readings.tds !== undefined ? readings.tds + " ppm" : prev.tds,
      }));
    }
  }, [latestReadings]);

  // Update system status when alert is received
  useEffect(() => {
    if (latestAlert) {
      setSystemStatus("needs attention");
      // Reset after 30 seconds
      const timer = setTimeout(() => setSystemStatus("running smoothly"), 30000);
      return () => clearTimeout(timer);
    }
  }, [latestAlert]);

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
          {isConnected && (
            <span style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#22c55e",
              marginLeft: 4,
            }} />
          )}
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
          Welcome!
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
          {!apiAvailable ? (
            <>
              <span style={{ color: "#f59e0b", fontWeight: 500 }}>Demo Mode</span> - Connect your backend to see real data
            </>
          ) : (
            <>
              Your aquaponics system is{" "}
              <span
                style={{
                  color: systemStatus === "running smoothly" ? "rgba(175,208,110,1)" : "#ef4444",
                  fontWeight: 800,
                  background: systemStatus === "running smoothly" ? "rgba(175,208,110,0.15)" : "rgba(239,68,68,0.15)",
                  borderRadius: "4px",
                  padding: "1px 6px",
                }}
              >
                {systemStatus}
              </span>{" "}
              {systemStatus === "running smoothly" ? "- here's today's overview." : "- check the alerts below."}
            </>
          )}
        </p>
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="System Health" value={stats.systemHealth} />
        <StatCard title="pH Level" value={stats.ph} />
        <StatCard title="Water Level" value={stats.waterLevel} />
        <StatCard title="Water Temp" value={stats.waterTemp} />
        <StatCard title="TDS" value={stats.tds} />
      </div>

      {/* Alert Banner (if recent alert) */}
      {latestAlert && (
        <div style={{
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            color: "#dc2626",
            fontWeight: 700,
          }}>
            !
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: "#dc2626", fontSize: 14 }}>
              New Alert: {latestAlert.tank_name || "Tank 1"}
            </div>
            <div style={{ color: "#7f1d1d", fontSize: 13 }}>
              {latestAlert.message}
            </div>
          </div>
          <div style={{ color: "#9ca3af", fontSize: 12 }}>
            Just now
          </div>
        </div>
      )}

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
