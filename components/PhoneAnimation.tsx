'use client';

import { useState, useEffect } from 'react';

export default function PhoneAnimation() {
  const [step, setStep] = useState(0);

  // Animation sequence timing
  useEffect(() => {
    const sequence = [
      // --- GOOGLE (0-12) ---
      { time: 1500, next: 1 },  // 0: Load
      { time: 500, next: 2 },   // 1: Wait
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
      { time: 1500, next: 14 }, // 13: Load
      { time: 500, next: 15 },  // 14: Wait
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
      { time: 1500, next: 26 }, // 25: Load
      { time: 800, next: 27 },  // 26: Wait
      { time: 200, next: 28 },  // 27: Press Follow
      { time: 800, next: 29 },  // 28: Loading state
      { time: 1500, next: 30 }, // 29: Following state
      { time: 500, next: 31 },  // 30: Success overlay (optional)

      // --- TIKTOK (31-37) ---
      { time: 1500, next: 32 }, // 31: Load
      { time: 800, next: 33 },  // 32: Wait
      { time: 200, next: 34 },  // 33: Press Follow
      { time: 800, next: 35 },  // 34: Loading
      { time: 1500, next: 36 }, // 35: Following
      { time: 500, next: 37 },  // 36: Success

      // --- CHECKATRADE (37-49) ---
      { time: 1500, next: 38 }, // 37: Load
      { time: 500, next: 39 },  // 38: Wait
      { time: 200, next: 40 },  // 39: Score 1
      { time: 200, next: 41 },  // 40: Score 2
      { time: 200, next: 42 },  // 41: Score 3
      { time: 200, next: 43 },  // 42: Score 4 (10/10)
      { time: 400, next: 44 },  // 43: Type Part 1
      { time: 400, next: 45 },  // 44: Type Part 2
      { time: 400, next: 46 },  // 45: Type Full
      { time: 500, next: 47 },  // 46: Submit
      { time: 2000, next: 48 }, // 47: Success
      { time: 100, next: 0 },   // 48: Loop
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
  const isCheckatrade = step >= 37 && step <= 48;

  const getUrl = () => {
    if (isGoogle) return 'google.com';
    if (isTrustpilot) return 'trustpilot.com';
    if (isInstagram) return 'instagram.com';
    if (isTikTok) return 'tiktok.com';
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

  // Checkatrade Logic
  const catScore = (step >= 42 && step <= 48) ? 10 : (step >= 39 ? (step - 38) * 2.5 : 0); // 2.5, 5, 7.5, 10
  const catText = step === 44 ? "Exce" : step === 45 ? "Excellent" : step >= 46 ? "Excellent work!" : "";
  const showCatCursor = step >= 44 && step <= 46;
  const catSubmitted = step >= 47;

  // Global Success State (for overlay)
  const showSuccessOverlay = 
    (isGoogle && step === 12) || 
    (isTrustpilot && step === 24) ||
    (isCheckatrade && step === 47);

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
      {/* Status Bar */}
      <div className="h-6 bg-black text-white flex justify-between items-center px-4 text-[10px] font-medium z-20 relative">
        <span>9:41</span>
        <div className="flex gap-1">
          <span>5G</span>
          <span>100%</span>
        </div>
      </div>

      {/* Browser Bar */}
      <div className="bg-gray-100 border-b border-gray-200 p-2 flex items-center gap-2 z-20 relative">
        <div className="flex-1 bg-white rounded-md h-6 px-2 flex items-center text-[10px] text-gray-500 transition-all">
          <span className="mr-1">🔒</span> {getUrl()}
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
            <span className="font-medium text-gray-700">Rate and review</span>
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
              <svg className="w-8 h-8 text-[#00b67a]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L15.39 7.86L23 8.97L17.5 14.33L18.8 21.91L12 18.33L5.2 21.91L6.5 14.33L1 8.97L8.61 7.86L12 1Z" />
              </svg>
              <span className="font-bold text-gray-900 text-lg tracking-tight">Trustpilot</span>
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
            <span className="font-bold text-gray-900 text-sm">best_coffee_co</span>
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
            <span className="font-bold text-base">Best Coffee Co.</span>
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

        {/* --- CHECKATRADE --- */}
        <div className={`transition-opacity duration-500 absolute inset-0 bg-white ${isCheckatrade && step > 37 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Checkatrade Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8" viewBox="0 0 176 169" fill="none">
                <path fill="#040154" d="M94.568 71.818c-2.607 4.12-5.1 8.31-7.524 12.535-2.229-3.43-4.469-6.849-6.732-10.279l-.023-.023c-4.411-6.526-31.27 2.567-28.26 7.367 6.215 9.38 20.092 30.72 20.793 31.791 3.24 4.892 8.593 5.399 19.047 2.878 5.606-1.566 8.156-6.987 9.029-8.99.77-1.726 4.848-10.463 7.065-14.768a324.53 324.53 0 0 1 23.021-38.271 321.655 321.655 0 0 1 6.181-8.53 333.407 333.407 0 0 1 13.612-17c.92-1.07 1.85-2.14 2.78-3.2 5.986-6.814 15.635-16.402 21.907-22.905 2.609-2.717-18.598-4.225-25.571 2.198-6.95 6.688-16.783 16.978-23.182 24.252a336.937 336.937 0 0 0-15.543 19.038c-7.561 9.99-16.599 23.906-16.6 23.907Z" />
                <path fill="#FF3F3F" d="M118.302 117.584c-6.193 16.379-22.379 24.689-39.84 24.689-26.939 0-47.02-19.74-47.02-53.672s19.874-53.672 47.02-53.672c8.776 0 16.129 1.669 22.975 5.398l16.865-20.143c-10.845-6.93-24.47-10.98-39.852-10.98-44.147.01-77.036 29.281-77.036 79.409 0 50.127 33.555 79.385 77.048 79.385 31.821 0 55.049-17.254 63.963-41.609l-24.123-8.805Z" />
              </svg>
              <span className="font-bold italic text-lg text-[#2d2e83]">Checkatrade</span>
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
