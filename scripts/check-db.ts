
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Connected successfully.');

    const email = process.env.CHECK_EMAIL;
    const password = process.env.CHECK_PASSWORD;

    if (!email) {
      console.log('⚠️  Set CHECK_EMAIL to look up a user.');
      return;
    }
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      console.log(`User ${email} found. Active: ${user.active}`);
      if (password) {
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`Password match: ${isMatch}`);
      } else {
        console.log('No CHECK_PASSWORD provided. Skipping password check.');
      }
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
