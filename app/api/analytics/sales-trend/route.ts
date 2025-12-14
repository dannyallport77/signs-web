import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { verifyMobileToken } from '@/lib/auth-mobile';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyMobileToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const role = (payload.role || '').toLowerCase();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const whereClause = {
      status: 'success',
      createdAt: {
        gte: startDate
      },
      ...(role !== 'admin' && { userId: payload.userId })
    };

    const salesTrend = await prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as sales,
        COALESCE(SUM(sale_price), 0) as revenue
      FROM transactions
      WHERE status = 'success'
        AND created_at >= ${startDate}
        ${role !== 'admin' ? Prisma.sql`AND user_id = ${payload.userId}` : Prisma.sql``}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `;

    return NextResponse.json({
      success: true,
      data: salesTrend
    });

  } catch (error) {
    console.error('Error fetching sales trend:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}