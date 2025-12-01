import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      placeId,
      businessName,
      prizeType,
      giftName,
      giftEmoji,
      giftValue,
      defaultWinOdds,
      enabled,
    } = body;

    if (!placeId || !businessName) {
      return NextResponse.json(
        { error: 'Missing required fields: placeId and businessName' },
        { status: 400 }
      );
    }

    const promotion = await prisma.promotion.create({
      data: {
        placeId,
        businessName,
        prizeType: prizeType || 'gift',
        giftName,
        giftEmoji,
        giftValue,
        defaultWinOdds: defaultWinOdds || 0.004,
        enabled: enabled !== undefined ? enabled : true,
      },
    });

    return NextResponse.json(promotion);
  } catch (error) {
    console.error('Error creating promotion:', error);
    return NextResponse.json(
      { error: 'Failed to create promotion' },
      { status: 500 }
    );
  }
}
