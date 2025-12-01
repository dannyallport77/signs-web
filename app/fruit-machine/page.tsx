import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

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
      <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 shadow-2xl border-4 border-yellow-500">
        <h1 className="text-3xl font-bold text-center text-yellow-400 mb-2">
          🎰 Fruit Machine
        </h1>
        <p className="text-center text-slate-300 mb-8">
          {promotion.businessName}
        </p>

        <div className="bg-slate-900 p-6 rounded-xl border-2 border-yellow-600 mb-8">
          <div className="flex justify-center gap-4 text-5xl mb-4">
            <span>❓</span>
            <span>❓</span>
            <span>❓</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xl mb-4">
            Win a <span className="font-bold text-yellow-400">{promotion.giftName}</span>!
          </p>
          
          <button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg transform transition active:scale-95 border-b-4 border-red-700">
            SPIN TO WIN!
          </button>
        </div>
        
        <p className="text-center text-xs text-slate-500 mt-8">
          Powered by Review Signs
        </p>
      </div>
    </div>
  );
}
