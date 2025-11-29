import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Setting up Signs NFC Manager database...\n');

  // Create admin user
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123'; // Change this in production!

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'System Administrator',
        role: 'admin',
        active: true,
      }
    });
    
    console.log('✅ Admin user created');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!\n');
  }

  // Create sample sign types
  const sampleSignTypes = [
    {
      name: 'A-Board Sign',
      description: 'Double-sided pavement sign perfect for restaurants and retail',
      defaultPrice: 25.00,
      isActive: true,
    },
    {
      name: 'Window Sticker',
      description: 'Clear vinyl sticker for shop windows',
      defaultPrice: 15.00,
      isActive: true,
    },
    {
      name: 'Menu Board',
      description: 'Digital menu display with NFC integration',
      defaultPrice: 50.00,
      isActive: true,
    },
    {
      name: 'Business Card',
      description: 'NFC-enabled business cards',
      defaultPrice: 5.00,
      isActive: true,
    },
    {
      name: 'Poster Sign',
      description: 'Large format poster with NFC tag',
      defaultPrice: 35.00,
      isActive: true,
    },
  ];

  for (const signType of sampleSignTypes) {
    const existing = await prisma.signType.findFirst({
      where: { name: signType.name }
    });

    if (!existing) {
      await prisma.signType.create({ data: signType });
      console.log(`✅ Created sign type: ${signType.name}`);
    }
  }

  // Create test user for mobile app
  const testUserEmail = 'test@example.com';
  const testUserPassword = 'test123'; // Change this in production!

  const existingTestUser = await prisma.user.findUnique({
    where: { email: testUserEmail }
  });

  if (existingTestUser) {
    console.log('✅ Test user already exists');
  } else {
    const hashedPassword = await bcrypt.hash(testUserPassword, 10);
    
    await prisma.user.create({
      data: {
        email: testUserEmail,
        password: hashedPassword,
        name: 'Test User',
        role: 'user',
        active: true,
      }
    });
    
    console.log('✅ Test user created');
    console.log(`   Email: ${testUserEmail}`);
    console.log(`   Password: ${testUserPassword}`);
    console.log('   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!\n');
  }
}

main()
  .catch((e) => {
    console.error('Error setting up database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
