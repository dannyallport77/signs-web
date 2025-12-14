'use client';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-100">
        <Sidebar />
        <div className="md:pl-64 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
