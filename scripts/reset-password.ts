/**
 * Create or Reset User Password Script
 * 
 * Usage: npx tsx scripts/reset-password.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = 'dannyallport@icloud.com';
  const newPassword = 'Verify123!';
  const name = 'Danny Allport';
  
  console.log(`🔄 Creating/Resetting password for ${email}...`);
  
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Upsert user (create if doesn't exist, update if exists)
    const user = await prisma.user.upsert({
      where: { email },
      update: { 
        password: hashedPassword 
      },
      create: {
        email,
        name,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    
    console.log(`✅ User created/updated successfully!`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
