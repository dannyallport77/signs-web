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
              <h1 className="text-xl font-bold text-gray-900">Signs NFC Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/dashboard" className="text-gray-700 hover:text-gray-900">Dashboard</a>
              <a href="/dashboard/stock" className="text-gray-700 hover:text-gray-900">Stock</a>
              <a href="/dashboard/users" className="text-gray-700 hover:text-gray-900">Users</a>
              <a href="/dashboard/nfc-tags" className="text-gray-700 hover:text-gray-900">NFC Tags</a>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
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
