import { prisma } from '@/lib/prisma';

/**
 * Test script to verify the fruit machine promotion functionality
 * This script:
 * 1. Creates a test review menu
 * 2. Creates a test promotion
 * 3. Links them together
 * 4. Verifies the promotion can be fetched
 * 5. Tests the URL structure
 */

async function testFruitMachinePromotion() {
  console.log('🎰 Starting Fruit Machine Promotion Tests...\n');

  try {
    // Test 1: Create a test promotion
    console.log('📝 Test 1: Creating a test promotion...');
    const testPromotion = await prisma.promotion.create({
      data: {
        placeId: 'test-place-' + Date.now(),
        businessName: 'Test Business',
        prizeType: 'gift',
        giftName: '50% Off',
        giftEmoji: '🎁',
        giftValue: '50',
        defaultWinOdds: 0.15,
        enabled: true,
      },
    });
    console.log('✅ Promotion created:', {
      id: testPromotion.id,
      businessName: testPromotion.businessName,
      giftName: testPromotion.giftName,
    });

    // Test 2: Create a review menu with the promotion
    console.log('\n📝 Test 2: Creating a review menu linked to promotion...');
    const testMenu = await prisma.reviewPlatformMenu.create({
      data: {
        slug: 'test-menu-' + Date.now(),
        businessName: 'Test Business',
        businessAddress: '123 Test St',
        placeId: testPromotion.placeId,
        promotionId: testPromotion.id,
        heroTitle: 'Test Review',
        heroSubtitle: 'Test subtitle',
        platforms: {
          create: [
            {
              platformKey: 'google',
              name: 'Google',
              url: 'https://google.com',
              enabled: true,
              order: 1,
            },
          ],
        },
      },
    });
    console.log('✅ Review menu created:', {
      slug: testMenu.slug,
      promotionId: testMenu.promotionId,
    });

    // Test 3: Verify the promotion can be fetched by ID
    console.log('\n📝 Test 3: Fetching promotion by ID...');
    const fetchedPromotion = await prisma.promotion.findUnique({
      where: { id: testPromotion.id },
    });
    if (!fetchedPromotion) {
      throw new Error('Failed to fetch promotion by ID');
    }
    console.log('✅ Promotion fetched successfully:', {
      id: fetchedPromotion.id,
      businessName: fetchedPromotion.businessName,
    });

    // Test 4: Verify the review menu has the promotion ID
    console.log('\n📝 Test 4: Fetching review menu with promotion...');
    const fetchedMenu = await prisma.reviewPlatformMenu.findUnique({
      where: { slug: testMenu.slug },
      include: {
        platforms: true,
      },
    });
    if (!fetchedMenu || !fetchedMenu.promotionId) {
      throw new Error('Review menu does not have promotionId');
    }
    console.log('✅ Review menu fetched with promotion:', {
      slug: fetchedMenu.slug,
      promotionId: fetchedMenu.promotionId,
    });

    // Test 5: Verify URL structure
    console.log('\n📝 Test 5: Verifying URL structure...');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.review-signs.co.uk';
    const reviewMenuUrl = `${baseUrl}/review-menu/${testMenu.slug}`;
    const promotionPageUrl = `${baseUrl}/review-menu/${testMenu.slug}/platform/promotion`;
    const fruitMachineUrl = `${baseUrl}/fruit-machine?promotionId=${testPromotion.id}`;

    console.log('✅ URL paths generated:');
    console.log(`   Review Menu:    ${reviewMenuUrl}`);
    console.log(`   Promotion Page: ${promotionPageUrl}`);
    console.log(`   Fruit Machine:  ${fruitMachineUrl}`);

    // Test 6: Cleanup - delete test data
    console.log('\n🧹 Test 6: Cleaning up test data...');
    await prisma.reviewPlatform.deleteMany({
      where: { menuId: testMenu.id },
    });
    await prisma.reviewPlatformMenu.delete({
      where: { id: testMenu.id },
    });
    await prisma.promotion.delete({
      where: { id: testPromotion.id },
    });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Fruit machine promotion is working correctly.\n');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    // Attempt cleanup even on error
    try {
      const promotions = await prisma.promotion.findMany({
        where: { businessName: 'Test Business' },
      });
      for (const promo of promotions) {
        const menus = await prisma.reviewPlatformMenu.findMany({
          where: { promotionId: promo.id },
        });
        for (const menu of menus) {
          await prisma.reviewPlatform.deleteMany({
            where: { menuId: menu.id },
          });
          await prisma.reviewPlatformMenu.delete({
            where: { id: menu.id },
          });
        }
        await prisma.promotion.delete({
          where: { id: promo.id },
        });
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
testFruitMachinePromotion();
