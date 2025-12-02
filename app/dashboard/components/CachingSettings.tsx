'use client';

import { useState, useEffect } from 'react';

export default function CachingSettings() {
  const [cachingEnabled, setCachingEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCachingStatus();
  }, []);

  const fetchCachingStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings/caching');
      const data = await response.json();
      if (data.success) {
        setCachingEnabled(data.caching.enabled);
      }
    } catch (err) {
      setError('Failed to fetch caching status');
    } finally {
      setLoading(false);
    }
  };

  const toggleCaching = async () => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      const response = await fetch('/api/admin/settings/caching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !cachingEnabled }),
      });

      const data = await response.json();
      if (data.success) {
        setCachingEnabled(data.caching.enabled);
        setSuccess(data.caching.message);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to update caching setting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Social Media Search Caching</h2>

      {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="p-3 mb-4 bg-green-100 text-green-700 rounded">{success}</div>}

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
          <div>
            <p className="font-semibold">Cache Results</p>
            <p className="text-sm text-gray-600">
              {cachingEnabled
                ? 'Results cached for 30 days. Use ?skipCache=true to bypass.'
                : 'Caching disabled - all results fetched fresh (good for testing)'}
            </p>
          </div>
          <button
            onClick={toggleCaching}
            disabled={loading}
            className={`px-6 py-2 rounded font-semibold transition ${
              cachingEnabled
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            } disabled:opacity-50`}
          >
            {loading ? 'Updating...' : cachingEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm font-semibold text-blue-900 mb-2">ℹ Development Tips:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Add <code className="bg-blue-100 px-2 py-1 rounded">?skipCache=true</code> to API calls to bypass cache</li>
            <li>• Caching is per business (businessName + address + website)</li>
            <li>• Cache expires after 30 days automatically</li>
            <li>• Reducing API calls saves SerpAPI credits</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
