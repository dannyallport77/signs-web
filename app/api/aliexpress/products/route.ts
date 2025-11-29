import { NextResponse } from 'next/server';
import crypto from 'crypto';

// AliExpress API credentials from environment variables
const ALIEXPRESS_APP_KEY = process.env.ALIEXPRESS_APP_KEY;
const ALIEXPRESS_APP_SECRET = process.env.ALIEXPRESS_APP_SECRET;
const ALIEXPRESS_API_URL = process.env.ALIEXPRESS_API_URL || 'https://api-sg.aliexpress.com/sync';

interface AliExpressProduct {
  product_id: string;
  product_title: string;
  product_main_image_url: string;
  product_video_url?: string;
  target_sale_price: string;
  target_original_price?: string;
  evaluate_rate?: string;
  shop_url?: string;
  product_detail_url: string;
}

interface AliExpressResponse {
  result?: {
    products?: {
      product: AliExpressProduct[];
    };
  };
  error_response?: {
    code: number;
    msg: string;
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keywords = searchParams.get('keywords') || 'nfc signs desktop review';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Check if API credentials are configured
    if (!ALIEXPRESS_APP_KEY || !ALIEXPRESS_APP_SECRET) {
      console.error('AliExpress API credentials not configured');
      return NextResponse.json(
        { success: false, error: 'AliExpress API credentials not configured' },
        { status: 500 }
      );
    }

    // Call AliExpress API
    const timestamp = Date.now();
    const params: Record<string, string> = {
      app_key: ALIEXPRESS_APP_KEY!,
      method: 'aliexpress.affiliate.product.query',
      timestamp: timestamp.toString(),
      format: 'json',
      v: '2.0',
      sign_method: 'md5',
      keywords,
      category_ids: category,
      page_no: page.toString(),
      page_size: pageSize.toString(),
      sort: 'default',
      target_currency: 'GBP',
      target_language: 'EN',
      ship_to_country: 'GB'
    };

    // Generate signature for AliExpress API
    const sign = generateAliExpressSignature(params, ALIEXPRESS_APP_SECRET!);
    params.sign = sign;

    const queryString = new URLSearchParams(params).toString();

    const response = await fetch(`${ALIEXPRESS_API_URL}?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`AliExpress API error: ${response.statusText}`);
    }

    const data: AliExpressResponse = await response.json();

    if (data.error_response) {
      throw new Error(`AliExpress API error: ${data.error_response.msg}`);
    }

    const products = data.result?.products?.product || [];
    
    // Transform AliExpress products to our format
    const transformedProducts = products.map((product) => ({
      id: product.product_id,
      title: product.product_title,
      description: null,
      customPrice: null,
      price: parseFloat(product.target_sale_price),
      compareAtPrice: product.target_original_price 
        ? parseFloat(product.target_original_price) 
        : null,
      active: true,
      featured: false,
      bestseller: parseFloat(product.evaluate_rate || '0') > 4.5,
      newArrival: false,
      images: [product.product_main_image_url],
      video: product.product_video_url || null,
      inventoryQuantity: 999,
      shopUrl: product.shop_url,
      detailUrl: product.product_detail_url,
      rating: product.evaluate_rate,
      source: 'aliexpress'
    }));

    return NextResponse.json({
      success: true,
      data: transformedProducts,
      total: 1000, // AliExpress doesn't always provide exact total
      page,
      pageSize,
      source: 'aliexpress'
    });

  } catch (error) {
    console.error('Error fetching from AliExpress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products from AliExpress' },
      { status: 500 }
    );
  }
}

function generateAliExpressSignature(params: Record<string, string>, secret: string): string {
  // AliExpress Open API signature generation:
  // 1. Sort parameters alphabetically by key
  // 2. Concatenate: secret + key1 + value1 + key2 + value2 + ... + secret
  // 3. Generate MD5 hash and convert to uppercase

  const sortedKeys = Object.keys(params).sort();
  
  let signString = secret;
  for (const key of sortedKeys) {
    signString += key + params[key];
  }
  signString += secret;

  // Generate MD5 hash
  return crypto.createHash('md5').update(signString).digest('hex').toUpperCase();
}
