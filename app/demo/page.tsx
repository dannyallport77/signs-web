import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demo Feature | Review Signs',
  description: 'This is a demonstration of the Review Signs NFC tag features.',
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Demo Badge */}
        <div className="inline-flex items-center gap-2 bg-amber-500 text-amber-900 px-4 py-2 rounded-full text-sm font-semibold mb-6">
          <span>🎯</span> Demo Mode
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-6xl mb-6">✨</div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            Demo Feature
          </h1>
          
          <p className="text-indigo-200 text-lg mb-6">
            This is a demonstration of what customers see when they tap an NFC tag.
          </p>
          
          <div className="bg-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">In a real implementation:</h2>
            <ul className="text-left text-indigo-200 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>This would link to the business's actual review page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>WiFi credentials would auto-connect the customer</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Promotions would show real prizes and offers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>App links would open the correct app store</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-indigo-300 mb-6">
            This demo tag showcases all 12+ review platforms, WiFi access, 
            fruit machine promotions, and more!
          </p>

          <a
            href="/review-menu/demo-showcase"
            className="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold px-8 py-4 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg"
          >
            ← Back to Demo Menu
          </a>
        </div>

        {/* Footer */}
        <div className="mt-8 text-indigo-400 text-sm">
          <p>Powered by Review Signs</p>
          <p className="mt-1">NFC Review Tags for Every Business</p>
        </div>
      </div>
    </div>
  );
}
