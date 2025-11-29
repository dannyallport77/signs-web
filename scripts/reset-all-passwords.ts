import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const newPassword = 'password123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log('Resetting all user passwords to "password123"...');
    
    const result = await prisma.user.updateMany({
      data: {
        password: hashedPassword
      }
    });

    console.log(`✅ Successfully updated ${result.count} user(s) password(s)`);
    console.log(`New password: ${newPassword}`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
