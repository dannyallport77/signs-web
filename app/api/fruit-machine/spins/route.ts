import { NextResponse } from 'next/server';
import { nfcTagInteractionService } from '@/lib/services/nfcTagInteractionService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      businessId,
      placeId,
      promotionId,
      winnerCode,
      prizeType,
      prizeName,
      prizeAmount,
      isWin,
      gameType
    } = body;

    if (!promotionId || !businessId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Record to NFCTagInteraction (unified system)
    const result = await nfcTagInteractionService.logRead({
      siteId: placeId || businessId,
      actionType: gameType || 'fruit_machine',
      promotionId,
      promotionResult: isWin ? 'win' : 'lose',
      prizeType: prizeType || 'gift',
      prizeName: prizeName || undefined,
      prizeValue: prizeAmount ? String(prizeAmount) : undefined,
      tagData: {
        businessId,
        winnerCode: winnerCode || `spin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        gameType,
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error recording spin:', error);
    return NextResponse.json(
      { error: 'Failed to record spin' },
      { status: 500 }
    );
  }
}
