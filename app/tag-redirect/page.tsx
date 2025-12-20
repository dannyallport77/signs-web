'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function TagRedirectContent() {
  const searchParams = useSearchParams();
  const targetUrl = searchParams.get('url');
  const businessName = searchParams.get('business');
  const tagId = searchParams.get('tag');
  const isTrial = searchParams.get('trial') === 'true';
  const daysRemaining = parseInt(searchParams.get('days') || '0');
  
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!targetUrl) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = decodeURIComponent(targetUrl);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetUrl]);

  const handleSkip = () => {
    if (targetUrl) {
      window.location.href = decodeURIComponent(targetUrl);
    }
  };

  const handlePayNow = () => {
    if (tagId) {
      window.location.href = `/trial-expired?tag=${tagId}`;
    }
  };

  if (!targetUrl) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">Invalid redirect URL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col">
      {/* Trial Banner */}
      {isTrial && (
        <div className="bg-red-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-lg">⚠️ TRIAL VERSION</p>
                  <p className="text-red-100 text-sm">
                    {daysRemaining > 0 
                      ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining - Pay £30 to remove this banner`
                      : 'Trial expired - Pay £30 to activate'}
                  </p>
                </div>
              </div>
              <button
                onClick={handlePayNow}
                className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-red-50 transition-colors whitespace-nowrap"
              >
                Pay Now - £30
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Business Logo/Name */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-white/10 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-white">
                {businessName ? businessName.substring(0, 2).toUpperCase() : '⭐'}
              </span>
            </div>
            {businessName && (
              <h1 className="text-2xl font-bold text-white">{decodeURIComponent(businessName)}</h1>
            )}
          </div>

          {/* Redirect Message */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
            <p className="text-white/80 mb-2">Redirecting you to</p>
            <p className="text-white font-medium text-lg truncate">
              {(() => {
                try {
                  const url = new URL(decodeURIComponent(targetUrl));
                  return url.hostname.replace('www.', '');
                } catch {
                  return 'your destination';
                }
              })()}
            </p>
            
            {/* Countdown */}
            <div className="mt-6">
              <div className="w-16 h-16 rounded-full border-4 border-white/30 mx-auto flex items-center justify-center mb-3">
                <span className="text-3xl font-bold text-white">{countdown}</span>
              </div>
              <p className="text-white/60 text-sm">seconds</p>
            </div>
          </div>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="text-white/70 hover:text-white text-sm underline transition-colors"
          >
            Skip and go now →
          </button>

          {/* Trial Warning at bottom */}
          {isTrial && (
            <div className="mt-8 bg-red-500/20 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-200 text-sm">
                This sign is running in <span className="font-bold">TRIAL MODE</span>. 
                Contact Review Signs to activate: <a href="tel:07484684658" className="underline">07484 684658</a>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-white/40 text-xs">Powered by Review Signs</p>
      </div>
    </div>
  );
}

export default function TagRedirectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900" />}>
      <TagRedirectContent />
    </Suspense>
  );
}
