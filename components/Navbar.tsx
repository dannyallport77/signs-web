import Link from 'next/link';
import Logo from './Logo';

export default function Navbar() {
  return (
    <nav className="bg-gray-900/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-50" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <Logo className="w-10 h-10 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-2xl font-bold text-white tracking-tight">
              Review<span className="text-indigo-400">Signs</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-300 hover:text-white font-medium transition-colors text-sm uppercase tracking-wide">
              Home
            </Link>
            <Link href="/products" className="text-gray-300 hover:text-white font-medium transition-colors text-sm uppercase tracking-wide">
              Shop
            </Link>
            <Link href="/contact" className="text-gray-300 hover:text-white font-medium transition-colors text-sm uppercase tracking-wide">
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/cart" className="text-gray-300 hover:text-white font-medium transition-colors flex items-center gap-2 group">
              <div className="relative">
                <span className="text-xl group-hover:scale-110 transition-transform block">🛒</span>
                {/* <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">0</span> */}
              </div>
              <span className="hidden sm:inline text-sm font-medium">Cart</span>
            </Link>
            <Link href="/login" className="bg-white text-gray-900 hover:bg-gray-100 px-6 py-2.5 rounded-full font-bold text-sm transition-all transform hover:scale-105 shadow-lg">
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
