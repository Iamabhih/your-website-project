import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    category: string;
  };
}

const GUEST_WISHLIST_KEY = 'guest-wishlist';
const SESSION_ID_KEY = 'guest-session-id';

export function useWishlist() {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, [user]);

  const getOrCreateSessionId = () => {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  };

  const loadWishlist = async () => {
    setLoading(true);

    if (user) {
      // Load from database for authenticated users
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          product_id,
          created_at,
          products (
            id,
            name,
            price,
            image_url,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setWishlistItems(
          data.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            created_at: item.created_at,
            product: item.products,
          }))
        );
      }

      // Migrate guest wishlist if exists
      await migrateGuestWishlist();
    } else {
      // Load from local storage for guests
      const guestWishlist = localStorage.getItem(GUEST_WISHLIST_KEY);
      if (guestWishlist) {
        setWishlistItems(JSON.parse(guestWishlist));
      }
    }

    setLoading(false);
  };

  const migrateGuestWishlist = async () => {
    if (!user) return;

    const sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) return;

    try {
      const { data } = await supabase.rpc('migrate_guest_wishlist', {
        _session_id: sessionId,
        _user_id: user.id,
      });

      if (data && data > 0) {
        localStorage.removeItem(GUEST_WISHLIST_KEY);
        localStorage.removeItem(SESSION_ID_KEY);
        toast.success(`${data} item(s) migrated to your wishlist`);
        loadWishlist(); // Reload after migration
      }
    } catch (error) {
      console.error('Failed to migrate guest wishlist:', error);
    }
  };

  const addToWishlist = async (productId: string) => {
    if (user) {
      // Add to database
      const { error } = await supabase.from('wishlist').insert({
        user_id: user.id,
        product_id: productId,
      });

      if (error) {
        if (error.code === '23505') {
          toast.info('Already in wishlist');
        } else {
          toast.error('Failed to add to wishlist');
        }
        return;
      }

      toast.success('Added to wishlist');
      loadWishlist();
    } else {
      // Add to guest wishlist
      const sessionId = getOrCreateSessionId();
      const guestItem: WishlistItem = {
        id: crypto.randomUUID(),
        product_id: productId,
        created_at: new Date().toISOString(),
      };

      const existingWishlist = localStorage.getItem(GUEST_WISHLIST_KEY);
      const wishlist: WishlistItem[] = existingWishlist ? JSON.parse(existingWishlist) : [];

      // Check if already in wishlist
      const exists = wishlist.some((item) => item.product_id === productId);

      if (exists) {
        toast.info('Already in wishlist');
        return;
      }

      wishlist.push(guestItem);
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlist));
      setWishlistItems(wishlist);

      // Also save to guest_wishlist table
      await supabase.from('guest_wishlist').insert({
        session_id: sessionId,
        product_id: productId,
      });

      toast.success('Added to wishlist');
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (user) {
      // Remove from database
      try {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .match({ user_id: user.id, product_id: productId });
        
        if (error) throw error;

        toast.success('Removed from wishlist');
        loadWishlist();
      } catch (error) {
        toast.error('Failed to remove from wishlist');
      }
    } else {
      // Remove from guest wishlist
      const existingWishlist = localStorage.getItem(GUEST_WISHLIST_KEY);
      if (!existingWishlist) return;

      const wishlist: WishlistItem[] = JSON.parse(existingWishlist);
      const filtered = wishlist.filter((item) => item.product_id !== productId);

      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(filtered));
      setWishlistItems(filtered);
      toast.success('Removed from wishlist');
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some((item) => item.product_id === productId);
  };

  return {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  };
}
