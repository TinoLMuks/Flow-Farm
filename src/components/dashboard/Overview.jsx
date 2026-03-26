import StatCard from "./StatCard";
import AdviceCard from "./AdviceCard";
import RecentIssuesTable from "./RecentIssuesTable";
import Meters from "./Meters";

export default function Overview() {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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
          Hi, Alexandra!{" "}
         
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
        <StatCard title="System Health" value="21 324" />
        <StatCard title="pH Level" value="8.1" />
        <StatCard title="Water Level" value="22%" />
        <StatCard title="Water Temp" value="31.2°C" />
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