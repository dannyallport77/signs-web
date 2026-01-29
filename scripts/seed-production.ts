import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding production database...');

  // Create admin user (only if env provided)
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordRaw = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPasswordRaw) {
    console.log('⚠️  ADMIN_EMAIL/ADMIN_PASSWORD not set. Skipping admin user creation.');
  } else {
    const adminPassword = await bcrypt.hash(adminPasswordRaw, 10);
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        active: true,
      },
      create: {
        email: adminEmail,
        name: 'Admin User',
        password: adminPassword,
        role: 'ADMIN',
        active: true,
      },
    });
    console.log('✓ Created admin user:', admin.email, '- active:', admin.active);
  }

  // Create test user (optional; requires env)
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPasswordRaw = process.env.TEST_USER_PASSWORD;
  const testName = process.env.TEST_USER_NAME || 'Test User';
  const testRole = process.env.TEST_USER_ROLE || 'USER';
  if (!testEmail || !testPasswordRaw) {
    console.log('ℹ️  TEST_USER_EMAIL/TEST_USER_PASSWORD not set. Skipping test user creation.');
  } else {
    const testPassword = await bcrypt.hash(testPasswordRaw, 10);
    const testUser = await prisma.user.upsert({
      where: { email: testEmail },
      update: {
        active: true,
      },
      create: {
        email: testEmail,
        name: testName,
        password: testPassword,
        role: testRole,
        active: true,
      },
    });
    console.log('✓ Created test user:', testUser.email, '- active:', testUser.active);
  }

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
