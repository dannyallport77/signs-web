'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ScrapedData {
  title: string;
  description: string;
  price: number;
  images: string[];
  videoUrl?: string;
  options: Array<{name: string, values: string[]}>;
  specifications: Array<{name: string, value: string}>;
  url: string;
}

export default function ImportPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const router = useRouter();

  // Editable fields
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCostPrice, setEditCostPrice] = useState(0);
  const [editSellingPrice, setEditSellingPrice] = useState(0);
  const [editCategory, setEditCategory] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleScrape = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setScrapedData(null);

    try {
      const response = await fetch('/api/aliexpress/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const result = await response.json();

      if (result.success) {
        setScrapedData(result.data);
        setEditTitle(result.data.title);
        setEditDescription(result.data.description);
        setEditCostPrice(result.data.price);
        // Default selling price = cost price * 2.5
        setEditSellingPrice(Math.round(result.data.price * 2.5 * 100) / 100);
        setSelectedImages(result.data.images);
      } else {
        setError(result.error || 'Failed to scrape product');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!scrapedData) return;

    setImporting(true);
    setError('');

    try {
      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          costPrice: editCostPrice,
          sellingPrice: editSellingPrice,
          images: selectedImages,
          videoUrl: scrapedData.videoUrl,
          aliexpressUrl: scrapedData.url,
          category: editCategory || 'uncategorized',
          options: scrapedData.options,
          specifications: scrapedData.specifications
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Product imported successfully!');
        router.push('/dashboard/stock');
      } else {
        setError(result.error || 'Failed to import product');
      }
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const toggleImage = (img: string) => {
    if (selectedImages.includes(img)) {
      setSelectedImages(selectedImages.filter(i => i !== img));
    } else {
      setSelectedImages([...selectedImages, img]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import from AliExpress</h1>
          <p className="text-gray-600">Paste an AliExpress product URL to import it into your store</p>
        </div>

        {/* URL Input */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AliExpress Product URL
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.aliexpress.com/item/..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={handleScrape}
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Fetching...' : 'Fetch Product'}
            </button>
          </div>
          {error && (
            <div className="mt-3 text-red-600 text-sm">{error}</div>
          )}
        </div>

        {/* Preview */}
        {scrapedData && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Product Preview</h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter product description..."
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Price (£)
                  <span className="text-xs text-gray-500 ml-1">(what you pay)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editCostPrice}
                  onChange={(e) => setEditCostPrice(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Price (£)
                  <span className="text-xs text-gray-500 ml-1">(customer pays)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editSellingPrice}
                  onChange={(e) => setEditSellingPrice(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Profit Margin */}
            {editCostPrice > 0 && editSellingPrice > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-green-900">Profit Margin:</span>
                  <span className="text-green-700">
                    £{(editSellingPrice - editCostPrice).toFixed(2)} 
                    ({Math.round(((editSellingPrice - editCostPrice) / editCostPrice) * 100)}%)
                  </span>
                </div>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select category</option>
                <option value="stands">Countertop Signs</option>
                <option value="stickers">Smart Stickers</option>
                <option value="keyrings">Digital Keyrings</option>
              </select>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Images ({selectedImages.length} selected)
              </label>
              <div className="grid grid-cols-4 gap-3">
                {scrapedData.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleImage(img)}
                    className={`relative cursor-pointer border-2 rounded-lg overflow-hidden ${
                      selectedImages.includes(img) ? 'border-indigo-600' : 'border-gray-200'
                    }`}
                  >
                    <img src={img} alt={`Product ${idx + 1}`} className="w-full h-32 object-cover" />
                    {selectedImages.includes(img) && (
                      <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Product Options */}
            {scrapedData.options && scrapedData.options.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Options</label>
                <div className="space-y-3">
                  {scrapedData.options.map((option, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-sm text-gray-900 mb-2">{option.name}</p>
                      <div className="flex flex-wrap gap-2">
                        {option.values.map((val, vIdx) => (
                          <span key={vIdx} className="inline-flex items-center px-3 py-1 bg-white border border-gray-200 rounded text-xs">
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications */}
            {scrapedData.specifications && scrapedData.specifications.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                  {scrapedData.specifications.map((spec, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-200 last:border-0">
                      <span className="font-medium text-gray-700">{spec.name}:</span>
                      <span className="text-gray-600">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {scrapedData.videoUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video</label>
                <p className="text-sm text-gray-600 break-all">{scrapedData.videoUrl}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t">
              <button
                onClick={handleImport}
                disabled={importing || selectedImages.length === 0}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
              >
                {importing ? 'Importing...' : 'Import Product'}
              </button>
              <button
                onClick={() => {
                  setScrapedData(null);
                  setUrl('');
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
