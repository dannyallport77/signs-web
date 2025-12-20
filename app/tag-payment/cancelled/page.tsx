'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentCancelledContent() {
  const searchParams = useSearchParams();
  const tagId = searchParams.get('tag_id');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-600 p-6 text-center">
          <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Payment Cancelled</h1>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-gray-600">
              Your payment was cancelled. Your NFC sign remains on trial status.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-center text-sm">
              Don't worry - you can complete payment at any time before your trial expires.
            </p>
          </div>

          {/* Try Again */}
          {tagId && (
            <Link
              href={`/trial-expired?tag=${tagId}`}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Try Payment Again
            </Link>
          )}

          {/* Contact */}
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-2">Need help?</p>
            <a
              href="tel:07484684658"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Call 07484 684658
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelledPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentCancelledContent />
    </Suspense>
  );
}
