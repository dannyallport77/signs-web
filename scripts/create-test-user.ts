import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'test@example.com';
  const password = 'test123';
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        role: 'admin', // Making it admin for easier testing
        active: true,
      },
      create: {
        email,
        password: hashedPassword,
        name: 'Test User',
        role: 'admin',
        active: true,
      },
    });

    console.log(`User created/updated: ${user.email}`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
