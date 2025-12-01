import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  context: any
) {
  try {
    const { slug, platformId } = await context.params;

    // Extract IP and user agent from request
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;
    const referrer = request.headers.get('referer') || undefined;

    // Get optional query parameters
    const { searchParams } = new URL(request.url);
    const reviewSubmitted = searchParams.get('reviewSubmitted') === 'true';
    const metadata = searchParams.get('metadata');

    // Fetch the menu to get menuId
    const menu = await prisma.reviewPlatformMenu.findUnique({
      where: { slug },
      include: {
        platforms: true,
      },
    });

    if (!menu) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      );
    }

    // Verify platform exists and belongs to this menu
    const platform = menu.platforms.find((p) => p.id === platformId);
    if (!platform || !platform.enabled) {
      return NextResponse.json(
        { error: 'Platform not found or disabled' },
        { status: 404 }
      );
    }

    // Log the click
    const click = await prisma.reviewPlatformClick.create({
      data: {
        menuId: menu.id,
        platformId: platform.id,
        ipAddress: ip,
        userAgent,
        referrer,
        reviewSubmitted,
        metadata: metadata ? JSON.stringify({ parsedMetadata: metadata }) : null,
      },
    });

    // Return platform URL and click data
    return NextResponse.json({
      success: true,
      clickId: click.id,
      platformUrl: platform.url,
      platformName: platform.name,
    });
  } catch (error) {
    console.error('[TRACK_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve analytics for a menu
export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const { slug, platformId } = await context.params;

    // Get analytics for this platform
    const clicks = await prisma.reviewPlatformClick.findMany({
      where: {
        platform: {
          id: platformId,
          menu: {
            slug: slug,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 100,
    });

    const totalClicks = clicks.length;
    const reviewsSubmitted = clicks.filter((c) => c.reviewSubmitted).length;

    return NextResponse.json({
      success: true,
      platformId,
      slug,
      totalClicks,
      reviewsSubmitted,
      conversionRate: totalClicks > 0 ? ((reviewsSubmitted / totalClicks) * 100).toFixed(2) : '0.00',
      recentClicks: clicks.slice(0, 10),
    });
  } catch (error) {
    console.error('[ANALYTICS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
