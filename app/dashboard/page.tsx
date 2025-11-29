'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStock: 0,
    lowStock: 0,
    totalUsers: 0,
    nfcTagsWritten: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [stockRes, usersRes, tagsRes] = await Promise.all([
        fetch('/api/stock'),
        fetch('/api/users'),
        fetch('/api/nfc-tags'),
      ]);

      const [stockData, usersData, tagsData] = await Promise.all([
        stockRes.json(),
        usersRes.json(),
        tagsRes.json(),
      ]);

      setStats({
        totalStock: stockData.stats?.total || 0,
        lowStock: stockData.stats?.lowStock || 0,
        totalUsers: usersData.data?.length || 0,
        nfcTagsWritten: tagsData.data?.length || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Stock Items"
          value={stats.totalStock}
          icon="📦"
          color="blue"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStock}
          icon="⚠️"
          color="red"
        />
        <StatCard
          title="Active Users"
          value={stats.totalUsers}
          icon="👥"
          color="green"
        />
        <StatCard
          title="NFC Tags Written"
          value={stats.nfcTagsWritten}
          icon="📱"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/dashboard/stock'}
              className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Manage Stock
            </button>
            <button
              onClick={() => window.location.href = '/dashboard/users'}
              className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Manage Users
            </button>
            <button
              onClick={() => window.location.href = '/dashboard/nfc-tags'}
              className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              View NFC Tags
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">System Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">Version:</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">Database:</span>
              <span className="font-medium">SQLite</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">Status:</span>
              <span className="text-green-600 font-medium">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'red' | 'green' | 'purple';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`text-4xl p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
