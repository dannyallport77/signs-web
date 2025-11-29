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
    line: number;
    error: string;
    data: string;
  }>;
}

export default function DSersCSVImportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('replaceExisting', replaceExisting.toString());

      const response = await fetch('/api/dsers/import-csv', {
        method: 'POST',
        body: formData,
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
            <h1 className="text-2xl font-bold text-gray-900">Import Products from DSers (CSV)</h1>
            <button
              onClick={() => router.push('/products')}
              className="text-blue-600 hover:text-blue-800"
            >
              View Products →
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📋 How to Export from DSers</h3>
            <ol className="text-sm text-blue-800 space-y-2 ml-4 list-decimal">
              <li>Log in to your DSers account at <a href="https://www.dsers.com/" target="_blank" rel="noopener noreferrer" className="underline">dsers.com</a></li>
              <li>Go to <strong>My Products</strong> or <strong>Product List</strong></li>
              <li>Click the <strong>Export</strong> button (usually at the top right)</li>
              <li>Choose <strong>Export to CSV</strong></li>
              <li>Download the CSV file and upload it below</li>
            </ol>
            <div className="mt-3 p-3 bg-blue-100 rounded">
              <p className="text-xs text-blue-900 font-semibold">CSV Format Requirements:</p>
              <p className="text-xs text-blue-800 mt-1">
                Your CSV must include columns for: <strong>title/name</strong> and <strong>price</strong>
                <br />
                Optional columns: product_id, description, image_url
              </p>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select DSers CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
            />
            {file && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Import Options */}
          <div className="mb-6">
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
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">
                  ⚠️ Warning: This will delete ALL existing products and their associated transactions before importing.
                </p>
              </div>
            )}
          </div>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={loading || !file}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Importing...' : 'Import Products from CSV'}
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
                  <p>Total rows processed: {result.total}</p>
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
                        <p className="text-red-700 font-medium">Line {fail.line}: {fail.error}</p>
                        <p className="text-red-600 text-xs">{fail.data}</p>
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

        {/* Sample CSV Format */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Sample CSV Format</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
            <pre className="text-xs">
{`product_id,title,price,description,image_url
12345,For Sale Sign,29.99,High quality for sale sign,https://example.com/image1.jpg
12346,To Let Sign,29.99,Professional to let sign,https://example.com/image2.jpg
12347,Sold Sign,29.99,Bold sold sign,https://example.com/image3.jpg`}
            </pre>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            <strong>Minimum required columns:</strong> title (or name), price
            <br />
            <strong>Optional columns:</strong> product_id, description, image_url
          </p>
        </div>
      </div>
    </div>
  );
}
