'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DemoFeatures {
  wifi: boolean;
  promotion: boolean;
  website: boolean;
  appDownload: boolean;
  platformCount: number;
}

interface DemoData {
  id: string;
  slug: string;
  menuUrl: string;
  businessName: string;
  platforms: Array<{ key: string; name: string }>;
  features: DemoFeatures;
}

export default function DemoTagPage() {
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDemoData();
  }, []);

  const fetchDemoData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/demo-menu');
      const result = await response.json();
      
      if (result.success) {
        setDemoData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load demo data');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const regenerateDemo = async () => {
    try {
      setRegenerating(true);
      const response = await fetch('/api/demo-menu', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        await fetchDemoData();
      } else {
        setError(result.error || 'Failed to regenerate demo');
      }
    } catch (err) {
      setError('Failed to regenerate demo');
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('URL copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading demo data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-indigo-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">🎯 Demo Tag Writer</h1>
          <p className="mt-2 text-gray-600">
            Create a fully-featured demo tag to showcase all available options to customers and operators.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Demo URL Card */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Demo Tag URL</h2>
          <div className="flex items-center gap-4">
            <input
              type="text"
              readOnly
              value={demoData?.menuUrl || ''}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 bg-gray-50 text-gray-700"
            />
            <button
              onClick={() => demoData?.menuUrl && copyToClipboard(demoData.menuUrl)}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition"
            >
              📋 Copy
            </button>
            <a
              href={demoData?.menuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition"
            >
              👁️ Preview
            </a>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Write this URL to an NFC tag to create a demo showcase. The tag can be scanned by any NFC-enabled phone.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Demo Features Included</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FeatureCard icon="⭐" title="Review Platforms" description={`${demoData?.features.platformCount || 12} platforms`} />
            <FeatureCard icon="🎰" title="Fruit Machine" description="Prize promotion" />
            <FeatureCard icon="📶" title="WiFi Access" description="Guest WiFi credentials" />
            <FeatureCard icon="🌐" title="Website Link" description="Business website" />
            <FeatureCard icon="📱" title="App Downloads" description="iOS & Android links" />
            <FeatureCard icon="🎁" title="Prize Wheel" description="Gamified engagement" />
          </div>
        </div>

        {/* Platforms List */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Platforms</h2>
          <div className="flex flex-wrap gap-2">
            {demoData?.platforms.map((platform) => (
              <span
                key={platform.key}
                className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-800"
              >
                {platform.name}
              </span>
            ))}
          </div>
        </div>

        {/* NFC Writing Instructions */}
        <div className="mb-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 shadow-lg text-white">
          <h2 className="text-xl font-semibold mb-4">📝 How to Write the Demo Tag</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Open the <strong>Review Signs mobile app</strong></li>
            <li>Tap the <strong>"🎯 Demo Tag"</strong> button on the main screen</li>
            <li>Tap <strong>"Write Demo to NFC Tag"</strong></li>
            <li>Hold your phone near a blank NFC tag</li>
            <li>The demo URL will be written to the tag</li>
          </ol>
          <p className="mt-4 text-indigo-100">
            Alternatively, you can use any NFC writing app to write the URL above directly to a tag.
          </p>
        </div>

        {/* QR Code Section */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📱 QR Code</h2>
          <p className="text-gray-600 mb-4">
            Scan this QR code or share it to preview the demo on any device:
          </p>
          <div className="flex justify-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(demoData?.menuUrl || '')}`}
              alt="Demo QR Code"
              className="rounded-lg shadow"
            />
          </div>
        </div>

        {/* Regenerate Button */}
        <div className="rounded-xl bg-amber-50 p-6 border border-amber-200">
          <h2 className="text-lg font-semibold text-amber-900 mb-2">🔄 Regenerate Demo</h2>
          <p className="text-amber-800 mb-4 text-sm">
            If you need to reset the demo data or update it with new features, you can regenerate it here.
          </p>
          <button
            onClick={regenerateDemo}
            disabled={regenerating}
            className="rounded-lg bg-amber-500 px-6 py-3 text-white font-semibold hover:bg-amber-600 transition disabled:opacity-50"
          >
            {regenerating ? 'Regenerating...' : 'Regenerate Demo Menu'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
