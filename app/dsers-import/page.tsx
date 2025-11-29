'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ImportResult {
  imported: number;
  total: number;
  errors: number;
  products: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  failedImports: Array<{
    productId: string;
    title: string;
    error: string;
  }>;
}

export default function DSersImportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionTest, setConnectionTest] = useState<any>(null);

  // Form state
  const [appKey, setAppKey] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [storeId, setStoreId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [useEnvCredentials, setUseEnvCredentials] = useState(true);

  const handleTestConnection = async () => {
    setTesting(true);
    setError(null);
    setConnectionTest(null);

    try {
      const response = await fetch('/api/dsers/import');
      const data = await response.json();

      if (response.ok) {
        setConnectionTest(data.data);
      } else {
        setError(data.message || 'Failed to connect to DSers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setTesting(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body: any = {
        keyword: keyword.trim() || undefined,
        replaceExisting,
      };

      // Only include credentials if not using env variables
      if (!useEnvCredentials) {
        if (!appKey || !appSecret) {
          throw new Error('Please provide DSers App Key and App Secret');
        }
        body.appKey = appKey;
        body.appSecret = appSecret;
        body.storeId = storeId || undefined;
      }

      const response = await fetch('/api/dsers/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.data);
      } else {
        setError(data.message || 'Import failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Import Products from DSers</h1>
            <button
              onClick={() => router.push('/products')}
              className="text-blue-600 hover:text-blue-800"
            >
              View Products →
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📚 Setup Instructions</h3>
            <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
              <li>Log in to your DSers account at <a href="https://www.dsers.com/" target="_blank" rel="noopener noreferrer" className="underline">dsers.com</a></li>
              <li>Go to Settings → API Settings</li>
              <li>Create a new API application and copy your App Key and App Secret</li>
              <li>Either add them to your .env file or enter them below</li>
            </ol>
          </div>

          {/* Credentials Section */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="useEnv"
                checked={useEnvCredentials}
                onChange={(e) => setUseEnvCredentials(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="useEnv" className="text-sm text-gray-700">
                Use credentials from environment variables (.env file)
              </label>
            </div>

            {!useEnvCredentials && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DSers App Key *
                  </label>
                  <input
                    type="text"
                    value={appKey}
                    onChange={(e) => setAppKey(e.target.value)}
                    placeholder="Your DSers App Key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DSers App Secret *
                  </label>
                  <input
                    type="password"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                    placeholder="Your DSers App Secret"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    placeholder="Your DSers Store ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Test Connection */}
          <div className="mb-6">
            <button
              onClick={handleTestConnection}
              disabled={testing || loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {testing ? 'Testing...' : 'Test DSers Connection'}
            </button>

            {connectionTest && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 font-medium">✓ Connection successful!</p>
                <p className="text-sm text-green-700 mt-1">
                  Found {connectionTest.total} products in your DSers account
                </p>
                {connectionTest.sampleProducts?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-green-600">Sample products:</p>
                    <ul className="text-xs text-green-700 ml-4 list-disc">
                      {connectionTest.sampleProducts.map((p: any) => (
                        <li key={p.id}>{p.title} - ${p.price}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Import Options */}
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Keyword (Optional)
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g., 'signs', 'stickers' - leave empty to import all"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Only import products matching this keyword
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="replace"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="replace" className="text-sm text-gray-700">
                Delete existing products before importing
              </label>
            </div>

            {replaceExisting && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">
                  ⚠️ Warning: This will delete ALL existing products and their associated transactions before importing.
                </p>
              </div>
            )}
          </div>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={loading || testing}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Importing...' : 'Import Products from DSers'}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 font-medium">✓ Import Complete!</p>
                <div className="text-sm text-green-700 mt-2 space-y-1">
                  <p>Successfully imported: {result.imported} products</p>
                  <p>Total found: {result.total}</p>
                  {result.errors > 0 && <p className="text-red-600">Failed: {result.errors}</p>}
                </div>
              </div>

              {result.products.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="font-medium text-gray-900 mb-2">Imported Products:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {result.products.map((product) => (
                      <div key={product.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">{product.name}</span>
                        <span className="text-gray-600 font-medium">${product.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.failedImports.length > 0 && (
                <div className="p-4 bg-red-50 rounded-md">
                  <p className="font-medium text-red-900 mb-2">Failed Imports:</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {result.failedImports.map((fail, idx) => (
                      <div key={idx} className="text-sm">
                        <p className="text-red-700 font-medium">{fail.title}</p>
                        <p className="text-red-600 text-xs">{fail.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => router.push('/products')}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                View All Products →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
