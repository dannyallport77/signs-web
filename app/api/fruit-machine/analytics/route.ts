import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Build filter
    const where: any = { placeId };
    
    if (promotionId) {
      where.promotionId = promotionId;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    // Get analytics
    const events = await prisma.fruitMachineAnalytics.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    // Calculate stats
    const stats = {
      totalScans: events.filter(e => e.eventType === 'scan').length,
      totalWins: events.filter(e => e.eventType === 'win').length,
      totalLosses: events.filter(e => e.eventType === 'loss').length,
      winRate: 0,
      cashWins: events.filter(e => e.eventType === 'win' && e.prizeType === 'cash').length,
      totalCashWon: events
        .filter(e => e.eventType === 'win' && e.prizeType === 'cash')
        .reduce((sum, e) => sum + (e.prizeAmount || 0), 0),
      gameTypeBreakdown: {} as Record<string, number>,
      machineTypeBreakdown: {} as Record<string, number>,
    };

    // Calculate win rate
    if (stats.totalWins > 0 || stats.totalLosses > 0) {
      stats.winRate = stats.totalWins / (stats.totalWins + stats.totalLosses);
    }

    // Game type breakdown
    events.forEach(e => {
      if (e.gameType) {
        stats.gameTypeBreakdown[e.gameType] = (stats.gameTypeBreakdown[e.gameType] || 0) + 1;
      }
    });

    // Machine type breakdown
    events.forEach(e => {
      if (e.machineType) {
        stats.machineTypeBreakdown[e.machineType] = (stats.machineTypeBreakdown[e.machineType] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      stats,
      events: events.slice(0, 100), // Return last 100 events
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
