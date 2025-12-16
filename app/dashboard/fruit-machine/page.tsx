import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

interface FruitMachineResult {
  id: string;
  businessId: string;
  businessName: string;
  winnerCode: string;
  prizeType: string;
  prizeName: string;
  prizeValue?: string;
  timestamp: string;
  isWin: boolean;
}

export default async function FruitMachineResultsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Get results for all businesses owned by this user
  // const businesses = await prisma.business.findMany({
  //   where: { createdBy: session.user.id },
  //   select: { id: true, name: true },
  // });
  const businesses: any[] = [];

  // if (!businesses.length) {
  //   return notFound();
  // }

  const businessIds = businesses.map((b) => b.id);

  // Fetch results from custom table or API endpoint
  // This assumes you have a fruit_machine_results table
  const results: any[] = []; /* await prisma.$queryRaw`
    SELECT * FROM fruit_machine_results 
    WHERE business_id IN (${businessIds})
    ORDER BY timestamp DESC
    LIMIT 1000
  `.catch(() => []); */

  // Calculate statistics
  const totalSpins = results?.length || 0;
  const wins = results?.filter((r: any) => r.is_win)?.length || 0;
  const losses = totalSpins - wins;
  const winRate = totalSpins > 0 ? ((wins / totalSpins) * 100).toFixed(1) : '0';

  // Group by business
  const resultsByBusiness = businesses.map((business) => {
    const businessResults = (results || []).filter(
      (r: any) => r.business_id === business.id
    );
    const businessWins = businessResults.filter((r: any) => r.is_win).length;
    const businessTotal = businessResults.length;
    const businessWinRate =
      businessTotal > 0 ? ((businessWins / businessTotal) * 100).toFixed(1) : '0';

    return {
      ...business,
      totalSpins: businessTotal,
      wins: businessWins,
      losses: businessTotal - businessWins,
      winRate: businessWinRate,
      results: businessResults,
    };
  });

  // Group by prize type
  const prizeTypeStats = (results || []).reduce(
    (acc: any, r: any) => {
      const key = r.prize_name || 'Unknown';
      if (!acc[key]) {
        acc[key] = { name: key, count: 0, percentage: 0 };
      }
      acc[key].count++;
      return acc;
    },
    {}
  );

  Object.keys(prizeTypeStats).forEach((key) => {
    prizeTypeStats[key].percentage = (
      (prizeTypeStats[key].count / totalSpins) *
      100
    ).toFixed(1);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎰 Fruit Machine Results
          </h1>
          <p className="text-slate-400">Track promotion performance across all locations</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <OverviewCard label="Total Spins" value={totalSpins} icon="🎯" />
          <OverviewCard label="Total Wins" value={wins} icon="🏆" color="green" />
          <OverviewCard label="Total Losses" value={losses} icon="😢" color="red" />
          <OverviewCard
            label="Win Rate"
            value={`${winRate}%`}
            icon="📊"
            color="blue"
          />
        </div>

        {/* Prize Distribution */}
        {Object.keys(prizeTypeStats).length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Prize Distribution</h2>
            <div className="space-y-4">
              {Object.entries(prizeTypeStats).map(([key, stats]: any) => (
                <div key={key} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <span className="text-white font-medium">{stats.name}</span>
                      <span className="text-slate-400 text-sm">
                        {stats.count} ({stats.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results by Business */}
        <div className="space-y-6">
          {resultsByBusiness.map((business: any) => (
            <div
              key={business.id}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-2">{business.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Stat label="Spins" value={business.totalSpins} />
                  <Stat label="Wins" value={business.wins} color="green" />
                  <Stat label="Losses" value={business.losses} color="red" />
                  <Stat label="Win Rate" value={`${business.winRate}%`} />
                </div>
              </div>

              {/* Recent Results */}
              {business.results.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <h4 className="font-semibold text-white mb-4">Recent Results</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 text-slate-400">Code</th>
                          <th className="text-left py-2 text-slate-400">Prize</th>
                          <th className="text-left py-2 text-slate-400">Result</th>
                          <th className="text-left py-2 text-slate-400">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {business.results.slice(0, 5).map((result: any, idx: number) => (
                          <tr
                            key={idx}
                            className="border-b border-slate-700 hover:bg-slate-700/50"
                          >
                            <td className="py-3 text-white font-mono text-xs">
                              {result.winner_code}
                            </td>
                            <td className="py-3 text-slate-300">{result.prize_name}</td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  result.is_win
                                    ? 'bg-green-900 text-green-200'
                                    : 'bg-red-900 text-red-200'
                                }`}
                              >
                                {result.is_win ? '🏆 Win' : '😢 Loss'}
                              </span>
                            </td>
                            <td className="py-3 text-slate-400 text-xs">
                              {format(new Date(result.timestamp), 'MMM d, yyyy HH:mm')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OverviewCard({
  label,
  value,
  icon,
  color = 'purple',
}: {
  label: string;
  value: any;
  icon: string;
  color?: 'green' | 'red' | 'blue' | 'purple';
}) {
  const bgColor = {
    green: 'from-green-600 to-emerald-600',
    red: 'from-red-600 to-rose-600',
    blue: 'from-blue-600 to-cyan-600',
    purple: 'from-purple-600 to-indigo-600',
  }[color];

  return (
    <div
      className={`bg-gradient-to-br ${bgColor} rounded-xl p-6 text-white border border-slate-700`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-slate-200 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  color = 'purple',
}: {
  label: string;
  value: any;
  color?: 'green' | 'red' | 'blue' | 'purple';
}) {
  const textColor = {
    green: 'text-green-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
  }[color];

  return (
    <div className="bg-slate-700/50 rounded-lg p-3">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
    </div>
  );
}
