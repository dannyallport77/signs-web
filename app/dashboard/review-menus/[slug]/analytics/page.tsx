'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface ClickData {
  id: string;
  platformId: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  reviewSubmitted: boolean;
}

interface PlatformStats {
  platformId: string;
  platformName: string;
  totalClicks: number;
  reviewsSubmitted: number;
  conversionRate: string;
  recentClicks: ClickData[];
}

export default function MenuAnalyticsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [stats, setStats] = useState<PlatformStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalClicks, setTotalClicks] = useState(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // First get menu details
        const menuRes = await fetch(`/api/review-menus/${slug}`);
        if (!menuRes.ok) throw new Error('Menu not found');
        const menuData = await menuRes.json();
        const menu = menuData.data;

        // Fetch analytics for each platform
        const platformStats: PlatformStats[] = [];
        let totalClicksCount = 0;

        for (const platform of menu.platforms) {
          const res = await fetch(`/api/review-menu/${slug}/platform/${platform.id}/track`);
          if (res.ok) {
            const data = await res.json();
            platformStats.push({
              platformId: platform.id,
              platformName: platform.name,
              totalClicks: data.totalClicks || 0,
              reviewsSubmitted: data.reviewsSubmitted || 0,
              conversionRate: data.conversionRate || '0.00',
              recentClicks: data.recentClicks || [],
            });
            totalClicksCount += data.totalClicks || 0;
          }
        }

        setStats(platformStats.sort((a, b) => b.totalClicks - a.totalClicks));
        setTotalClicks(totalClicksCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchAnalytics();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <Link href={`/dashboard/review-menus/${slug}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold mb-2 inline-block">
          ← Back to Menu Editor
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Menu Analytics</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-semibold">Total Clicks</p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{totalClicks}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-semibold">Platforms Tracked</p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{stats.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-semibold">Reviews Submitted</p>
          <p className="text-4xl font-bold text-gray-900 mt-2">
            {stats.reduce((sum, p) => sum + p.reviewsSubmitted, 0)}
          </p>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Platform Performance</h2>
        </div>

        {stats.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No click data available yet. Share your review menu to start tracking!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Platform</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Clicks</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Reviews</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.map((platform) => (
                  <tr key={platform.platformId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{platform.platformName}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                        {platform.totalClicks}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                        {platform.reviewsSubmitted}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, parseFloat(platform.conversionRate))}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-gray-900">{platform.conversionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {stats.some((p) => p.recentClicks.length > 0) && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {stats
              .flatMap((platform) =>
                (platform.recentClicks || []).map((click) => ({
                  ...click,
                  platformName: platform.platformName,
                }))
              )
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 20)
              .map((click) => (
                <div key={click.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{click.platformName}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(click.timestamp).toLocaleString()}
                      </p>
                      {click.ipAddress && (
                        <p className="text-xs text-gray-500 mt-1">IP: {click.ipAddress}</p>
                      )}
                      {click.userAgent && (
                        <p className="text-xs text-gray-500 truncate">
                          {click.userAgent.substring(0, 60)}...
                        </p>
                      )}
                    </div>
                    {click.reviewSubmitted && (
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                        ✓ Review Submitted
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
