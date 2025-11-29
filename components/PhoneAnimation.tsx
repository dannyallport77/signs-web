'use client';

import { useState, useEffect } from 'react';

export default function PhoneAnimation() {
  const [step, setStep] = useState(0);

  // Animation sequence timing
  useEffect(() => {
    const sequence = [
      { time: 2000, next: 1 }, // 0: Google Loading -> Show Form
      { time: 1000, next: 2 }, // 1: Wait before clicking stars
      { time: 800, next: 3 },  // 2: 1 star
      { time: 200, next: 4 },  // 3: 2 stars
      { time: 200, next: 5 },  // 4: 3 stars
      { time: 200, next: 6 },  // 5: 4 stars
      { time: 200, next: 7 },  // 6: 5 stars
      { time: 1000, next: 8 }, // 7: Wait before typing/submitting
      { time: 500, next: 9 },  // 8: Show "Posting..."
      { time: 2000, next: 10 }, // 9: Show Success
      { time: 2000, next: 11 }, // 10: Transition to Trustpilot
      { time: 2000, next: 12 }, // 11: Trustpilot Loading -> Show Form
      { time: 1000, next: 13 }, // 12: Wait before clicking stars
      { time: 800, next: 14 },  // 13: 1 star
      { time: 200, next: 15 },  // 14: 2 stars
      { time: 200, next: 16 },  // 15: 3 stars
      { time: 200, next: 17 },  // 16: 4 stars
      { time: 200, next: 18 },  // 17: 5 stars
      { time: 1000, next: 19 }, // 18: Wait before submitting
      { time: 500, next: 20 },  // 19: Show "Posting..."
      { time: 2000, next: 0 },  // 20: Show Success -> Loop back to Google
    ];

    const currentStepConfig = sequence[step] || sequence[0];
    
    // Handle the loop specifically if we are at the end of defined steps
    if (step >= sequence.length) {
        setStep(0);
        return;
    }

    const timer = setTimeout(() => {
      setStep(currentStepConfig.next);
    }, currentStepConfig.time);

    return () => clearTimeout(timer);
  }, [step]);

  const isGoogle = step <= 10;
  const isTrustpilot = step > 10;

  // Helper to determine star state
  const getStarCount = () => {
    if (step >= 7 && step <= 10) return 5;
    if (step >= 18) return 5;
    
    if (step === 2 || step === 13) return 1;
    if (step === 3 || step === 14) return 2;
    if (step === 4 || step === 15) return 3;
    if (step === 5 || step === 16) return 4;
    if (step === 6 || step === 17) return 5;
    
    return 0;
  };

  const starCount = getStarCount();
  const isSuccess = step === 9 || step === 10 || step === 20;
  const isPosting = step === 8 || step === 19;

  return (
    <div className="w-full h-full bg-white relative overflow-hidden font-sans">
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
        <div className="flex-1 bg-white rounded-md h-6 px-2 flex items-center text-[10px] text-gray-500">
          <span className="mr-1">🔒</span> {isGoogle ? 'google.com' : 'trustpilot.com'}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 h-full relative">
        
        {/* Transition Overlay */}
        <div 
          className={`absolute inset-0 bg-white z-10 transition-opacity duration-500 flex items-center justify-center
            ${(step === 0 || step === 11) ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>

        {/* Google Interface */}
        <div 
          className={`transition-opacity duration-500 absolute inset-0 p-4 pt-12
            ${isGoogle && step > 0 ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              B
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Best Coffee Co.</h2>
              <p className="text-xs text-gray-500">Coffee shop · Open now</p>
            </div>
          </div>

          <div className="border-t border-b border-gray-100 py-6 text-center">
            <p className="text-gray-900 font-medium mb-4">Rate and review</p>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg 
                  key={i}
                  className={`w-8 h-8 transition-all duration-200 ${i <= starCount ? 'text-yellow-400 scale-110' : 'text-gray-200'}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 text-left mb-4 h-24 border border-gray-200">
              <p className="text-sm text-gray-400">Share details of your own experience at this place...</p>
            </div>

            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 text-blue-600 font-medium text-sm">Cancel</button>
              <button 
                className={`px-6 py-2 rounded-full font-medium text-sm transition-all duration-300
                  ${isSuccess 
                    ? 'bg-green-600 text-white' 
                    : starCount > 0 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-400'}
                `}
              >
                {isSuccess ? 'Posted' : isPosting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>

        {/* Trustpilot Interface */}
        <div 
          className={`transition-opacity duration-500 absolute inset-0 p-4 pt-12
            ${isTrustpilot && step > 11 ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">★</span>
              <span className="font-bold text-gray-900">Trustpilot</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-bold text-gray-900 text-lg mb-2">Rate your recent experience</h2>
            <div className="flex items-center gap-2 mb-4">
               <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
               <span className="font-medium text-sm">Best Coffee Co.</span>
            </div>

            <div className="flex justify-center gap-1 mb-6 bg-gray-50 p-4 rounded-lg">
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i}
                  className={`w-8 h-8 transition-all duration-200 flex items-center justify-center rounded
                    ${i <= starCount ? 'bg-green-500 text-white scale-110' : 'bg-gray-200 text-gray-300'}
                  `}
                >
                  <span className="text-lg">★</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="h-10 border border-gray-200 rounded px-3 flex items-center">
                <span className="text-sm text-gray-400">Give your review a title</span>
              </div>
              <div className="h-20 border border-gray-200 rounded px-3 py-2">
                <span className="text-sm text-gray-400">Tell us about your experience</span>
              </div>
              
              <button 
                className={`w-full py-3 rounded font-bold text-sm transition-all duration-300 mt-2
                  ${isSuccess 
                    ? 'bg-green-600 text-white' 
                    : starCount > 0 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-100 text-blue-300'}
                `}
              >
                {isSuccess ? 'Review Submitted' : isPosting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>

        {/* Success Overlay */}
        <div 
          className={`absolute inset-0 bg-white/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center transition-opacity duration-500
            ${isSuccess ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Thanks for sharing!</h3>
          <p className="text-gray-500 text-sm mt-2">Your review helps others.</p>
        </div>

      </div>
    </div>
  );
}
