'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface TagStatus {
  found: boolean;
  tag?: {
    id: string;
    businessName: string;
    businessAddress?: string;
    placeId: string;
  };
  isTrial: boolean;
  isPaid: boolean;
  isExpired: boolean;
  daysRemaining: number;
  paymentAmount: number;
}

function TrialExpiredContent() {
  const searchParams = useSearchParams();
  const tagId = searchParams.get('tag') || searchParams.get('tagId');
  
  const [status, setStatus] = useState<TagStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tagId) {
      fetchStatus();
    } else {
      setLoading(false);
      setError('No tag ID provided');
    }
  }, [tagId]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/nfc-tags/${tagId}/trial-status`);
      if (!res.ok) {
        throw new Error('Tag not found');
      }
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setError('Unable to load tag information');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!tagId) return;
    
    try {
      setCheckoutLoading(true);
      const res = await fetch(`/api/nfc-tags/${tagId}/checkout`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const data = await res.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError('Payment system unavailable. Please call us to complete payment.');
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 p-6 text-center">
          <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">TRIAL EXPIRED</h1>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {status?.tag && (
            <div className="text-center">
              <p className="text-gray-600 text-sm">Sign for</p>
              <p className="text-xl font-semibold text-gray-900">{status.tag.businessName}</p>
              {status.tag.businessAddress && (
                <p className="text-gray-500 text-sm">{status.tag.businessAddress}</p>
              )}
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-center">
              Your trial period has ended. To continue using this NFC sign, please complete payment below or contact us.
            </p>
          </div>

          {/* Price */}
          <div className="text-center">
            <p className="text-gray-500 text-sm">One-time activation fee</p>
            <p className="text-4xl font-bold text-gray-900">£30</p>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={checkoutLoading}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {checkoutLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Pay Now - £30
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center space-y-3">
            <p className="text-gray-600">Call us to enable this sign</p>
            <a
              href="tel:07484684658"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              07484 684658
            </a>
          </div>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <p className="text-yellow-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-xs text-gray-500">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TrialExpiredPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <TrialExpiredContent />
    </Suspense>
  );
}
