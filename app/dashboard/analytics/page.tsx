'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';

interface NFCTag {
  id: string;
  salePrice: number | null;
  isTrial: boolean;
  trialStartDate: string;
  trialDays: number;
  isPaid: boolean;
  paidAt: string | null;
}

interface NFCInteraction {
  id: string;
  interactionType: 'write' | 'read';
  siteId: string | null;
  businessName: string | null;
  tagUid: string | null;
  actionType: string | null;
  socialMediaType: {
    id: string;
    name: string;
    displayName: string;
    category: string;
  } | null;
  nfcTag: NFCTag | null;
  promotionId: string | null;
  promotionResult: string | null;
  prizeType: string | null;
  prizeName: string | null;
  prizeValue: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  timestamp: string;
  metadata: any;
}

interface Stats {
  totalWrites: number;
  totalReads: number;
  actionBreakdown: Record<string, number>;
  promotionResults: {
    wins: number;
    losses: number;
    winRate: number;
  };
  topActions: { actionType: string; count: number }[];
}

type GroupBy = 'none' | 'actionType' | 'siteId' | 'tagUid' | 'interactionType' | 'promotionResult' | 'date' | 'hour';
type SortField = 'timestamp' | 'actionType' | 'siteId' | 'tagUid' | 'interactionType' | 'businessName';
type SortDirection = 'asc' | 'desc';

export default function AnalyticsPage() {
  const [interactions, setInteractions] = useState<NFCInteraction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterSite, setFilterSite] = useState<string>('all');
  const [filterTagUid, setFilterTagUid] = useState<string>('all');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Grouping
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [interactionsRes, statsRes] = await Promise.all([
        fetch('/api/nfc-interactions?limit=1000'),
        fetch('/api/nfc-interactions/stats'),
      ]);

      if (!interactionsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const interactionsData = await interactionsRes.json();
      const statsData = await statsRes.json();

      setInteractions(interactionsData.data || []);
      setStats(statsData.data || statsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filters
  const uniqueActions = useMemo(() => {
    const actions = new Set(interactions.map(i => i.actionType).filter(Boolean));
    return Array.from(actions).sort();
  }, [interactions]);

  const uniqueSites = useMemo(() => {
    const sites = new Set(interactions.map(i => i.siteId).filter(Boolean));
    return Array.from(sites).sort();
  }, [interactions]);

  const uniqueTagUids = useMemo(() => {
    const tagUids = new Set(interactions.map(i => i.tagUid).filter(Boolean));
    return Array.from(tagUids).sort();
  }, [interactions]);

  // Apply filters
  const filteredInteractions = useMemo(() => {
    return interactions.filter(i => {
      if (filterType !== 'all' && i.interactionType !== filterType) return false;
      if (filterAction !== 'all' && i.actionType !== filterAction) return false;
      if (filterSite !== 'all' && i.siteId !== filterSite) return false;
      if (filterTagUid !== 'all' && i.tagUid !== filterTagUid) return false;
      if (filterResult !== 'all') {
        if (filterResult === 'win' && i.promotionResult !== 'win') return false;
        if (filterResult === 'loss' && i.promotionResult !== 'loss') return false;
        if (filterResult === 'none' && i.promotionResult !== null) return false;
      }
      if (filterDateFrom && new Date(i.timestamp) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(i.timestamp) > new Date(filterDateTo + 'T23:59:59')) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchFields = [
          i.siteId,
          i.businessName,
          i.actionType,
          i.tagUid,
          i.prizeName,
          i.socialMediaType?.displayName,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!searchFields.includes(query)) return false;
      }
      return true;
    });
  }, [interactions, filterType, filterAction, filterSite, filterTagUid, filterResult, filterDateFrom, filterDateTo, searchQuery]);

  // Apply sorting
  const sortedInteractions = useMemo(() => {
    return [...filteredInteractions].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'timestamp':
          aVal = new Date(a.timestamp).getTime();
          bVal = new Date(b.timestamp).getTime();
          break;
        case 'actionType':
          aVal = a.actionType || '';
          bVal = b.actionType || '';
          break;
        case 'siteId':
          aVal = a.siteId || '';
          bVal = b.siteId || '';
          break;
        case 'tagUid':
          aVal = a.tagUid || '';
          bVal = b.tagUid || '';
          break;
        case 'interactionType':
          aVal = a.interactionType;
          bVal = b.interactionType;
          break;
        case 'businessName':
          aVal = a.businessName || '';
          bVal = b.businessName || '';
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredInteractions, sortField, sortDirection]);

  // Apply grouping
  const groupedInteractions = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Interactions': sortedInteractions };
    }

    const groups: Record<string, NFCInteraction[]> = {};
    sortedInteractions.forEach(i => {
      let key: string;
      switch (groupBy) {
        case 'actionType':
          key = i.actionType || 'Unknown';
          break;
        case 'siteId':
          key = i.businessName || i.siteId || 'Unknown Site';
          break;
        case 'tagUid':
          key = i.tagUid ? `🏷️ Tag: ${i.tagUid.substring(0, 16)}...` : '🏷️ No Tag UID';
          break;
        case 'interactionType':
          key = i.interactionType === 'write' ? '📝 Tag Writes' : '📖 Tag Reads';
          break;
        case 'promotionResult':
          key = i.promotionResult === 'win' ? '🏆 Wins' : i.promotionResult === 'loss' ? '❌ Losses' : '📊 No Result';
          break;
        case 'date':
          key = format(new Date(i.timestamp), 'yyyy-MM-dd');
          break;
        case 'hour':
          key = format(new Date(i.timestamp), 'yyyy-MM-dd HH:00');
          break;
        default:
          key = 'Other';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(i);
    });

    // Sort group keys
    const sortedGroups: Record<string, NFCInteraction[]> = {};
    Object.keys(groups).sort((a, b) => {
      if (groupBy === 'date' || groupBy === 'hour') {
        return b.localeCompare(a); // Newest first for dates
      }
      return groups[b].length - groups[a].length; // Largest groups first
    }).forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }, [sortedInteractions, groupBy]);

  // Calculate totals for current view
  const viewStats = useMemo(() => {
    const total = filteredInteractions.length;
    const writes = filteredInteractions.filter(i => i.interactionType === 'write').length;
    const reads = filteredInteractions.filter(i => i.interactionType === 'read').length;
    const wins = filteredInteractions.filter(i => i.promotionResult === 'win').length;
    const losses = filteredInteractions.filter(i => i.promotionResult === 'loss').length;
    const trials = filteredInteractions.filter(i => i.nfcTag?.isTrial && !i.nfcTag?.isPaid).length;
    const paid = filteredInteractions.filter(i => i.nfcTag?.isPaid).length;
    return { total, writes, reads, wins, losses, trials, paid };
  }, [filteredInteractions]);

  // Helper function to get trial status info for a tag
  const getTrialStatus = (interaction: NFCInteraction) => {
    if (!interaction.nfcTag) return null;
    
    const { isTrial, isPaid, salePrice, trialStartDate, trialDays } = interaction.nfcTag;
    
    if (isPaid) {
      return { status: 'paid', label: `£${salePrice || 30}`, color: 'green' };
    }
    
    if (!isTrial && salePrice) {
      return { status: 'sale', label: `£${salePrice}`, color: 'blue' };
    }
    
    if (isTrial) {
      const startDate = new Date(trialStartDate);
      const daysPassed = differenceInDays(new Date(), startDate);
      const daysRemaining = trialDays - daysPassed;
      
      if (daysRemaining <= 0) {
        return { status: 'expired', label: 'TRIAL EXPIRED', color: 'red' };
      }
      
      return { 
        status: 'trial', 
        label: `TRIAL (${daysRemaining}d left)`, 
        color: 'red' 
      };
    }
    
    return null;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const resetFilters = () => {
    setFilterType('all');
    setFilterAction('all');
    setFilterSite('all');
    setFilterTagUid('all');
    setFilterResult('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchQuery('');
    setGroupBy('none');
  };

  const exportCSV = () => {
    const headers = ['Timestamp', 'Type', 'Action', 'Site ID', 'Business', 'Tag UID', 'Result', 'Prize', 'IP'];
    const rows = sortedInteractions.map(i => [
      format(new Date(i.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      i.interactionType,
      i.actionType || '',
      i.siteId || '',
      i.businessName || '',
      i.tagUid || '',
      i.promotionResult || '',
      i.prizeName || '',
      i.ipAddress || '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nfc-interactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button onClick={fetchData} className="mt-2 text-red-600 hover:text-red-800 underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">NFC Analytics</h1>
          <p className="text-gray-600">Track all tag interactions with filtering, sorting, and grouping</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Interactions</p>
          <p className="text-2xl font-bold text-gray-900">{viewStats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Tag Writes</p>
          <p className="text-2xl font-bold text-blue-600">{viewStats.writes}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Tag Reads</p>
          <p className="text-2xl font-bold text-green-600">{viewStats.reads}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Promotion Wins</p>
          <p className="text-2xl font-bold text-yellow-600">{viewStats.wins}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Promotion Losses</p>
          <p className="text-2xl font-bold text-red-600">{viewStats.losses}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-500">Trial Tags</p>
          <p className="text-2xl font-bold text-red-600">{viewStats.trials}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Paid Tags</p>
          <p className="text-2xl font-bold text-green-600">{viewStats.paid}</p>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by site, business, action..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Interaction Type */}
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="write">Writes</option>
              <option value="read">Reads</option>
            </select>
          </div>

          {/* Action Type */}
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action!}>{action}</option>
              ))}
            </select>
          </div>

          {/* Site */}
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
            <select
              value={filterSite}
              onChange={(e) => setFilterSite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sites</option>
              {uniqueSites.map(site => (
                <option key={site} value={site!}>{site}</option>
              ))}
            </select>
          </div>

          {/* Tag UID */}
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag UID</label>
            <select
              value={filterTagUid}
              onChange={(e) => setFilterTagUid(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tags</option>
              {uniqueTagUids.map(tagUid => (
                <option key={tagUid} value={tagUid!}>{tagUid!.substring(0, 20)}...</option>
              ))}
            </select>
          </div>

          {/* Promotion Result */}
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
            <select
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Results</option>
              <option value="win">Wins Only</option>
              <option value="loss">Losses Only</option>
              <option value="none">No Result</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          {/* Date From */}
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Group By */}
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">No Grouping</option>
              <option value="actionType">Action Type</option>
              <option value="siteId">Site / Business</option>
              <option value="tagUid">Tag UID</option>
              <option value="interactionType">Write / Read</option>
              <option value="promotionResult">Win / Loss</option>
              <option value="date">Date</option>
              <option value="hour">Hour</option>
            </select>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Table Header */}
        <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Showing {sortedInteractions.length} of {interactions.length} interactions
            {groupBy !== 'none' && ` in ${Object.keys(groupedInteractions).length} groups`}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort:</span>
            {(['timestamp', 'actionType', 'siteId', 'tagUid', 'businessName'] as SortField[]).map(field => (
              <button
                key={field}
                onClick={() => handleSort(field)}
                className={`px-2 py-1 text-xs rounded ${
                  sortField === field
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {field === 'timestamp' ? 'Time' : field === 'actionType' ? 'Action' : field === 'siteId' ? 'Site' : field === 'tagUid' ? 'Tag' : 'Business'}
                {sortField === field && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </button>
            ))}
          </div>
        </div>

        {/* Grouped Data */}
        {Object.entries(groupedInteractions).map(([groupName, items]) => (
          <div key={groupName} className="border-b last:border-b-0">
            {/* Group Header */}
            {groupBy !== 'none' && (
              <div className="px-4 py-3 bg-gray-100 flex justify-between items-center sticky top-0">
                <span className="font-medium text-gray-800">{groupName}</span>
                <span className="text-sm text-gray-500">{items.length} interactions</span>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Site / Business
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tag UID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.slice((page - 1) * pageSize, page * pageSize).map((interaction) => {
                    const trialStatus = getTrialStatus(interaction);
                    const isTrialOrExpired = trialStatus?.status === 'trial' || trialStatus?.status === 'expired';
                    
                    return (
                    <tr 
                      key={interaction.id} 
                      className={`hover:bg-gray-50 ${isTrialOrExpired ? 'bg-red-50 border-l-4 border-red-500' : ''}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(interaction.timestamp), 'MMM d, HH:mm:ss')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          interaction.interactionType === 'write'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {interaction.interactionType === 'write' ? '📝 Write' : '📖 Read'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className="font-medium text-gray-900">{interaction.actionType || '-'}</span>
                        {interaction.socialMediaType && (
                          <span className="block text-xs text-gray-500">
                            {interaction.socialMediaType.displayName}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className="text-gray-900">{interaction.businessName || interaction.siteId || '-'}</span>
                        {interaction.businessName && interaction.siteId && (
                          <span className="block text-xs text-gray-400 font-mono">{interaction.siteId}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-gray-500">
                        {interaction.tagUid ? interaction.tagUid.substring(0, 12) + '...' : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {trialStatus ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            trialStatus.status === 'paid' 
                              ? 'bg-green-100 text-green-800'
                              : trialStatus.status === 'sale'
                              ? 'bg-blue-100 text-blue-800'
                              : trialStatus.status === 'expired'
                              ? 'bg-red-200 text-red-900 animate-pulse'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {trialStatus.status === 'trial' || trialStatus.status === 'expired' ? '⚠️ ' : trialStatus.status === 'paid' ? '✅ ' : '💰 '}
                            {trialStatus.label}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {interaction.promotionResult ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            interaction.promotionResult === 'win'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {interaction.promotionResult === 'win' ? '🏆 Win' : '❌ Loss'}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {interaction.prizeName && (
                          <span className="block">🎁 {interaction.prizeName}</span>
                        )}
                        {interaction.prizeValue && (
                          <span className="block text-xs">Value: {interaction.prizeValue}</span>
                        )}
                        {interaction.ipAddress && (
                          <span className="block text-xs text-gray-400">{interaction.ipAddress}</span>
                        )}
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination for group */}
            {items.length > pageSize && groupBy === 'none' && (
              <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Page {page} of {Math.ceil(items.length / pageSize)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(Math.ceil(items.length / pageSize), p + 1))}
                    disabled={page >= Math.ceil(items.length / pageSize)}
                    className="px-3 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {sortedInteractions.length === 0 && (
          <div className="px-4 py-12 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2">No interactions match your filters</p>
            <button onClick={resetFilters} className="mt-2 text-blue-600 hover:text-blue-800">
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
