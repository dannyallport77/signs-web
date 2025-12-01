'use client';

import { useEffect, useMemo, useState } from 'react';
import { PLATFORM_PRESETS, PlatformKey } from '@/lib/reviewPlatforms';
import Link from 'next/link';

interface ReviewMenuSummary {
  id: string;
  slug: string;
  businessName: string;
  createdAt: string;
  platforms: Array<{ id: string; name: string; platformKey: string }>;
}

type PlatformSelectionState = Record<
  PlatformKey,
  {
    enabled: boolean;
    label: string;
    url: string;
  }
>;

type SelectedPlatformPayload = {
  platformKey: PlatformKey;
  name: string;
  url: string;
};

const buildInitialPlatformState = (): PlatformSelectionState => {
  return PLATFORM_PRESETS.reduce((acc, preset) => {
    acc[preset.key] = {
      enabled: false,
      label: preset.label,
      url: '',
    };
    return acc;
  }, {} as PlatformSelectionState);
};

export default function ReviewMenusPage() {
  const [menus, setMenus] = useState<ReviewMenuSummary[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [shareUrl, setShareUrl] = useState('');

  const [form, setForm] = useState({
    businessName: '',
    businessAddress: '',
    placeId: '',
    slug: '',
    heroTitle: '',
    heroSubtitle: '',
    logoUrl: '',
  });

  const [platformState, setPlatformState] = useState<PlatformSelectionState>(() => buildInitialPlatformState());

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await fetch('/api/review-menus');
        const result = await response.json();
        if (result.success) {
          setMenus(result.data);
        }
      } catch (err) {
        console.error('Failed to load review menus', err);
      } finally {
        setLoadingMenus(false);
      }
    };

    fetchMenus();
  }, []);

  const selectedCount = useMemo(() =>
    Object.values(platformState).filter((platform) => platform.enabled && platform.url.trim().length > 0).length,
  [platformState]);

  const handlePlatformToggle = (key: PlatformKey) => {
    setPlatformState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key].enabled,
      },
    }));
  };

  const handlePlatformFieldChange = (key: PlatformKey, field: 'label' | 'url', value: string) => {
    setPlatformState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const resetForm = () => {
    setForm({
      businessName: '',
      businessAddress: '',
      placeId: '',
      slug: '',
      heroTitle: '',
      heroSubtitle: '',
      logoUrl: '',
    });
    setPlatformState(buildInitialPlatformState());
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');
    setShareUrl('');

    if (!form.businessName.trim()) {
      setError('Business name is required.');
      setSaving(false);
      return;
    }

    if (selectedCount === 0) {
      setError('Select at least one platform and provide its destination URL.');
      setSaving(false);
      return;
    }

    const selectedPlatforms: SelectedPlatformPayload[] = PLATFORM_PRESETS.map((preset) => {
      const state = platformState[preset.key];
      return state.enabled && state.url.trim()
        ? {
            platformKey: preset.key,
            name: state.label || preset.label,
            url: state.url.trim(),
          }
        : null;
    }).filter((platform): platform is SelectedPlatformPayload => Boolean(platform));

    try {
      const response = await fetch('/api/review-menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          platforms: selectedPlatforms,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create menu');
      }

      setSuccessMessage('Menu created successfully. Share the link below.');
      setShareUrl(`${window.location.origin}/review-menu/${result.data.slug}`);
      setMenus((prev) => [result.data, ...prev]);
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create menu';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setSuccessMessage('Link copied to clipboard.');
    } catch (err) {
      console.error('Clipboard error', err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Multi-platform Menus</h1>
          <p className="text-gray-600">Create a single link that lists every review platform (including Fruit Machine promotions) for a business.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Name *</label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Best Coffee Co."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Public Slug (optional)</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="best-coffee"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Address</label>
              <input
                type="text"
                value={form.businessAddress}
                onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="123 Main Street, London"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Place ID / Reference</label>
              <input
                type="text"
                value={form.placeId}
                onChange={(e) => setForm({ ...form, placeId: e.target.value })}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="ChIJ..."
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Hero Title</label>
              <input
                type="text"
                value={form.heroTitle}
                onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Share your experience"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hero Subtitle</label>
              <input
                type="text"
                value={form.heroSubtitle}
                onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Tap a platform below"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Logo URL</label>
            <input
              type="text"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Available Platforms</h2>
              <p className="text-sm text-gray-500">{selectedCount} selected</p>
            </div>

            <div className="space-y-4">
              {PLATFORM_PRESETS.map((preset) => {
                const state = platformState[preset.key];
                return (
                  <div key={preset.key} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <label className="flex items-center gap-3 text-base font-medium text-gray-900">
                          <input
                            type="checkbox"
                            checked={state.enabled}
                            onChange={() => handlePlatformToggle(preset.key)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{preset.label}</span>
                        </label>
                        <p className="text-sm text-gray-500 mt-1">{preset.description}</p>
                      </div>
                      <span className="text-2xl" aria-hidden>{preset.icon}</span>
                    </div>
                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">Label</label>
                        <input
                          type="text"
                          value={state.label}
                          onChange={(e) => handlePlatformFieldChange(preset.key, 'label', e.target.value)}
                          disabled={!state.enabled}
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">Destination URL</label>
                        <input
                          type="url"
                          value={state.url}
                          onChange={(e) => handlePlatformFieldChange(preset.key, 'url', e.target.value)}
                          disabled={!state.enabled}
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                          placeholder={`https://${preset.key}.com/...`}
                          required={state.enabled}
                        />
                      </div>
                    </div>
                    {preset.key === 'fruitMachine' && (
                      <p className="mt-2 text-sm text-indigo-600">Tip: Use this button to drive visitors to your live Fruit Machine promotion page. This fixes the broken promotion link on older menus.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">{error}</div>}
          {successMessage && (
            <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-2 text-sm flex items-center justify-between">
              <span>{successMessage}</span>
              {shareUrl && (
                <button type="button" onClick={copyShareUrl} className="text-green-800 font-semibold">Copy Link</button>
              )}
            </div>
          )}
          {shareUrl && (
            <div className="rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-600">
              <p className="font-medium text-gray-800">Shareable Link</p>
              <Link href={shareUrl} target="_blank" className="text-indigo-600 break-all">{shareUrl}</Link>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Create Menu'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Menus</h2>
          <span className="text-sm text-gray-500">{menus.length} total</span>
        </div>
        {loadingMenus ? (
          <div className="py-12 text-center text-gray-500">Loading menus...</div>
        ) : menus.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No menus created yet.</div>
        ) : (
          <div className="space-y-4">
            {menus.map((menu) => (
              <div key={menu.id} className="rounded-lg border border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{menu.businessName}</p>
                  <p className="text-sm text-gray-500">{new Date(menu.createdAt).toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-1">Platforms: {menu.platforms.map((p) => p.name).join(', ')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/review-menu/${menu.slug}`}
                    target="_blank"
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    View Menu
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
