'use client';

import Sidebar from './components/Sidebar';
import Header from './components/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100" suppressHydrationWarning>
      <Sidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
