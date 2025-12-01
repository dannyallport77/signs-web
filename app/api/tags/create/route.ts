import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUniqueSlug, sanitizePlatforms, slugify } from '@/lib/reviewMenuUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessName,
      businessAddress,
      placeId,
      tagType,
      platforms,
      wifiSsid,
      wifiPassword,
      wifiSecurity,
      promotionId,
    } = body;

    if (!businessName) {
      return NextResponse.json({ error: 'businessName is required' }, { status: 400 });
    }

    if (tagType !== 'multiplatform') {
      return NextResponse.json({ error: 'Invalid tag type' }, { status: 400 });
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'At least one platform must be provided' }, { status: 400 });
    }

    // Map mobile app platform format to backend format
    const mappedPlatforms = platforms.map((p: any) => ({
      platformKey: slugify(p.platform),
      name: p.platform,
      url: p.url,
      enabled: true
    }));

    const sanitizedPlatforms = sanitizePlatforms(mappedPlatforms);

    if (sanitizedPlatforms.length === 0) {
      return NextResponse.json({ error: 'No valid platforms were supplied' }, { status: 400 });
    }

    const baseSlug = slugify(businessName);
    const finalSlug = await ensureUniqueSlug(baseSlug);

    const menu = await prisma.reviewPlatformMenu.create({
      data: {
        slug: finalSlug,
        businessName,
        businessAddress,
        placeId,
        heroTitle: `Review ${businessName}`,
        heroSubtitle: 'Choose a platform to leave a review',
        wifiSsid,
        wifiPassword,
        wifiSecurity,
        promotionId,
        platforms: {
          create: sanitizedPlatforms,
        },
      },
    });

    // Return the URL for the tag
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.review-signs.co.uk';
    const tagUrl = `${baseUrl}/r/${menu.slug}`;

    return NextResponse.json({ 
      success: true, 
      url: tagUrl,
      slug: menu.slug,
      id: menu.id
    });

  } catch (error: unknown) {
    console.error('Failed to create tag', error);
    const message = error instanceof Error ? error.message : 'Failed to create tag';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
