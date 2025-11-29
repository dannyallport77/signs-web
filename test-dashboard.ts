import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing corrected dashboard queries...');
    
    const userId = (await prisma.user.findFirst())?.id;
    if (!userId) {
      console.log('No users found');
      return;
    }
    
    // Test sales trend with correct column names
    const salesTrend = await prisma.$queryRaw`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as sales,
        COALESCE(SUM("salePrice"), 0) as revenue
      FROM "Transaction"
      WHERE status = 'success'
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt")
    `;
    
    console.log('✅ Sales Trend:', (salesTrend as any).length, 'days');
    (salesTrend as any).forEach((d: any) => {
      console.log('  -', d.date, '- Sales:', d.sales, 'Revenue: $' + d.revenue);
    });
    
    // Test sign popularity
    const signPopularity = await prisma.$queryRaw`
      SELECT
        st.name as sign_type,
        COUNT(t.id) as quantity,
        COALESCE(SUM(t."salePrice"), 0) as revenue
      FROM "Transaction" t
      JOIN "SignType" st ON t."signTypeId" = st.id
      WHERE t.status = 'success'
      GROUP BY st.id, st.name
      ORDER BY quantity DESC
      LIMIT 10
    `;
    
    console.log('\n✅ Sign Popularity:', (signPopularity as any).length, 'types');
    (signPopularity as any).forEach((s: any) => {
      console.log('  -', s.sign_type, ':', s.quantity, 'sales, $' + s.revenue);
    });
    
    // Test top users
    const topUsers = await prisma.$queryRaw`
      SELECT
        u.id as user_id,
        u.name,
        COUNT(t.id) as total_sales,
        COALESCE(SUM(t."salePrice"), 0) as total_revenue
      FROM "User" u
      LEFT JOIN "Transaction" t ON u.id = t."userId"
      WHERE u.active = true
      GROUP BY u.id, u.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `;
    
    console.log('\n✅ Top Users:', (topUsers as any).length, 'users');
    (topUsers as any).forEach((u: any) => {
      console.log('  -', u.name, ':', u.total_sales, 'sales, $' + u.total_revenue);
    });
    
    console.log('\n✅ All dashboard API queries fixed and working!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
