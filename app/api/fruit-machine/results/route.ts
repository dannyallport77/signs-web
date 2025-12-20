import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { nfcTagInteractionService } from '@/lib/services/nfcTagInteractionService';

export const dynamic = 'force-dynamic';

interface FruitMachineResultRequest {
  businessId: string;
  placeId?: string;
  promotionId?: string;
  winnerCode: string;
  prizeType: string;
  prizeName: string;
  prizeValue?: string | number;
  timestamp: string;
  isWin: boolean;
}

/**
 * POST /api/fruit-machine/results
 * Records a fruit machine result (win or loss)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data: FruitMachineResultRequest = await request.json();

    // Validate required fields
    if (!data.businessId || !data.winnerCode || !data.prizeType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Record to unified NFCTagInteraction
    const result = await nfcTagInteractionService.logRead({
      siteId: data.placeId || data.businessId,
      actionType: 'fruit_machine',
      promotionId: data.promotionId,
      promotionResult: data.isWin ? 'win' : 'lose',
      prizeType: data.prizeType,
      prizeName: data.prizeName,
      prizeValue: data.prizeValue ? String(data.prizeValue) : undefined,
      metadata: {
        businessId: data.businessId,
        winnerCode: data.winnerCode,
        originalTimestamp: data.timestamp,
      },
    });

    return NextResponse.json({
      success: true,
      result,
      message: 'Result recorded successfully',
    });
  } catch (error) {
    console.error('Error recording fruit machine result:', error);
    return NextResponse.json(
      { error: 'Failed to record result' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/fruit-machine/results
 * Fetches results for a business with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');
    const placeId = searchParams.get('placeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const siteId = placeId || businessId;
    if (!siteId) {
      return NextResponse.json(
        { error: 'Missing businessId or placeId' },
        { status: 400 }
      );
    }

    // Query unified NFCTagInteraction for fruit machine results
    const { interactions } = await nfcTagInteractionService.query({
      siteId,
      actionType: 'fruit_machine',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
    });

    // Calculate statistics
    const totalResults = interactions.length;
    const wins = interactions.filter(i => i.promotionResult === 'win').length;
    const losses = interactions.filter(i => i.promotionResult === 'loss').length;
    const winRate = totalResults > 0 ? (wins / totalResults) * 100 : 0;

    // Group by prize
    const prizeDistribution = interactions.reduce((acc: Record<string, number>, i) => {
      const prizeKey = i.prizeName || 'Unknown';
      acc[prizeKey] = (acc[prizeKey] || 0) + 1;
      return acc;
    }, {});

    // Map to expected format
    const results = interactions.map(i => ({
      id: i.id,
      businessId: i.siteId,
      placeId: i.siteId,
      promotionId: i.promotionId,
      prizeType: i.prizeType,
      prizeName: i.prizeName,
      prizeValue: i.prizeValue,
      isWin: i.promotionResult === 'win',
      timestamp: i.timestamp,
    }));

    return NextResponse.json({
      success: true,
      results,
      statistics: {
        totalResults,
        wins,
        losses,
        winRate: parseFloat(winRate.toFixed(2)),
        prizeDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching fruit machine results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
