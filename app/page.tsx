import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PhoneAnimation from '../components/PhoneAnimation';
import NotificationBubble from '../components/NotificationBubble';
import Logo from '../components/Logo';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans" suppressHydrationWarning>
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
                  <Logo className="w-5 h-5 text-indigo-400" planeClassName="text-indigo-200" />
                  <span className="text-indigo-200 text-sm font-medium tracking-wide uppercase">Next Gen Review Tech</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
                  Skyrocket Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">5-Star Reviews</span> Instantly
                </h1>
                <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Turn happy customers into powerful brand advocates with a single tap. Our premium NFC signs make leaving a review effortless, boosting your online reputation and search ranking automatically.
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
                    Works on iOS & Android
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Lifetime Warranty
                  </div>
                </div>
                
                {/* Platform Logos */}
                <div className="mt-10 pt-8 border-t border-white/10">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-4 text-center lg:text-left">Works with all major platforms</p>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
                    <img src="/platform-logos/google.png" alt="Google" className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" />
                    <img src="/platform-logos/trustpilot.png" alt="Trustpilot" className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" />
                    <img src="/platform-logos/facebook.png" alt="Facebook" className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" />
                    <img src="/platform-logos/instagram.png" alt="Instagram" className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" />
                    <img src="/platform-logos/tiktok.png" alt="TikTok" className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" />
                    <img src="/platform-logos/tripadvisor.png" alt="TripAdvisor" className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
              
              <div className="relative lg:h-[600px] flex items-center justify-center">
                <div className="relative w-full max-w-md aspect-[9/16] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden ring-1 ring-white/10 animate-enter-phone z-10">
                  <PhoneAnimation />
                  
                  {/* Phone UI Overlay */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-black/20 backdrop-blur-sm z-10 pointer-events-none"></div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 mx-auto w-1/3 rounded-full mb-2 z-10 pointer-events-none"></div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -right-4 top-1/4 z-50">
                  <NotificationBubble />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Categories */}
        <div className="py-24 bg-white relative overflow-hidden">
          {/* Background Blobs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-50/80 blur-3xl"></div>
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-50/80 blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
                <div className="h-80 bg-gray-100 flex items-center justify-center p-8 group-hover:scale-105 transition-transform duration-500">
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
                <div className="h-80 bg-gray-100 flex items-center justify-center p-8 group-hover:scale-105 transition-transform duration-500">
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
                <div className="h-80 bg-gray-100 flex items-center justify-center p-8 group-hover:scale-105 transition-transform duration-500">
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
              <FeatureCardWithLogo
                title="Google Reviews"
                description="Direct customers straight to your Google 5-star review page."
                logo="/platform-logos/google.png"
              />
              <FeatureCardWithLogo
                title="Social Media"
                description="Grow your Instagram, TikTok, or Facebook following instantly."
                logos={["/platform-logos/instagram.png", "/platform-logos/tiktok.png", "/platform-logos/facebook.png"]}
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
              <FeatureCardWithLogo
                title="Trustpilot & More"
                description="Support for Trustpilot, Checkatrade, TripAdvisor, and more."
                logos={["/platform-logos/trustpilot.png", "/platform-logos/checkatrade.png", "/platform-logos/tripadvisor.png"]}
              />
              <FeatureCard
                title="Secure"
                description="Locked tags prevent unauthorized reprogramming."
                icon="🔒"
              />
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="py-24 bg-gray-900 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-purple-900/90"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 lg:p-12 border border-white/10">
              <div className="lg:flex items-center justify-between gap-12">
                <div className="lg:w-2/3">
                  <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-6">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                    </span>
                    <span className="text-indigo-200 text-sm font-medium tracking-wide uppercase">Coming Soon</span>
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">The Ultimate Command Center</h2>
                  <p className="text-lg text-gray-300 leading-relaxed max-w-2xl">
                    We're building a fully integrated management portal to centralize your digital growth. Soon, you'll be able to view, manage, and analyze all your social media activity and reviews from one powerful dashboard.
                  </p>
                </div>
                <div className="lg:w-1/3 mt-8 lg:mt-0">
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-1 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-300">
                    <div className="bg-gray-900 rounded-xl p-6 text-center">
                      <div className="text-4xl mb-3">🚀</div>
                      <h3 className="text-white font-bold text-lg mb-1">All-in-One Portal</h3>
                      <p className="text-gray-400 text-sm">Review Management • Social Analytics • Growth Tracking</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-24 bg-white relative overflow-hidden">
          {/* Background Blobs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute bottom-0 left-1/4 w-[50%] h-[50%] rounded-full bg-blue-50/80 blur-3xl"></div>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="bg-indigo-600 rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-indigo-900/80 z-10"></div>
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover opacity-50"
                  suppressHydrationWarning
                >
                  <source src="/magick-signs-video.mp4" type="video/mp4" />
                </video>
              </div>
              <div className="relative z-20">
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
    <div className="bg-gray-100 rounded-2xl shadow-sm p-8 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1">
      <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-3xl mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

interface FeatureCardWithLogoProps {
  title: string;
  description: string;
  logo?: string;
  logos?: string[];
}

function FeatureCardWithLogo({ title, description, logo, logos }: FeatureCardWithLogoProps) {
  return (
    <div className="bg-gray-100 rounded-2xl shadow-sm p-8 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1">
      <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm">
        {logo ? (
          <img src={logo} alt={title} className="w-10 h-10 object-contain" />
        ) : logos ? (
          <div className="flex -space-x-2">
            {logos.slice(0, 3).map((l, i) => (
              <img key={i} src={l} alt="" className="w-7 h-7 object-contain rounded-full bg-white shadow-sm ring-2 ring-white" />
            ))}
          </div>
        ) : null}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
