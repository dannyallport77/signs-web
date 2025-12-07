import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      targetUrl, 
      businessName, 
      placeId, 
      name 
    } = body;

    if (!targetUrl || !businessName || !placeId) {
      return NextResponse.json(
        { error: 'Target URL, business name, and placeId are required' },
        { status: 400 }
      );
    }

    // Generate a short slug (6 chars)
    const slug = nanoid(6);

    const smartLink = await prisma.smartLink.create({
      data: {
        slug,
        targetUrl,
        businessName,
        placeId,
        name: name || `Link for ${businessName}`,
        active: true,
        suspended: false,
      }
    });

    // Return the full redirect URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://review-signs.co.uk';
    const redirectUrl = `${baseUrl}/t/${slug}`;

    return NextResponse.json({ 
      success: true, 
      data: {
        ...smartLink,
        redirectUrl
      } 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating smart link:', error);
    return NextResponse.json(
      { error: 'Failed to create smart link' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');
    
    const where: any = {};
    if (placeId) {
      where.placeId = placeId;
    }

    const links = await prisma.smartLink.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { scans: true }
        }
      }
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://review-signs.co.uk';
    
    const transformedLinks = links.map(link => ({
      ...link,
      redirectUrl: `${baseUrl}/t/${link.slug}`,
      scanCount: link._count.scans
    }));

    return NextResponse.json({ success: true, data: transformedLinks });
  } catch (error) {
    console.error('Error fetching smart links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch smart links' },
      { status: 500 }
    );
  }
}
