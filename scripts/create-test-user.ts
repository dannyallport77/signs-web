import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  const name = process.env.TEST_USER_NAME || 'Test User';
  const role = process.env.TEST_USER_ROLE || 'user';

  if (!email || !password) {
    console.log('⚠️  Set TEST_USER_EMAIL and TEST_USER_PASSWORD to create a test user.');
    return;
  }
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
        name,
        role,
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
