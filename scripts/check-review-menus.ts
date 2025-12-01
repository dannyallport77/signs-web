import { prisma } from '../lib/prisma';

async function main() {
  try {
    const menus = await prisma.reviewPlatformMenu.findMany({
      include: {
        platforms: {
          orderBy: { order: 'asc' },
        },
      },
      take: 10,
    });

    console.log(`\nFound ${menus.length} review menus:\n`);

    for (const menu of menus) {
      console.log(`Menu: ${menu.businessName} (/${menu.slug})`);
      console.log(`  Platforms (${menu.platforms.length}):`);
      for (const platform of menu.platforms) {
        console.log(`    - ${platform.name} (${platform.platformKey})`);
        console.log(`      Enabled: ${platform.enabled}`);
        console.log(`      URL: ${platform.url}`);
      }
      console.log('');
    }

    if (menus.length === 0) {
      console.log('No review menus found in database.');
      console.log('Create them using the mobile app first.\n');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
