import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch both imported products and sign types
    const [importedProducts, signTypes] = await Promise.all([
      prisma.product.findMany({
        include: {
          options: true,
          variants: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.signType.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      })
    ]);

    // Format imported products
    const products = importedProducts.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description || '',
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      images: p.images,
      category: p.category || 'Imported',
      isActive: p.isActive,
      aliexpressUrl: p.aliexpressUrl,
      createdAt: p.createdAt,
    }));

    // Also return sign types for backwards compatibility
    const signTypeProducts = signTypes.map(signType => ({
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
      data: signTypeProducts,
      products: products, // New imported products
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
