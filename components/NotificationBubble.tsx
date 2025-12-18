'use client';

import { useState, useEffect } from 'react';

export default function NotificationBubble() {
  const [step, setStep] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  // Sync with PhoneAnimation timing
  useEffect(() => {
    const sequence = [
      // --- GOOGLE (0-12) ---
      { time: 800, next: 1 },
      { time: 200, next: 2 },
      { time: 150, next: 3 },
      { time: 150, next: 4 },
      { time: 150, next: 5 },
      { time: 150, next: 6 },
      { time: 150, next: 7 },
      { time: 500, next: 8 },
      { time: 300, next: 9 },
      { time: 300, next: 10 },
      { time: 500, next: 11 },
      { time: 500, next: 12 },
      { time: 2000, next: 13 },

      // --- TRUSTPILOT (13-25) ---
      { time: 800, next: 14 },
      { time: 200, next: 15 },
      { time: 150, next: 16 },
      { time: 150, next: 17 },
      { time: 150, next: 18 },
      { time: 150, next: 19 },
      { time: 150, next: 20 },
      { time: 400, next: 21 },
      { time: 400, next: 22 },
      { time: 400, next: 23 },
      { time: 500, next: 24 },
      { time: 2000, next: 25 },

      // --- INSTAGRAM (25-31) ---
      { time: 800, next: 26 },
      { time: 200, next: 27 },
      { time: 200, next: 28 },
      { time: 800, next: 29 },
      { time: 1500, next: 30 },
      { time: 500, next: 31 },

      // --- TIKTOK (31-37) ---
      { time: 800, next: 32 },
      { time: 200, next: 33 },
      { time: 200, next: 34 },
      { time: 800, next: 35 },
      { time: 1500, next: 36 },
      { time: 500, next: 37 },

      // --- CHECKATRADE (37-49) ---
      { time: 800, next: 38 },
      { time: 200, next: 39 },
      { time: 200, next: 40 },
      { time: 200, next: 41 },
      { time: 200, next: 42 },
      { time: 200, next: 43 },
      { time: 400, next: 44 },
      { time: 400, next: 45 },
      { time: 400, next: 46 },
      { time: 500, next: 47 },
      { time: 2000, next: 48 },
      { time: 100, next: 0 },
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

  // Determine current platform and success state
  const isGoogle = step >= 0 && step <= 12;
  const isTrustpilot = step >= 13 && step <= 24;
  const isInstagram = step >= 25 && step <= 30;
  const isTikTok = step >= 31 && step <= 36;
  const isCheckatrade = step >= 37 && step <= 48;

  // Show notification at success moments
  const isSuccessStep = 
    step === 12 ||  // Google success
    step === 24 ||  // Trustpilot success
    step === 29 ||  // Instagram following
    step === 35 ||  // TikTok following
    step === 47;    // Checkatrade success

  // Trigger notification animation
  useEffect(() => {
    if (isSuccessStep) {
      setShowNotification(true);
      const hideTimer = setTimeout(() => {
        setShowNotification(false);
      }, 1800);
      return () => clearTimeout(hideTimer);
    }
  }, [isSuccessStep, step]);

  // Get notification content based on platform
  const getNotificationContent = () => {
    if (isGoogle) {
      return { title: 'Review Received!', icon: '/platform-logos/google.png', color: 'bg-blue-500' };
    }
    if (isTrustpilot) {
      return { title: 'Review Received!', icon: '/platform-logos/trustpilot.png', color: 'bg-green-500' };
    }
    if (isInstagram) {
      return { title: 'New Follower!', icon: '/platform-logos/instagram.png', color: 'bg-gradient-to-r from-purple-500 to-pink-500' };
    }
    if (isTikTok) {
      return { title: 'Message Sent!', icon: '/platform-logos/tiktok.png', color: 'bg-black' };
    }
    if (isCheckatrade) {
      return { title: 'Review Received!', icon: '/platform-logos/checkatrade.png', color: 'bg-blue-800' };
    }
    return { title: 'Success!', icon: null, color: 'bg-green-500' };
  };

  const notification = getNotificationContent();

  return (
    <div 
      className={`bg-white backdrop-blur-md border border-gray-100 p-4 rounded-2xl shadow-2xl hidden lg:block z-50 transition-all duration-500 ${
        showNotification 
          ? 'opacity-100 translate-x-0 scale-100' 
          : 'opacity-0 translate-x-8 scale-95 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`${notification.color} rounded-full p-2 flex items-center justify-center`}>
          {notification.icon ? (
            <img src={notification.icon} alt="" className="w-6 h-6 object-contain" />
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-gray-900 font-bold">{notification.title}</p>
          <p className="text-gray-500 text-xs">Just now</p>
        </div>
      </div>
    </div>
  );
}
