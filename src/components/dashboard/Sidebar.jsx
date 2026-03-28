import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiHome, FiBarChart2, FiMessageCircle, FiSettings, FiHelpCircle, FiLogOut } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Sidebar() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch(`${API_URL}/messages/unread-count/1`);
        const json = await res.json();
        if (json.success && json.data) {
          setUnreadCount(json.data.unread_count);
        }
      } catch (err) {
        console.error("Failed to fetch unread count:", err);
      }
    }
    fetchUnread();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes drift {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, 20px) scale(1.08); }
        }
        @keyframes leaf-sway {
          from { transform: rotate(0deg) scale(1); }
          to   { transform: rotate(8deg) scale(1.05); }
        }
        .sidebar-drift-1 { animation: drift 12s ease-in-out infinite alternate; }
        .sidebar-drift-2 { animation: drift 12s ease-in-out infinite alternate; animation-delay: -4s; }
        .sidebar-drift-3 { animation: drift 12s ease-in-out infinite alternate; animation-delay: -8s; }
        .sidebar-leaf-1  { animation: leaf-sway 8s ease-in-out infinite alternate; }
        .sidebar-leaf-2  { animation: leaf-sway 8s ease-in-out infinite alternate; animation-delay: -3s; }
        .sidebar-bg-grid {
          background-image:
            linear-gradient(rgba(175,208,110,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(175,208,110,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>

      <div className="w-60 h-full flex flex-col relative overflow-hidden bg-[#0e1628] text-gray-300">

        {/* Background blobs */}
        <div className="sidebar-drift-1 absolute w-48 h-48 rounded-full bg-[#87aece] opacity-[0.18] blur-[60px] -top-10 -right-10 pointer-events-none" />
        <div className="sidebar-drift-2 absolute w-48 h-48 rounded-full bg-[#afd06e] opacity-[0.22] blur-[60px] -bottom-10 -left-10 pointer-events-none" />
        <div className="sidebar-drift-3 absolute w-36 h-36 rounded-full bg-[#407118] opacity-25 blur-[60px] top-[45%] -left-8 pointer-events-none" />

        {/* Grid pattern */}
        <div className="sidebar-bg-grid absolute inset-0 pointer-events-none" />

        {/* Leaf decorations */}
        <svg className="sidebar-leaf-1 absolute top-[4%] left-[5%] opacity-[0.07] pointer-events-none" width="100" height="100" viewBox="0 0 100 100" fill="none">
          <path d="M50 5 C80 5, 95 30, 95 50 C95 75, 70 95, 50 95 C30 95, 5 75, 5 50 C5 25, 20 5, 50 5Z" fill="#afd06e"/>
          <path d="M50 5 L50 95" stroke="#407118" strokeWidth="2"/>
          <path d="M50 30 C60 25, 75 30, 80 40" stroke="#407118" strokeWidth="1.5" fill="none"/>
          <path d="M50 50 C60 45, 78 48, 82 58" stroke="#407118" strokeWidth="1.5" fill="none"/>
        </svg>
        <svg className="sidebar-leaf-2 absolute bottom-[8%] right-[5%] opacity-[0.07] pointer-events-none rotate-[120deg]" width="80" height="80" viewBox="0 0 100 100" fill="none">
          <path d="M50 5 C80 5, 95 30, 95 50 C95 75, 70 95, 50 95 C30 95, 5 75, 5 50 C5 25, 20 5, 50 5Z" fill="#afd06e"/>
          <path d="M50 5 L50 95" stroke="#407118" strokeWidth="2"/>
          <path d="M50 35 C62 28, 78 33, 83 45" stroke="#407118" strokeWidth="1.5" fill="none"/>
        </svg>

        {/* Top Section */}
        <div className="flex flex-col flex-1 px-4 pt-6 pb-2 relative z-10">

          {/* Logo */}
          <h2 className="text-xl font-bold text-white px-2 mb-6">Flow Farm</h2>

          {/* Nav label */}
          <p className="text-[10px] font-medium text-[rgba(240,244,255,0.3)] tracking-[0.12em] uppercase px-2 mb-2">Menu</p>

          <nav className="flex flex-col gap-1">
            <Link to="/dashboard/overview" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-gray-300 hover:text-white transition-colors duration-150 text-sm">
              <FiHome size={15} />
              <span>Overview</span>
            </Link>

            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[rgba(175,208,110,0.1)] border border-[rgba(175,208,110,0.15)] text-[#afd06e] text-sm cursor-pointer">
              <FiBarChart2 size={15} />
              <span>Summary</span>
            </div>

            <Link to="/dashboard/analytics" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-gray-300 hover:text-white transition-colors duration-150 text-sm">
              <FiBarChart2 size={15} />
              <span>Analytics</span>
            </Link>

            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-gray-300 hover:text-white transition-colors duration-150 text-sm cursor-pointer relative">
              <FiMessageCircle size={15} />
              <span>Messages</span>
              {unreadCount > 0 && (
                <span className="absolute right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {unreadCount}
                </span>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="px-4 pb-5 pt-4 border-t border-[rgba(175,208,110,0.12)] flex flex-col gap-1 relative z-10">
          <p className="text-[10px] font-medium text-[rgba(240,244,255,0.3)] tracking-[0.12em] uppercase px-2 mb-2">Account</p>

          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] hover:text-white transition-colors duration-150 text-sm cursor-pointer">
            <FiSettings size={15} />
            <span>Settings</span>
          </div>

          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] hover:text-white transition-colors duration-150 text-sm cursor-pointer">
            <FiHelpCircle size={15} />
            <span>Help</span>
          </div>

          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] hover:text-white transition-colors duration-150 text-sm cursor-pointer">
            <span>Contact us</span>
          </div>

          {/* Log out button */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,100,100,0.08)] hover:text-red-400 transition-colors duration-150 text-sm cursor-pointer mt-1"
          >
            <FiLogOut size={15} />
            <span>Log out</span>
          </div>
        </div>

      </div>
    </>
  );
}
