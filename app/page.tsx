import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PhoneAnimation from '../components/PhoneAnimation';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative bg-gray-900 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 opacity-90"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
                  <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
                  <span className="text-indigo-200 text-sm font-medium tracking-wide uppercase">Next Gen Review Tech</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
                  Get More <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">5-Star Reviews</span> Instantly
                </h1>
                <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  The easiest way for your customers to leave a review. Just a tap of their phone on our premium NFC signs, stickers, or keyrings. No app required.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/products"
                    className="bg-white text-gray-900 hover:bg-gray-50 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  >
                    Shop Now
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="bg-transparent border-2 border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600 px-8 py-4 rounded-full font-bold text-lg transition-all"
                  >
                    See How It Works
                  </Link>
                </div>
                <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-gray-400 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    No App Needed
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    iOS & Android
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Lifetime Warranty
                  </div>
                </div>
              </div>
              
              <div className="relative lg:h-[600px] flex items-center justify-center">
                <div className="relative w-full max-w-md aspect-[9/16] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden ring-1 ring-white/10">
                  <PhoneAnimation />
                  
                  {/* Phone UI Overlay */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-black/20 backdrop-blur-sm z-10 pointer-events-none"></div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 mx-auto w-1/3 rounded-full mb-2 z-10 pointer-events-none"></div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -right-4 top-1/4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl animate-bounce delay-700 hidden lg:block">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 rounded-full p-2">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <div>
                      <p className="text-white font-bold">Review Received!</p>
                      <p className="text-gray-300 text-xs">Just now</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Wave Divider */}
          <div className="absolute bottom-0 w-full overflow-hidden leading-none">
            <svg className="relative block w-full h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-white"></path>
            </svg>
          </div>
        </div>

        {/* Product Categories */}
        <div className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-3">Our Products</h2>
              <h3 className="text-4xl font-bold text-gray-900 mb-6">Choose Your Growth Tool</h3>
              <p className="text-xl text-gray-600">
                Premium hardware designed to blend seamlessly into your business environment while capturing customer attention.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group relative bg-gray-50 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                <div className="h-80 bg-white flex items-center justify-center p-8 group-hover:scale-105 transition-transform duration-500">
                  <span className="text-9xl filter drop-shadow-xl">🪧</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 z-20 translate-y-4 group-hover:translate-y-0 transition-transform">
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-white mb-2">Countertop Signs</h3>
                  <p className="text-gray-600 group-hover:text-gray-200 mb-6 opacity-0 group-hover:opacity-100 transition-opacity delay-100">Perfect for reception desks, checkout counters, and tables.</p>
                  <Link href="/products?category=stands" className="inline-flex items-center gap-2 text-indigo-600 group-hover:text-white font-bold">
                    Shop Collection <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>

              <div className="group relative bg-gray-50 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                <div className="h-80 bg-white flex items-center justify-center p-8 group-hover:scale-105 transition-transform duration-500">
                  <span className="text-9xl filter drop-shadow-xl">🏷️</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 z-20 translate-y-4 group-hover:translate-y-0 transition-transform">
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-white mb-2">Smart Stickers</h3>
                  <p className="text-gray-600 group-hover:text-gray-200 mb-6 opacity-0 group-hover:opacity-100 transition-opacity delay-100">Versatile adhesive tags for windows, mirrors, and menus.</p>
                  <Link href="/products?category=stickers" className="inline-flex items-center gap-2 text-indigo-600 group-hover:text-white font-bold">
                    Shop Collection <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>

              <div className="group relative bg-gray-50 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                <div className="h-80 bg-white flex items-center justify-center p-8 group-hover:scale-105 transition-transform duration-500">
                  <span className="text-9xl filter drop-shadow-xl">🔑</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 z-20 translate-y-4 group-hover:translate-y-0 transition-transform">
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-white mb-2">Digital Keyrings</h3>
                  <p className="text-gray-600 group-hover:text-gray-200 mb-6 opacity-0 group-hover:opacity-100 transition-opacity delay-100">Portable power for staff on the move.</p>
                  <Link href="/products?category=keyrings" className="inline-flex items-center gap-2 text-indigo-600 group-hover:text-white font-bold">
                    Shop Collection <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="how-it-works" className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">Why Businesses Love Us</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                title="Google Reviews"
                description="Direct customers straight to your Google 5-star review page."
                icon="⭐"
              />
              <FeatureCard
                title="Social Media"
                description="Grow your Instagram, TikTok, or Facebook following instantly."
                icon="📱"
              />
              <FeatureCard
                title="Easy Management"
                description="Update destination links anytime from our dashboard."
                icon="⚙️"
              />
              <FeatureCard
                title="Analytics"
                description="Track how many taps each sign gets to measure performance."
                icon="📊"
              />
              <FeatureCard
                title="Premium Quality"
                description="Durable, scratch-resistant materials built for daily business use."
                icon="💎"
              />
              <FeatureCard
                title="Secure"
                description="Locked tags prevent unauthorized reprogramming."
                icon="🔒"
              />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-indigo-600 rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="relative z-10">
                <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Business?</h2>
                <p className="text-indigo-100 mb-10 text-xl max-w-2xl mx-auto">
                  Join thousands of businesses using our NFC solutions to grow their online presence and reputation.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link
                    href="/products"
                    className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-4 rounded-full font-bold text-lg transition-colors shadow-lg"
                  >
                    Get Started Now
                  </Link>
                  <Link
                    href="/contact"
                    className="bg-indigo-700 text-white hover:bg-indigo-800 border border-indigo-500 px-8 py-4 rounded-full font-bold text-lg transition-colors"
                  >
                    Contact Sales
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
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
    <div className="bg-white rounded-2xl shadow-sm p-8 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1">
      <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-3xl mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
