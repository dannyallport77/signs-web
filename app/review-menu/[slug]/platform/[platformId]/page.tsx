'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface ReviewMenuPageProps {
  params: Promise<{
    slug: string;
    platformId: string;
  }>;
}

export default function PlatformRedirectPage({ params }: ReviewMenuPageProps) {
  const router = useRouter();
  const [paramsData, setParamsData] = useState<{ slug: string; platformId: string } | null>(null);
  const [platformInfo, setPlatformInfo] = useState<any>(null);
  const [menuInfo, setMenuInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState(2);

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setParamsData(resolved);

      try {
        // Fetch platform info from tracking endpoint
        const trackResponse = await fetch(
          `/api/review-menu/${resolved.slug}/platform/${resolved.platformId}/track`,
          { method: 'POST' }
        );

        if (!trackResponse.ok) {
          throw new Error('Platform not found');
        }

        const trackData = await trackResponse.json();
        setPlatformInfo(trackData);

        // Fetch menu info
        const menuResponse = await fetch(`/api/review-menus/${resolved.slug}`);
        if (menuResponse.ok) {
          const menuData = await menuResponse.json();
          setMenuInfo(menuData);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load platform information');
        setLoading(false);
      }
    };

    resolveParams();
  }, [params]);

  // Auto-redirect countdown
  useEffect(() => {
    if (!platformInfo || autoRedirectSeconds <= 0) return;

    const timer = setTimeout(() => {
      setAutoRedirectSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [platformInfo, autoRedirectSeconds]);

  // Perform redirect when countdown reaches 0
  useEffect(() => {
    if (autoRedirectSeconds === 0 && platformInfo?.platformUrl) {
      window.location.href = platformInfo.platformUrl;
    }
  }, [autoRedirectSeconds, platformInfo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-full shadow-lg flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-600 text-lg">Loading platform...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Error</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          {paramsData && (
            <Link
              href={`/review-menu/${paramsData.slug}`}
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Back to Menu
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-md">
        {/* Logo */}
        <div className="mb-8">
          {menuInfo?.logoUrl ? (
            <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full shadow-lg overflow-hidden flex items-center justify-center p-2">
              <Image
                src={menuInfo.logoUrl}
                alt={menuInfo.businessName || 'Business Logo'}
                width={96}
                height={96}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full shadow-lg flex items-center justify-center">
              <span className="text-4xl">🔗</span>
            </div>
          )}
        </div>

        {/* Business Name */}
        {menuInfo?.businessName && (
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{menuInfo.businessName}</h1>
        )}

        {/* Platform Name */}
        {platformInfo?.platformName && (
          <p className="text-lg text-slate-600 mb-8">
            Redirecting to <span className="font-semibold text-blue-600">{platformInfo.platformName}</span>
          </p>
        )}

        {/* Loading animation */}
        <div className="mb-8">
          <div className="flex justify-center gap-2 mb-6">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-slate-500 text-sm">Redirecting in {autoRedirectSeconds} second{autoRedirectSeconds !== 1 ? 's' : ''}...</p>
        </div>

        {/* Manual redirect button */}
        {platformInfo?.platformUrl && (
          <a
            href={platformInfo.platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            Continue Now →
          </a>
        )}

        {/* Web address */}
        <p className="mt-8 text-sm text-slate-500">
          review-signs.co.uk
        </p>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
