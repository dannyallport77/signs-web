'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PromotionPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [promotionId, setPromotionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotionId = async () => {
      try {
        const response = await fetch(`/api/review-menus/${slug}`);
        const data = await response.json();
        if (data.data?.promotionId) {
          setPromotionId(data.data.promotionId);
        }
      } catch (error) {
        console.error('Failed to fetch promotion:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPromotionId();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-400">Loading promotion...</p>
        </div>
      </div>
    );
  }

  if (!promotionId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-400">Promotion not found</p>
          <Link href={`/review-menu/${slug}`} className="text-cyan-400 hover:underline mt-4">
            Back to Reviews
          </Link>
        </div>
      </div>
    );
  }

  // Redirect to the fruit machine page with the promotion ID
  useEffect(() => {
    if (promotionId) {
      window.location.href = `/fruit-machine?promotionId=${promotionId}`;
    }
  }, [promotionId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-slate-400">Redirecting to promotion...</p>
      </div>
    </div>
  );
}
