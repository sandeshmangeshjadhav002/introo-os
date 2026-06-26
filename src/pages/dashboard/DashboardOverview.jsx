import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Card from "../../components/Card";
import Button from "../../components/Button";
import {
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Bell,
  Search,
  AlertCircle,
} from "lucide-react";
import { useSupabase } from "../../context/SupabaseContext";

// Skeleton Component
const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl ${className}`}
  ></div>
);

const StatSkeleton = () => (
  <Card className="p-6">
    <div className="flex items-start justify-between mb-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-12 w-12" />
    </div>
    <Skeleton className="h-6 w-24" />
  </Card>
);

export default function DashboardOverview() {
  const { supabase, profile, organization } = useSupabase();
  const [stats, setStats] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load dashboard stats from the view we created
        const { data: statsData, error: statsError } = await supabase
          .from("dashboard_stats")
          .select("*")
          .single();

        if (statsError) throw statsError;

        setStats({
          totalRevenue: statsData?.total_revenue || 0,
          activeProjects: statsData?.active_projects || 0,
          pendingTasks: statsData?.pending_tasks || 0,
          employeeCount: statsData?.employee_count || 0,
        });

        // Load activity feed
        const { data: activityData, error: activityError } = await supabase
          .from("activity_logs")
          .select("*, users(full_name)")
          .order("created_at", { ascending: false })
          .limit(5);

        if (activityError) throw activityError;
        setActivityFeed(activityData || []);

        // Load invoice data for revenue chart
        const { data: invoicesData, error: invoicesError } = await supabase
          .from("invoices")
          .select("created_at, amount")
          .order("created_at", { ascending: true });

        if (invoicesError) throw invoicesError;

        // Aggregate by month
        const monthlyRevenue = {};
        invoicesData?.forEach((invoice) => {
          const month = new Date(invoice.created_at).toLocaleString("default", {
            month: "short",
          });
          if (!monthlyRevenue[month]) {
            monthlyRevenue[month] = 0;
          }
          monthlyRevenue[month] += Number(invoice.amount || 0);
        });

        const chartData = Object.entries(monthlyRevenue).map(
          ([month, revenue]) => ({
            month,
            revenue,
          }),
        );
        setRevenueData(chartData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase]);

  const statsConfig = [
    {
      label: "Total Revenue",
      value: stats ? `$${stats.totalRevenue.toLocaleString()}` : "$0",
      change: "+12.5%",
      up: true,
      icon: DollarSign,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "Active Projects",
      value: stats?.activeProjects || 0,
      change: "+5.2%",
      up: true,
      icon: TrendingUp,
      gradient: "from-purple-500 to-pink-600",
    },
    {
      label: "Open Tasks",
      value: stats?.pendingTasks || 0,
      change: "+3.1%",
      up: false,
      icon: Clock,
      gradient: "from-green-500 to-emerald-600",
    },
    {
      label: "Team Members",
      value: stats?.employeeCount || 0,
      change: "+8.3%",
      up: true,
      icon: Users,
      gradient: "from-orange-500 to-red-600",
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-8 py-8">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Oops! Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
            Welcome back, {profile?.full_name?.split(" ")[0] || "User"}! Here's
            your business overview for {organization?.name || "your org"}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              size={20}
            />
            <input
              type="text"
              placeholder="Search anything..."
              className="pl-12 pr-6 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <button className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-all">
            <Bell size={20} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => <StatSkeleton key={i} />)
          : statsConfig.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.08,
                    ease: "easeOut",
                  }}
                >
                  <Card className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {stat.label}
                        </p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          {stat.value}
                        </p>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}
                      >
                        <Icon size={24} className="text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          stat.up
                            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                        }`}
                      >
                        {stat.up ? (
                          <ArrowUpRight size={14} />
                        ) : (
                          <ArrowDownRight size={14} />
                        )}
                        {stat.change}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        vs last month
                      </span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="lg:col-span-2"
        >
          <Card className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Revenue Analytics
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Track your monthly revenue
                </p>
              </div>
              <select className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm">
                <option>Last 6 months</option>
                <option>Last 12 months</option>
              </select>
            </div>
            {loading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E2E8F0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748B", fontSize: 14 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748B", fontSize: 14 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: "12px",
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 4px 16px rgba(15, 23, 42, 0.12)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563EB"
                      strokeWidth={4}
                      dot={{
                        r: 6,
                        fill: "#2563EB",
                        strokeWidth: 2,
                        stroke: "#FFFFFF",
                      }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
        >
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Recent Activity
              </h2>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="space-y-6">
              {loading ? (
                Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))
              ) : activityFeed.length > 0 ? (
                activityFeed.map((item, i) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {item.users?.full_name?.[0] || "U"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {item.users?.full_name || "User"}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 ml-1">
                          {item.action}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No recent activity
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
