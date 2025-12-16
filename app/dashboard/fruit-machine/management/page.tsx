'use client';

import { useState, useEffect } from 'react';
import { format, differenceInHours } from 'date-fns';

interface Business {
  placeId: string;
  name: string;
}

interface FruitMachinePromotion {
  id: string;
  businessId: string;
  name: string;
  enabled: boolean;
  startsAt: string | null;
  endsAt: string | null;
  winProbability: number;
  monthlyBudget: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function PromotionsManagementPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');
  const [promotions, setPromotions] = useState<FruitMachinePromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    enabled: false,
    startsAt: '',
    endsAt: '',
    name: '',
    winProbability: 20,
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    if (selectedPlaceId) {
      fetchPromotions();
    }
  }, [selectedPlaceId]);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/places');
      if (!response.ok) throw new Error('Failed to fetch businesses');
      const data = await response.json();
      setBusinesses(data);
      if (data.length > 0) {
        setSelectedPlaceId(data[0].placeId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch businesses');
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotions = async () => {
    if (!selectedPlaceId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/fruit-machine/promotion/list?placeId=${selectedPlaceId}`);
      if (!response.ok) throw new Error('Failed to fetch promotions');
      const data = await response.json();
      setPromotions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch promotions');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (promo: FruitMachinePromotion) => {
    setEditingId(promo.id);
    setEditForm({
      enabled: promo.enabled,
      startsAt: promo.startsAt ? format(new Date(promo.startsAt), "yyyy-MM-dd'T'HH:mm") : '',
      endsAt: promo.endsAt ? format(new Date(promo.endsAt), "yyyy-MM-dd'T'HH:mm") : '',
      name: promo.name,
      winProbability: promo.winProbability,
    });
  };

  const saveChanges = async (promoId: string) => {
    try {
      const response = await fetch(`/api/fruit-machine/promotion/${promoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: editForm.enabled,
          startsAt: editForm.startsAt || null,
          endsAt: editForm.endsAt || null,
          name: editForm.name,
          winProbability: editForm.winProbability,
        }),
      });

      if (!response.ok) throw new Error('Failed to update promotion');
      
      setEditingId(null);
      await fetchPromotions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update promotion');
    }
  };

  const getPromotionStatus = (promo: FruitMachinePromotion) => {
    const now = new Date();
    const startsAt = promo.startsAt ? new Date(promo.startsAt) : null;
    const endsAt = promo.endsAt ? new Date(promo.endsAt) : null;

    if (!promo.enabled) return { status: 'Disabled', color: 'bg-gray-500', icon: '❌' };
    if (startsAt && now < startsAt) return { status: 'Scheduled', color: 'bg-blue-500', icon: '⏰' };
    if (endsAt && now > endsAt) return { status: 'Ended', color: 'bg-red-500', icon: '⏱️' };
    return { status: 'Active', color: 'bg-green-500', icon: '✅' };
  };

  if (loading && businesses.length === 0) {
    return <div className="p-8 text-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎰 Manage Promotions</h1>
          <p className="text-slate-400">Enable/disable promotions and set time bounds</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Business Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Select Location</label>
          <select
            value={selectedPlaceId}
            onChange={(e) => setSelectedPlaceId(e.target.value)}
            className="w-full md:w-64 px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
          >
            {businesses.map((biz) => (
              <option key={biz.placeId} value={biz.placeId}>
                {biz.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {promotions.map((promo) => {
            const statusInfo = getPromotionStatus(promo);
            const isEditing = editingId === promo.id;

            return (
              <div key={promo.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                {isEditing ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Win Probability (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.winProbability}
                          onChange={(e) =>
                            setEditForm({ ...editForm, winProbability: parseFloat(e.target.value) })
                          }
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Start Date/Time
                        </label>
                        <input
                          type="datetime-local"
                          value={editForm.startsAt}
                          onChange={(e) => setEditForm({ ...editForm, startsAt: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          End Date/Time
                        </label>
                        <input
                          type="datetime-local"
                          value={editForm.endsAt}
                          onChange={(e) => setEditForm({ ...editForm, endsAt: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-slate-300">
                        <input
                          type="checkbox"
                          checked={editForm.enabled}
                          onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span>Enabled</span>
                      </label>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => saveChanges(promo.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-medium transition"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded text-white font-medium transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">{promo.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${statusInfo.color}`}>
                            {statusInfo.icon} {statusInfo.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => startEdit(promo)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Win Probability</span>
                        <p className="text-white font-semibold">{promo.winProbability}%</p>
                      </div>

                      <div>
                        <span className="text-slate-400">Status</span>
                        <p className="text-white font-semibold">{promo.enabled ? '✅ Enabled' : '❌ Disabled'}</p>
                      </div>

                      {promo.startsAt && (
                        <div>
                          <span className="text-slate-400">Starts</span>
                          <p className="text-white font-semibold">
                            {format(new Date(promo.startsAt), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      )}

                      {promo.endsAt && (
                        <div>
                          <span className="text-slate-400">Ends</span>
                          <p className="text-white font-semibold">
                            {format(new Date(promo.endsAt), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      )}
                    </div>

                    {promo.startsAt && promo.endsAt && (
                      <div className="mt-3 text-xs text-slate-400">
                        Duration: {differenceInHours(new Date(promo.endsAt), new Date(promo.startsAt))} hours
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {promotions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No promotions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
