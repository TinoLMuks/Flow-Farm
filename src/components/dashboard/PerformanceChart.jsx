import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip
);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function PerformanceChart() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    fetch(`${API_URL}/sensors/readings/range/1?start=${sixHoursAgo.toISOString()}&end=${now.toISOString()}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((json) => {
        if (!json.success) throw new Error("API returned error");
        const apiData = json.data;
        setChartData({
          labels: apiData.labels,
          datasets: [
            {
              label: "Temperature",
              data: apiData.tempData,
              borderColor: "#87aece",
              backgroundColor: "#87aece",
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: "Water Level",
              data: apiData.waterData,
              borderColor: "#1d2a62",
              backgroundColor: "#1d2a62",
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 4,
            },
            {
              label: "pH",
              data: apiData.phData,
              borderColor: "#afd063",
              backgroundColor: "#afd063",
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 4,
            }
          ]
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Unable to load live sensor data.");
        setLoading(false);
      });
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        align: "start",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        grid: {
          color: "rgba(0,0,0,0.05)"
        },
        ticks: {
          display: false
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-[#ededed] p-6 rounded-2xl shadow-md flex justify-center items-center h-64">
        <p className="text-[#1d2a62] font-semibold animate-pulse">Connecting to SAFS Cloud...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#ededed] p-6 rounded-2xl shadow-md border-2 border-red-200">
        <h2 className="text-lg font-bold mb-4 text-[#1d2a62]">Performance</h2>
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <p className="text-red-600 font-medium mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs bg-[#1d2a62] text-white px-3 py-1 rounded-full hover:bg-opacity-80"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#ededed] p-6 rounded-2xl shadow-md">
      <h2 className="text-lg font-bold mb-4 text-[#1d2a62]">Performance</h2>
      <Line data={chartData} options={options} />
    </div>
  );
}
