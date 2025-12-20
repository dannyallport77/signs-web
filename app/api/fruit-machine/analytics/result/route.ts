import { NextResponse } from 'next/server';
import { nfcTagInteractionService } from '@/lib/services/nfcTagInteractionService';

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

    // Record to NFCTagInteraction (unified system)
    const result = await nfcTagInteractionService.logRead({
      siteId: placeId,
      businessName: businessName || undefined,
      actionType: gameType || 'fruit_machine',
      promotionId: promotionId || undefined,
      promotionResult: won ? 'win' : 'lose',
      prizeType: prizeType || undefined,
      prizeName: prizeName || undefined,
      prizeValue: prizeAmount ? String(prizeAmount) : undefined,
      tagData: {
        businessId,
        promotionName,
        resultEmoji,
        gameType,
        machineType,
        spinStartedAt,
        spinCompletedAt,
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
