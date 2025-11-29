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

  // Create sign types
  const signTypes = [
    { name: 'For Sale', defaultPrice: 29.99 },
    { name: 'To Let', defaultPrice: 29.99 },
    { name: 'Sold', defaultPrice: 29.99 },
    { name: 'Under Offer', defaultPrice: 29.99 },
    { name: 'Open House', defaultPrice: 24.99 },
    { name: 'Private Parking', defaultPrice: 19.99 },
  ];

  for (const signType of signTypes) {
    const existing = await prisma.signType.findFirst({
      where: { name: signType.name },
    });
    
    if (!existing) {
      const created = await prisma.signType.create({
        data: signType,
      });
      console.log('✓ Created sign type:', created.name);
    } else {
      console.log('- Sign type already exists:', existing.name);
    }
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
