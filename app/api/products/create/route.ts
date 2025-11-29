import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/products/create
 * 
 * Manually create a product
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { name, price, description, imageUrl } = body;

    if (!name || !price) {
      return NextResponse.json(
        { success: false, error: 'Name and price are required' },
        { status: 400 }
      );
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid price' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const id = `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const product = await prisma.signType.create({
      data: {
        id,
        name,
        description: description || null,
        defaultPrice: parsedPrice,
        isActive: true,
        imageUrl: imageUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });

  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create product',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
