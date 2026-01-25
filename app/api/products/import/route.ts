import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return admin.response;
    }

    const { title, description, costPrice, sellingPrice, images, videoUrl, aliexpressUrl, category, options, specifications } = await request.json();

    if (!title || !costPrice || !sellingPrice) {
      return NextResponse.json({ error: 'Title, cost price, and selling price are required' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        title,
        description: description || title,
        costPrice,
        sellingPrice,
        images,
        videoUrl,
        aliexpressUrl,
        category,
        isActive: true,
        options: {
          create: options?.map((opt: any) => ({
            name: opt.name,
            values: opt.values
          })) || []
        }
      },
      include: {
        options: true
      }
    });

    return NextResponse.json({ success: true, product });

  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
