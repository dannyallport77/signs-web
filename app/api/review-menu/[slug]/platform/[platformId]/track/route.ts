import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nfcTagInteractionService } from '@/lib/services/nfcTagInteractionService';

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

    // Log to NFCTagInteraction (new unified system)
    const interaction = await nfcTagInteractionService.logRead({
      siteId: menu.placeId || menu.id,
      businessName: menu.businessName,
      businessAddress: menu.businessAddress || undefined,
      actionType: platform.platformKey,
      targetUrl: platform.url,
      userAgent,
      ipAddress: ip,
      tagData: {
        menuSlug: slug,
        platformId: platform.id,
        platformName: platform.name,
        reviewSubmitted,
        referrer,
        metadata: metadata ? JSON.parse(metadata) : null,
      },
    });

    // Return platform URL and click data
    return NextResponse.json({
      success: true,
      clickId: interaction.id,
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

    // Get the menu to find the siteId
    const menu = await prisma.reviewPlatformMenu.findUnique({
      where: { slug },
      include: { platforms: true },
    });

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    const platform = menu.platforms.find((p) => p.id === platformId);

    // Get analytics from NFCTagInteraction
    const { interactions } = await nfcTagInteractionService.query({
      siteId: menu.placeId || menu.id,
      actionType: platform?.platformKey,
      limit: 100,
    });

    const totalClicks = interactions.length;

    return NextResponse.json({
      success: true,
      platformId,
      slug,
      totalClicks,
      recentClicks: interactions.slice(0, 10).map(i => ({
        id: i.id,
        timestamp: i.timestamp,
        userAgent: i.userAgent,
        ipAddress: i.ipAddress,
      })),
    });
  } catch (error) {
    console.error('[ANALYTICS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
