import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyMobileToken } from '@/lib/auth-mobile';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check mobile JWT token
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

    // Get all active sign types
    const signTypes = await prisma.signType.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform to match the expected format
    const products = signTypes.map(signType => ({
      id: signType.id,
      name: signType.name,
      description: signType.description || '',
      price: signType.defaultPrice,
      isActive: signType.isActive,
      imageUrl: signType.imageUrl || '',
      createdAt: signType.createdAt.toISOString(),
      updatedAt: signType.updatedAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}