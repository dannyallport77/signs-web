'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Client-side session check would go here
    // For now, just a placeholder
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Sign-up Advertising Signage Systems</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => window.location.href = '/dashboard/stock'}
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                Stock
              </button>
              <button
                onClick={() => window.location.href = '/dashboard/users'}
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                Users
              </button>
              <button
                onClick={() => window.location.href = '/dashboard/nfc-tags'}
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                NFC Tags
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
