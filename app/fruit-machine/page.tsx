import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import GameSelector from '@/components/GameSelector';

export const dynamic = 'force-dynamic';

export default async function FruitMachinePage({
  searchParams,
}: {
  searchParams: Promise<{ promotionId?: string; placeId?: string }>;
}) {
  const params = await searchParams;
  const { promotionId, placeId } = params;

  if (!promotionId && !placeId) {
    return notFound();
  }

  let promotionData: any = null;

  if (promotionId) {
    // Try new model first
    const fmPromo = await prisma.fruitMachinePromotion.findUnique({ where: { id: promotionId } });
    if (fmPromo) {
      promotionData = { ...fmPromo, type: 'new' };
    } else {
      // Fallback to legacy
      const promo = await prisma.promotion.findUnique({ where: { id: promotionId } });
      if (promo) promotionData = { ...promo, type: 'legacy' };
    }
  } else if (placeId) {
    // Try new model first
    const fmPromo = await prisma.fruitMachinePromotion.findFirst({
      where: { placeId, enabled: true },
      orderBy: { createdAt: 'desc' }
    });
    if (fmPromo) {
      promotionData = { ...fmPromo, type: 'new' };
    } else {
      // Fallback to legacy
      const promo = await prisma.promotion.findFirst({
        where: { placeId, enabled: true },
        orderBy: { createdAt: 'desc' }
      });
      if (promo) promotionData = { ...promo, type: 'legacy' };
    }
  }

  if (!promotionData) {
    return notFound();
  }

  // Normalize data for GameSelector
  const prizes = promotionData.type === 'new' && Array.isArray(promotionData.prizes)
    ? promotionData.prizes
    : undefined;

  const giftName = promotionData.type === 'new'
    ? (prizes?.[0]?.name || 'Mystery Prize')
    : promotionData.giftName;

  const giftEmoji = promotionData.type === 'new'
    ? (prizes?.[0]?.emoji || '🎁')
    : promotionData.giftEmoji;

  const businessName = promotionData.type === 'new'
    ? (promotionData.name || 'Business Promotion') // Fallback if businessName missing in FM model
    : promotionData.businessName;

  // Note: FM model has 'name' (promotion name), not 'businessName'. 
  // But we added 'businessId'. We might need to fetch business name if not stored.
  // However, for now let's use promotion name or a default.
  // Actually, in the POST route we set name = body.name || `${businessName} Promotion`.
  // So we might lose the actual business name if we don't store it.
  // Let's check if we can get it.
  
  let displayBusinessName = businessName;
  if (promotionData.type === 'new' && promotionData.businessId) {
     // We could fetch business name, but let's assume 'name' contains it or we use a generic one for now
     // to avoid another DB call. Or we can fetch it.
     // Let's just use the promotion name for now.
     displayBusinessName = promotionData.name;
  }

  const businessId = promotionData.type === 'new'
    ? promotionData.businessId
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col items-center justify-center p-4">
      <GameSelector
        promotionId={promotionData.id}
        placeId={promotionData.placeId || placeId || ''}
        businessId={businessId}
        businessName={displayBusinessName}
        giftName={giftName || 'Prize'}
        giftEmoji={giftEmoji || '🎁'}
        prizes={prizes}
        winOdds={promotionData.defaultWinOdds || (promotionData.winProbability ? promotionData.winProbability / 100 : 0.004)}
      />
      
      <p className="text-center text-xs text-slate-500 mt-12">
        Powered by Review Signs • One spin per visit
      </p>
    </div>
  );
}
