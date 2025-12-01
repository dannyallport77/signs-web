import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import WheelOfFortune from '@/components/WheelOfFortune';

export default async function FruitMachinePage({
  searchParams,
}: {
  searchParams: { promotionId?: string; placeId?: string };
}) {
  const { promotionId, placeId } = searchParams;

  if (!promotionId) {
    return notFound();
  }

  const promotion = await prisma.promotion.findUnique({
    where: { id: promotionId },
  });

  if (!promotion) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-800 rounded-2xl p-8 shadow-2xl border-4 border-yellow-500">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-4xl font-bold text-yellow-400">
            🎰 Wheel of Fortune
          </h1>
          <p className="text-lg text-slate-300">
            {promotion.businessName}
          </p>
          <p className="text-sm text-slate-400">
            Spin to win {promotion.giftName || 'amazing prizes'}!
          </p>
        </div>

        <WheelOfFortune
          giftName={promotion.giftName || 'Prize'}
          businessName={promotion.businessName}
          promotionId={promotionId}
        />
        
        <p className="text-center text-xs text-slate-500 mt-12">
          Powered by Review Signs • One spin per visit
        </p>
      </div>
    </div>
  );
}
