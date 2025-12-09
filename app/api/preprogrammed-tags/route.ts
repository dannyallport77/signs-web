import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

// POST - Create a new preprogrammed tag
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { programmedBy } = body;

    // Generate unique identifiers
    const tagUid = `RS-${nanoid(8).toUpperCase()}`; // e.g., RS-A1B2C3D4
    const slug = nanoid(6); // Short URL slug

    const tag = await prisma.preprogrammedTag.create({
      data: {
        tagUid,
        slug,
        status: 'unlinked',
        programmedBy,
        programmedAt: new Date(),
      }
    });

    // Return the URL that should be written to the NFC tag
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://review-signs.co.uk';
    const redirectUrl = `${baseUrl}/p/${slug}`;

    return NextResponse.json({ 
      success: true, 
      data: {
        ...tag,
        redirectUrl
      } 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating preprogrammed tag:', error);
    return NextResponse.json(
      { error: 'Failed to create preprogrammed tag' },
      { status: 500 }
    );
  }
}

// GET - List preprogrammed tags with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // unlinked, linked, deactivated
    const placeId = searchParams.get('placeId');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (placeId) {
      where.placeId = placeId;
    }

    const tags = await prisma.preprogrammedTag.findMany({
      where,
      orderBy: { programmedAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: { scans: true }
        }
      }
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://review-signs.co.uk';
    
    const transformedTags = tags.map(tag => ({
      ...tag,
      redirectUrl: `${baseUrl}/p/${tag.slug}`,
      scanCount: tag._count.scans
    }));

    return NextResponse.json({ success: true, data: transformedTags });
  } catch (error) {
    console.error('Error fetching preprogrammed tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preprogrammed tags' },
      { status: 500 }
    );
  }
}
