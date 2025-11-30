import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
