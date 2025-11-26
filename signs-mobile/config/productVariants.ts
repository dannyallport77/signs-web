export interface VariantOption {
  id: string;
  label: string;
  description?: string;
  priceDelta?: number; // relative to base product
}

export const productVariants: Record<string, VariantOption[]> = {
  // Custom variant options keyed by product ID
  // These can be refined by fetching from Shopify API if available
};
