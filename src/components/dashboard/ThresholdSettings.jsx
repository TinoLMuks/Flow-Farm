import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Sensor configuration with defaults and display info
const SENSOR_CONFIGS = {
  temperature: {
    label: "Temperature",
    unit: "°C",
    icon: "🌡️",
    color: "#ef4444",
    defaultMin: 22,
    defaultMax: 28,
    absMin: 10,
    absMax: 40,
    step: 0.5,
    description: "Water temperature for fish health"
  },
  ph: {
    label: "pH Level",
    unit: "pH",
    icon: "🧪",
    color: "#8b5cf6",
    defaultMin: 6.8,
    defaultMax: 7.2,
    absMin: 5,
    absMax: 9,
    step: 0.1,
    description: "Water acidity/alkalinity"
  },
  water_level: {
    label: "Water Level",
    unit: "%",
    icon: "💧",
    color: "#3b82f6",
    defaultMin: 40,
    defaultMax: 90,
    absMin: 0,
    absMax: 100,
    step: 1,
    description: "Tank water level percentage"
  },
  tds: {
    label: "TDS",
    unit: "ppm",
    icon: "📊",
    color: "#10b981",
    defaultMin: 200,
    defaultMax: 400,
    absMin: 0,
    absMax: 800,
    step: 10,
    description: "Total Dissolved Solids"
  }
};

function ThresholdCard({ sensorType, config, min, max, onUpdate, isSaving }) {
  const [localMin, setLocalMin] = useState(min);
  const [localMax, setLocalMax] = useState(max);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalMin(min);
    setLocalMax(max);
    setHasChanges(false);
  }, [min, max]);

  const handleMinChange = (value) => {
    const newMin = parseFloat(value);
    if (newMin < localMax) {
      setLocalMin(newMin);
      setHasChanges(true);
    }
  };

  const handleMaxChange = (value) => {
    const newMax = parseFloat(value);
    if (newMax > localMin) {
      setLocalMax(newMax);
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    onUpdate(sensorType, localMin, localMax);
  };

  const handleReset = () => {
    setLocalMin(config.defaultMin);
    setLocalMax(config.defaultMax);
    setHasChanges(true);
  };

  return (
    <div style={{
      background: "#ffffff",
      borderRadius: 16,
      border: "1px solid #e5e7eb",
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 20,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${config.color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}>
          {config.icon}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1f2937" }}>
            {config.label}
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
            {config.description}
          </p>
        </div>
      </div>

      {/* Range Display */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "16px 0",
        background: "#f9fafb",
        borderRadius: 12,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Minimum</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: config.color }}>
            {localMin}{config.unit}
          </div>
        </div>
        <div style={{
          width: 40,
          height: 2,
          background: `linear-gradient(90deg, ${config.color}, ${config.color}50)`,
          borderRadius: 2,
        }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Maximum</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: config.color }}>
            {localMax}{config.unit}
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Min Threshold</label>
            <span style={{ fontSize: 12, color: "#1f2937", fontWeight: 600 }}>{localMin}{config.unit}</span>
          </div>
          <input
            type="range"
            min={config.absMin}
            max={localMax - config.step}
            step={config.step}
            value={localMin}
            onChange={(e) => handleMinChange(e.target.value)}
            style={{
              width: "100%",
              height: 6,
              borderRadius: 3,
              background: `linear-gradient(90deg, ${config.color} ${((localMin - config.absMin) / (config.absMax - config.absMin)) * 100}%, #e5e7eb ${((localMin - config.absMin) / (config.absMax - config.absMin)) * 100}%)`,
              appearance: "none",
              cursor: "pointer",
            }}
          />
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Max Threshold</label>
            <span style={{ fontSize: 12, color: "#1f2937", fontWeight: 600 }}>{localMax}{config.unit}</span>
          </div>
          <input
            type="range"
            min={localMin + config.step}
            max={config.absMax}
            step={config.step}
            value={localMax}
            onChange={(e) => handleMaxChange(e.target.value)}
            style={{
              width: "100%",
              height: 6,
              borderRadius: 3,
              background: `linear-gradient(90deg, ${config.color} ${((localMax - config.absMin) / (config.absMax - config.absMin)) * 100}%, #e5e7eb ${((localMax - config.absMin) / (config.absMax - config.absMin)) * 100}%)`,
              appearance: "none",
              cursor: "pointer",
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        <button
          onClick={handleReset}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            color: "#6b7280",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Reset to Default
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: hasChanges ? config.color : "#e5e7eb",
            color: hasChanges ? "#ffffff" : "#9ca3af",
            fontSize: 13,
            fontWeight: 600,
            cursor: hasChanges ? "pointer" : "not-allowed",
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

export default function ThresholdSettings({ tankId = 1 }) {
  const [thresholds, setThresholds] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch current thresholds
  useEffect(() => {
    async function fetchThresholds() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/thresholds/${tankId}`);
        const json = await res.json();
        
        if (json.success && json.data) {
          const thresholdMap = {};
          for (const th of json.data) {
            thresholdMap[th.type_name] = {
              min: parseFloat(th.min_value),
              max: parseFloat(th.max_value)
            };
          }
          setThresholds(thresholdMap);
        }
      } catch (err) {
        console.error("Failed to fetch thresholds:", err);
        setError("Failed to load thresholds");
      } finally {
        setLoading(false);
      }
    }
    fetchThresholds();
  }, [tankId]);

  // Update threshold
  const handleUpdate = async (sensorType, minValue, maxValue) => {
    const sensorTypeId = { temperature: 1, ph: 2, water_level: 3, tds: 4 }[sensorType];
    
    setSaving(prev => ({ ...prev, [sensorType]: true }));
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_URL}/thresholds/${tankId}/${sensorTypeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          min_value: minValue,
          max_value: maxValue,
          updated_by: 1 // TODO: Use actual logged-in user ID
        })
      });

      const json = await res.json();
      
      if (json.success) {
        setThresholds(prev => ({
          ...prev,
          [sensorType]: { min: minValue, max: maxValue }
        }));
        setSuccess(`${SENSOR_CONFIGS[sensorType].label} thresholds updated successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(json.error || "Update failed");
      }
    } catch (err) {
      console.error("Failed to update threshold:", err);
      setError(`Failed to update ${SENSOR_CONFIGS[sensorType].label} thresholds`);
    } finally {
      setSaving(prev => ({ ...prev, [sensorType]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 16, color: "#6b7280" }}>Loading thresholds...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 4px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          color: "#1f2937",
          margin: 0,
          letterSpacing: "-0.02em"
        }}>
          Threshold Settings
        </h1>
        <p style={{
          fontSize: 14,
          color: "#6b7280",
          marginTop: 8,
          lineHeight: 1.5
        }}>
          Configure alert thresholds for your sensors. When readings go outside these ranges, 
          you will receive email notifications.
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div style={{
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 24,
          color: "#dc2626",
          fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: "rgba(34, 197, 94, 0.1)",
          border: "1px solid rgba(34, 197, 94, 0.3)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 24,
          color: "#16a34a",
          fontSize: 14,
        }}>
          {success}
        </div>
      )}

      {/* Threshold Cards Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 20,
      }}>
        {Object.entries(SENSOR_CONFIGS).map(([sensorType, config]) => (
          <ThresholdCard
            key={sensorType}
            sensorType={sensorType}
            config={config}
            min={thresholds[sensorType]?.min ?? config.defaultMin}
            max={thresholds[sensorType]?.max ?? config.defaultMax}
            onUpdate={handleUpdate}
            isSaving={saving[sensorType]}
          />
        ))}
      </div>

      {/* Email Configuration Notice */}
      <div style={{
        marginTop: 32,
        padding: 20,
        background: "rgba(59, 130, 246, 0.05)",
        border: "1px solid rgba(59, 130, 246, 0.2)",
        borderRadius: 12,
      }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#1e40af" }}>
          Email Alert Configuration
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "#3b82f6", lineHeight: 1.5 }}>
          To receive email alerts when thresholds are breached, make sure you have configured 
          the following environment variables on your server:
        </p>
        <ul style={{ margin: "12px 0 0", paddingLeft: 20, fontSize: 13, color: "#6b7280" }}>
          <li><code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>RESEND_API_KEY</code> - Your Resend API key</li>
          <li><code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>ALERT_EMAIL_TO</code> - Email address(es) to receive alerts</li>
        </ul>
      </div>
    </div>
  );
}
