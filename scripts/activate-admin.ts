
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const email = process.env.ADMIN_EMAIL;
    if (!email) {
      console.log('⚠️  Set ADMIN_EMAIL to activate a user.');
      return;
    }
    console.log(`Activating user ${email}...`);
    
    const user = await prisma.user.update({
      where: { email },
      data: { active: true }
    });

    console.log(`User ${email} is now active: ${user.active}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
