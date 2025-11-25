import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CollectionMetadata {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  meta_title: string;
  meta_description: string;
  is_visible: boolean;
  sort_order: number;
  parent_category?: string;
}

export interface Collection {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: number;
}

const CATEGORY_METADATA_KEY = 'category_metadata';

async function fetchCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', CATEGORY_METADATA_KEY)
    .maybeSingle();

  if (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }

  if (!data?.value) {
    return [];
  }

  const metadata: Record<string, CollectionMetadata> =
    typeof data.value === 'string' ? JSON.parse(data.value) : data.value;

  // Convert to array, filter visible, and sort
  const collections = Object.values(metadata)
    .filter(cat => cat.is_visible !== false)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(cat => ({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image_url: cat.image_url || '',
      sort_order: cat.sort_order || 0,
    }));

  return collections;
}

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: fetchCollections,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useVisibleCollections(limit?: number) {
  const query = useCollections();

  const collections = limit
    ? query.data?.slice(0, limit)
    : query.data;

  return {
    ...query,
    data: collections,
  };
}
