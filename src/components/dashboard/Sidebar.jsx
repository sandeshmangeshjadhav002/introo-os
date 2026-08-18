import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Layout,
  Users,
  Briefcase,
  Clock,
  MessageSquare,
  Calendar,
  FileText,
  UserCheck,
  DollarSign,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useSupabase } from "../../context/SupabaseContext";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: Layout },
  { path: "/dashboard/ai", label: "AI Assistant", icon: Sparkles },
  { path: "/dashboard/crm", label: "CRM", icon: Users },
  { path: "/dashboard/projects", label: "Projects", icon: Briefcase },
  { path: "/dashboard/tasks", label: "Tasks", icon: Clock },
  { path: "/dashboard/chat", label: "Chat", icon: MessageSquare },
  { path: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { path: "/dashboard/documents", label: "Documents", icon: FileText },
  { path: "/dashboard/hr", label: "HR", icon: UserCheck },
  { path: "/dashboard/finance", label: "Finance", icon: DollarSign },
  { path: "/dashboard/settings", label: "Settings", icon: Settings },
  { path: "/dashboard/admin", label: "Admin", icon: Shield },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const [collapsed, setCollapsed] = useState(false);
  const { profile, organization } = useSupabase();

  const getInitials = (name) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "U";
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out ${
          collapsed ? "w-24" : "w-72"
        } ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col h-full">
          <div
            className={`p-8 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}
          >
            {!collapsed && (
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Introo OS
              </h1>
            )}
            {collapsed && (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                I
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              {collapsed ? (
                <ChevronRight size={20} />
              ) : (
                <ChevronLeft size={20} />
              )}
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
            {navItems.map((item, i) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-blue-500/10 text-blue-600 font-medium shadow-md"
                      : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                  }`
                }
              >
                <item.icon size={collapsed ? 24 : 20} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className={`p-4 border-t border-gray-200 dark:border-gray-800`}>
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                {getInitials(profile?.full_name)}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {profile?.full_name || "User"}
                  </p>
                  <p className="text-xs text-[#64748B] dark:text-gray-400 truncate">
                    {organization?.name || "Organization"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
