'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  title: string;
  description: string | null;
  customPrice: number | null;
  price: number;
  compareAtPrice?: number | null;
  active: boolean;
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  images: string[];
  inventoryQuantity?: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestsellerProducts, setBestsellerProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const priceFormatter = useMemo(
    () => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
    []
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Fetch from AliExpress API with default search for NFC signs
      const response = await fetch('/api/aliexpress/products?keywords=nfc+smart+review+signs+desktop&pageSize=20');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        const normalizedProducts: Product[] = data.data.map((product: any) => ({
          id: product.id,
          title: product.title,
          description: product.description ?? null,
          customPrice: product.customPrice,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          active: product.active,
          featured: product.featured,
          bestseller: product.bestseller,
          newArrival: product.newArrival,
          images: Array.isArray(product.images) ? product.images : [],
          inventoryQuantity: product.inventoryQuantity,
        }));
        
        setProducts(normalizedProducts);
        setFeaturedProducts(normalizedProducts.filter((p) => p.featured).slice(0, 3));
        setBestsellerProducts(normalizedProducts.filter((p) => p.bestseller).slice(0, 6));
        setError(null);
      } else {
        setError(data.error || 'Failed to load products');
        setProducts([]);
        setFeaturedProducts([]);
        setBestsellerProducts([]);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setError('Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null || Number.isNaN(price)) return 'Contact for pricing';
    return priceFormatter.format(price);
  };

  const handleViewProduct = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  const handleAddToCart = (product: Product) => {
    // Get current cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product already in cart
    const existingItem = cart.find((item: any) => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: product.customPrice ?? product.price,
        image: product.images?.[0],
        quantity: 1
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Optional: Show toast notification
    alert(`${product.title} added to cart!`);
    
    // Optional: Navigate to cart
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Smart NFC 
                <span className="text-indigo-600"> Desktop Signs</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Revolutionize customer reviews with our intelligent NFC-enabled desktop signs. 
                Simply tap to instantly connect customers to your Google Business reviews.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105">
                  Get Your Signs Today
                </button>
                <button className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all">
                  View Demo
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-8 shadow-2xl">
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="w-full h-auto rounded-xl shadow-lg"
                >
                  <source src="/Sb6a96e1b265d4f188db79667e0b1f2ccJ/0.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!loading && error && (
        <section className="bg-red-50 py-6">
          <div className="mx-auto max-w-4xl px-4">
            <p className="text-red-700">{error}</p>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {!loading && featuredProducts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-12">Featured Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow"
                >
                  <div className="relative h-64 w-full overflow-hidden rounded-t-lg bg-gray-200">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        sizes="(min-width: 1024px) 25vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                        No image
                      </div>
                    )}
                    {product.newArrival && (
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        New
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-2xl font-bold text-indigo-600 mb-4">
                      {formatPrice(product.customPrice ?? product.price)}
                    </p>
                    <button 
                      onClick={() => handleViewProduct(product.id)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      View Product
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bestsellers Section */}
      {!loading && bestsellerProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-12">Bestsellers</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {bestsellerProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-gray-200">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        sizes="(min-width: 1024px) 25vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                        No image
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Bestseller
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-2xl font-bold text-indigo-600 mb-4">
                      {formatPrice(product.customPrice ?? product.price)}
                    </p>
                    <button 
                      onClick={() => handleViewProduct(product.id)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      View Product
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Products Section */}
      {!loading && products.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-12">All Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-56 w-full overflow-hidden rounded-t-lg bg-gray-200">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        sizes="(min-width: 1280px) 20vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-lg font-bold text-indigo-600 mb-3">
                      {formatPrice(product.customPrice ?? product.price)}
                    </p>
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded text-sm font-semibold transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Loading State */}
      {loading && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-600">Loading products...</p>
          </div>
        </section>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-600 text-xl">No products available at this time.</p>
          </div>
        </section>
      )}
    </div>
  );
}
