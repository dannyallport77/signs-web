'use client';

import { useState, useRef, useEffect } from 'react';

interface WheelSegment {
  id: number;
  label: string;
  color: string;
  probability: number;
}

const WHEEL_SEGMENTS: WheelSegment[] = [
  { id: 0, label: '🎁 Prize!', color: '#FF6B6B', probability: 0.15 },
  { id: 1, label: 'Try Again', color: '#4ECDC4', probability: 0.20 },
  { id: 2, label: '💰 Bonus!', color: '#FFE66D', probability: 0.10 },
  { id: 3, label: 'Try Again', color: '#95E1D3', probability: 0.20 },
  { id: 4, label: '🏆 Winner!', color: '#F38181', probability: 0.15 },
  { id: 5, label: 'Try Again', color: '#AA96DA', probability: 0.20 },
];

export default function WheelOfFortune({
  giftName,
  businessName,
  promotionId,
}: {
  giftName?: string;
  businessName: string;
  promotionId: string;
}) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<WheelSegment | null>(null);
  const [spins, setSpins] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw the wheel on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 150;
    const sliceAngle = (Math.PI * 2) / WHEEL_SEGMENTS.length;

    // Clear canvas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw wheel segments
    WHEEL_SEGMENTS.forEach((segment, index) => {
      const startAngle = index * sliceAngle - rotation;
      const endAngle = startAngle + sliceAngle;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw text
      const textAngle = startAngle + sliceAngle / 2;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(textAngle);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(segment.label, radius - 20, 5);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPIN', centerX, centerY);
  }, [rotation]);

  const getResultSegment = (): WheelSegment => {
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const segment of WHEEL_SEGMENTS) {
      cumulativeProbability += segment.probability;
      if (random <= cumulativeProbability) {
        return segment;
      }
    }

    return WHEEL_SEGMENTS[0];
  };

  const spin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);
    setSpins(spins + 1);

    const resultSegment = getResultSegment();
    const segmentAngle = (Math.PI * 2) / WHEEL_SEGMENTS.length;
    const targetAngle = resultSegment.id * segmentAngle;

    // Calculate total rotation (multiple spins + target position)
    const totalRotation = rotation + Math.PI * 2 * (3 + Math.random()) + targetAngle;

    // Animate the spin
    const startTime = Date.now();
    const duration = 3000; // 3 seconds

    const animateSpin = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = rotation + (totalRotation - rotation) * easeOut;

      setRotation(currentRotation % (Math.PI * 2));

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        setRotation(totalRotation % (Math.PI * 2));
        setResult(resultSegment);
        setIsSpinning(false);
      }
    };

    requestAnimationFrame(animateSpin);
  };

  const resetWheel = () => {
    setResult(null);
    setRotation(0);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* Wheel Container */}
      <div className="relative">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 flex flex-col items-center">
          <div className="w-0 h-0 border-l-6 border-r-6 border-t-12 border-l-transparent border-r-transparent border-t-yellow-400"></div>
        </div>

        {/* Canvas Wheel */}
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="rounded-full shadow-2xl border-8 border-yellow-500 bg-slate-900"
        />
      </div>

      {/* Spin Button */}
      <button
        onClick={spin}
        disabled={isSpinning}
        className={`px-8 py-4 rounded-xl font-bold text-xl uppercase tracking-wider shadow-lg transform transition ${
          isSpinning
            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
            : 'bg-red-500 hover:bg-red-600 text-white active:scale-95 border-b-4 border-red-700 hover:border-red-800'
        }`}
      >
        {isSpinning ? '🔄 Spinning...' : '🎰 SPIN!'}
      </button>

      {/* Result Display */}
      {result && (
        <div className="text-center space-y-4 animate-bounce">
          <div className="text-6xl">{result.label.split(' ')[0]}</div>
          <div className="text-2xl font-bold text-yellow-400">
            {result.label.includes('Prize') || result.label.includes('Winner')
              ? `You won a ${giftName || 'prize'}!`
              : result.label.includes('Bonus')
                ? 'Double your next spin!'
                : 'Better luck next time!'}
          </div>
          <p className="text-sm text-slate-300">
            {result.label.includes('Prize') || result.label.includes('Winner')
              ? 'Show this to staff to claim your prize!'
              : 'Spin again for another chance!'}
          </p>
          <button
            onClick={resetWheel}
            className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
          >
            Spin Again
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="text-sm text-slate-400 text-center">
        <p>Total Spins: <span className="text-yellow-400 font-bold">{spins}</span></p>
        <p className="mt-1 text-xs">Good luck! 🍀</p>
      </div>
    </div>
  );
}
