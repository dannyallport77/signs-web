'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function WiFiInfoPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [wifiData, setWifiData] = useState<{
    ssid: string;
    password: string;
    security: string;
    businessName: string;
  } | null>(null);

  useEffect(() => {
    const fetchWifiData = async () => {
      try {
        const response = await fetch(`/api/review-menus/${slug}`);
        const data = await response.json();
        if (data.data?.wifiSsid) {
          setWifiData({
            ssid: data.data.wifiSsid,
            password: data.data.wifiPassword || '',
            security: data.data.wifiSecurity || 'WPA/WPA2',
            businessName: data.data.businessName,
          });
        }
      } catch (error) {
        console.error('Failed to fetch WiFi data:', error);
      }
    };

    if (slug) {
      fetchWifiData();
    }
  }, [slug]);

  if (!wifiData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-400">Loading WiFi information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-white/10">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📶</div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">
              Guest WiFi
            </h1>
            <p className="text-slate-400">{wifiData.businessName}</p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-slate-900 rounded-lg p-4 space-y-2">
              <p className="text-sm text-slate-400 uppercase tracking-wider">Network Name (SSID)</p>
              <p className="text-2xl font-bold text-cyan-300 break-all font-mono">
                {wifiData.ssid}
              </p>
            </div>

            {wifiData.password && (
              <div className="bg-slate-900 rounded-lg p-4 space-y-2">
                <p className="text-sm text-slate-400 uppercase tracking-wider">Password</p>
                <p className="text-2xl font-bold text-cyan-300 break-all font-mono">
                  {wifiData.password}
                </p>
              </div>
            )}

            <div className="bg-slate-900 rounded-lg p-4">
              <p className="text-sm text-slate-400 uppercase tracking-wider mb-2">Security</p>
              <p className="text-lg text-cyan-300">
                {wifiData.security}
              </p>
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-8">
            <p className="text-sm text-cyan-200">
              ✓ Connected! Enjoy fast, reliable internet while you wait.
            </p>
          </div>

          <Link
            href={`/review-menu/${slug}`}
            className="block w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg text-center transition"
          >
            Back to Reviews
          </Link>
        </div>

        <p className="text-center text-xs text-slate-500 mt-8">
          Powered by Review Signs
        </p>
      </div>
    </div>
  );
}
