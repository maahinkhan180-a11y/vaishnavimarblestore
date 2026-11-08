import { useEffect, useMemo, useState } from 'react';
import { Search, Loader } from 'lucide-react';

import type { Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { api } from '@/lib/api';

function normalizeParam(value?: string | null) {
  return value ? decodeURIComponent(value.trim()) : '';
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function ProductsPage({ category, search }: { category?: string | null; search?: string | null }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryLabel = normalizeParam(category);
  const searchTerm = normalizeParam(search);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        setLoading(true);

        let results: Product[] = [];

        if (searchTerm) {
          const data = await api.searchProducts(searchTerm);
          results = Array.isArray(data) ? data : [];
        } else if (categoryLabel) {
          const categories = await api.getCategories();
          const match = categories.find(item => {
            const normalizedName = item.name.toLowerCase();
            const normalizedCategory = categoryLabel.toLowerCase();
            return item.slug === slugify(categoryLabel)
              || normalizedName === normalizedCategory
              || slugify(item.name) === slugify(categoryLabel);
          });

          if (match) {
            const data = await api.getProducts({ category_id: match.id });
            results = Array.isArray(data) ? data : [];
          } else {
            const data = await api.getProducts();
            results = Array.isArray(data) ? data : [];
          }
        } else {
          const data = await api.getProducts();
          results = Array.isArray(data) ? data : [];
        }

        if (active) {
          setProducts(results);
        }
      } catch (error) {
        console.error('Product listing error:', error);
        if (active) {
          setProducts([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      active = false;
    };
  }, [categoryLabel, searchTerm]);

  const title = useMemo(() => {
    if (searchTerm) return `Search results for "${searchTerm}"`;
    if (categoryLabel) return categoryLabel;
    return 'All products';
  }, [categoryLabel, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8"> 
      <div className="mb-6 flex items-center gap-3">
        <Search size={24} className="text-stone-400" />
        <h1 className="text-3xl font-bold text-stone-800">{title}</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="rounded-xl border border-stone-200 bg-white p-3 animate-pulse">
              <div className="h-48 rounded-lg bg-stone-200" />
              <div className="mt-3 h-4 w-3/4 rounded bg-stone-200" />
              <div className="mt-2 h-4 w-1/2 rounded bg-stone-200" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-16 text-center">
          <Loader size={24} className="mx-auto mb-4 animate-spin text-stone-500" />
          <p className="text-lg font-medium text-stone-700">No products found</p>
          <p className="mt-2 text-sm text-stone-500">Try another category or a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
