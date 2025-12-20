'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const tagId = searchParams.get('tag_id');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [businessName, setBusinessName] = useState<string>('');

  useEffect(() => {
    if (tagId) {
      verifyPayment();
    } else {
      setStatus('success'); // Assume success if redirected here
    }
  }, [tagId]);

  const verifyPayment = async () => {
    try {
      const res = await fetch(`/api/nfc-tags/${tagId}/trial-status`);
      if (res.ok) {
        const data = await res.json();
        setBusinessName(data.tag?.businessName || '');
        if (data.isPaid) {
          setStatus('success');
        } else {
          // Payment may still be processing, show success anyway
          setStatus('success');
        }
      } else {
        setStatus('success');
      }
    } catch {
      setStatus('success');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 p-6 text-center">
          <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Payment Successful!</h1>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-gray-600">
              Thank you for your payment. Your NFC sign is now fully activated and ready to use.
            </p>
            {businessName && (
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {businessName}
              </p>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-green-800">Sign Activated</p>
                <p className="text-green-700 text-sm">
                  Your sign will now work normally when scanned. Customers will be directed to your business page.
                </p>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">What happens now?</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                Your sign is immediately active
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                Customers scanning the sign will see your business
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                A receipt has been sent to your email
              </li>
            </ul>
          </div>

          {/* Test Button */}
          <div className="text-center pt-4">
            <p className="text-gray-500 text-sm mb-3">Try scanning your sign now to test it!</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-xs text-gray-500">
            Questions? Call us at <a href="tel:07484684658" className="text-blue-600">07484 684658</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
