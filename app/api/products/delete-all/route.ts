import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';

export async function DELETE() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return admin.response;
  }

  try {
    // First delete all transactions that reference SignType
    const transactionResult = await prisma.transaction.deleteMany({});
    
    // Then delete all UserInventory records that reference SignType
    const inventoryResult = await prisma.userInventory.deleteMany({});
    
    // Finally, delete all SignType records
    const result = await prisma.signType.deleteMany({});
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} products, ${transactionResult.count} transactions, and ${inventoryResult.count} inventory records`,
      counts: {
        products: result.count,
        transactions: transactionResult.count,
        inventory: inventoryResult.count
      }
    });
  } catch (error) {
    console.error('Error deleting products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete products' },
      { status: 500 }
    );
  }
}
