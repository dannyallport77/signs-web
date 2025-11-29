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

  // Trustpilot Logic
  const tpStars = (step >= 19 && step <= 24) ? 5 : (step >= 15 ? step - 14 : 0);
  const tpTitle = step >= 20 ? "Amazing!" : "";
  const tpBody = step === 21 ? "Highly rec" : step >= 22 ? "Highly recommended service." : "";
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
  const catSubmitted = step >= 47;

  // Global Success State (for overlay)
  const showSuccessOverlay = 
    (isGoogle && step === 12) || 
    (isTrustpilot && step === 24) ||
    (isCheckatrade && step === 47);

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
        <div className={`transition-opacity duration-500 absolute inset-0 p-4 pt-8 ${isGoogle && step > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">B</div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Best Coffee Co.</h2>
              <p className="text-[10px] text-gray-500">Coffee shop · Open now</p>
            </div>
          </div>
          <div className="border-t border-b border-gray-100 py-4 text-center">
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className={`w-8 h-8 transition-all duration-200 ${i <= googleStars ? 'text-yellow-400 scale-110' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-left mb-4 h-20 border border-gray-200 text-xs text-gray-800">
              {googleText || <span className="text-gray-400">Share details of your own experience...</span>}
            </div>
            <div className="flex justify-end gap-2">
              <button className={`px-4 py-1.5 rounded-full font-medium text-xs transition-all ${googlePosted ? 'bg-green-600 text-white' : googleStars > 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {googlePosted ? 'Posted' : 'Post'}
              </button>
            </div>
          </div>
        </div>

        {/* --- TRUSTPILOT --- */}
        <div className={`transition-opacity duration-500 absolute inset-0 p-4 pt-8 ${isTrustpilot && step > 13 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-green-500 text-xl">★</span>
            <span className="font-bold text-gray-900 text-sm">Trustpilot</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
            <h2 className="font-bold text-gray-900 text-sm mb-2">Rate your experience</h2>
            <div className="flex justify-center gap-1 mb-4 bg-gray-50 p-2 rounded-lg">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`w-6 h-6 transition-all duration-200 flex items-center justify-center rounded ${i <= tpStars ? 'bg-green-500 text-white scale-110' : 'bg-gray-200 text-gray-300'}`}>
                  <span className="text-xs">★</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-8 border border-gray-200 rounded px-2 flex items-center text-xs text-gray-800">
                {tpTitle || <span className="text-gray-400">Title</span>}
              </div>
              <div className="h-16 border border-gray-200 rounded px-2 py-1 text-xs text-gray-800">
                {tpBody || <span className="text-gray-400">Your review...</span>}
              </div>
              <button className={`w-full py-2 rounded font-bold text-xs transition-all mt-1 ${tpSubmitted ? 'bg-green-600 text-white' : tpStars > 0 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-300'}`}>
                {tpSubmitted ? 'Sent!' : 'Submit'}
              </button>
            </div>
          </div>
        </div>

        {/* --- INSTAGRAM --- */}
        <div className={`transition-opacity duration-500 absolute inset-0 bg-white ${isInstagram && step > 25 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="p-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  <div className="w-full h-full rounded-full bg-gray-200"></div>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-gray-900">best_coffee_co</h2>
                <p className="text-xs text-gray-500">Coffee Shop</p>
                <div className="flex gap-4 mt-2 text-xs">
                  <div><b>1.2k</b> posts</div>
                  <div><b>15k</b> followers</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                className={`flex-1 py-1.5 rounded-lg font-semibold text-sm transition-all duration-200 
                  ${instaFollowing ? 'bg-gray-100 text-black border border-gray-200' : 'bg-blue-500 text-white'}
                `}
              >
                {instaLoading ? '...' : instaFollowing ? 'Following' : 'Follow'}
              </button>
              <button className="flex-1 py-1.5 rounded-lg font-semibold text-sm bg-gray-100 text-black border border-gray-200">
                Message
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 mt-6">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="aspect-square bg-gray-100"></div>
               ))}
            </div>
          </div>
        </div>

        {/* --- TIKTOK --- */}
        <div className={`transition-opacity duration-500 absolute inset-0 bg-black text-white ${isTikTok && step > 31 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="p-4 pt-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-800 mx-auto mb-3 border-2 border-white/20"></div>
            <h2 className="font-bold text-lg">@bestcoffee</h2>
            <div className="flex justify-center gap-4 text-xs text-gray-300 mb-6">
              <div className="text-center"><b className="text-white block text-sm">124</b> Following</div>
              <div className="text-center"><b className="text-white block text-sm">85.2K</b> Followers</div>
              <div className="text-center"><b className="text-white block text-sm">1.2M</b> Likes</div>
            </div>
            <div className="flex justify-center gap-2 mb-8">
              <button 
                className={`px-12 py-2 rounded-sm font-semibold text-sm transition-all duration-200
                  ${tiktokFollowing ? 'bg-gray-800 text-white border border-gray-700' : 'bg-[#FE2C55] text-white border-none'}
                `}
              >
                {tiktokLoading ? '...' : tiktokFollowing ? 'Following' : 'Follow'}
              </button>
              <div className="w-9 h-9 bg-gray-800 rounded-sm flex items-center justify-center">▼</div>
            </div>
            <div className="grid grid-cols-3 gap-1">
               {[1,2,3].map(i => (
                 <div key={i} className="aspect-[3/4] bg-gray-900 border border-gray-800"></div>
               ))}
            </div>
          </div>
        </div>

        {/* --- CHECKATRADE --- */}
        <div className={`transition-opacity duration-500 absolute inset-0 bg-white ${isCheckatrade && step > 37 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="bg-[#2d2e83] text-white p-3 pt-8">
            <h2 className="font-bold italic">Checkatrade</h2>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-gray-900 mb-4">Leave a review</h3>
            <div className="space-y-3 mb-4">
              {['Reliability', 'Tidiness', 'Courtesy', 'Workmanship'].map((label, idx) => (
                <div key={label} className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">{label}</span>
                  <div className="flex gap-1">
                    <span className="font-bold text-[#2d2e83]">{catScore >= 10 ? '10' : catScore > 0 ? catScore : '-'}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 p-2 rounded border border-gray-200 h-16 mb-3 text-xs text-gray-800">
               {catText || <span className="text-gray-400">Brief description of work...</span>}
            </div>
            <button className={`w-full py-2 rounded font-bold text-xs transition-all ${catSubmitted ? 'bg-green-600 text-white' : 'bg-[#2d2e83] text-white'}`}>
              {catSubmitted ? 'Review Published' : 'Submit Review'}
            </button>
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
