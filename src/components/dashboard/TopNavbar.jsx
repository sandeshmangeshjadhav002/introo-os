import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  User,
  ChevronDown,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useSupabase } from "../../context/SupabaseContext";

export default function TopNavbar({ setIsOpen }) {
  const { theme, setTheme } = useTheme();
  const { profile, signOut, supabase, user } = useSupabase();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Load notifications
  useEffect(() => {
    if (user) {
      loadNotifications();

      // Subscribe to realtime notifications
      const channel = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => loadNotifications(),
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  }, [user]);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    setNotifications(data || []);
  };

  const markAsRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    loadNotifications();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-8 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsOpen(true)}
            className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          >
            <Menu size={24} />
          </button>
          <div className="relative flex-1 max-w-xl">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={20}
            />
            <input
              type="text"
              placeholder="Search clients, projects, tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-start gap-3 ${!notif.is_read ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Bell
                            size={18}
                            className="text-blue-600 dark:text-blue-400"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {notif.title}
                          </p>
                          {notif.message && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {notif.message}
                            </p>
                          )}
                        </div>
                        {!notif.is_read && (
                          <CheckCircle2 size={16} className="text-blue-500" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative ml-2">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                {getInitials(profile?.full_name)}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {profile?.role || "Member"}
                </p>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden z-50">
                <Link
                  to="/dashboard/settings"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  <User size={18} />
                  Profile Settings
                </Link>
                <div className="h-px bg-gray-200 dark:bg-gray-800"></div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-left"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
