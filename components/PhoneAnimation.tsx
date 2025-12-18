'use client';

import { useState, useEffect } from 'react';

export default function PhoneAnimation() {
  const [step, setStep] = useState(0);

  // Animation sequence timing
  useEffect(() => {
    const sequence = [
      // --- GOOGLE (0-12) ---
      { time: 800, next: 1 },   // 0: Load
      { time: 200, next: 2 },   // 1: Wait
      { time: 150, next: 3 },   // 2: 1 star
      { time: 150, next: 4 },   // 3: 2 stars
      { time: 150, next: 5 },   // 4: 3 stars
      { time: 150, next: 6 },   // 5: 4 stars
      { time: 150, next: 7 },   // 6: 5 stars
      { time: 500, next: 8 },   // 7: Wait before typing
      { time: 300, next: 9 },   // 8: Type part 1
      { time: 300, next: 10 },  // 9: Type part 2
      { time: 500, next: 11 },  // 10: Type full
      { time: 500, next: 12 },  // 11: Post
      { time: 2000, next: 13 }, // 12: Success

      // --- TRUSTPILOT (13-25) ---
      { time: 800, next: 14 },  // 13: Load
      { time: 200, next: 15 },  // 14: Wait
      { time: 150, next: 16 },  // 15: 1 star
      { time: 150, next: 17 },  // 16: 2 stars
      { time: 150, next: 18 },  // 17: 3 stars
      { time: 150, next: 19 },  // 18: 4 stars
      { time: 150, next: 20 },  // 19: 5 stars
      { time: 400, next: 21 },  // 20: Type Title
      { time: 400, next: 22 },  // 21: Type Body Part 1
      { time: 400, next: 23 },  // 22: Type Body Full
      { time: 500, next: 24 },  // 23: Submit
      { time: 2000, next: 25 }, // 24: Success

      // --- INSTAGRAM (25-31) ---
      { time: 800, next: 26 },  // 25: Load
      { time: 200, next: 27 },  // 26: Wait
      { time: 200, next: 28 },  // 27: Press Follow
      { time: 800, next: 29 },  // 28: Loading state
      { time: 1500, next: 30 }, // 29: Following state
      { time: 500, next: 31 },  // 30: Success overlay (optional)

      // --- TIKTOK (31-37) ---
      { time: 800, next: 32 },  // 31: Load
      { time: 200, next: 33 },  // 32: Wait
      { time: 200, next: 34 },  // 33: Press Follow
      { time: 800, next: 35 },  // 34: Loading
      { time: 1500, next: 36 }, // 35: Following
      { time: 500, next: 37 },  // 36: Success

      // --- FACEBOOK (37-43) ---
      { time: 800, next: 38 },  // 37: Load
      { time: 200, next: 39 },  // 38: Wait
      { time: 200, next: 40 },  // 39: Press Like
      { time: 800, next: 41 },  // 40: Loading
      { time: 1500, next: 42 }, // 41: Liked state
      { time: 500, next: 43 },  // 42: Success

      // --- SNAPCHAT (43-49) ---
      { time: 800, next: 44 },  // 43: Load
      { time: 200, next: 45 },  // 44: Wait
      { time: 200, next: 46 },  // 45: Press Add
      { time: 800, next: 47 },  // 46: Loading
      { time: 1500, next: 48 }, // 47: Added state
      { time: 500, next: 49 },  // 48: Success

      // --- CHECKATRADE (49-61) ---
      { time: 800, next: 50 },  // 49: Load
      { time: 200, next: 51 },  // 50: Wait
      { time: 200, next: 52 },  // 51: Score 1
      { time: 200, next: 53 },  // 52: Score 2
      { time: 200, next: 54 },  // 53: Score 3
      { time: 200, next: 55 },  // 54: Score 4 (10/10)
      { time: 400, next: 56 },  // 55: Type Part 1
      { time: 400, next: 57 },  // 56: Type Part 2
      { time: 400, next: 58 },  // 57: Type Full
      { time: 500, next: 59 },  // 58: Submit
      { time: 2000, next: 60 }, // 59: Success
      { time: 100, next: 0 },   // 60: Loop
    ];

    const currentStepConfig = sequence[step] || sequence[0];
    
    if (step >= sequence.length) {
        setStep(0);
        return;
    }

    const timer = setTimeout(() => {
      setStep(currentStepConfig.next);
    }, currentStepConfig.time);

    return () => clearTimeout(timer);
  }, [step]);

  // --- STATE HELPERS ---

  const isGoogle = step >= 0 && step <= 12;
  const isTrustpilot = step >= 13 && step <= 24;
  const isInstagram = step >= 25 && step <= 30;
  const isTikTok = step >= 31 && step <= 36;
  const isFacebook = step >= 37 && step <= 42;
  const isSnapchat = step >= 43 && step <= 48;
  const isCheckatrade = step >= 49 && step <= 60;

  const getUrl = () => {
    if (isGoogle) return 'google.com';
    if (isTrustpilot) return 'trustpilot.com';
    if (isInstagram) return 'instagram.com';
    if (isTikTok) return 'tiktok.com';
    if (isFacebook) return 'facebook.com';
    if (isSnapchat) return 'snapchat.com';
    if (isCheckatrade) return 'checkatrade.com';
    return '...';
  };

  // Google Logic
  const googleStars = (step >= 6 && step <= 12) ? 5 : (step >= 2 ? step - 1 : 0);
  const googleText = step === 8 ? "Great" : step === 9 ? "Great ser" : step >= 10 ? "Great service! ⭐" : "";
  const googlePosted = step >= 11;
  const showGoogleCursor = step >= 8 && step <= 10;

  // Trustpilot Logic
  const tpStars = (step >= 19 && step <= 24) ? 5 : (step >= 15 ? step - 14 : 0);
  const tpTitle = step >= 20 ? "Amazing!" : "";
  const showTpTitleCursor = step === 20;
  const tpBody = step === 21 ? "Highly rec" : step >= 22 ? "Highly recommended service." : "";
  const showTpBodyCursor = step >= 21 && step <= 22;
  const tpSubmitted = step >= 23;

  // Instagram Logic
  const instaFollowing = step >= 29;
  const instaLoading = step === 28;

  // TikTok Logic
  const tiktokFollowing = step >= 35;
  const tiktokLoading = step === 34;

  // Facebook Logic
  const fbLiked = step >= 41;
  const fbLoading = step === 40;

  // Snapchat Logic
  const snapAdded = step >= 47;
  const snapLoading = step === 46;

  // Checkatrade Logic
  const catScore = (step >= 54 && step <= 60) ? 10 : (step >= 51 ? (step - 50) * 2.5 : 0);
  const catText = step === 56 ? "Exce" : step === 57 ? "Excellent" : step >= 58 ? "Excellent work!" : "";
  const showCatCursor = step >= 56 && step <= 58;
  const catSubmitted = step >= 59;

  // Global Success State (for overlay)
  const showSuccessOverlay = 
    (isGoogle && step === 12) || 
    (isTrustpilot && step === 24) ||
    (isCheckatrade && step === 59);

  // Sample Images for Social Media
  const coffeeImages = [
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1509365465984-134190037106?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80"
  ];

  const profileImage = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=100&q=80";

  return (
    <div className="w-full h-full bg-white relative overflow-hidden font-sans select-none">
      {/* Platform Indicator */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-50 flex gap-1.5">
        <div className={`w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 ${isGoogle ? 'scale-110 ring-2 ring-blue-500' : 'scale-75 opacity-50'}`}>
          <img src="/platform-logos/google.png" alt="Google" className="w-4 h-4 object-contain" />
        </div>
        <div className={`w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 ${isTrustpilot ? 'scale-110 ring-2 ring-green-500' : 'scale-75 opacity-50'}`}>
          <img src="/platform-logos/trustpilot.png" alt="Trustpilot" className="w-4 h-4 object-contain" />
        </div>
        <div className={`w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 ${isInstagram ? 'scale-110 ring-2 ring-pink-500' : 'scale-75 opacity-50'}`}>
          <img src="/platform-logos/instagram.png" alt="Instagram" className="w-4 h-4 object-contain" />
        </div>
        <div className={`w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 ${isTikTok ? 'scale-110 ring-2 ring-black' : 'scale-75 opacity-50'}`}>
          <img src="/platform-logos/tiktok.png" alt="TikTok" className="w-4 h-4 object-contain" />
        </div>
        <div className={`w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 ${isFacebook ? 'scale-110 ring-2 ring-blue-600' : 'scale-75 opacity-50'}`}>
          <img src="/platform-logos/facebook.png" alt="Facebook" className="w-4 h-4 object-contain" />
        </div>
        <div className={`w-7 h-7 rounded-full bg-yellow-400 shadow-lg flex items-center justify-center transition-all duration-300 ${isSnapchat ? 'scale-110 ring-2 ring-yellow-500' : 'scale-75 opacity-50'}`}>
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
          </svg>
        </div>
        <div className={`w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 ${isCheckatrade ? 'scale-110 ring-2 ring-blue-800' : 'scale-75 opacity-50'}`}>
          <img src="/platform-logos/checkatrade.png" alt="Checkatrade" className="w-4 h-4 object-contain" />
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-black text-white flex justify-between items-center px-4 text-[10px] font-medium z-20 relative">
        <span>9:41</span>
        <div className="flex gap-1">
          <span>5G</span>
          <span>100%</span>
        </div>
      </div>

      {/* Browser Bar */}
      <div className="bg-gray-100 border-b border-gray-200 p-3 flex items-center gap-2 z-20 relative">
        <div className="flex-1 bg-white rounded-lg h-10 px-4 flex items-center text-base text-gray-600 font-medium shadow-sm transition-all">
          <span className="mr-2 text-green-600">🔒</span> {getUrl()}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 h-full relative overflow-hidden">
        
        {/* Transition Spinner */}
        <div 
          className={`absolute inset-0 bg-white z-10 transition-opacity duration-300 flex items-center justify-center
            ${(step === 0 || step === 13 || step === 25 || step === 31 || step === 37) ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>

        {/* --- GOOGLE --- */}
        <div className={`transition-opacity duration-500 absolute inset-0 bg-white ${isGoogle && step > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Google Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-gray-500 text-xl">✕</span>
            <div className="flex items-center gap-2">
              <img src="/platform-logos/google.png" alt="Google" className="w-5 h-5 object-contain" />
              <span className="font-medium text-gray-700">Rate and review</span>
            </div>
            <button 
              className={`font-medium text-sm transition-colors ${googlePosted ? 'text-blue-600' : googleStars > 0 ? 'text-blue-600' : 'text-gray-300'}`}
            >
              Post
            </button>
          </div>
          
          <div className="p-4">
            <h2 className="font-bold text-gray-900 text-base mb-1">Best Coffee Co.</h2>
            <p className="text-xs text-gray-500 mb-6">Publicly posting as Danny A...</p>
            
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className={`w-10 h-10 transition-all duration-200 ${i <= googleStars ? 'text-[#FBBC04] fill-[#FBBC04]' : 'text-gray-300 fill-transparent stroke-current stroke-1'}`} viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>

            <div className="space-y-4">
              <div className="border border-gray-300 rounded p-3 min-h-[80px] text-sm text-gray-800">
                {googleText ? (
                  <span>
                    {googleText}
                    {showGoogleCursor && <span className="animate-pulse text-blue-600">|</span>}
                  </span>
                ) : (
                  <span className="text-gray-400">Share details of your own experience at this place</span>
                )}
              </div>
              
              <div className="flex gap-2 overflow-x-auto py-2">
                <div className="flex-shrink-0 w-16 h-16 border border-gray-300 rounded flex flex-col items-center justify-center text-blue-600 gap-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-[10px]">Add photos</span>
                </div>
                <div className="flex-shrink-0 w-16 h-16 border border-gray-300 rounded flex flex-col items-center justify-center text-blue-600 gap-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-[10px]">Add videos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- TRUSTPILOT --- */}
        <div className={`transition-opacity duration-500 absolute inset-0 bg-[#fcfbf3] ${isTrustpilot && step > 13 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Trustpilot Header */}
          <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <img src="/platform-logos/trustpilot.png" alt="Trustpilot" className="h-8 w-auto object-contain" />
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
               <img src={profileImage} alt="User" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="p-5">
            <h2 className="font-bold text-gray-900 text-xl mb-1">Rate your recent experience</h2>
            <p className="text-gray-500 text-sm mb-6">Best Coffee Co.</p>
            
            <div className="flex gap-1 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`w-10 h-10 border-2 transition-all duration-200 flex items-center justify-center ${i <= tpStars ? 'bg-[#00b67a] border-[#00b67a] text-white' : 'bg-white border-gray-300 text-gray-300'}`}>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Give your review a title</label>
                <div className="h-10 border border-gray-300 bg-white rounded px-3 flex items-center text-sm text-gray-800">
                  {tpTitle ? (
                    <span>
                      {tpTitle}
                      {showTpTitleCursor && <span className="animate-pulse text-black">|</span>}
                    </span>
                  ) : (
                    <span className="text-gray-400">What's most important to know?</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tell us about your experience</label>
                <div className="h-24 border border-gray-300 bg-white rounded p-3 text-sm text-gray-800">
                  {tpBody ? (
                    <span>
                      {tpBody}
                      {showTpBodyCursor && <span className="animate-pulse text-black">|</span>}
                    </span>
                  ) : (
                    <span className="text-gray-400">What did you like or dislike?</span>
                  )}
                </div>
              </div>

              <button className={`w-full py-3 rounded font-bold text-sm transition-all mt-2 ${tpSubmitted ? 'bg-[#00b67a] text-white' : tpStars > 0 ? 'bg-[#00b67a] text-white' : 'bg-blue-100 text-blue-300'}`}>
                {tpSubmitted ? 'Review submitted' : 'Submit review'}
              </button>
            </div>
          </div>
        </div>

        {/* --- INSTAGRAM --- */}
        <div className={`transition-opacity duration-500 absolute inset-0 bg-white ${isInstagram && step > 25 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Instagram Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            <div className="flex items-center gap-2">
              <img src="/platform-logos/instagram.png" alt="Instagram" className="w-5 h-5 object-contain" />
              <span className="font-bold text-gray-900 text-sm">best_coffee_co</span>
            </div>
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
          </div>

          <div className="p-4 pb-0">
            <div className="flex items-center justify-between mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  <img src={profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                </div>
              </div>
              <div className="flex gap-6 text-center mr-4">
                <div><div className="font-bold text-gray-900 text-sm">1,240</div><div className="text-xs text-gray-500">Posts</div></div>
                <div><div className="font-bold text-gray-900 text-sm">15.4K</div><div className="text-xs text-gray-500">Followers</div></div>
                <div><div className="font-bold text-gray-900 text-sm">342</div><div className="text-xs text-gray-500">Following</div></div>
              </div>
            </div>
            
            <div className="mb-4">
              <h2 className="font-bold text-gray-900 text-sm">Best Coffee Co.</h2>
              <p className="text-xs text-gray-600">☕️ Specialty Coffee Roasters<br/>🥐 Fresh Pastries Daily<br/>📍 London, UK</p>
            </div>

            <div className="flex gap-2 mb-6">
              <button 
                className={`flex-1 py-1.5 rounded-lg font-semibold text-sm transition-all duration-200 
                  ${instaFollowing ? 'bg-gray-100 text-black border border-gray-200' : 'bg-[#0095f6] text-white'}
                `}
              >
                {instaLoading ? '...' : instaFollowing ? 'Following' : 'Follow'}
              </button>
              <button className="flex-1 py-1.5 rounded-lg font-semibold text-sm bg-gray-100 text-black border border-gray-200">
                Message
              </button>
            </div>

            {/* Highlights */}
            <div className="flex gap-4 overflow-x-auto mb-4 pb-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 p-1">
                    <div className="w-full h-full rounded-full bg-gray-200"></div>
                  </div>
                  <div className="text-[10px] text-gray-500">Menu</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex border-t border-gray-200">
              <div className="flex-1 py-2 border-b-2 border-black flex justify-center">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </div>
              <div className="flex-1 py-2 flex justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="flex-1 py-2 flex justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-0.5">
               {coffeeImages.map((src, i) => (
                 <div key={i} className="aspect-square bg-gray-100 overflow-hidden">
                   <img src={src} alt="Post" className="w-full h-full object-cover" />
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* --- TIKTOK --- */}
        <div className={`transition-opacity duration-500 absolute inset-0 bg-black text-white ${isTikTok && step > 31 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* TikTok Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            <div className="flex items-center gap-2">
              <img src="/platform-logos/tiktok.png" alt="TikTok" className="w-5 h-5 object-contain" />
              <span className="font-bold text-base">Best Coffee Co.</span>
            </div>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
          </div>

          <div className="p-4 pt-2 text-center">
            <div className="w-24 h-24 rounded-full bg-gray-800 mx-auto mb-3 border-2 border-white/20 overflow-hidden">
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <h2 className="font-bold text-lg mb-1">@bestcoffee</h2>
            
            <div className="flex justify-center gap-6 text-xs text-gray-300 mb-6 border-b border-gray-800 pb-4">
              <div className="text-center"><b className="text-white block text-base">124</b> Following</div>
              <div className="text-center"><b className="text-white block text-base">85.2K</b> Followers</div>
              <div className="text-center"><b className="text-white block text-base">1.2M</b> Likes</div>
            </div>

            <div className="flex justify-center gap-2 mb-6">
              <button 
                className={`px-12 py-3 rounded font-semibold text-sm transition-all duration-200 flex-1
                  ${tiktokFollowing ? 'bg-gray-800 text-white border border-gray-700' : 'bg-[#FE2C55] text-white border-none'}
                `}
              >
                {tiktokLoading ? '...' : tiktokFollowing ? 'Message' : 'Follow'}
              </button>
              <div className="w-11 h-11 bg-gray-800 rounded flex items-center justify-center border border-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800 mb-1">
              <div className="flex-1 pb-2 border-b-2 border-white text-white font-medium text-sm">Videos</div>
              <div className="flex-1 pb-2 text-gray-500 font-medium text-sm">Liked</div>
            </div>

            <div className="grid grid-cols-3 gap-0.5">
               {coffeeImages.slice(0, 6).map((src, i) => (
                 <div key={i} className="aspect-[3/4] bg-gray-900 overflow-hidden relative">
                   <img src={src} alt="TikTok" className="w-full h-full object-cover opacity-80" />
                   <div className="absolute bottom-1 left-1 text-[10px] font-bold flex items-center gap-1">
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     {12 + i}K
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* --- FACEBOOK --- */}
        <div className={`transition-opacity duration-500 absolute inset-0 bg-white ${isFacebook && step > 37 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Facebook Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white">
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            <div className="flex items-center gap-2">
              <img src="/platform-logos/facebook.png" alt="Facebook" className="w-5 h-5 object-contain" />
              <span className="font-bold text-gray-900 text-sm">Best Coffee Co.</span>
            </div>
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div className="p-0">
            {/* Cover Photo */}
            <div className="h-28 bg-gradient-to-r from-blue-600 to-blue-400 relative">
              <img src={coffeeImages[0]} alt="Cover" className="w-full h-full object-cover opacity-80" />
            </div>
            
            {/* Profile Section */}
            <div className="px-4 -mt-12 relative">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              </div>
              
              <div className="mt-2">
                <h2 className="font-bold text-gray-900 text-lg flex items-center gap-1">
                  Best Coffee Co.
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </h2>
                <p className="text-xs text-gray-500">12.4K followers · Coffee Shop</p>
              </div>

              <div className="flex gap-2 mt-4">
                <button 
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2
                    ${fbLiked ? 'bg-gray-100 text-gray-700' : 'bg-[#1877F2] text-white'}
                  `}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" /></svg>
                  {fbLoading ? '...' : fbLiked ? 'Liked' : 'Like'}
                </button>
                <button className="flex-1 py-2 rounded-lg font-semibold text-sm bg-gray-100 text-gray-700 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  Share
                </button>
              </div>

              {/* Posts Preview */}
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img src={profileImage} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Best Coffee Co.</p>
                    <p className="text-[10px] text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <p className="text-xs text-gray-700 mb-2">Fresh batch of our signature blend just arrived! ☕✨</p>
                <div className="rounded-lg overflow-hidden">
                  <img src={coffeeImages[1]} alt="Post" className="w-full h-24 object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- SNAPCHAT --- */}
        <div className={`transition-opacity duration-500 absolute inset-0 bg-[#FFFC00] ${isSnapchat && step > 43 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Snapchat Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#FFFC00]">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
              </svg>
              <span className="font-bold text-black text-base">bestcoffeeco</span>
            </div>
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
          </div>

          <div className="bg-white flex-1 rounded-t-3xl mt-2 p-4">
            {/* Profile Card */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1 mx-auto mb-3">
                <div className="w-full h-full rounded-full bg-white p-1">
                  <img src={profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                </div>
              </div>
              <h2 className="font-bold text-black text-lg">bestcoffeeco</h2>
              <p className="text-gray-500 text-sm">Best Coffee Co. ☕</p>
              
              <div className="flex justify-center gap-8 mt-4 text-center">
                <div>
                  <div className="font-bold text-black text-lg">2.4K</div>
                  <div className="text-xs text-gray-500">Score</div>
                </div>
                <div>
                  <div className="font-bold text-black text-lg">847</div>
                  <div className="text-xs text-gray-500">Friends</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-4">
              <button 
                className={`flex-1 py-3 rounded-full font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2
                  ${snapAdded ? 'bg-gray-200 text-gray-700' : 'bg-[#FFFC00] text-black'}
                `}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                {snapLoading ? '...' : snapAdded ? 'Added' : 'Add Friend'}
              </button>
              <button className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
              </button>
            </div>

            {/* Recent Snaps */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500 font-medium mb-3">Recent Stories</p>
              <div className="flex gap-3">
                {coffeeImages.slice(0, 3).map((src, i) => (
                  <div key={i} className="w-16 h-20 rounded-lg overflow-hidden border-2 border-[#FFFC00]">
                    <img src={src} alt="Story" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- CHECKATRADE --- */}
        <div className={`transition-opacity duration-500 absolute inset-0 bg-white ${isCheckatrade && step > 49 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Checkatrade Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <img src="/platform-logos/checkatrade.png" alt="Checkatrade" className="h-8 w-auto object-contain" />
            </div>
            <div className="text-gray-400">✕</div>
          </div>

          <div className="p-5">
            <h3 className="font-bold text-gray-900 text-xl mb-2">Leave a review</h3>
            <p className="text-sm text-gray-500 mb-6">Share your experience with Best Coffee Co.</p>
            
            <div className="space-y-6 mb-8">
              {['Reliability', 'Tidiness', 'Courtesy', 'Workmanship'].map((label, idx) => (
                <div key={label} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-medium text-gray-700">
                    <span>{label}</span>
                    <span className="font-bold text-[#2d2e83] bg-blue-50 px-2 py-0.5 rounded">
                      {catScore >= 10 ? '10' : catScore > 0 ? catScore : '-'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#2d2e83] transition-all duration-300"
                      style={{ width: `${catScore * 10}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Your review</label>
                <div className="bg-white p-3 rounded border border-gray-300 h-24 text-sm text-gray-800">
                   {catText ? (
                     <span>
                       {catText}
                       {showCatCursor && <span className="animate-pulse text-[#2d2e83]">|</span>}
                     </span>
                   ) : (
                     <span className="text-gray-400">Brief description of work carried out...</span>
                   )}
                </div>
              </div>

              <button className={`w-full py-3 rounded font-bold text-sm transition-all shadow-sm ${catSubmitted ? 'bg-green-600 text-white' : 'bg-[#2d2e83] text-white'}`}>
                {catSubmitted ? 'Review Published' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>

        {/* Success Overlay (Shared) */}
        <div 
          className={`absolute inset-0 bg-white/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center transition-opacity duration-500
            ${showSuccessOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Success!</h3>
          <p className="text-gray-500 text-sm mt-2">Action completed.</p>
        </div>

      </div>
    </div>
  );
}
