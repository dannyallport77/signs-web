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

    const role = typeof payload.role === 'string' ? payload.role.toLowerCase() : '';
    const userId = typeof payload.userId === 'string' ? payload.userId : undefined;

    const userPerformance = await prisma.$queryRaw`
      SELECT
        u.id as user_id,
        u.name,
        COUNT(t.id) as total_sales,
        COALESCE(SUM(t.sale_price), 0) as total_revenue,
        ROUND(
          (COUNT(CASE WHEN t.status = 'success' THEN 1 END)::decimal /
           NULLIF(COUNT(t.id), 0)) * 100, 2
        ) as success_rate
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      WHERE u.active = true
        ${role !== 'admin' && userId ? Prisma.sql`AND u.id = ${userId}` : Prisma.sql``}
      GROUP BY u.id, u.name
      ORDER BY total_revenue DESC
    `;

    return NextResponse.json({
      success: true,
      data: userPerformance
    });

  } catch (error) {
    console.error('Error fetching user performance:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}