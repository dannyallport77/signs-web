/* eslint-disable jsx-a11y/alt-text, @next/next/no-html-link-for-pages */
'use client';

import { useState } from 'react';

export default function ImportDSersToStockPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    keyword: '',
    initialQuantity: '0',
    minQuantity: '10',
    location: 'Main Warehouse',
    replaceExisting: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/stock/import-dsers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: formData.keyword || undefined,
          initialQuantity: parseInt(formData.initialQuantity),
          minQuantity: parseInt(formData.minQuantity),
          location: formData.location || undefined,
          replaceExisting: formData.replaceExisting,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Import failed');
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '48rem', margin: '0 auto' }}>
      <h1>Import from DSers to Stock</h1>
      <p>
        Directly import products from your DSers account into your stock management system
      </p>

      <form onSubmit={handleImport} style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Search by Keyword (optional)
          </label>
          <input
            type="text"
            name="keyword"
            value={formData.keyword}
            onChange={handleChange}
            placeholder="Leave blank to import all products"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
          />
          <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280' }}>
            Leave empty to import all available products
          </small>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Initial Stock Quantity
          </label>
          <input
            type="number"
            name="initialQuantity"
            value={formData.initialQuantity}
            onChange={handleChange}
            min="0"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
          />
          <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280' }}>
            How many units to set for each imported item (default: 0)
          </small>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Low Stock Threshold
          </label>
          <input
            type="number"
            name="minQuantity"
            value={formData.minQuantity}
            onChange={handleChange}
            min="1"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
          />
          <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280' }}>
            Alert when stock falls below this level (default: 10)
          </small>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Storage Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Warehouse A, Room 102"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
          />
          <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280' }}>
            Physical location where items are stored
          </small>
        </div>

        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            name="replaceExisting"
            checked={formData.replaceExisting}
            onChange={handleChange}
            style={{ marginRight: '0.5rem', cursor: 'pointer' }}
          />
          <label style={{ cursor: 'pointer' }}>
            Overwrite existing items with matching SKUs
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: loading ? '#d1d5db' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Importing...' : 'Import from DSers'}
        </button>
      </form>

      {result && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #10b981', borderRadius: '0.5rem', backgroundColor: '#f0fdf4' }}>
          <h2 style={{ color: '#059669', marginBottom: '1rem' }}>Import Successful!</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#d1fae5', borderRadius: '0.375rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#047857' }}>Imported</div>
              <div style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{result.imported}</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#dbeafe', borderRadius: '0.375rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>Total Processed</div>
              <div style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{result.total}</div>
            </div>
            {result.skipped > 0 && (
              <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '0.375rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#92400e' }}>Skipped (existing)</div>
                <div style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{result.skipped}</div>
              </div>
            )}
            {result.errors > 0 && (
              <div style={{ padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.375rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#991b1b' }}>Errors</div>
                <div style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{result.errors}</div>
              </div>
            )}
          </div>

          {result.items && result.items.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Imported Items:</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.375rem' }}>
                {result.items.slice(0, 10).map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <span>{item.name}</span>
                    <span style={{ color: '#6b7280' }}>{item.quantity}x @ {item.sku}</span>
                  </div>
                ))}
                {result.items.length > 10 && (
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                    + {result.items.length - 10} more items
                  </div>
                )}
              </div>
            </div>
          )}

          {result.skippedItems && result.skippedItems.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#ca8a04' }}>Skipped Items (already exist):</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.375rem' }}>
                {result.skippedItems.slice(0, 5).map((item: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    <span>{item.title}</span>
                    <span style={{ color: '#6b7280' }}>{item.sku}</span>
                  </div>
                ))}
                {result.skippedItems.length > 5 && (
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                    + {result.skippedItems.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {result.failedImports && result.failedImports.length > 0 && (
            <div>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#dc2626' }}>Failed Imports:</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.375rem' }}>
                {result.failedImports.slice(0, 5).map((item: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <div style={{ fontWeight: '600' }}>{item.title}</div>
                    <div style={{ color: '#991b1b', fontSize: '0.75rem' }}>{item.error}</div>
                  </div>
                ))}
                {result.failedImports.length > 5 && (
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                    + {result.failedImports.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ef4444', borderRadius: '0.5rem', backgroundColor: '#fef2f2' }}>
          <h2 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Error</h2>
          <p style={{ color: '#991b1b' }}>{error}</p>
        </div>
      )}

      <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>How it works</h3>
        <ul style={{ listStylePosition: 'inside', color: '#4b5563', fontSize: '0.875rem', lineHeight: '1.5' }}>
          <li>✓ Connects to your DSers account using stored credentials</li>
          <li>✓ Imports all products or filters by keyword</li>
          <li>✓ Creates new stock items with automatic SKU generation (DSERS-[product_id])</li>
          <li>✓ Records all imports as stock movements for audit trail</li>
          <li>✓ Skips items with duplicate SKUs by default (enable "Overwrite" to update)</li>
          <li>✓ Each imported item gets a low-stock alert threshold</li>
        </ul>
      </div>
    </main>
  );
}
