import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function RecentIssuesTable() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch(`${API_URL}/alerts?limit=10`);
        const json = await res.json();
        if (json.success) setIssues(json.data);
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      }
    }
    fetchAlerts();
  }, []);

  return (
    <div className="bg-white p-4 rounded-xl shadow overflow-x-auto">
      <h2 className="text-lg font-semibold mb-4">Recent Issues</h2>

      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Sensor</th>
            <th className="p-2 text-left">Issue</th>
            <th className="p-2 text-left">Value</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {issues.length === 0 ? (
            <tr>
              <td className="p-2 text-gray-400" colSpan="6">No recent issues</td>
            </tr>
          ) : (
            issues.map((issue, i) => (
              <tr key={issue.alert_id} className={i % 2 === 1 ? "bg-gray-100" : ""}>
                <td className="p-2">
                  {new Date(issue.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                </td>
                <td className="p-2">{issue.sensor}</td>
                <td className="p-2">{issue.issue}</td>
                <td className="p-2">{issue.value_recorded}{issue.unit}</td>
                <td className={`p-2 ${issue.status === "high" ? "text-red-500" : issue.status === "low" ? "text-orange-500" : "text-yellow-500"}`}>
                  {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                </td>
                <td className="p-2"></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
