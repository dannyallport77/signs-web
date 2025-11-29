import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const signTypes = await prisma.signType.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    const products = signTypes.map(signType => ({
      id: signType.id,
      title: signType.name,
      description: signType.description || '',
      price: signType.defaultPrice || 0,
      customPrice: signType.defaultPrice || 0,
      compareAtPrice: null,
      active: signType.isActive,
      featured: false,
      bestseller: false,
      newArrival: false,
      images: signType.imageUrl ? [signType.imageUrl] : [],
      video: null,
      inventoryQuantity: 999
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
