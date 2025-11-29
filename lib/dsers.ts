/**
 * DSers API Integration Service
 * 
 * DSers API Documentation: https://open.dsers.com/
 * 
 * To get your DSers API credentials:
 * 1. Log in to your DSers account at https://www.dsers.com/
 * 2. Go to Settings > API Settings
 * 3. Create a new API application
 * 4. Copy your App Key and App Secret
 */

interface DSersConfig {
  appKey: string;
  appSecret: string;
  storeId?: string;
}

interface DSersProduct {
  product_id: string;
  title: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  images?: string[];
  sku?: string;
  variants?: DSersVariant[];
  status?: string;
  tags?: string[];
}

interface DSersVariant {
  variant_id: string;
  title: string;
  price: number;
  sku?: string;
  inventory_quantity?: number;
}

interface DSersAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class DSersService {
  private config: DSersConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  // Note: DSers does not have a public API. This is a placeholder for CSV/JSON import functionality
  // Real DSers integration would require using their Shopify/WooCommerce apps or manual export
  private baseUrl = 'https://api.dsers.com'; // Placeholder - DSers API may not be publicly available

  constructor(config: DSersConfig) {
    this.config = config;
  }

  /**
   * Authenticate with DSers API and get access token
   */
  private async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_key: this.config.appKey,
          app_secret: this.config.appSecret,
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`DSers authentication failed: ${error}`);
      }

      const data: DSersAuthResponse = await response.json();
      this.accessToken = data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('DSers authentication error:', error);
      throw new Error(`Failed to authenticate with DSers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Make an authenticated request to DSers API
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.authenticate();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DSers API request failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Fetch all products from DSers
   */
  async getProducts(page: number = 1, pageSize: number = 100): Promise<{
    products: DSersProduct[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      if (this.config.storeId) {
        params.append('store_id', this.config.storeId);
      }

      const data = await this.request<any>(`/api/v1/products?${params}`);

      return {
        products: data.products || [],
        total: data.total || 0,
        hasMore: data.has_more || false,
      };
    } catch (error) {
      console.error('Error fetching DSers products:', error);
      throw error;
    }
  }

  /**
   * Fetch all products (handles pagination automatically)
   */
  async getAllProducts(): Promise<DSersProduct[]> {
    const allProducts: DSersProduct[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await this.getProducts(page, 100);
      allProducts.push(...result.products);
      hasMore = result.hasMore;
      page++;

      // Safety check to prevent infinite loops
      if (page > 100) {
        console.warn('Reached maximum page limit (100) when fetching DSers products');
        break;
      }
    }

    return allProducts;
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: string): Promise<DSersProduct> {
    try {
      const data = await this.request<any>(`/api/v1/products/${productId}`);
      return data.product;
    } catch (error) {
      console.error(`Error fetching DSers product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Search products by keyword
   */
  async searchProducts(keyword: string, page: number = 1, pageSize: number = 100): Promise<{
    products: DSersProduct[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const params = new URLSearchParams({
        keyword,
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      if (this.config.storeId) {
        params.append('store_id', this.config.storeId);
      }

      const data = await this.request<any>(`/api/v1/products/search?${params}`);

      return {
        products: data.products || [],
        total: data.total || 0,
        hasMore: data.has_more || false,
      };
    } catch (error) {
      console.error('Error searching DSers products:', error);
      throw error;
    }
  }
}

/**
 * Create a DSers service instance from environment variables
 */
export function createDSersService(): DSersService {
  const appKey = process.env.DSERS_APP_KEY;
  const appSecret = process.env.DSERS_APP_SECRET;
  const storeId = process.env.DSERS_STORE_ID;

  if (!appKey || !appSecret) {
    throw new Error('DSers credentials not configured. Please set DSERS_APP_KEY and DSERS_APP_SECRET environment variables.');
  }

  return new DSersService({
    appKey,
    appSecret,
    storeId,
  });
}
