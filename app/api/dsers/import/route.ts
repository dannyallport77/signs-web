import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createDSersService, DSersService } from '@/lib/dsers';

/**
 * POST /api/dsers/import
 * 
 * Import products from DSers account into the database
 * 
 * Body (optional):
 * {
 *   "appKey": "your-dsers-app-key",     // Optional: override env variable
 *   "appSecret": "your-dsers-app-secret", // Optional: override env variable
 *   "storeId": "your-store-id",         // Optional
 *   "keyword": "search-term",            // Optional: only import matching products
 *   "replaceExisting": true              // Optional: delete existing products first
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    
    let dsersService: DSersService;
    
    // Allow credentials from request body or use environment variables
    if (body.appKey && body.appSecret) {
      const { DSersService: DSersServiceClass } = await import('@/lib/dsers');
      dsersService = new DSersServiceClass({
        appKey: body.appKey,
        appSecret: body.appSecret,
        storeId: body.storeId,
      });
    } else {
      dsersService = createDSersService();
    }

    // Fetch products from DSers
    let dsersProducts;
    if (body.keyword) {
      console.log(`Searching DSers for products matching: ${body.keyword}`);
      const searchResult = await dsersService.searchProducts(body.keyword);
      dsersProducts = searchResult.products;
    } else {
      console.log('Fetching all products from DSers...');
      dsersProducts = await dsersService.getAllProducts();
    }

    console.log(`Found ${dsersProducts.length} products from DSers`);

    // Optionally delete existing products
    if (body.replaceExisting) {
      console.log('Deleting existing products...');
      await prisma.transaction.deleteMany({});
      await prisma.userInventory.deleteMany({});
      await prisma.signType.deleteMany({});
    }

    // Import products into database
    const importedProducts = [];
    const errors = [];

    for (const dsersProduct of dsersProducts) {
      try {
        // Generate a unique ID from DSers product ID
        const id = `dsers-${dsersProduct.product_id}`;
        
        // Map DSers product to SignType schema
        const productData = {
          id,
          name: dsersProduct.title,
          description: dsersProduct.description || null,
          defaultPrice: dsersProduct.price || 0,
          isActive: dsersProduct.status === 'active',
          imageUrl: dsersProduct.images?.[0] || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Upsert the product (create or update if exists)
        const signType = await prisma.signType.upsert({
          where: { id },
          update: productData,
          create: productData,
        });

        importedProducts.push(signType);
        console.log(`Imported product: ${signType.name} (${signType.id})`);
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
      message: `Successfully imported ${importedProducts.length} products from DSers`,
      data: {
        imported: importedProducts.length,
        total: dsersProducts.length,
        errors: errors.length,
        products: importedProducts.map(p => ({
          id: p.id,
          name: p.name,
          price: p.defaultPrice,
        })),
        failedImports: errors,
      },
    });

  } catch (error) {
    console.error('DSers import error:', error);
    
    // Check for specific error types
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
        error: 'Failed to import products from DSers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dsers/import
 * 
 * Test DSers connection and get product count
 */
export async function GET() {
  try {
    const dsersService = createDSersService();
    
    // Fetch first page to test connection and get count
    const result = await dsersService.getProducts(1, 10);

    return NextResponse.json({
      success: true,
      message: 'DSers connection successful',
      data: {
        total: result.total,
        sampleProducts: result.products.slice(0, 5).map(p => ({
          id: p.product_id,
          title: p.title,
          price: p.price,
        })),
      },
    });
  } catch (error) {
    console.error('DSers connection test error:', error);

    if (error instanceof Error && error.message.includes('credentials not configured')) {
      return NextResponse.json(
        {
          success: false,
          error: 'DSers not configured',
          message: 'Please set DSERS_APP_KEY and DSERS_APP_SECRET environment variables.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to DSers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
