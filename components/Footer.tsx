import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                S
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                Signs<span className="text-indigo-400">NFC</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Empowering businesses with next-generation NFC technology. Collect reviews, grow social media, and engage customers instantly.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-6 tracking-wide uppercase text-sm">Shop</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/products" className="text-gray-400 hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/products?category=stands" className="text-gray-400 hover:text-white transition-colors">Countertop Signs</Link></li>
              <li><Link href="/products?category=stickers" className="text-gray-400 hover:text-white transition-colors">Smart Stickers</Link></li>
              <li><Link href="/products?category=keyrings" className="text-gray-400 hover:text-white transition-colors">Digital Keyrings</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-6 tracking-wide uppercase text-sm">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors">Admin Portal</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-6 tracking-wide uppercase text-sm">Legal</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Signs NFC. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="text-2xl grayscale opacity-50 hover:opacity-100 transition-opacity cursor-pointer">💳</span>
            <span className="text-2xl grayscale opacity-50 hover:opacity-100 transition-opacity cursor-pointer">🅿️</span>
            <span className="text-2xl grayscale opacity-50 hover:opacity-100 transition-opacity cursor-pointer">🍎</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
