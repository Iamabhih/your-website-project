import { useEffect } from 'react';

interface ProductStructuredDataProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string | null;
    category: string;
    average_rating?: number;
    review_count?: number;
    stock_quantity: number;
  };
}

/**
 * ProductStructuredData Component
 *
 * Adds Schema.org Product structured data (JSON-LD) for SEO
 * This helps search engines understand product information and enables rich snippets
 */
export default function ProductStructuredData({ product }: ProductStructuredDataProps) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.image_url || undefined,
      sku: product.id,
      category: product.category,
      brand: {
        '@type': 'Brand',
        name: 'Ideal Smoke Supply',
      },
      offers: {
        '@type': 'Offer',
        url: `${window.location.origin}/product/${product.id}`,
        priceCurrency: 'ZAR',
        price: product.price.toFixed(2),
        availability:
          product.stock_quantity > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'Ideal Smoke Supply',
        },
      },
    };

    // Add aggregateRating if reviews exist
    if (product.average_rating && product.review_count && product.review_count > 0) {
      (structuredData as any).aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: product.average_rating.toFixed(1),
        reviewCount: product.review_count,
        bestRating: '5',
        worstRating: '1',
      };
    }

    // Create and inject script tag
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    script.id = `structured-data-${product.id}`;
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const existingScript = document.getElementById(`structured-data-${product.id}`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [product]);

  return null;
}
