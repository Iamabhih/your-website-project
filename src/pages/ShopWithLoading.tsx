import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { GridSkeleton } from '@/components/LoadingSkeletons';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string | null;
  pack_info: string | null;
  min_quantity: number;
}

/**
 * Enhanced Shop page with loading state management system
 * 
 * This is an example of how to integrate the loading system into existing pages:
 * 1. Uses useAsyncOperation for data fetching
 * 2. Shows GridSkeleton while loading
 * 3. Displays toast notifications for errors
 */
export default function ShopWithLoading() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const { execute: loadProducts, loading } = useAsyncOperation(
    fetchProducts,
    {
      loadingKey: 'shop-products',
      errorMessage: 'Failed to load products',
      onSuccess: () => {
        // Products loaded successfully
      }
    }
  );

  useEffect(() => {
    const fetchData = async () => {
      const data = await loadProducts();
      if (data) {
        setProducts(data);
      }
    };
    fetchData();
  }, []);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Our Products</h1>
            <p className="text-muted-foreground">
              Browse our collection of premium products
            </p>
          </div>

          <Tabs defaultValue="all" className="mb-8" onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start overflow-x-auto">
              {categories.map(category => (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="capitalize"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            {loading ? (
              <TabsContent value={selectedCategory} className="mt-6">
                <GridSkeleton items={8} />
              </TabsContent>
            ) : (
              <TabsContent value={selectedCategory} className="mt-6">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-lg text-muted-foreground">
                      No products found in this category
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} {...product} />
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
