import { useState, useEffect } from "react";
import { Bell, User } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Topbar() {
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUserAndMessages() {
      try {
        const [userRes, msgRes] = await Promise.all([
          fetch(`${API_URL}/users/1`),
          fetch(`${API_URL}/messages/unread-count/1`),
        ]);
        const userData = await userRes.json();
        const msgData = await msgRes.json();

        if (userData.success && userData.data) {
          setUserName(userData.data.full_name);
          setUserRole(userData.data.role_name);
        }
        if (msgData.success && msgData.data) {
          setUnreadCount(msgData.data.unread_count);
        }
      } catch (err) {
        console.error("Failed to fetch topbar data:", err);
      }
    }
    fetchUserAndMessages();
  }, []);

  return (
    <div className="flex items-center justify-end bg-grey-100 h-14 px-6 ">

      {/* Notification */}
      <div className="relative mr-6 cursor-pointer">
        <Bell className="w-5 h-5 text-gray-600" />

        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3">

        {/* Name + Role */}
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">
            {userName || "Loading..."}
          </p>
          <p className="text-xs text-gray-400">
            {userRole || ""}
          </p>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500 text-sm">
            <User size={30}/>
          </span>
        </div>

      </div>
    </div>
  );
}
