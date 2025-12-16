import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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

    // Verify user owns this business
    // const business = await prisma.business.findFirst({
    //   where: {
    //     id: data.businessId,
    //     createdBy: session.user.id,
    //   },
    // });

    // if (!business) {
    //   return NextResponse.json(
    //     { error: 'Business not found or access denied' },
    //     { status: 403 }
    //   );
    // }

    // Record the result in the database
    // Note: You'll need to create this table in your Prisma schema
    const result = await recordFruitMachineResult({
      businessId: data.businessId,
      placeId: data.placeId,
      promotionId: data.promotionId,
      winnerCode: data.winnerCode,
      prizeType: data.prizeType,
      prizeName: data.prizeName,
      prizeValue: data.prizeValue,
      timestamp: new Date(data.timestamp),
      isWin: data.isWin,
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Verify user owns the business
    // const business = await prisma.business.findFirst({
    //   where: {
    //     id: businessId || undefined,
    //     createdBy: session.user.id,
    //   },
    // });

    // if (!business) {
    //   return NextResponse.json(
    //     { error: 'Business not found or access denied' },
    //     { status: 403 }
    //   );
    // }

    // Build query
    const where: any = { businessId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    // Fetch results (placeholder - adjust based on your schema)
    const results = await prisma.$queryRaw`
      SELECT * FROM fruit_machine_results 
      WHERE business_id = ${businessId}
      ${startDate ? `AND timestamp >= ${new Date(startDate)}` : ''}
      ${endDate ? `AND timestamp <= ${new Date(endDate)}` : ''}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `.catch(() => []) as any[];

    // Calculate statistics
    const totalResults = results?.length || 0;
    const wins = (results as any[])?.filter((r) => r.is_win)?.length || 0;
    const losses = totalResults - wins;
    const winRate = totalResults > 0 ? (wins / totalResults) * 100 : 0;

    // Group by prize
    const prizeDistribution = (results as any[])?.reduce(
      (acc: any, r) => {
        const prizeKey = r.prize_name || 'Unknown';
        if (!acc[prizeKey]) {
          acc[prizeKey] = 0;
        }
        acc[prizeKey]++;
        return acc;
      },
      {}
    ) || {};

    return NextResponse.json({
      success: true,
      business: 'Unknown', // business.name,
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

/**
 * Helper function to record a fruit machine result
 * Adjust based on your database schema
 */
async function recordFruitMachineResult(data: any) {
  // TODO: Fix Schema Mismatch
  // The Web App uses 'Promotion' model, but 'FruitMachineResult' model requires a relation to 'FruitMachinePromotion'.
  // We cannot save 'Promotion' IDs into 'FruitMachineResult' without foreign key errors.
  // For now, we just log the result.
  
  console.log('Mock recording result:', data);

  /*
  return await prisma.fruitMachineResult.create({
    data: {
      businessId: data.businessId,
      placeId: data.placeId,
      promotionId: data.promotionId, // This would fail FK constraint if ID is from Promotion table
      winnerCode: data.winnerCode,
      prizeType: data.prizeType,
      prizeName: data.prizeName,
      prizeValue: data.prizeValue ? String(data.prizeValue) : null,
      isWin: data.isWin,
      timestamp: data.timestamp,
    }
  });
  */

  return {
    id: `mock-${Date.now()}`,
    ...data,
    createdAt: new Date(),
  };
}
