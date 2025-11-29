
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const email = 'admin@example.com';
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
