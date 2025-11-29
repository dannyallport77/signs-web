
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Connected successfully.');

    const email = 'admin@example.com';
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      console.log(`User ${email} found. Active: ${user.active}`);
      const isMatch = await bcrypt.compare('admin123', user.password);
      console.log(`Password 'admin123' match: ${isMatch}`);
    } else {
      console.log(`User ${email} not found.`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
