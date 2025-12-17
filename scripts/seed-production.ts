import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding production database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      active: true,
    },
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      active: true,
    },
  });
  console.log('✓ Created admin user:', admin.email, '- active:', admin.active);

  // Create test user
  const testPassword = await bcrypt.hash('test123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      active: true,
    },
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: testPassword,
      role: 'USER',
      active: true,
    },
  });
  console.log('✓ Created test user:', testUser.email, '- active:', testUser.active);

  // Create sign types - NFC signs for review and social media collection
  const signTypes = [
    { id: 'google-review-sign', name: 'Google Review NFC Sign', defaultPrice: 34.99 },
    { id: 'multi-platform-sign', name: 'Multi-Platform NFC Sign', defaultPrice: 44.99 },
    { id: 'facebook-review-sign', name: 'Facebook Review NFC Sign', defaultPrice: 29.99 },
    { id: 'social-media-follow-sign', name: 'Social Media Follow NFC Sign', defaultPrice: 39.99 },
    { id: 'trustpilot-review-sign', name: 'Trustpilot Review NFC Sign', defaultPrice: 29.99 },
    { id: 'custom-review-bundle', name: 'Custom Review Bundle (5 Signs)', defaultPrice: 129.99 },
  ];

  for (const signType of signTypes) {
    const created = await prisma.signType.upsert({
      where: { id: signType.id },
      update: {
        name: signType.name,
        defaultPrice: signType.defaultPrice,
        isActive: true,
      },
      create: {
        id: signType.id,
        name: signType.name,
        defaultPrice: signType.defaultPrice,
        isActive: true,
        updatedAt: new Date(),
      },
    });
    console.log('✓ Created/updated sign type:', created.name);
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
