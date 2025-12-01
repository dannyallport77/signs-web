import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyMobileToken } from '@/lib/auth-mobile';
import { ensureUniqueSlug, sanitizePlatforms, slugify, PlatformPayload } from '@/lib/reviewMenuUtils';

interface MobilePlatformInput {
  platformKey: PlatformPayload['platformKey'];
  url: string;
  name?: string;
  enabled?: boolean;
  order?: number;
  icon?: string;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyMobileToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      businessAddress,
      placeId,
      heroTitle,
      heroSubtitle,
      logoUrl,
      slug,
      platforms,
    } = body as {
      businessName?: string;
      businessAddress?: string;
      placeId?: string;
      heroTitle?: string;
      heroSubtitle?: string;
      logoUrl?: string;
      slug?: string;
      platforms?: MobilePlatformInput[];
    };

    if (!businessName) {
      return NextResponse.json({ success: false, error: 'businessName is required' }, { status: 400 });
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one platform is required' }, { status: 400 });
    }

    const preparedPlatforms = sanitizePlatforms(
      platforms.map((platform, index) => ({
        platformKey: platform.platformKey,
        name: platform.name,
        url: platform.url,
        enabled: platform.enabled ?? true,
        order: platform.order ?? index,
        icon: platform.icon,
      }))
    );

    if (preparedPlatforms.length === 0) {
      return NextResponse.json({ success: false, error: 'No enabled platforms supplied' }, { status: 400 });
    }

    const baseSlug = slugify(slug || `${businessName}-${Date.now()}`);
    const finalSlug = await ensureUniqueSlug(baseSlug);

    const menu = await prisma.reviewPlatformMenu.create({
      data: {
        slug: finalSlug,
        businessName,
        businessAddress,
        placeId,
        heroTitle: heroTitle || 'How was your experience?',
        heroSubtitle: heroSubtitle || 'Choose a platform below to leave feedback',
        logoUrl,
        platforms: {
          create: preparedPlatforms,
        },
      },
      include: {
        platforms: {
          orderBy: { order: 'asc' },
        },
      },
    });

    const shareUrl = `${request.nextUrl.origin}/review-menu/${menu.slug}`;

    return NextResponse.json({
      success: true,
      data: menu,
      shareUrl,
    });
  } catch (error) {
    console.error('Failed to create mobile review menu:', error);
    return NextResponse.json({ success: false, error: 'Failed to create review menu' }, { status: 500 });
  }
}
