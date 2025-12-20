/**
 * List Users Script
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    
    console.log(`\n📋 Found ${users.length} user(s):\n`);
    
    if (users.length === 0) {
      console.log('   No users found in database.');
    } else {
      users.forEach(user => {
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name || '(no name)'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt.toISOString()}`);
        console.log('   ---');
      });
    }
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
