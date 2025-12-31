'use client';

import { useState } from 'react';

interface FormData {
  businessName: string;
  businessAddress: string;
  placeId: string;
  reviewUrl: string;
  latitude: string;
  longitude: string;
  writtenBy: string;
  tagUid: string;
  salePrice: string;
  isTrial: boolean;
  trialDays: string;
  trialEndPrice: string;
}

export default function TestWritePage() {
  const [formData, setFormData] = useState<FormData>({
    businessName: 'Test Business',
    businessAddress: '123 Test Street, Test City',
    placeId: 'test_place_123',
    reviewUrl: 'https://www.google.com/search?q=test+business+reviews',
    latitude: '51.5074',
    longitude: '-0.1278',
    writtenBy: 'test-user@example.com',
    tagUid: `test-${Date.now()}`,
    salePrice: '29.99',
    isTrial: true,
    trialDays: '7',
    trialEndPrice: '30',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setResult(null);

    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude) || undefined,
        longitude: parseFloat(formData.longitude) || undefined,
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
        trialDays: parseInt(formData.trialDays) || 7,
        trialEndPrice: parseFloat(formData.trialEndPrice) || 30,
      };

      const response = await fetch('/api/nfc-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to write tag');
      }

      setResult(data);
      // Generate new tagUid for next test
      setFormData(prev => ({
        ...prev,
        tagUid: `test-${Date.now()}`,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Test NFC Tag Write</h1>
            <p className="text-gray-600">
              Simulate writing an NFC tag to test the logging and analytics system.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Address
                  </label>
                  <textarea
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Place ID *
                  </label>
                  <input
                    type="text"
                    name="placeId"
                    value={formData.placeId}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Review URL *
                  </label>
                  <input
                    type="url"
                    name="reviewUrl"
                    value={formData.reviewUrl}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Location & Tag Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Location & Tag Details</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="text"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="text"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Written By
                  </label>
                  <input
                    type="text"
                    name="writtenBy"
                    value={formData.writtenBy}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tag UID
                  </label>
                  <input
                    type="text"
                    name="tagUid"
                    value={formData.tagUid}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Pricing Information</h3>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isTrial"
                  checked={formData.isTrial}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Is Trial
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sale Price
                  </label>
                  <input
                    type="text"
                    name="salePrice"
                    value={formData.salePrice}
                    onChange={handleChange}
                    disabled={formData.isTrial}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trial Days
                  </label>
                  <input
                    type="number"
                    name="trialDays"
                    value={formData.trialDays}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trial End Price
                  </label>
                  <input
                    type="text"
                    name="trialEndPrice"
                    value={formData.trialEndPrice}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Writing Tag...' : 'Write Test Tag'}
              </button>

              <button
                type="button"
                onClick={() => window.open('/dashboard/activity-logs', '_blank')}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                View Activity Logs
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-medium">Success!</p>
              <pre className="text-green-700 text-sm mt-2 overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}