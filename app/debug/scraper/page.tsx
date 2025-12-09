'use client';

import { useState } from 'react';

interface PlatformResult {
  platform: string;
  url: string;
  verified: boolean;
  source?: string;
}

interface SearchResult {
  success: boolean;
  businessName: string;
  platforms: PlatformResult[];
  searchTime: number;
  cached: boolean;
  error?: string;
}

export default function DebugScraperPage() {
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!businessName.trim()) {
      setError('Please enter a business name');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams();
      params.append('name', businessName);
      if (website) params.append('website', website);
      if (address) params.append('address', address);

      const startTime = Date.now();
      const response = await fetch(`/api/places/platforms?${params.toString()}`);
      const data = await response.json();
      const searchTime = Date.now() - startTime;

      if (!response.ok) {
        setError(data.error || 'Search failed');
        return;
      }

      setResult({
        success: true,
        businessName: data.businessName,
        platforms: data.platforms || [],
        searchTime,
        cached: data.cached || false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/places/platforms', { method: 'DELETE' });
      const data = await response.json();
      alert(`Cache cleared: ${data.message}`);
    } catch (err) {
      alert('Failed to clear cache');
    }
  };

  const platformEmojis: Record<string, string> = {
    google: '🔍',
    facebook: '📘',
    instagram: '📷',
    twitter: '🐦',
    tiktok: '🎵',
    linkedin: '💼',
    youtube: '🎬',
    trustpilot: '⭐',
    tripadvisor: '🦉',
    yelp: '📍',
    yell: '📞',
    checkatrade: '✅',
    trustatrader: '🛠️',
    ratedpeople: '👥',
    feefo: '💬',
    reviews_io: '📝',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🔍 Platform Scraper Debug
          </h1>
          <p className="text-gray-600 mb-6">
            Test the review platform scraper. Enter a business name to find their social media and review profiles.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g., Bolton Bathrooms Ltd"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website (optional)
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g., https://boltonbathrooms.co.uk"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address (optional)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., Bolton, UK"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </span>
                ) : (
                  '🔍 Search Platforms'
                )}
              </button>
              <button
                onClick={handleClearCache}
                className="px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                🗑️ Clear Cache
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Results for &quot;{result.businessName}&quot;
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>⏱️ {(result.searchTime / 1000).toFixed(2)}s</span>
                {result.cached && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Cached</span>}
              </div>
            </div>

            {result.platforms.length === 0 ? (
              <p className="text-gray-500">No platforms found</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  Found {result.platforms.length} platform(s)
                </p>
                {result.platforms.map((platform, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {platformEmojis[platform.platform.toLowerCase()] || '🔗'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{platform.platform}</p>
                        <a
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-800 break-all"
                        >
                          {platform.url}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {platform.verified && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          ✓ Verified
                        </span>
                      )}
                      {platform.source && (
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded">
                          {platform.source}
                        </span>
                      )}
                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ↗️
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>This debug tool uses the <code className="bg-gray-100 px-1 py-0.5 rounded">/api/places/platforms</code> endpoint</p>
        </div>
      </div>
    </div>
  );
}
