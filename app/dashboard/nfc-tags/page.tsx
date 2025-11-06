'use client';

import { useEffect, useState } from 'react';

interface NFCTag {
  id: number;
  businessName: string;
  businessAddress: string;
  placeId: string;
  reviewUrl: string;
  latitude: number;
  longitude: number;
  writtenBy: string;
  writtenAt: string;
}

export default function NFCTagsPage() {
  const [tags, setTags] = useState<NFCTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/nfc-tags');
      const data = await response.json();
      if (data.success) {
        setTags(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch NFC tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this NFC tag record?')) return;

    try {
      const response = await fetch(`/api/nfc-tags/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        fetchTags();
      }
    } catch (error) {
      console.error('Failed to delete NFC tag:', error);
      alert('Failed to delete NFC tag record');
    }
  };

  const openMapsLocation = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const openReviewUrl = (url: string) => {
    window.open(url, '_blank');
  };

  const filteredTags = tags.filter(tag => {
    const matchesSearch = tag.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tag.businessAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tag.writtenBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'recent') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return matchesSearch && new Date(tag.writtenAt) > weekAgo;
    }
    
    return matchesSearch;
  });

  if (loading) {
    return <div className="text-center py-12">Loading NFC tags...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">NFC Tags Written</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          >
            <option value="all">All Tags</option>
            <option value="recent">Last 7 Days</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by business name, address, or user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-900 font-medium">Total Tags Written</div>
          <div className="text-2xl font-bold text-gray-900">{tags.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-900 font-medium">This Week</div>
          <div className="text-2xl font-bold text-indigo-600">
            {tags.filter(tag => {
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return new Date(tag.writtenAt) > weekAgo;
            }).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-900 font-medium">Today</div>
          <div className="text-2xl font-bold text-green-600">
            {tags.filter(tag => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return new Date(tag.writtenAt) >= today;
            }).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-900 font-medium">Unique Businesses</div>
          <div className="text-2xl font-bold text-purple-600">
            {new Set(tags.map(tag => tag.placeId)).size}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Written By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTags.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No tags found matching your search.' : 'No NFC tags written yet. Tags will appear here when written from the mobile app.'}
                  </td>
                </tr>
              ) : (
                filteredTags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{tag.businessName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {tag.businessAddress}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openMapsLocation(tag.latitude, tag.longitude)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                      >
                        📍 View Map
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tag.writtenBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tag.writtenAt).toLocaleDateString()}<br/>
                      <span className="text-xs text-gray-400">
                        {new Date(tag.writtenAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openReviewUrl(tag.reviewUrl)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Review Link
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTags.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-right">
          Showing {filteredTags.length} of {tags.length} tags
        </div>
      )}
    </div>
  );
}
