import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');

    if (!placeId) {
      return NextResponse.json(
        { error: 'Missing required parameter: placeId' },
        { status: 400 }
      );
    }

    const [legacyPromotions, newPromotions] = await Promise.all([
      prisma.promotion.findMany({
        where: { placeId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fruitMachinePromotion.findMany({
        where: { placeId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Combine and sort
    const allPromotions = [...newPromotions, ...legacyPromotions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(allPromotions);
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    );
  }
}
