import { FiHome, FiBarChart2, FiMessageCircle, FiSettings, FiHelpCircle, FiLogOut } from "react-icons/fi";

export default function Sidebar() {
  return (
    // Note: h-full ensures it stretches within the parent container
    <div className="w-60 bg-gray-900 text-gray-300 h-full flex flex-col">

      {/* Top Section - added flex-1 to push everything below it down */}
      <div className="p-6 flex-1">
        <h2 className="text-2xl font-bold text-white mb-8">Flow Farm</h2>

        <nav className="flex flex-col gap-2">
          <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer">
            <FiHome />
            <span>Overview</span>
          </div>

          <div className="flex items-center gap-3 p-2 rounded bg-gray-800 hover:bg-gray-700 cursor-pointer">
            <FiBarChart2 />
            <span>Summary</span>
          </div>

          <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer">
            <FiBarChart2 />
            <span>Custom view</span>
          </div>

          <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer relative">
            <FiMessageCircle />
            <span>Messages</span>
            <span className="absolute right-3 bg-red-500 text-white text-xs font-bold px-2 rounded-full">
              2
            </span>
          </div>
        </nav>
      </div>

      {/* Bottom Section - mt-auto acts as a safety net to stay at the bottom */}
      <div className="p-6 border-t border-gray-700 flex flex-col gap-3 text-sm mt-auto mb-4">
        <div className="flex items-center gap-2 hover:text-white cursor-pointer">
          <FiSettings />
          <span>Settings</span>
        </div>

        <div className="flex items-center gap-2 hover:text-white cursor-pointer">
          <FiHelpCircle />
          <span>Help</span>
        </div>

        <div className="flex items-center gap-2 hover:text-white cursor-pointer">
          <span>Contact us</span>
        </div>

        <div className="flex items-center gap-2 hover:text-red-500 cursor-pointer">
          <FiLogOut />
          <span>Log out</span>
        </div>
      </div>

    </div>
  );
}