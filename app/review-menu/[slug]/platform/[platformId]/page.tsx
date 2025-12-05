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
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState(1);

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
      // Add small delay to ensure page is fully rendered before redirect
      setTimeout(() => {
        window.location.href = platformInfo.platformUrl;
      }, 100);
    }
  }, [autoRedirectSeconds, platformInfo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-full shadow-2xl flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
          <p className="text-white text-xl font-semibold drop-shadow-lg">Loading your review...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Animated background decoration */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-10 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-md">
        {/* Thank you message with animation */}
        <div className="mb-8 animate-bounce-slow">
          <div className="text-6xl mb-4">⭐</div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-lg">
            Thanks for reviewing us!
          </h1>
        </div>

        {/* Logo */}
        <div className="mb-6">
          {menuInfo?.logoUrl ? (
            <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-3xl shadow-2xl overflow-hidden flex items-center justify-center p-3 ring-4 ring-white/30">
              <Image
                src={menuInfo.logoUrl}
                alt={menuInfo.businessName || 'Business Logo'}
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-3xl shadow-2xl flex items-center justify-center ring-4 ring-white/30">
              <span className="text-5xl">⭐</span>
            </div>
          )}
        </div>

        {/* Business Name */}
        {menuInfo?.businessName && (
          <h2 className="text-2xl font-bold text-white mb-3 drop-shadow-md">{menuInfo.businessName}</h2>
        )}

        {/* Platform redirect message */}
        {platformInfo?.platformName && (
          <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-4 mb-6 border border-white/30">
            <p className="text-white text-lg font-semibold">
              Opening <span className="text-yellow-300">{platformInfo.platformName}</span>
            </p>
          </div>
        )}

        {/* Pulse animation */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse">
            <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">
                ✓
              </div>
            </div>
          </div>
        </div>

        {/* Manual redirect button */}
        {platformInfo?.platformUrl && (
          <a
            href={platformInfo.platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-white text-indigo-600 font-bold text-lg rounded-full hover:bg-yellow-300 hover:scale-105 transition-all duration-200 shadow-2xl hover:shadow-yellow-300/50"
          >
            Continue Now →
          </a>
        )}

        {/* Powered by */}
        <p className="mt-8 text-sm text-white/70 font-medium">
          Powered by Review Signs
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

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
