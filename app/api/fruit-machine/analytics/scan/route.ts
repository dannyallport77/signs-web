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
      scannedAt,
    } = body;

    if (!placeId) {
      return NextResponse.json(
        { error: 'Missing placeId' },
        { status: 400 }
      );
    }

    // Record the scan event
    const scan = await prisma.fruitMachineAnalytics.create({
      data: {
        placeId,
        businessId: businessId || null,
        businessName: businessName || null,
        promotionId: promotionId || null,
        promotionName: promotionName || null,
        eventType: 'scan',
        timestamp: scannedAt ? new Date(scannedAt) : new Date(),
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
