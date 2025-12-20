'use client';

import { useEffect, useState } from 'react';
import CachingSettings from './components/CachingSettings';
import { useRouter } from 'next/navigation';

interface Transaction {
  id: string;
  businessName: string;
  signTypeName: string;
  status: string;
  salePrice: number;
  createdAt: string;
}

interface DashboardData {
  stats: {
    totalSales: number;
    totalRevenue: number;
    failedSales: number;
    activeUsers: number;
    todaysSales: number;
    todaysRevenue: number;
  };
  salesTrend: Array<{ date: string; sales: number; revenue: number }>;
  signPopularity: Array<{ sign_type: string; quantity: number; revenue: number }>;
  topUsers: Array<{ user_id: string; name: string; total_sales: number; total_revenue: number; success_rate: number }>;
  recentTransactions: Transaction[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const router = useRouter();

  useEffect(() => {
    fetchDashboard();
  }, [timeRange]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      // Web authentication uses session cookies automatically
      
      let url = '/api/analytics/dashboard';
      if (timeRange !== '30d') {
        const endDate = new Date();
        const startDate = new Date();
        if (timeRange === '7d') startDate.setDate(startDate.getDate() - 7);
        if (timeRange === '90d') startDate.setDate(startDate.getDate() - 90);
        url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      }

      const response = await fetch(url, {
        credentials: 'include', // Include cookies for NextAuth
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-600">Failed to load dashboard data</div>;
  }

  const stats = data.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your business performance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === '7d' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === '30d' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === '90d' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Sales"
          value={stats.totalSales}
          icon="📊"
          color="blue"
          subtitle={`${stats.todaysSales} today`}
          onClick={() => router.push('/dashboard/invoices')}
        />
        <MetricCard
          title="Total Revenue"
          value={`£${stats.totalRevenue.toFixed(2)}`}
          icon="💰"
          color="green"
          subtitle={`£${stats.todaysRevenue.toFixed(2)} today`}
          onClick={() => router.push('/dashboard/invoices')}
        />
        <MetricCard
          title="Failed Sales"
          value={stats.failedSales}
          icon="⚠️"
          color="red"
          subtitle={`${((stats.failedSales / (stats.totalSales + stats.failedSales)) * 100).toFixed(1)}% failure rate`}
          onClick={() => router.push('/dashboard/invoices')}
        />
        <MetricCard
          title="Active Users"
          value={stats.activeUsers}
          icon="👥"
          color="purple"
          onClick={() => router.push('/dashboard/users')}
        />
        <MetricCard
          title="Avg Sale Value"
          value={`£${(stats.totalRevenue / stats.totalSales || 0).toFixed(2)}`}
          icon="📈"
          color="indigo"
          onClick={() => router.push('/dashboard/invoices')}
        />
        <MetricCard
          title="Success Rate"
          value={`${((stats.totalSales / (stats.totalSales + stats.failedSales)) * 100).toFixed(1)}%`}
          icon="✅"
          color="teal"
          onClick={() => router.push('/dashboard/invoices')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sales Trend</h3>
          <div className="space-y-2">
            {data.salesTrend.slice(-10).map((day, idx) => {
              const maxRevenue = Math.max(...data.salesTrend.map(d => Number(d.revenue)));
              const percentage = maxRevenue > 0 ? (Number(day.revenue) / maxRevenue) * 100 : 0;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-20">{new Date(day.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage > 15 && <span className="text-xs font-semibold text-white">{day.sales}</span>}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-20 text-right">£{Number(day.revenue).toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sign Popularity */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Popular Sign Types</h3>
          <div className="space-y-3">
            {data.signPopularity.slice(0, 5).map((sign, idx) => {
              const maxQty = Math.max(...data.signPopularity.map(s => Number(s.quantity)));
              const percentage = (Number(sign.quantity) / maxQty) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">{sign.sign_type}</span>
                    <span className="text-gray-600">{sign.quantity} sales</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">Revenue: £{Number(sign.revenue).toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Performers</h3>
          <div className="space-y-3">
            {data.topUsers.slice(0, 5).map((user, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.total_sales} sales · {Number(user.success_rate).toFixed(1)}% success</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">£{Number(user.total_revenue).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {data.recentTransactions.slice(0, 5).map((tx, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{tx.businessName}</p>
                  <p className="text-xs text-gray-600">{tx.signTypeName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    tx.status === 'success' ? 'bg-green-100 text-green-700' : 
                    tx.status === 'failed' ? 'bg-red-100 text-red-700' : 
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {tx.status}
                  </span>
                  <span className="font-bold text-gray-900 w-16 text-right">£{tx.salePrice?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ActionCard
          title="Manage Stock"
          description="View and update inventory levels"
          icon="📦"
          href="/dashboard/stock"
          color="indigo"
        />
        <ActionCard
          title="Manage Users"
          description="Add or edit user accounts"
          icon="👥"
          href="/dashboard/users"
          color="purple"
        />
        <ActionCard
          title="View NFC Tags"
          description="Track all written tags"
          icon="📱"
          href="/dashboard/nfc-tags"
          color="blue"
        />
        <ActionCard
          title="Demo Tag"
          description="Write a showcase demo tag"
          icon="🎯"
          href="/dashboard/demo-tag"
          color="violet"
        />
      </div>

      {/* Settings Section */}
      <div className="mt-8 border-t pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
        <CachingSettings />
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'red' | 'green' | 'purple' | 'indigo' | 'teal';
  subtitle?: string;
  onClick?: () => void;
}

function MetricCard({ title, value, icon, color, subtitle, onClick }: MetricCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    red: 'from-red-500 to-red-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
    teal: 'from-teal-500 to-teal-600',
  };

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`bg-white p-6 rounded-xl shadow-lg border border-gray-200 transition-shadow text-left w-full ${
        onClick ? 'hover:shadow-xl focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} text-white text-2xl`}>
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </Wrapper>
  );
}

import Link from 'next/link';

interface ActionCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: 'indigo' | 'purple' | 'blue' | 'violet';
}

function ActionCard({ title, description, icon, href, color }: ActionCardProps) {
  const colorClasses = {
    indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    violet: 'from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700',
  };

  return (
    <Link
      href={href}
      className={`block p-6 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white hover:shadow-xl transition-all transform hover:scale-105`}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm opacity-90">{description}</p>
    </Link>
  );
}
