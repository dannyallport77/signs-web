import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      placeId,
      businessName,
      businessId, // Added for new model
      prizeType,
      giftName,
      giftEmoji,
      giftValue,
      defaultWinOdds,
      enabled,
      prizes, // Added for new model
      monthlyBudget, // Added for new model
      winProbability, // Added for new model
    } = body;

    if (!placeId && !businessId) {
      return NextResponse.json(
        { error: 'Missing required fields: placeId or businessId' },
        { status: 400 }
      );
    }

    // New Flow: Multiple Prizes
    if (prizes && Array.isArray(prizes)) {
      const promotion = await prisma.fruitMachinePromotion.create({
        data: {
          businessId: businessId || placeId, // Fallback
          placeId: placeId,
          name: body.name || `${businessName} Promotion`,
          prizes: prizes,
          monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : null,
          winProbability: winProbability || 20,
          enabled: enabled !== undefined ? enabled : true,
        },
      });
      return NextResponse.json(promotion);
    }

    // Legacy Flow: Single Gift
    const promotion = await prisma.promotion.create({
      data: {
        placeId: placeId!,
        businessName: businessName || 'Unknown Business',
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
