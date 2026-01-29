/**
 * Create or Reset User Password Script
 * 
 * Usage: npx tsx scripts/reset-password.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = process.env.RESET_EMAIL;
  const newPassword = process.env.RESET_PASSWORD;
  const name = process.env.RESET_NAME || undefined;
  const role = process.env.RESET_ROLE || undefined;

  if (!email || !newPassword) {
    console.log('⚠️  Set RESET_EMAIL and RESET_PASSWORD to reset a user password.');
    return;
  }
  
  console.log(`🔄 Creating/Resetting password for ${email}...`);
  
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Upsert user (create if doesn't exist, update if exists)
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        ...(name ? { name } : {}),
        ...(role ? { role } : {}),
      },
      create: {
        email,
        ...(name ? { name } : {}),
        password: hashedPassword,
        ...(role ? { role } : {}),
      },
    });
    
    console.log(`✅ User created/updated successfully!`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${user.name || '-'}`);
    console.log(`   Role: ${user.role}`);
    console.log('   Password updated');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
