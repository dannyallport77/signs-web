import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/dsers/import-csv
 * 
 * Import products from DSers CSV export
 * 
 * Body:
 * {
 *   "csvData": "product_id,title,description,price,image_url\n...",
 *   "replaceExisting": false
 * }
 * 
 * Or use FormData with a file upload:
 * FormData: { file: <csv-file>, replaceExisting: "true" }
 */
export async function POST(request: Request) {
  try {
    let csvData: string;
    let replaceExisting = false;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      replaceExisting = formData.get('replaceExisting') === 'true';

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        );
      }

      csvData = await file.text();
    } else {
      // Handle JSON body
      const body = await request.json();
      csvData = body.csvData;
      replaceExisting = body.replaceExisting || false;

      if (!csvData) {
        return NextResponse.json(
          { success: false, error: 'No CSV data provided' },
          { status: 400 }
        );
      }
    }

    // Parse CSV data
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Invalid CSV format - must have header and at least one data row' },
        { status: 400 }
      );
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    
    // Find column indices
    const getColumnIndex = (possibleNames: string[]) => {
      for (const name of possibleNames) {
        const index = headers.indexOf(name);
        if (index !== -1) return index;
      }
      return -1;
    };

    const idIndex = getColumnIndex(['product_id', 'id', 'sku', 'product id']);
    const titleIndex = getColumnIndex(['title', 'name', 'product_name', 'product name']);
    const priceIndex = getColumnIndex(['price', 'cost', 'amount']);
    const descIndex = getColumnIndex(['description', 'desc', 'details']);
    const imageIndex = getColumnIndex(['image', 'image_url', 'imageurl', 'photo', 'picture']);

    if (titleIndex === -1 || priceIndex === -1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'CSV must contain at minimum: title/name and price columns',
          foundHeaders: headers 
        },
        { status: 400 }
      );
    }

    // Optionally delete existing products
    if (replaceExisting) {
      console.log('Deleting existing products...');
      await prisma.transaction.deleteMany({});
      await prisma.userInventory.deleteMany({});
      await prisma.signType.deleteMany({});
    }

    // Import products
    const importedProducts = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Simple CSV parser (handles basic comma-separated values)
        // For more complex CSVs with quoted fields containing commas, use a CSV library
        const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));

        const productId = idIndex >= 0 ? values[idIndex] : `csv-import-${i}`;
        const title = values[titleIndex];
        const priceStr = values[priceIndex];
        const description = descIndex >= 0 ? values[descIndex] : null;
        const imageUrl = imageIndex >= 0 ? values[imageIndex] : null;

        if (!title || !priceStr) {
          errors.push({
            line: i + 1,
            error: 'Missing required fields (title or price)',
            data: line.substring(0, 100)
          });
          continue;
        }

        // Parse price (remove currency symbols and convert to number)
        const price = parseFloat(priceStr.replace(/[^0-9.-]/g, ''));
        if (isNaN(price)) {
          errors.push({
            line: i + 1,
            error: `Invalid price: ${priceStr}`,
            data: line.substring(0, 100)
          });
          continue;
        }

        const id = `dsers-${productId}`;

        const productData = {
          id,
          name: title,
          description,
          defaultPrice: price,
          isActive: true,
          imageUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const signType = await prisma.signType.upsert({
          where: { id },
          update: productData,
          create: productData,
        });

        importedProducts.push(signType);
        console.log(`Imported: ${signType.name} - $${signType.defaultPrice}`);

      } catch (error) {
        console.error(`Error importing line ${i + 1}:`, error);
        errors.push({
          line: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: line.substring(0, 100)
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedProducts.length} products from CSV`,
      data: {
        imported: importedProducts.length,
        total: lines.length - 1, // Exclude header
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
    console.error('CSV import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import products from CSV',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
