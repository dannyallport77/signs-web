import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Setting up Signs NFC Manager database...\n');

  // Create admin user (only if env provided)
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('⚠️  ADMIN_EMAIL/ADMIN_PASSWORD not set. Skipping admin user creation.');
  } else {
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
      console.log('   ⚠️  Store this password securely.\n');
    }
  }

  // Create sample stock items
  const sampleItems = [
    {
      name: 'NFC Tag - NTAG213',
      description: 'Rewritable NFC tags compatible with all phones',
      sku: 'NFC-213',
      quantity: 100,
      minQuantity: 20,
      location: 'Storage Room A',
    },
    {
      name: 'NFC Tag - NTAG215',
      description: 'High capacity NFC tags',
      sku: 'NFC-215',
      quantity: 50,
      minQuantity: 15,
      location: 'Storage Room A',
    },
    {
      name: 'Acrylic Sign Holder',
      description: 'Clear acrylic stands for signs',
      sku: 'SIGN-HOLD-01',
      quantity: 25,
      minQuantity: 10,
      location: 'Storage Room B',
    },
  ];

  for (const item of sampleItems) {
    const existing = await prisma.stockItem.findUnique({
      where: { sku: item.sku }
    });

    if (!existing) {
      await prisma.stockItem.create({ data: item });
      console.log(`✅ Created stock item: ${item.name}`);
    }
  }

  console.log('\n✨ Database setup complete!\n');
  console.log('Next steps:');
  console.log('1. Start the web app: npm run dev');
  console.log('2. Ensure an admin user exists (set ADMIN_EMAIL/ADMIN_PASSWORD and re-run setup if needed)');
  console.log('3. Add users for mobile app access');
  console.log('4. Configure Google Maps API keys in .env\n');
}

main()
  .catch((e) => {
    console.error('Error setting up database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
