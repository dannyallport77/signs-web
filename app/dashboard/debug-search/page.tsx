'use client';

import { useState } from 'react';

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  website?: string;
  types: string[];
  social?: any;
}

export default function DebugSearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);
  const [skipCache, setSkipCache] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    setSelectedPlace(null);

    try {
      const res = await fetch(`/api/places/text-search?query=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.success) {
        setResults(data.data);
      } else {
        console.error('Search failed:', data.error);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocialMedia = async (place: PlaceResult) => {
    setSocialLoading(true);
    setSelectedPlace(place);

    try {
      const params = new URLSearchParams({
        businessName: place.name,
        address: place.address,
      });
      if (place.placeId) {
        params.append('placeId', place.placeId);
      }
      if (place.website) {
        params.append('website', place.website);
      }
      if (skipCache) {
        params.append('skipCache', 'true');
      }

      const res = await fetch(`/api/places/social-media?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setSelectedPlace(prev => prev ? { ...prev, social: data.data } : null);
      } else {
        console.error('Social media fetch failed:', data.error);
      }
    } catch (error) {
      console.error('Error fetching social media:', error);
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Debug Search Logic</h1>
          <p className="text-gray-600 mt-1">Test the business search and social media scraping logic directly.</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter business name or location..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Results List */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Search Results</h2>
          {results.length === 0 && !loading && (
            <p className="text-gray-500 text-center py-8">No results found. Try a search.</p>
          )}
          <div className="space-y-4">
            {results.map((place) => (
              <div
                key={place.placeId}
                onClick={() => fetchSocialMedia(place)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedPlace?.placeId === place.placeId
                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <h3 className="font-semibold text-gray-900">{place.name}</h3>
                <p className="text-sm text-gray-600">{place.address}</p>
                {place.website && (
                  <p className="text-xs text-blue-600 mt-1 truncate">{place.website}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {place.types.slice(0, 3).map((type) => (
                    <span key={type} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {type.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Media Details */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Social Media Analysis</h2>
            <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={skipCache}
                onChange={(e) => setSkipCache(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Force Refresh</span>
            </label>
          </div>
          {!selectedPlace ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              Select a business from the results to analyze social media links
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900">{selectedPlace.name}</h3>
                <p className="text-sm text-gray-600">{selectedPlace.address}</p>
              </div>

              {socialLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                  <p className="text-gray-600">Analyzing social media presence...</p>
                  <p className="text-xs text-gray-400 mt-2">This may take up to 30 seconds (Scraping + AI)</p>
                </div>
              ) : selectedPlace.social ? (
                <div className="space-y-4">
                  {Object.entries(selectedPlace.social).map(([platform, data]: [string, any]) => (
                    <div key={platform} className="flex items-start p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl mr-3">
                        {platform === 'facebook' && '📘'}
                        {platform === 'instagram' && '📸'}
                        {platform === 'twitter' && '🐦'}
                        {platform === 'youtube' && '▶️'}
                        {platform === 'linkedin' && '💼'}
                        {platform === 'tiktok' && '🎵'}
                        {platform === 'google' && '🔍'}
                        {platform === 'tripadvisor' && '🦉'}
                        {platform === 'trustpilot' && '⭐'}
                        {platform === 'yell' && 'Y'}
                        {platform === 'checkatrade' && '✅'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-gray-900 capitalize">{platform}</h4>
                          {data.verified && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                              Verified
                            </span>
                          )}
                        </div>
                        <a
                          href={data.reviewUrl || data.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:underline truncate block mt-1"
                        >
                          {data.reviewUrl || data.profileUrl}
                        </a>
                      </div>
                    </div>
                  ))}
                  {Object.keys(selectedPlace.social).length === 0 && (
                    <p className="text-center text-gray-500 py-4">No social media links found.</p>
                  )}
                </div>
              ) : (
                <p className="text-red-500">Failed to load social media data.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
