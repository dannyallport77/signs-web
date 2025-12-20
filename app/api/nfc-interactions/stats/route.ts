import { NextResponse } from 'next/server';
import { nfcTagInteractionService } from '@/lib/services/nfcTagInteractionService';

/**
 * GET /api/nfc-interactions/stats
 * Get statistics for NFC tag interactions
 * 
 * Query params:
 * - siteId: (optional) filter by site/place ID - if omitted, returns global stats
 * - startDate: filter from date (ISO string)
 * - endDate: filter to date (ISO string)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId') || undefined;

    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : undefined;
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : undefined;

    const stats = await nfcTagInteractionService.getStats(siteId, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching NFC interaction stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
