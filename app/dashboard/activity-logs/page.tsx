'use client';

import { useState, useEffect } from 'react';

interface ActivityLog {
  id: string;
  type: string;
  action: string;
  userId: string | null;
  targetUserId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  severity: string;
  createdAt: string;
  user?: { id: string; name: string | null; email: string } | null;
  targetUser?: { id: string; name: string | null; email: string } | null;
}

interface Stats {
  totalLogs: number;
  last24HoursCount: number;
  authFailedCount: number;
  criticalCount: number;
  errorCount: number;
  typeBreakdown: { type: string; count: number }[];
}

// Row background colors based on severity
const SEVERITY_ROW_COLORS: Record<string, string> = {
  info: 'bg-white hover:bg-gray-50',
  warning: 'bg-yellow-50 hover:bg-yellow-100',
  error: 'bg-red-50 hover:bg-red-100',
  critical: 'bg-red-100 hover:bg-red-200',
};

// Badge colors for severity
const SEVERITY_BADGE_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  error: 'bg-red-100 text-red-800 border border-red-300',
  critical: 'bg-red-600 text-white font-bold',
};

// Severity filter options with colors
const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities', color: 'bg-gray-200' },
  { value: 'info', label: '🔵 Info', color: 'bg-blue-500' },
  { value: 'warning', label: '🟡 Warning', color: 'bg-yellow-500' },
  { value: 'error', label: '🔴 Error', color: 'bg-red-500' },
  { value: 'critical', label: '⛔ Critical', color: 'bg-red-700' },
];

const TYPE_LABELS: Record<string, string> = {
  // Auth events
  auth_failed: '🔐 Auth Failed',
  auth_success: '✅ Auth Success',
  auth_logout: '👋 Logout',
  // User management
  user_created: '👤 User Created',
  user_updated: '✏️ User Updated',
  user_deleted: '🗑️ User Deleted',
  user_deactivated: '⏸️ User Deactivated',
  user_reactivated: '▶️ User Reactivated',
  // NFC/Tag events
  tag_written: '📝 Tag Written',
  tag_erased: '🧹 Tag Erased',
  tag_scan_started: '📡 Tag Scan Started',
  tag_scan_completed: '✅ Tag Scan Done',
  tag_scan_failed: '❌ Tag Scan Failed',
  // Business events
  transaction_created: '💰 Transaction',
  invoice_sent: '📧 Invoice Sent',
  // Password
  password_reset_requested: '🔑 Password Reset Request',
  password_reset_completed: '🔑 Password Reset Done',
  // Admin
  admin_action: '⚙️ Admin Action',
  // Errors
  api_error: '❌ API Error',
  // Mobile app events
  app_opened: '📱 App Opened',
  map_refreshed: '🗺️ Map Refreshed',
  business_selected: '🏢 Business Selected',
  platforms_selected: '📋 Platforms Selected',
  website_link_toggled: '🔗 Website Link Toggle',
  wifi_credentials_set: '📶 WiFi Credentials',
  smart_link_created: '🔗 Smart Link Created',
};

// Group types by category for the dropdown
const TYPE_CATEGORIES = {
  'Authentication': ['auth_failed', 'auth_success', 'auth_logout'],
  'Users': ['user_created', 'user_updated', 'user_deleted', 'user_deactivated', 'user_reactivated'],
  'NFC Tags': ['tag_written', 'tag_erased', 'tag_scan_started', 'tag_scan_completed', 'tag_scan_failed'],
  'Business': ['transaction_created', 'invoice_sent', 'business_selected'],
  'Mobile App': ['app_opened', 'map_refreshed', 'platforms_selected', 'website_link_toggled', 'wifi_credentials_set', 'smart_link_created'],
  'System': ['admin_action', 'api_error', 'password_reset_requested', 'password_reset_completed'],
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    type: '',
    severity: '',
    startDate: '',
    endDate: '',
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const limit = 50;

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, filter]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs();
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [page, filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', (page * limit).toString());
      if (filter.type) params.append('type', filter.type);
      if (filter.severity) params.append('severity', filter.severity);
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);

      const res = await fetch(`/api/admin/activity-logs?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setLogs(data.data.logs);
        setTotal(data.data.total);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/activity-logs', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleString();
  };

  const toggleRowExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const clearFilters = () => {
    setFilter({ type: '', severity: '', startDate: '', endDate: '' });
    setPage(0);
  };

  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters = filter.type || filter.severity || filter.startDate || filter.endDate;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-sm text-gray-500">Real-time activity monitoring • Auto-refreshes every 30s</p>
        </div>
        <button
          onClick={() => { fetchLogs(); fetchStats(); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Events</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalLogs.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Last 24 Hours</div>
            <div className="text-2xl font-bold text-blue-600">{stats.last24HoursCount.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Auth Failures (7d)</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.authFailedCount.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md" onClick={() => setFilter({ ...filter, severity: 'error' })}>
            <div className="text-sm text-gray-500">Errors (7d)</div>
            <div className="text-2xl font-bold text-orange-600">{stats.errorCount?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md" onClick={() => setFilter({ ...filter, severity: 'critical' })}>
            <div className="text-sm text-gray-500">Critical (7d)</div>
            <div className="text-2xl font-bold text-red-600">{stats.criticalCount.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-700">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              value={filter.type}
              onChange={(e) => { setFilter({ ...filter, type: e.target.value }); setPage(0); }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              {Object.entries(TYPE_CATEGORIES).map(([category, types]) => (
                <optgroup key={category} label={category}>
                  {types.map((type) => (
                    <option key={type} value={type}>{TYPE_LABELS[type] || type}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select
              value={filter.severity}
              onChange={(e) => { setFilter({ ...filter, severity: e.target.value }); setPage(0); }}
              className={`w-full border rounded-md px-3 py-2 text-sm ${
                filter.severity === 'error' ? 'border-red-300 bg-red-50' :
                filter.severity === 'critical' ? 'border-red-500 bg-red-100' :
                filter.severity === 'warning' ? 'border-yellow-300 bg-yellow-50' :
                'border-gray-300'
              }`}
            >
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => { setFilter({ ...filter, startDate: e.target.value }); setPage(0); }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => { setFilter({ ...filter, endDate: e.target.value }); setPage(0); }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
        
        {/* Quick Filters */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 mr-2">Quick filters:</span>
          <button
            onClick={() => setFilter({ ...filter, severity: 'error' })}
            className={`px-2 py-1 text-xs rounded-full ${filter.severity === 'error' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}
          >
            🔴 Errors Only
          </button>
          <button
            onClick={() => setFilter({ ...filter, severity: 'critical' })}
            className={`px-2 py-1 text-xs rounded-full ${filter.severity === 'critical' ? 'bg-red-800 text-white' : 'bg-red-200 text-red-900'}`}
          >
            ⛔ Critical Only
          </button>
          <button
            onClick={() => setFilter({ ...filter, type: 'tag_written' })}
            className={`px-2 py-1 text-xs rounded-full ${filter.type === 'tag_written' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
          >
            📝 Tag Writes
          </button>
          <button
            onClick={() => setFilter({ ...filter, type: 'auth_failed' })}
            className={`px-2 py-1 text-xs rounded-full ${filter.type === 'auth_failed' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'}`}
          >
            🔐 Auth Failed
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Activity Log Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading activity logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    No activity logs found
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="block mx-auto mt-2 text-blue-600 hover:text-blue-800">
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <>
                    <tr 
                      key={log.id} 
                      className={`${SEVERITY_ROW_COLORS[log.severity] || 'bg-white hover:bg-gray-50'} cursor-pointer`}
                      onClick={() => toggleRowExpand(log.id)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div title={new Date(log.createdAt).toLocaleString()}>
                          {formatDate(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${SEVERITY_BADGE_COLORS[log.severity] || 'bg-gray-100 text-gray-800'}`}>
                          {log.severity === 'critical' && '⛔ '}
                          {log.severity === 'error' && '🔴 '}
                          {log.severity === 'warning' && '🟡 '}
                          {log.severity === 'info' && '🔵 '}
                          {log.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {TYPE_LABELS[log.type] || log.type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                        <div className={`truncate ${log.severity === 'error' || log.severity === 'critical' ? 'text-red-700 font-medium' : ''}`} title={log.action}>
                          {log.action}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {log.user ? (
                          <span title={log.user.email} className="flex items-center gap-1">
                            <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                              {(log.user.name || log.user.email).charAt(0).toUpperCase()}
                            </span>
                            {log.user.name || log.user.email}
                          </span>
                        ) : log.metadata?.email ? (
                          <span className="text-gray-400">{log.metadata.email}</span>
                        ) : log.metadata?.userName ? (
                          <span className="text-gray-400">{log.metadata.userName}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                        {log.metadata && Object.keys(log.metadata).length > 0 ? (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedRows.has(log.id) ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                            </svg>
                            {expandedRows.has(log.id) ? 'Hide' : 'View'}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                    {expandedRows.has(log.id) && log.metadata && (
                      <tr key={`${log.id}-details`} className="bg-gray-50">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="text-sm">
                            <div className="font-medium text-gray-700 mb-2">Event Details</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              {log.ipAddress && (
                                <div>
                                  <span className="text-gray-500">IP Address:</span>
                                  <span className="ml-1 font-mono">{log.ipAddress}</span>
                                </div>
                              )}
                              {log.userAgent && (
                                <div className="col-span-2">
                                  <span className="text-gray-500">User Agent:</span>
                                  <span className="ml-1 truncate block" title={log.userAgent}>{log.userAgent}</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-xs overflow-x-auto">
                              <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{page * limit + 1}</span> to <span className="font-medium">{Math.min((page + 1) * limit, total)}</span> of <span className="font-medium">{total}</span> results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                First
              </button>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
