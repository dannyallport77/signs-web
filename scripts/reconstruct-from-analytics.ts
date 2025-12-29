import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Reconstructing database from analytics backup...');

  try {
    // Create user accounts for the 2 businesses that had activity
    const user1Password = await bcrypt.hash('ChangeMe123!', 10);
    const user1 = await prisma.user.upsert({
      where: { email: 'unique-nano@example.com' },
      update: {
        active: true,
      },
      create: {
        email: 'unique-nano@example.com',
        name: 'UNIQUE NANO SOLUTIONS',
        password: user1Password,
        role: 'USER',
        active: true,
      },
    });
    console.log('✓ Created user for UNIQUE NANO SOLUTIONS:', user1.id);

    const user2Password = await bcrypt.hash('ChangeMe123!', 10);
    const user2 = await prisma.user.upsert({
      where: { email: 'clubboys@example.com' },
      update: {
        active: true,
      },
      create: {
        email: 'clubboys@example.com',
        name: 'Club Boys Barber',
        password: user2Password,
        role: 'USER',
        active: true,
      },
    });
    console.log('✓ Created user for Club Boys Barber:', user2.id);

    // Create BusinessDetail records from analytics
    const business1 = await prisma.businessDetail.upsert({
      where: { placeId: 'ChIJEx86whKne0gR-hXhGuRAJA4' },
      update: {
        userId: user1.id,
        name: 'UNIQUE NANO SOLUTIONS',
        address: '235 Halliwell Road, Bolton',
      },
      create: {
        userId: user1.id,
        name: 'UNIQUE NANO SOLUTIONS',
        address: '235 Halliwell Road, Bolton',
        placeId: 'ChIJEx86whKne0gR-hXhGuRAJA4',
      },
    });
    console.log('✓ Created BusinessDetail for UNIQUE NANO SOLUTIONS:', business1.id);

    const business2 = await prisma.businessDetail.upsert({
      where: { placeId: 'ChIJ796lsFene0gR6E0HF3PU0jw' },
      update: {
        userId: user2.id,
        name: 'Club Boys Barber',
        address: '231-233 Halliwell Rd, Bolton BL1 3NT, United Kingdom',
      },
      create: {
        userId: user2.id,
        name: 'Club Boys Barber',
        address: '231-233 Halliwell Rd, Bolton BL1 3NT, United Kingdom',
        placeId: 'ChIJ796lsFene0gR6E0HF3PU0jw',
      },
    });
    console.log('✓ Created BusinessDetail for Club Boys Barber:', business2.id);

    // Recreate ReviewPlatformMenu for UNIQUE NANO SOLUTIONS
    const menu1 = await prisma.reviewPlatformMenu.upsert({
      where: { id: 'cmjcqwp0g0000la044lwo246k' },
      update: {
        businessName: 'UNIQUE NANO SOLUTIONS',
      },
      create: {
        id: 'cmjcqwp0g0000la044lwo246k',
        slug: 'unique-nano-solutions',
        businessName: 'UNIQUE NANO SOLUTIONS',
        businessAddress: '235 Halliwell Road, Bolton',
        placeId: 'ChIJEx86whKne0gR-hXhGuRAJA4',
        heroTitle: 'Review UNIQUE NANO SOLUTIONS',
        heroSubtitle: 'Choose a platform to leave a review',
      },
    });
    console.log('✓ Recreated ReviewPlatformMenu for UNIQUE NANO SOLUTIONS');

    // Recreate ReviewPlatformMenu for Club Boys Barber
    const menu2 = await prisma.reviewPlatformMenu.upsert({
      where: { id: 'cmjcr8nqp0000jr04ojgtehxn' },
      update: {
        businessName: 'Club Boys Barber',
      },
      create: {
        id: 'cmjcr8nqp0000jr04ojgtehxn',
        slug: 'club-boys-barber',
        businessName: 'Club Boys Barber',
        businessAddress: '231-233 Halliwell Rd, Bolton BL1 3NT, United Kingdom',
        placeId: 'ChIJ796lsFene0gR6E0HF3PU0jw',
        heroTitle: 'Review Club Boys Barber',
        heroSubtitle: 'Choose a platform to leave a review',
      },
    });
    console.log('✓ Recreated ReviewPlatformMenu for Club Boys Barber');

    // Recreate ReviewPlatforms for UNIQUE NANO SOLUTIONS
    const platforms1 = [
      {
        id: 'cmjcqwp0g0001la04rhh3fgmn',
        menuId: menu1.id,
        platformKey: 'google-review',
        name: 'Google Review',
        url: 'https://search.google.com/local/writereview?placeid=ChIJEx86whKne0gR-hXhGuRAJA4',
        order: 0,
        icon: '⭐',
      },
      {
        id: 'cmjcqwp0g0002la04qmxnvp0v',
        menuId: menu1.id,
        platformKey: 'instagram',
        name: 'Instagram',
        url: 'https://www.instagram.com/uniquenanosolutions/',
        order: 1,
        icon: '📸',
      },
    ];

    for (const platform of platforms1) {
      await prisma.reviewPlatform.upsert({
        where: { id: platform.id },
        update: {
          enabled: true,
        },
        create: platform,
      });
    }
    console.log('✓ Recreated ReviewPlatforms for UNIQUE NANO SOLUTIONS');

    // Recreate ReviewPlatforms for Club Boys Barber
    const platforms2 = [
      {
        id: 'cmjcr8nqp0001jr049xd6jrrv',
        menuId: menu2.id,
        platformKey: 'google-review',
        name: 'Google Review',
        url: 'https://search.google.com/local/writereview?placeid=ChIJ796lsFene0gR6E0HF3PU0jw',
        order: 0,
        icon: '⭐',
      },
      {
        id: 'cmjcr8nqp0002jr04nn8bsz3k',
        menuId: menu2.id,
        platformKey: 'instagram',
        name: 'Instagram',
        url: 'https://www.instagram.com/clubboysbarber',
        order: 1,
        icon: '📸',
      },
    ];

    for (const platform of platforms2) {
      await prisma.reviewPlatform.upsert({
        where: { id: platform.id },
        update: {
          enabled: true,
        },
        create: platform,
      });
    }
    console.log('✓ Recreated ReviewPlatforms for Club Boys Barber');

    console.log('\n✅ Reconstruction from analytics backup complete!');
    console.log('\nRecovered data:');
    console.log('- 2 User accounts');
    console.log('- 2 Business locations');
    console.log('- 4 Review platforms (2 per business)');
    console.log('\n⚠️  NOTE: FruitMachinePromotions and NFCTag data was NOT in the analytics backup.');
    console.log('Please provide details about:');
    console.log('1. The 3 FruitMachinePromotions that were deleted');
    console.log('2. The 1 NFCTag that was deleted');
    console.log('3. Any payment/invoice history');

  } catch (error) {
    console.error('❌ Error during reconstruction:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
