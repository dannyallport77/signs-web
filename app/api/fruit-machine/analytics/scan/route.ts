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
      scannedAt,
    } = body;

    if (!placeId) {
      return NextResponse.json(
        { error: 'Missing placeId' },
        { status: 400 }
      );
    }

    // Record to NFCTagInteraction (unified system)
    const scan = await nfcTagInteractionService.logRead({
      siteId: placeId,
      businessName: businessName || undefined,
      actionType: 'fruit_machine',
      promotionId: promotionId || undefined,
      tagData: {
        businessId,
        promotionName,
        eventType: 'scan',
        scannedAt,
      },
    });

    return NextResponse.json({ success: true, scan });
  } catch (error) {
    console.error('Error recording scan:', error);
    return NextResponse.json(
      { error: 'Failed to record scan' },
      { status: 500 }
    );
  }
}
