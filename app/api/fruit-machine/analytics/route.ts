import { NextResponse } from 'next/server';
import { nfcTagInteractionService } from '@/lib/services/nfcTagInteractionService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');
    const promotionId = searchParams.get('promotionId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!placeId) {
      return NextResponse.json(
        { error: 'Missing placeId' },
        { status: 400 }
      );
    }

    // Get stats from unified NFCTagInteraction system
    const stats = await nfcTagInteractionService.getStats(
      placeId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    // Get recent events
    const { interactions } = await nfcTagInteractionService.query({
      siteId: placeId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: 100,
    });

    // Filter for fruit machine related events
    const fruitMachineEvents = interactions.filter(i => 
      i.actionType?.includes('fruit_machine') || i.promotionResult
    );

    // Build response in expected format
    const response = {
      success: true,
      stats: {
        totalScans: stats.actionBreakdown['fruit_machine'] || 0,
        totalWins: stats.promotionResults.wins,
        totalLosses: stats.promotionResults.losses,
        winRate: stats.promotionResults.winRate / 100, // Convert from percentage
        cashWins: fruitMachineEvents.filter(e => e.promotionResult === 'win' && e.prizeType === 'cash').length,
        totalCashWon: fruitMachineEvents
          .filter(e => e.promotionResult === 'win' && e.prizeType === 'cash')
          .reduce((sum, e) => sum + (parseFloat(e.prizeValue || '0') || 0), 0),
        gameTypeBreakdown: stats.actionBreakdown,
        machineTypeBreakdown: {},
      },
      events: fruitMachineEvents.map(e => ({
        id: e.id,
        placeId: e.siteId,
        businessName: e.businessName,
        eventType: e.promotionResult ? (e.promotionResult === 'win' ? 'win' : 'loss') : 'scan',
        won: e.promotionResult === 'win',
        prizeType: e.prizeType,
        prizeName: e.prizeName,
        prizeAmount: e.prizeValue ? parseFloat(e.prizeValue) : null,
        timestamp: e.timestamp,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
