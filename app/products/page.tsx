'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

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
  video?: string | null;
  inventoryQuantity?: number;
}

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || 'all';

  const priceFormatter = useMemo(
    () => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
    []
  );

  useEffect(() => {
    fetchProducts(category);
  }, [category]);

  const fetchProducts = async (selectedCategory: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
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
          video: product.video,
          inventoryQuantity: product.inventoryQuantity,
        }));
        
        setProducts(normalizedProducts);
        setError(null);
      } else {
        setError(data.error || 'Failed to load products');
        setProducts([]);
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
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
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
    alert(`${product.title} added to cart!`);
  };

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'stands', name: 'Countertop Signs' },
    { id: 'stickers', name: 'Smart Stickers' },
    { id: 'keyrings', name: 'Digital Keyrings' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-gray-50 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shop NFC Solutions</h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Boost your reviews and social media presence with our range of smart NFC products.
          </p>
          
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => router.push(`/products?category=${cat.id}`)}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  category === cat.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {!loading && error && (
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => fetchProducts(category)}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 group"
              >
                <div className="relative h-64 w-full overflow-hidden bg-gray-100">
                    {product.video && (
                      <div className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      sizes="(min-width: 1280px) 20vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 h-10">
                    {product.title}
                  </h3>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-lg font-bold text-indigo-600">
                      {formatPrice(product.customPrice ?? product.price)}
                    </p>
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found in this category.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
