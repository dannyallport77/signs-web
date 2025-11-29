import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllProducts() {
  console.log('🗑️  Deleting all sign types/products...');

  try {
    const result = await prisma.signType.deleteMany({});
    console.log(`✅ Deleted ${result.count} products from the database`);
  } catch (error) {
    console.error('❌ Error deleting products:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllProducts();
