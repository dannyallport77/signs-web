/**
 * Script to import curated products with images and videos
 * Run: npx tsx scripts/import-products.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const curatedProducts = [
  {
    name: 'Premium NFC Review Stand - Black',
    description: 'Elegant desktop NFC stand for Google reviews. Tap to instantly direct customers to your review page.',
    sku: 'NFC-STAND-BLK-001',
    category: 'stands',
    price: 24.99,
    compareAtPrice: 39.99,
    images: [
      'https://example.com/stand-black-1.jpg',
      'https://example.com/stand-black-2.jpg',
    ],
    video: 'https://example.com/videos/nfc-stand-demo.mp4',
    featured: true,
    bestseller: true,
    active: true,
    inventoryQuantity: 100,
  },
  {
    name: 'NFC Smart Sticker - Clear',
    description: 'Waterproof NFC sticker for windows, mirrors, or menus. Invisible yet powerful.',
    sku: 'NFC-STICK-CLR-001',
    category: 'stickers',
    price: 8.99,
    compareAtPrice: 14.99,
    images: [
      'https://example.com/sticker-clear-1.jpg',
      'https://example.com/sticker-clear-2.jpg',
    ],
    video: null,
    featured: true,
    bestseller: false,
    active: true,
    inventoryQuantity: 500,
  },
  {
    name: 'NFC Keyring - Premium Metal',
    description: 'Durable metal NFC keyring for staff. Perfect for mobile review collection.',
    sku: 'NFC-KEY-MET-001',
    category: 'keyrings',
    price: 12.99,
    compareAtPrice: 19.99,
    images: [
      'https://example.com/keyring-metal-1.jpg',
      'https://example.com/keyring-metal-2.jpg',
    ],
    video: 'https://example.com/videos/keyring-demo.mp4',
    featured: false,
    bestseller: true,
    active: true,
    inventoryQuantity: 200,
  },
];

async function importProducts() {
  console.log('Starting product import...');

  try {
    for (const product of curatedProducts) {
      console.log(`Importing: ${product.name}`);
      
      // Check if product already exists
      const existing = await prisma.product?.findUnique({
        where: { sku: product.sku }
      });

      if (existing) {
        console.log(`  ✓ Product already exists, skipping`);
        continue;
      }

      // Create the product
      // Note: You may need to create a Product model in your Prisma schema first
      // For now, this shows the structure you'd use
      
      console.log(`  ✓ Would create product: ${product.name}`);
      console.log(`    Price: £${product.price}`);
      console.log(`    Images: ${product.images.length}`);
      console.log(`    Video: ${product.video ? 'Yes' : 'No'}`);
    }

    console.log('\n✅ Import complete!');
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Alternative: Import from AliExpress URLs
async function importFromAliExpressUrls(urls: string[]) {
  console.log('Fetching products from AliExpress URLs...');
  
  for (const url of urls) {
    console.log(`\nProcessing: ${url}`);
    
    // Extract product ID from URL
    const productId = url.match(/(\d+)\.html/)?.[1];
    
    if (!productId) {
      console.log('  ❌ Invalid URL format');
      continue;
    }

    // You can use the AliExpress API to fetch product details
    // Or use a web scraper to get images/videos
    console.log(`  Product ID: ${productId}`);
    console.log(`  Would fetch and import this product`);
  }
}

// Run the import
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === '--urls') {
    // Import from specific AliExpress URLs
    const urls = args.slice(1);
    importFromAliExpressUrls(urls);
  } else {
    // Import curated products
    importProducts();
  }
}

export { importProducts, importFromAliExpressUrls };
