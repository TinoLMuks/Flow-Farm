/**
 * Messages Page
 * 
 * Displays all alerts and system messages in a unified inbox.
 * Real-time updates via WebSocket when new alerts come in.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  FiAlertTriangle, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiClock,
  FiThermometer,
  FiDroplet,
  FiActivity,
  FiFilter,
  FiRefreshCw,
  FiBell,
  FiMail,
  FiTrash2,
  FiCheck
} from 'react-icons/fi';
import { useSocket } from '../../hooks/useSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Sensor icon mapping
const SENSOR_ICONS = {
  temperature: FiThermometer,
  ph: FiDroplet,
  tds: FiActivity,
  water_level: FiDroplet,
};

// Alert type colors
const ALERT_COLORS = {
  high: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-400' },
  low: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-400' },
  resolved: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: 'text-emerald-400' },
  acknowledged: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'text-blue-400' },
};

export default function Messages() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, high, low, resolved, acknowledged
  const [refreshing, setRefreshing] = useState(false);
  
  // Real-time socket connection
  const { isConnected, latestAlert } = useSocket();

  // Fetch alerts from API
  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/alerts?limit=100`);
      const json = await res.json();
      
      if (json.success) {
        setAlerts(json.data);
      } else {
        throw new Error(json.error || 'Failed to fetch alerts');
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Handle real-time alerts
  useEffect(() => {
    if (latestAlert) {
      setAlerts(prev => [
        {
          alert_id: latestAlert.alert_id,
          created_at: latestAlert.created_at,
          sensor: latestAlert.sensor_type,
          issue: latestAlert.message,
          value_recorded: latestAlert.value,
          unit: latestAlert.unit,
          status: latestAlert.alert_type,
          resolution_status: null,
          tank_name: latestAlert.tank_name,
        },
        ...prev
      ]);
    }
  }, [latestAlert]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
  };

  // Acknowledge alert
  const handleAcknowledge = async (alertId) => {
    try {
      const res = await fetch(`${API_URL}/alerts/${alertId}/acknowledge`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged_by: 1 }) // TODO: Use actual user ID
      });
      
      if (res.ok) {
        setAlerts(prev => prev.map(a => 
          a.alert_id === alertId ? { ...a, resolution_status: 'acknowledged' } : a
        ));
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  // Resolve alert
  const handleResolve = async (alertId) => {
    try {
      const res = await fetch(`${API_URL}/alerts/${alertId}/resolve`, {
        method: 'PUT',
      });
      
      if (res.ok) {
        setAlerts(prev => prev.map(a => 
          a.alert_id === alertId ? { ...a, resolution_status: 'resolved' } : a
        ));
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'resolved' || filter === 'acknowledged') {
      return alert.resolution_status === filter;
    }
    return alert.status === filter && !alert.resolution_status;
  });

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Count by status
  const counts = {
    all: alerts.length,
    high: alerts.filter(a => a.status === 'high' && !a.resolution_status).length,
    low: alerts.filter(a => a.status === 'low' && !a.resolution_status).length,
    acknowledged: alerts.filter(a => a.resolution_status === 'acknowledged').length,
    resolved: alerts.filter(a => a.resolution_status === 'resolved').length,
  };

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Messages & Alerts</h1>
          <p className="text-sm text-gray-400">
            {isConnected ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Live updates enabled
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-500 rounded-full" />
                Offline mode
              </span>
            )}
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a2235] border border-[rgba(175,208,110,0.2)] rounded-lg text-gray-300 hover:text-white hover:border-[rgba(175,208,110,0.4)] transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'All', icon: FiBell },
          { key: 'high', label: 'Critical', icon: FiAlertTriangle },
          { key: 'low', label: 'Warnings', icon: FiAlertCircle },
          { key: 'acknowledged', label: 'Acknowledged', icon: FiCheck },
          { key: 'resolved', label: 'Resolved', icon: FiCheckCircle },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === key
                ? 'bg-[rgba(175,208,110,0.15)] border border-[rgba(175,208,110,0.3)] text-[#afd06e]'
                : 'bg-[#1a2235] border border-[rgba(255,255,255,0.06)] text-gray-400 hover:text-white hover:border-[rgba(255,255,255,0.1)]'
            }`}
          >
            <Icon size={14} />
            {label}
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              filter === key ? 'bg-[rgba(175,208,110,0.2)]' : 'bg-[rgba(255,255,255,0.06)]'
            }`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <FiRefreshCw className="animate-spin text-[#afd06e]" size={32} />
            <p className="text-gray-400">Loading alerts...</p>
          </div>
        </div>
      ) : filteredAlerts.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(175,208,110,0.1)] flex items-center justify-center mb-4">
            <FiBell className="text-[#afd06e]" size={28} />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">No alerts found</h3>
          <p className="text-gray-400 text-sm">
            {filter === 'all' 
              ? 'Your system is running smoothly with no alerts.'
              : `No ${filter} alerts at this time.`}
          </p>
        </div>
      ) : (
        /* Alerts List */
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const status = alert.resolution_status || alert.status;
            const colors = ALERT_COLORS[status] || ALERT_COLORS.low;
            const SensorIcon = SENSOR_ICONS[alert.sensor?.toLowerCase()] || FiActivity;
            
            return (
              <div
                key={alert.alert_id}
                className={`${colors.bg} border ${colors.border} rounded-xl p-4 transition-all hover:scale-[1.01]`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-2.5 rounded-lg ${colors.bg} ${colors.icon}`}>
                    <SensorIcon size={20} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-semibold ${colors.text}`}>
                        {status === 'high' ? 'CRITICAL' : status === 'low' ? 'WARNING' : status.toUpperCase()}
                      </span>
                      {alert.tank_name && (
                        <span className="text-xs text-gray-500 bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded">
                          {alert.tank_name}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-white font-medium mb-1">{alert.issue}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <FiClock size={12} />
                        {formatTime(alert.created_at)}
                      </span>
                      {alert.value_recorded !== null && (
                        <span>
                          Value: <span className="text-white">{alert.value_recorded}{alert.unit}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  {!alert.resolution_status && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcknowledge(alert.alert_id)}
                        className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Acknowledge"
                      >
                        <FiCheck size={16} />
                      </button>
                      <button
                        onClick={() => handleResolve(alert.alert_id)}
                        className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title="Mark as Resolved"
                      >
                        <FiCheckCircle size={16} />
                      </button>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  {alert.resolution_status && (
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {alert.resolution_status === 'resolved' ? 'Resolved' : 'Acknowledged'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Demo Mode Notice */}
      {!isConnected && alerts.length === 0 && !loading && (
        <div className="mt-6 p-4 bg-[#1a2235] border border-[rgba(175,208,110,0.2)] rounded-xl">
          <h4 className="text-[#afd06e] font-medium mb-1">Demo Mode</h4>
          <p className="text-gray-400 text-sm">
            Connect your ESP32 and backend server to see real-time alerts here. 
            Alerts will appear automatically when sensor readings breach configured thresholds.
          </p>
        </div>
      )}
    </div>
  );
}
