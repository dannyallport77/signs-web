import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUniqueSlug, sanitizePlatforms, slugify } from '@/lib/reviewMenuUtils';

const ALLOWED_APP_STORE_TYPES = ['app_store', 'google_play'] as const;
type AppStoreType = (typeof ALLOWED_APP_STORE_TYPES)[number];

const normalizeUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const normalized = new URL(withProtocol).toString();
    return normalized;
  } catch (error) {
    console.warn('Invalid URL provided, ignoring:', trimmed);
    return undefined;
  }
};

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
      websiteUrl,
      appDownloadUrl,
      appStoreType,
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

    const normalizedWebsiteUrl = normalizeUrl(websiteUrl);
    const normalizedAppDownloadUrl = normalizeUrl(appDownloadUrl);
    let normalizedAppStoreType: AppStoreType | undefined;
    if (normalizedAppDownloadUrl) {
      if (appStoreType && ALLOWED_APP_STORE_TYPES.includes(appStoreType)) {
        normalizedAppStoreType = appStoreType;
      } else {
        normalizedAppStoreType = 'app_store';
      }
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
        websiteUrl: normalizedWebsiteUrl,
        appDownloadUrl: normalizedAppDownloadUrl,
        appStoreType: normalizedAppStoreType,
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
