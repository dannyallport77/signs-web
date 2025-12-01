import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUniqueSlug, sanitizePlatforms, slugify, PlatformPayload } from '@/lib/reviewMenuUtils';

export async function GET() {
  try {
    const menus = await prisma.reviewPlatformMenu.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        platforms: {
          orderBy: { order: 'asc' },
        },
      },
      take: 50,
    });

    return NextResponse.json({ success: true, data: menus });
  } catch (error) {
    console.error('Failed to fetch review menus', error);
    return NextResponse.json({ error: 'Failed to fetch review menus' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessName,
      businessAddress,
      placeId,
      slug,
      heroTitle,
      heroSubtitle,
      logoUrl,
      platforms,
      wifiSsid,
      wifiPassword,
      wifiSecurity,
      promotionId,
    } = body as {
      businessName?: string;
      businessAddress?: string;
      placeId?: string;
      slug?: string;
      heroTitle?: string;
      heroSubtitle?: string;
      logoUrl?: string;
      platforms?: PlatformPayload[];
      wifiSsid?: string;
      wifiPassword?: string;
      wifiSecurity?: string;
      promotionId?: string;
    };

    if (!businessName) {
      return NextResponse.json({ error: 'businessName is required' }, { status: 400 });
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'At least one platform must be provided' }, { status: 400 });
    }

    const sanitizedPlatforms = sanitizePlatforms(platforms);

    if (sanitizedPlatforms.length === 0) {
      return NextResponse.json({ error: 'No valid platforms were supplied' }, { status: 400 });
    }

    const baseSlug = slugify(slug || businessName);
    const finalSlug = await ensureUniqueSlug(baseSlug);

    const menu = await prisma.reviewPlatformMenu.create({
      data: {
        slug: finalSlug,
        businessName,
        businessAddress,
        placeId,
        heroTitle,
        heroSubtitle,
        logoUrl,
        wifiSsid,
        wifiPassword,
        wifiSecurity,
        promotionId,
        platforms: {
          create: sanitizedPlatforms,
        },
      },
      include: {
        platforms: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({ success: true, data: menu });
  } catch (error: unknown) {
    console.error('Failed to create review menu', error);
    const message = error instanceof Error ? error.message : 'Failed to create review menu';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
