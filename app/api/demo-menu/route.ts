import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEMO_SLUG = 'demo-showcase';
const DEMO_PLACE_ID = 'demo-test-showcase';

// All available demo platforms with example URLs
const DEMO_PLATFORMS = [
  { platformKey: 'google', name: 'Google Reviews', url: 'https://review-signs.co.uk/demo', order: 0 },
  { platformKey: 'facebook', name: 'Facebook', url: 'https://review-signs.co.uk/demo', order: 1 },
  { platformKey: 'instagram', name: 'Instagram', url: 'https://review-signs.co.uk/demo', order: 2 },
  { platformKey: 'tiktok', name: 'TikTok', url: 'https://review-signs.co.uk/demo', order: 3 },
  { platformKey: 'twitter', name: 'X (Twitter)', url: 'https://review-signs.co.uk/demo', order: 4 },
  { platformKey: 'linkedin', name: 'LinkedIn', url: 'https://review-signs.co.uk/demo', order: 5 },
  { platformKey: 'tripadvisor', name: 'Tripadvisor', url: 'https://review-signs.co.uk/demo', order: 6 },
  { platformKey: 'trustpilot', name: 'Trustpilot', url: 'https://review-signs.co.uk/demo', order: 7 },
  { platformKey: 'yell', name: 'Yell', url: 'https://review-signs.co.uk/demo', order: 8 },
  { platformKey: 'checkatrade', name: 'Checkatrade', url: 'https://review-signs.co.uk/demo', order: 9 },
  { platformKey: 'ratedpeople', name: 'Rated People', url: 'https://review-signs.co.uk/demo', order: 10 },
  { platformKey: 'trustatrader', name: 'TrustATrader', url: 'https://review-signs.co.uk/demo', order: 11 },
];

export async function GET() {
  try {
    // Check if demo menu already exists
    let demoMenu = await prisma.reviewPlatformMenu.findUnique({
      where: { slug: DEMO_SLUG },
      include: { platforms: true },
    });

    if (!demoMenu) {
      // Create the demo menu with all options
      demoMenu = await prisma.reviewPlatformMenu.create({
        data: {
          slug: DEMO_SLUG,
          businessName: 'Demo Business - All Features',
          businessAddress: '123 Demo Street, Sample City, SC1 2AB',
          placeId: DEMO_PLACE_ID,
          heroTitle: '🎉 Welcome to the Demo Showcase!',
          heroSubtitle: 'This demonstrates all available features on a Review Signs NFC tag',
          // WiFi credentials
          wifiSsid: 'DemoWiFi',
          wifiPassword: 'demo1234',
          wifiSecurity: 'WPA',
          // Website
          websiteUrl: 'https://review-signs.co.uk',
          // App download links
          appDownloadUrlApple: 'https://apps.apple.com',
          appDownloadUrlGoogle: 'https://play.google.com',
          appStoreType: 'both',
          // Create all platforms
          platforms: {
            create: DEMO_PLATFORMS.map(p => ({
              platformKey: p.platformKey,
              name: p.name,
              url: p.url,
              enabled: true,
              order: p.order,
            })),
          },
        },
        include: { platforms: true },
      });

      // Create a demo fruit machine promotion
      const demoPromotion = await prisma.fruitMachinePromotion.create({
        data: {
          businessId: DEMO_PLACE_ID,
          placeId: DEMO_PLACE_ID,
          name: 'Demo Fruit Machine Promotion',
          description: 'Demo showcase with various prize levels',
          winProbability: 15,
          enabled: true,
          prizes: [
            { name: '10% Discount', description: 'Get 10% off your next purchase', probability: 40 },
            { name: 'Free Coffee', description: 'Enjoy a free coffee on us', probability: 30 },
            { name: 'Free Dessert', description: 'A complimentary dessert', probability: 20 },
            { name: 'Grand Prize!', description: 'Win a £50 gift voucher', probability: 10 },
          ],
        },
      });

      // Update menu with promotion
      demoMenu = await prisma.reviewPlatformMenu.update({
        where: { id: demoMenu.id },
        data: { promotionId: demoPromotion.id },
        include: { platforms: true },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://review-signs.co.uk';
    const menuUrl = `${baseUrl}/review-menu/${DEMO_SLUG}`;

    return NextResponse.json({
      success: true,
      data: {
        id: demoMenu.id,
        slug: demoMenu.slug,
        menuUrl,
        businessName: demoMenu.businessName,
        platforms: demoMenu.platforms.map(p => ({
          key: p.platformKey,
          name: p.name,
        })),
        features: {
          wifi: !!demoMenu.wifiSsid,
          promotion: !!demoMenu.promotionId,
          website: !!demoMenu.websiteUrl,
          appDownload: !!(demoMenu.appDownloadUrlApple || demoMenu.appDownloadUrlGoogle),
          platformCount: demoMenu.platforms.length,
        },
      },
    });
  } catch (error) {
    console.error('Error getting demo menu:', error);
    return NextResponse.json(
      { error: 'Failed to get demo menu' },
      { status: 500 }
    );
  }
}

// Regenerate/reset the demo menu
export async function POST() {
  try {
    // Delete existing demo menu if it exists
    const existing = await prisma.reviewPlatformMenu.findUnique({
      where: { slug: DEMO_SLUG },
    });

    if (existing) {
      // Delete associated promotion first
      if (existing.promotionId) {
        await prisma.promotion.delete({
          where: { id: existing.promotionId },
        }).catch(() => {}); // Ignore if not found
      }
      await prisma.reviewPlatformMenu.delete({
        where: { slug: DEMO_SLUG },
      });
    }

    // Create fresh demo menu
    const demoMenu = await prisma.reviewPlatformMenu.create({
      data: {
        slug: DEMO_SLUG,
        businessName: 'Demo Business - All Features',
        businessAddress: '123 Demo Street, Sample City, SC1 2AB',
        placeId: DEMO_PLACE_ID,
        heroTitle: '🎉 Welcome to the Demo Showcase!',
        heroSubtitle: 'This demonstrates all available features on a Review Signs NFC tag',
        wifiSsid: 'DemoWiFi',
        wifiPassword: 'demo1234',
        wifiSecurity: 'WPA',
        websiteUrl: 'https://review-signs.co.uk',
        appDownloadUrlApple: 'https://apps.apple.com',
        appDownloadUrlGoogle: 'https://play.google.com',
        appStoreType: 'both',
        platforms: {
          create: DEMO_PLATFORMS.map(p => ({
            platformKey: p.platformKey,
            name: p.name,
            url: p.url,
            enabled: true,
            order: p.order,
          })),
        },
      },
      include: { platforms: true },
    });

    // Create demo promotion
    const demoPromotion = await prisma.fruitMachinePromotion.create({
      data: {
        businessId: DEMO_PLACE_ID,
        placeId: DEMO_PLACE_ID,
        name: 'Demo Fruit Machine Promotion',
        description: 'Demo showcase with various prize levels',
        winProbability: 15,
        enabled: true,
        prizes: [
          { name: '10% Discount', description: 'Get 10% off your next purchase', probability: 40 },
          { name: 'Free Coffee', description: 'Enjoy a free coffee on us', probability: 30 },
          { name: 'Free Dessert', description: 'A complimentary dessert', probability: 20 },
          { name: 'Grand Prize!', description: 'Win a £50 gift voucher', probability: 10 },
        ],
      },
    });

    // Update menu with promotion
    await prisma.reviewPlatformMenu.update({
      where: { id: demoMenu.id },
      data: { promotionId: demoPromotion.id },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://review-signs.co.uk';
    const menuUrl = `${baseUrl}/review-menu/${DEMO_SLUG}`;

    return NextResponse.json({
      success: true,
      message: 'Demo menu regenerated successfully',
      data: {
        slug: DEMO_SLUG,
        menuUrl,
      },
    });
  } catch (error) {
    console.error('Error regenerating demo menu:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate demo menu' },
      { status: 500 }
    );
  }
}
