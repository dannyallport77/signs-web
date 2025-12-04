'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PLATFORM_PRESETS, PlatformKey } from '@/lib/reviewPlatforms';

interface Platform {
  id: string;
  name: string;
  platformKey: string;
  url: string;
  enabled: boolean;
  order: number;
  icon?: string;
}

interface ReviewMenu {
  id: string;
  slug: string;
  businessName: string;
  businessAddress?: string;
  placeId?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  logoUrl?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  wifiSecurity?: string;
  promotionId?: string;
  websiteUrl?: string;
  appDownloadUrl?: string;
  appStoreType?: 'app_store' | 'google_play' | null;
  platforms: Platform[];
  createdAt: string;
  updatedAt: string;
}

type PlatformFormState = Record<string, { enabled: boolean; name: string; url: string }>;

const APP_STORE_OPTIONS: Array<{ value: 'app_store' | 'google_play'; label: string }> = [
  { value: 'app_store', label: 'Apple App Store' },
  { value: 'google_play', label: 'Google Play Store' },
];

export default function MenuEditorPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [menu, setMenu] = useState<ReviewMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    businessName: '',
    businessAddress: '',
    placeId: '',
    heroTitle: '',
    heroSubtitle: '',
    logoUrl: '',
    wifiSsid: '',
    wifiPassword: '',
    wifiSecurity: 'WPA',
    promotionId: '',
    websiteUrl: '',
    appDownloadUrl: '',
    appStoreType: 'app_store' as 'app_store' | 'google_play',
  });

  const [platformForm, setPlatformForm] = useState<PlatformFormState>({});

  // Fetch menu data
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`/api/review-menus/${slug}`);
        if (!response.ok) {
          throw new Error('Menu not found');
        }
        const data = await response.json();
        const menuData: ReviewMenu = data.data;
        setMenu(menuData);

        // Populate form
        setForm({
          businessName: menuData.businessName || '',
          businessAddress: menuData.businessAddress || '',
          placeId: menuData.placeId || '',
          heroTitle: menuData.heroTitle || '',
          heroSubtitle: menuData.heroSubtitle || '',
          logoUrl: menuData.logoUrl || '',
          wifiSsid: menuData.wifiSsid || '',
          wifiPassword: menuData.wifiPassword || '',
          wifiSecurity: menuData.wifiSecurity || 'WPA',
          promotionId: menuData.promotionId || '',
          websiteUrl: menuData.websiteUrl || '',
          appDownloadUrl: menuData.appDownloadUrl || '',
          appStoreType: (menuData.appStoreType as 'app_store' | 'google_play' | undefined) || 'app_store',
        });

        // Populate platform form
        const platformState: PlatformFormState = {};
        menuData.platforms.forEach((platform) => {
          platformState[platform.platformKey] = {
            enabled: true,
            name: platform.name,
            url: platform.url,
          };
        });

        // Add disabled platforms
        PLATFORM_PRESETS.forEach((preset) => {
          if (!platformState[preset.key]) {
            platformState[preset.key] = {
              enabled: false,
              name: preset.label,
              url: '',
            };
          }
        });

        setPlatformForm(platformState);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMenu();
    }
  }, [slug]);

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlatformToggle = (platformKey: string) => {
    setPlatformForm((prev) => ({
      ...prev,
      [platformKey]: {
        ...prev[platformKey],
        enabled: !prev[platformKey].enabled,
      },
    }));
  };

  const handlePlatformChange = (platformKey: string, field: 'name' | 'url', value: string) => {
    setPlatformForm((prev) => ({
      ...prev,
      [platformKey]: {
        ...prev[platformKey],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!form.businessName.trim()) {
        throw new Error('Business name is required');
      }

      // Collect enabled platforms
      const platforms = Object.entries(platformForm)
        .filter(([_, state]) => state.enabled && state.url.trim())
        .map(([key, state]) => ({
          platformKey: key as PlatformKey,
          name: state.name,
          url: state.url.trim(),
        }));

      if (platforms.length === 0) {
        throw new Error('At least one platform with URL is required');
      }

      const response = await fetch(`/api/review-menus/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: form.businessName,
          businessAddress: form.businessAddress || undefined,
          placeId: form.placeId || undefined,
          heroTitle: form.heroTitle || undefined,
          heroSubtitle: form.heroSubtitle || undefined,
          logoUrl: form.logoUrl || undefined,
          wifiSsid: form.wifiSsid || undefined,
          wifiPassword: form.wifiPassword || undefined,
          wifiSecurity: form.wifiSecurity || undefined,
          promotionId: form.promotionId || undefined,
          websiteUrl: form.websiteUrl || undefined,
          appDownloadUrl: form.appDownloadUrl || undefined,
          appStoreType: form.appDownloadUrl ? form.appStoreType : undefined,
          platforms,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update menu');
      }

      setMenu(result.data);
      setSuccess('Menu updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update menu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-semibold">{error || 'Menu not found'}</p>
        <Link href="/dashboard/review-menus" className="text-red-600 hover:text-red-800 font-semibold mt-2 inline-block">
          Back to Menus
        </Link>
      </div>
    );
  }

  const enabledPlatformsCount = Object.values(platformForm).filter((p) => p.enabled && p.url.trim()).length;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/review-menus" className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold mb-2 inline-block">
            ← Back to Menus
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Review Menu</h1>
          <p className="text-gray-600 mt-1">{menu.businessName}</p>
        </div>
        <div className="text-right space-y-2">
          <div>
            <Link
              href={`/dashboard/review-menus/${menu.slug}/analytics`}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 inline-block mr-2"
            >
              View Analytics
            </Link>
            <Link
              href={`/review-menu/${menu.slug}`}
              target="_blank"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 inline-block"
            >
              View Live Menu →
            </Link>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-8">
        {/* Business Information */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b">Business Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name *</label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => handleFormChange('businessName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={form.businessAddress}
                onChange={(e) => handleFormChange('businessAddress', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="123 Main Street, London"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Place ID</label>
              <input
                type="text"
                value={form.placeId}
                onChange={(e) => handleFormChange('placeId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Google Place ID"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Logo URL</label>
              <input
                type="url"
                value={form.logoUrl}
                onChange={(e) => handleFormChange('logoUrl', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b">Hero Section</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={form.heroTitle}
              onChange={(e) => handleFormChange('heroTitle', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Leave a review"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subtitle</label>
            <input
              type="text"
              value={form.heroSubtitle}
              onChange={(e) => handleFormChange('heroSubtitle', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Choose your favorite platform"
            />
          </div>
        </div>

        {/* Website & App Links */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
            <span>🌐 Website & Apps</span>
            <span className="text-sm font-normal text-gray-500">(Optional)</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Website URL</label>
              <input
                type="url"
                value={form.websiteUrl}
                onChange={(e) => handleFormChange('websiteUrl', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://yourbusiness.co.uk"
              />
              <p className="text-sm text-gray-500 mt-2">
                Adds a "Visit Our Website" button to the customer-facing menu.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">App Download URL</label>
              <input
                type="url"
                value={form.appDownloadUrl}
                onChange={(e) => handleFormChange('appDownloadUrl', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://apps.apple.com/app/... or https://play.google.com/store/apps/..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">App Store</label>
              <select
                value={form.appStoreType}
                onChange={(e) => handleFormChange('appStoreType', e.target.value as 'app_store' | 'google_play')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={!form.appDownloadUrl}
              >
                {APP_STORE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {!form.appDownloadUrl && (
                <p className="text-sm text-gray-500 mt-2">
                  Enter an app link first to enable the install button.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* WiFi Access */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
            <span>📶 WiFi Access</span>
            <span className="text-sm font-normal text-gray-500">(Optional)</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">WiFi SSID</label>
              <input
                type="text"
                value={form.wifiSsid}
                onChange={(e) => handleFormChange('wifiSsid', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="GuestNetwork"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">WiFi Password</label>
              <input
                type="text"
                value={form.wifiPassword}
                onChange={(e) => handleFormChange('wifiPassword', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Security Type</label>
              <select
                value={form.wifiSecurity}
                onChange={(e) => handleFormChange('wifiSecurity', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="Open">Open</option>
              </select>
            </div>
          </div>
        </div>

        {/* Promotion */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
            <span>🎰 Promotion</span>
            <span className="text-sm font-normal text-gray-500">(Optional)</span>
          </h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Promotion ID</label>
            <input
              type="text"
              value={form.promotionId}
              onChange={(e) => handleFormChange('promotionId', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="promo-summer-2024"
            />
            <p className="text-sm text-gray-500 mt-2">Enter a promotion ID to enable the "Win a Prize!" button</p>
          </div>
        </div>

        {/* Platforms */}
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <h2 className="text-xl font-bold text-gray-900">Review Platforms</h2>
            <span className="text-sm text-gray-600 font-semibold">
              {enabledPlatformsCount} enabled
            </span>
          </div>

          <div className="space-y-4">
            {PLATFORM_PRESETS.map((preset) => {
              const state = platformForm[preset.key];
              if (!state) return null;

              return (
                <div
                  key={preset.key}
                  className={`border-2 rounded-lg p-4 transition ${
                    state.enabled ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        checked={state.enabled}
                        onChange={() => handlePlatformToggle(preset.key)}
                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{preset.icon}</span>
                        <div>
                          <p className="font-bold text-gray-900">{preset.label}</p>
                          <p className="text-sm text-gray-600">{preset.description}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={state.name}
                            onChange={(e) => handlePlatformChange(preset.key, 'name', e.target.value)}
                            disabled={!state.enabled}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder={preset.label}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                            URL *
                          </label>
                          <input
                            type="url"
                            value={state.url}
                            onChange={(e) => handlePlatformChange(preset.key, 'url', e.target.value)}
                            disabled={!state.enabled}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder={`https://${preset.key}.com/...`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-700">
            <p className="font-semibold">✓ {success}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 justify-end pt-6 border-t">
          <Link
            href="/dashboard/review-menus"
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Menu Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Menu Details</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Menu Slug</p>
            <p className="font-mono font-semibold text-gray-900">{menu.slug}</p>
          </div>
          <div>
            <p className="text-gray-600">Menu ID</p>
            <p className="font-mono font-semibold text-gray-900 truncate">{menu.id}</p>
          </div>
          <div>
            <p className="text-gray-600">Created</p>
            <p className="font-semibold text-gray-900">{new Date(menu.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-600">Last Updated</p>
            <p className="font-semibold text-gray-900">{new Date(menu.updatedAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-600">Active Platforms</p>
            <p className="font-semibold text-gray-900">{menu.platforms.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Share URL</p>
            <p className="font-mono text-sm text-indigo-600 font-semibold break-all">
              review-signs.co.uk/r/{menu.slug}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
