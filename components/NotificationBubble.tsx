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

      // --- FACEBOOK (37-43) ---
      { time: 800, next: 38 },
      { time: 200, next: 39 },
      { time: 200, next: 40 },
      { time: 800, next: 41 },
      { time: 1500, next: 42 },
      { time: 500, next: 43 },

      // --- SNAPCHAT (43-49) ---
      { time: 800, next: 44 },
      { time: 200, next: 45 },
      { time: 200, next: 46 },
      { time: 800, next: 47 },
      { time: 1500, next: 48 },
      { time: 500, next: 49 },

      // --- CHECKATRADE (49-61) ---
      { time: 800, next: 50 },
      { time: 200, next: 51 },
      { time: 200, next: 52 },
      { time: 200, next: 53 },
      { time: 200, next: 54 },
      { time: 200, next: 55 },
      { time: 400, next: 56 },
      { time: 400, next: 57 },
      { time: 400, next: 58 },
      { time: 500, next: 59 },
      { time: 2000, next: 60 },
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
  const isFacebook = step >= 37 && step <= 42;
  const isSnapchat = step >= 43 && step <= 48;
  const isCheckatrade = step >= 49 && step <= 60;

  // Show notification at success moments
  const isSuccessStep = 
    step === 12 ||  // Google success
    step === 24 ||  // Trustpilot success
    step === 29 ||  // Instagram following
    step === 35 ||  // TikTok following
    step === 41 ||  // Facebook liked
    step === 47 ||  // Snapchat added
    step === 59;    // Checkatrade success

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
    if (isFacebook) {
      return { title: 'Page Liked!', icon: '/platform-logos/facebook.png', color: 'bg-blue-600' };
    }
    if (isSnapchat) {
      return { title: 'Friend Added!', icon: null, color: 'bg-yellow-400', isSnapchat: true };
    }
    if (isCheckatrade) {
      return { title: 'Review Received!', icon: '/platform-logos/checkatrade.png', color: 'bg-blue-800' };
    }
    return { title: 'Success!', icon: null, color: 'bg-green-500' };
  };

  const notification = getNotificationContent();

  // Snapchat ghost SVG
  const SnapchatIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.449-.165-.57-1.873-.283-2.92-.701-3.147-1.27-.03-.075-.044-.149-.044-.224-.015-.24.164-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-.809-.329-1.224-.72-1.227-1.153-.001-.359.283-.689.735-.838.149-.06.344-.09.509-.09.12 0 .283.015.435.104.389.18.747.301 1.048.301.181 0 .3-.044.374-.09-.007-.18-.024-.345-.037-.51l-.003-.06c-.104-1.629-.229-3.669.3-4.847 1.58-3.551 4.94-3.821 5.928-3.821h.253z"/>
    </svg>
  );

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
          ) : (notification as any).isSnapchat ? (
            <SnapchatIcon />
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
