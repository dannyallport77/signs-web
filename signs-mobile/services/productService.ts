import AsyncStorage from '@react-native-async-storage/async-storage';
import { productVariants } from '../config/productVariants';
import { Product, ProductVariant } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.110:3000/api';
const STOCK_KEY = 'product_stock_levels';

type ApiProduct = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  imageUrl?: string;
  sku?: string;
  groupType?: string;
};

function mapToProduct(apiProduct: ApiProduct): Product {
  const basePrice = apiProduct.price ?? 0;
  const variants = getVariantsForProduct(apiProduct.id, basePrice);
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    description: apiProduct.description || 'Standard digital sign',
    basePrice,
    rrp: apiProduct.originalPrice,
    sku: apiProduct.sku,
    imageUrl: apiProduct.imageUrl,
    groupType: apiProduct.groupType || 'Default',
    variants,
  };
}

function getVariantsForProduct(productId: string, basePrice: number): ProductVariant[] {
  const overrides = productVariants[productId];
  if (overrides && overrides.length > 0) {
    return overrides.map((variant) => ({
      ...variant,
      priceDelta: variant.priceDelta ?? 0,
    }));
  }

  return [
    {
      id: `${productId}-default`,
      label: 'Standard',
      description: 'Single-sided NFC tag',
      priceDelta: 0,
    },
    {
      id: `${productId}-premium`,
      label: 'Premium',
      description: 'High-gloss durable vinyl sign',
      priceDelta: 20,
    },
  ].map((variant) => ({
    ...variant,
    priceDelta: variant.priceDelta ?? 0,
  }));
}

export const productService = {
  async fetchProducts(): Promise<Product[]> {
    try {
      let token = '';
      try {
        token = await AsyncStorage.getItem('authToken') || '';
      } catch (storageError) {
        console.error('Error retrieving auth token:', storageError);
      }
      console.log('Fetching products from:', `${API_URL}/mobile/products`);
      
      const response = await fetch(`${API_URL}/mobile/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Products response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Products API error:', errorText);
        throw new Error(`Failed to load products: ${response.status}`);
      }

      const payload = await response.json();
      console.log('Products payload:', JSON.stringify(payload, null, 2));

      if (!payload.success || !payload.data) {
        throw new Error('Invalid response from server');
      }

      if (payload.data.length === 0) {
        throw new Error('No products available. Please contact support.');
      }

      const items: ApiProduct[] = payload.data.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        imageUrl: product.imageUrl,
        sku: product.sku,
        groupType: product.groupType,
      }));

      return items.map(mapToProduct);
    } catch (error) {
      console.error('Product fetch error:', error);
      throw error;
    }
  },
};
