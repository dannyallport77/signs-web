export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Signs NFC Writer
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Professional NFC Tag Management System
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/login"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Admin Login
            </a>
            <a
              href="#features"
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Learn More
            </a>
          </div>
        </header>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto mb-16 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            Complete Business Solution
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Manage NFC tags with Google Places integration, user management, and comprehensive stock control - all in one platform.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-semibold text-indigo-900 mb-2">📱 Mobile App</h3>
              <p className="text-sm text-gray-700">Search businesses on Google Maps and write review links to NFC tags</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">🌐 Web Dashboard</h3>
              <p className="text-sm text-gray-700">Manage users, track inventory, and monitor all NFC tag activity</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            title="User Management"
            description="Create and manage mobile app users with role-based permissions"
            icon="👥"
          />
          <FeatureCard
            title="Stock Control"
            description="Track inventory, record movements, and get low stock alerts"
            icon="📦"
          />
          <FeatureCard
            title="Google Places"
            description="Search nearby businesses with real-time Google Maps integration"
            icon="🗺️"
          />
          <FeatureCard
            title="NFC Writing"
            description="Write Google review links directly to NFC tags from your phone"
            icon="📱"
          />
          <FeatureCard
            title="Activity Tracking"
            description="Monitor all written NFC tags with detailed history and analytics"
            icon="📊"
          />
          <FeatureCard
            title="Secure API"
            description="RESTful API with JWT authentication and role-based access"
            icon="🔐"
          />
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6">
            Login to the admin dashboard to manage users, stock, and view NFC tag activity
          </p>
          <a
            href="/login"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Access Dashboard
          </a>
          <p className="mt-4 text-sm text-gray-500">
            Default login: admin@example.com / admin123
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-600">
          <p className="mb-2">Built with Next.js 16, Expo, Prisma, and NextAuth</p>
          <p className="text-sm">Complete mobile and web solution for NFC tag management</p>
        </footer>
      </main>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
