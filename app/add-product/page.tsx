'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  name: string;
  price: string;
  description: string;
  imageUrl: string;
}

export default function ManualProductEntry() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [product, setProduct] = useState<Product>({
    name: '',
    price: '',
    description: '',
    imageUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: product.name,
          price: parseFloat(product.price),
          description: product.description,
          imageUrl: product.imageUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Product "${product.name}" created successfully!`);
        // Reset form
        setProduct({
          name: '',
          price: '',
          description: '',
          imageUrl: '',
        });
      } else {
        setError(data.error || 'Failed to create product');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Add Product Manually</h1>
            <button
              onClick={() => router.push('/products')}
              className="text-blue-600 hover:text-blue-800"
            >
              View All Products →
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> You can add products from your DSers account one by one, 
              or copy product information and paste it here.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                placeholder="e.g., For Sale Sign"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (£) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={product.price}
                onChange={(e) => setProduct({ ...product, price: e.target.value })}
                placeholder="29.99"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={product.description}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                placeholder="High quality weatherproof sign..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL (Optional)
              </label>
              <input
                type="url"
                value={product.imageUrl}
                onChange={(e) => setProduct({ ...product, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Copy image URL from DSers or use your own hosted image
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 text-sm">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Creating Product...' : 'Create Product'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Other Import Options:</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/dsers-import-csv')}
                className="w-full px-4 py-2 text-left bg-gray-50 hover:bg-gray-100 rounded-md text-sm text-gray-700"
              >
                📄 Import from CSV file
              </button>
              <button
                onClick={() => router.push('/products')}
                className="w-full px-4 py-2 text-left bg-gray-50 hover:bg-gray-100 rounded-md text-sm text-gray-700"
              >
                📋 View existing products (10 sample products already loaded)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
