import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      placeId,
      businessId,
      businessName,
      promotionId,
      promotionName,
      won,
      resultEmoji,
      gameType,
      machineType,
      prizeType,
      prizeName,
      prizeAmount,
      spinStartedAt,
      spinCompletedAt,
    } = body;

    if (!placeId) {
      return NextResponse.json(
        { error: 'Missing placeId' },
        { status: 400 }
      );
    }

    // Record the result event
    const result = await prisma.fruitMachineAnalytics.create({
      data: {
        placeId,
        businessId: businessId || null,
        businessName: businessName || null,
        promotionId: promotionId || null,
        promotionName: promotionName || null,
        eventType: won ? 'win' : 'loss',
        gameType: gameType || null,
        machineType: machineType || null,
        won: won || false,
        prizeType: prizeType || null,
        prizeName: prizeName || null,
        prizeAmount: prizeAmount ? parseFloat(String(prizeAmount)) : null,
        timestamp: spinCompletedAt ? new Date(spinCompletedAt) : new Date(),
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error recording result:', error);
    return NextResponse.json(
      { error: 'Failed to record result' },
      { status: 500 }
    );
  }
}
