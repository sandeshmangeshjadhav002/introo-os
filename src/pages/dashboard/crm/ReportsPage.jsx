import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Calendar } from 'lucide-react';
import { useDeals } from '../../../hooks/useDeals';
import { useLeads } from '../../../hooks/useLeads';
import { useActivities } from '../../../hooks/useActivities';
import { useCompanies } from '../../../hooks/useCompanies';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// Sample data for demo
const monthlyRevenueData = [
  { name: 'Jan', revenue: 4000, deals: 24 },
  { name: 'Feb', revenue: 3000, deals: 13 },
  { name: 'Mar', revenue: 2000, deals: 98 },
  { name: 'Apr', revenue: 2780, deals: 39 },
  { name: 'May', revenue: 1890, deals: 48 },
  { name: 'Jun', revenue: 2390, deals: 38 },
  { name: 'Jul', revenue: 3490, deals: 43 },
];

const pipelineData = [
  { name: 'New', value: 400 },
  { name: 'Qualified', value: 300 },
  { name: 'Proposal', value: 300 },
  { name: 'Negotiation', value: 200 },
  { name: 'Won', value: 278 },
];

const leadSourcesData = [
  { name: 'Website', count: 40 },
  { name: 'LinkedIn', count: 30 },
  { name: 'Referral', count: 30 },
  { name: 'Email', count: 20 },
  { name: 'Events', count: 10 },
];

const dealsByStageData = [
  { name: 'New', count: 45 },
  { name: 'Qualified', count: 35 },
  { name: 'Proposal', count: 25 },
  { name: 'Negotiation', count: 15 },
  { name: 'Won', count: 20 },
  { name: 'Lost', count: 10 },
];

const topSalespeopleData = [
  { name: 'John Doe', deals: 25, revenue: 125000 },
  { name: 'Jane Smith', deals: 20, revenue: 98000 },
  { name: 'Mike Johnson', deals: 18, revenue: 87000 },
  { name: 'Sarah Wilson', deals: 15, revenue: 72000 },
];

const StatCard = ({ title, value, icon: Icon, trend, color }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="text-sm font-medium">{Math.abs(trend)}% this month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default function ReportsPage() {
  const { data: deals = [] } = useDeals();
  const { data: leads = [] } = useLeads();
  const { data: activities = [] } = useActivities();
  const { data: companies = [] } = useCompanies();

  // Calculate real stats from data
  const wonDeals = deals.filter(deal => deal.stage === 'won');
  const lostDeals = deals.filter(deal => deal.stage === 'lost');
  const totalRevenue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const conversionRate = deals.length > 0 ? ((wonDeals.length / deals.length) * 100).toFixed(1) : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports & Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Track your sales performance and key metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend={12.5}
          color="bg-blue-600"
        />
        <StatCard
          title="Deals Won"
          value={wonDeals.length}
          icon={Target}
          trend={8.3}
          color="bg-green-600"
        />
        <StatCard
          title="Deals Lost"
          value={lostDeals.length}
          icon={TrendingDown}
          trend={-5.2}
          color="bg-red-600"
        />
        <StatCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          icon={TrendingUp}
          trend={3.1}
          color="bg-purple-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Revenue Trend</h3>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Calendar size={16} />
              <span className="text-sm">Last 7 months</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyRevenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" dark:stroke="#374151" />
              <XAxis dataKey="name" stroke="#6B7280" dark:stroke="#9CA3AF" />
              <YAxis stroke="#6B7280" dark:stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Pipeline Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pipelineData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pipelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Deals by Stage */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Deals by Stage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dealsByStageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" dark:stroke="#374151" />
              <XAxis dataKey="name" stroke="#6B7280" dark:stroke="#9CA3AF" />
              <YAxis stroke="#6B7280" dark:stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Sources */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Lead Sources</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leadSourcesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {leadSourcesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Salespeople */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Salespeople</h3>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Users size={16} />
              <span className="text-sm">This quarter</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSalespeopleData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" dark:stroke="#374151" />
              <XAxis type="number" stroke="#6B7280" dark:stroke="#9CA3AF" />
              <YAxis dataKey="name" type="category" stroke="#6B7280" dark:stroke="#9CA3AF" width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="deals" fill="#10B981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
