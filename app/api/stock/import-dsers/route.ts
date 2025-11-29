import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createDSersService } from '@/lib/dsers';

/**
 * POST /api/stock/import-dsers
 * 
 * Import products from DSers directly into StockItem inventory
 * 
 * Body (optional):
 * {
 *   "appKey": "your-dsers-app-key",          // Optional: override env variable
 *   "appSecret": "your-dsers-app-secret",    // Optional: override env variable
 *   "storeId": "your-store-id",              // Optional
 *   "keyword": "search-term",                // Optional: only import matching products
 *   "initialQuantity": 10,                   // Optional: initial stock quantity per item (default: 0)
 *   "minQuantity": 5,                        // Optional: low stock threshold (default: 10)
 *   "location": "Warehouse A",               // Optional: physical location for all items
 *   "replaceExisting": false,                // Optional: if true, overwrite existing SKUs (default: false)
 * }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    
    // Extract parameters with defaults
    const {
      keyword,
      initialQuantity = 0,
      minQuantity = 10,
      location,
      replaceExisting = false,
      appKey,
      appSecret,
      storeId,
    } = body;

    // Initialize DSers service
    let dsersService;
    if (appKey && appSecret) {
      const { DSersService: DSersServiceClass } = await import('@/lib/dsers');
      dsersService = new DSersServiceClass({
        appKey,
        appSecret,
        storeId,
      });
    } else {
      dsersService = createDSersService();
    }

    // Fetch products from DSers
    console.log(keyword ? `Searching DSers for: ${keyword}` : 'Fetching all DSers products...');
    let dsersProducts;
    if (keyword) {
      const searchResult = await dsersService.searchProducts(keyword);
      dsersProducts = searchResult.products;
    } else {
      dsersProducts = await dsersService.getAllProducts();
    }

    console.log(`Found ${dsersProducts.length} products from DSers`);

    const importedItems = [];
    const errors = [];
    const skipped = [];

    // Process each DSers product
    for (const dsersProduct of dsersProducts) {
      try {
        // Generate SKU from DSers product ID
        const sku = `DSERS-${dsersProduct.product_id}`;

        // Check if SKU already exists
        const existing = await prisma.stockItem.findUnique({
          where: { sku }
        });

        if (existing && !replaceExisting) {
          skipped.push({
            sku,
            title: dsersProduct.title,
            reason: 'SKU already exists',
          });
          continue;
        }

        // Prepare stock item data
        const itemData = {
          name: dsersProduct.title,
          description: dsersProduct.description || undefined,
          sku,
          quantity: parseInt(String(initialQuantity)),
          minQuantity: parseInt(String(minQuantity)),
          location: location || undefined,
        };

        // Create or update stock item
        let stockItem;
        if (existing && replaceExisting) {
          // Update existing item
          stockItem = await prisma.stockItem.update({
            where: { sku },
            data: {
              name: itemData.name,
              description: itemData.description,
              minQuantity: itemData.minQuantity,
              location: itemData.location,
              // Note: quantity is not updated via PATCH to preserve manual adjustments
            },
          });
          console.log(`Updated stock item: ${stockItem.name} (${stockItem.sku})`);
        } else {
          // Create new item
          stockItem = await prisma.stockItem.create({
            data: {
              name: itemData.name,
              description: itemData.description,
              sku: itemData.sku,
              quantity: itemData.quantity,
              minQuantity: itemData.minQuantity,
              location: itemData.location,
            },
          });

          // Create initial stock movement if quantity > 0
          if (itemData.quantity > 0) {
            await prisma.stockMovement.create({
              data: {
                stockItemId: stockItem.id,
                userId: (session.user as any).id,
                type: 'in',
                quantity: itemData.quantity,
                reason: `Imported from DSers: ${dsersProduct.product_id}`,
              },
            });
          }

          console.log(`Created stock item: ${stockItem.name} (${stockItem.sku})`);
        }

        importedItems.push({
          id: stockItem.id,
          sku: stockItem.sku,
          name: stockItem.name,
          quantity: stockItem.quantity,
          minQuantity: stockItem.minQuantity,
        });
      } catch (error) {
        console.error(`Error importing product ${dsersProduct.product_id}:`, error);
        errors.push({
          productId: dsersProduct.product_id,
          title: dsersProduct.title,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedItems.length} products into stock`,
      data: {
        imported: importedItems.length,
        skipped: skipped.length,
        errors: errors.length,
        total: dsersProducts.length,
        items: importedItems,
        skippedItems: skipped.length > 0 ? skipped : undefined,
        failedImports: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('Stock import error:', error);

    if (error instanceof Error) {
      if (error.message.includes('credentials not configured')) {
        return NextResponse.json(
          {
            success: false,
            error: 'DSers credentials not configured',
            message: 'Please set DSERS_APP_KEY and DSERS_APP_SECRET environment variables or provide them in the request body.',
          },
          { status: 400 }
        );
      }

      if (error.message.includes('authentication failed')) {
        return NextResponse.json(
          {
            success: false,
            error: 'DSers authentication failed',
            message: 'Invalid DSers credentials. Please check your App Key and App Secret.',
          },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import from DSers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
