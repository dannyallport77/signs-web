'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

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
  rating?: string;
}

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const priceFormatter = useMemo(
    () => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
    []
  );

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  const fetchProduct = async (id: string) => {
    try {
      // Since we don't have a direct ID endpoint yet, we'll fetch the list and find it
      // In a real app, this should be a direct API call by ID
      const response = await fetch('/api/aliexpress/products?keywords=nfc+signs&pageSize=50');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        const foundProduct = data.data.find((p: any) => p.id === id);
        
        if (foundProduct) {
          const normalizedProduct: Product = {
            id: foundProduct.id,
            title: foundProduct.title,
            description: foundProduct.description ?? "Boost your business reviews with this premium NFC sign. Easy to setup, no app required, and works with all modern smartphones.",
            customPrice: foundProduct.customPrice,
            price: foundProduct.price,
            compareAtPrice: foundProduct.compareAtPrice,
            active: foundProduct.active,
            featured: foundProduct.featured,
            bestseller: foundProduct.bestseller,
            newArrival: foundProduct.newArrival,
            images: Array.isArray(foundProduct.images) ? foundProduct.images : [],
            video: foundProduct.video,
            inventoryQuantity: foundProduct.inventoryQuantity,
            rating: foundProduct.rating
          };
          setProduct(normalizedProduct);
          setSelectedImage(normalizedProduct.images[0]);
        } else {
          setError('Product not found');
        }
      } else {
        setError('Failed to load product');
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      setError('Failed to fetch product details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

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
    router.push('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">{error || "The product you're looking for doesn't exist."}</p>
          <button 
            onClick={() => router.push('/products')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Store
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden">
              {selectedImage ? (
                <Image
                  src={selectedImage}
                  alt={product.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
              )}
              {product.video && (
                 <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1">
                   <span>🎥</span> Video Available
                 </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === img ? 'border-indigo-600' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <Image src={img} alt={`View ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="text-3xl font-bold text-indigo-600">
                {priceFormatter.format(product.customPrice ?? product.price)}
              </div>
              {product.compareAtPrice && (
                <div className="text-xl text-gray-400 line-through">
                  {priceFormatter.format(product.compareAtPrice)}
                </div>
              )}
              {product.rating && (
                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded text-yellow-700 text-sm font-medium">
                  <span>⭐</span> {product.rating}
                </div>
              )}
            </div>

            <div className="prose prose-indigo text-gray-600 mb-8">
              <p>{product.description}</p>
              <ul className="list-disc pl-5 space-y-2 mt-4">
                <li>Instant Google Review access via NFC</li>
                <li>No app required for customers</li>
                <li>Works with iPhone and Android</li>
                <li>Durable, high-quality material</li>
                <li>Easy setup in under 2 minutes</li>
              </ul>
            </div>

            <div className="mt-auto space-y-4">
              <button
                onClick={handleAddToCart}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-transform active:scale-95 shadow-lg shadow-indigo-200"
              >
                Add to Cart
              </button>
              <p className="text-center text-sm text-gray-500">
                Free shipping on orders over £50 • 30-day money-back guarantee
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductDetailContent />
    </Suspense>
  );
}
