'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface TrialBannerProps {
  tagId?: string;
  daysRemaining?: number;
}

export default function TrialBanner({ tagId, daysRemaining = 0 }: TrialBannerProps) {
  const searchParams = useSearchParams();
  const isTrial = searchParams.get('trial') === 'true';
  const urlTagId = searchParams.get('tag') || tagId;
  const urlDays = parseInt(searchParams.get('days') || '0') || daysRemaining;

  if (!isTrial) return null;

  return (
    <div className="bg-red-600 text-white sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2 animate-pulse">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-lg flex items-center gap-2">
                <span className="bg-white text-red-600 px-2 py-0.5 rounded text-sm">TRIAL VERSION</span>
              </p>
              <p className="text-red-100 text-sm">
                {urlDays > 0 
                  ? `${urlDays} day${urlDays !== 1 ? 's' : ''} remaining`
                  : 'Trial period active'}
                {' '}- Pay £30 to activate
              </p>
            </div>
          </div>
          {urlTagId && (
            <Link
              href={`/trial-expired?tag=${urlTagId}`}
              className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-red-50 transition-colors whitespace-nowrap shadow-lg"
            >
              Pay Now - £30
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
