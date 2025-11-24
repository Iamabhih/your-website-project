import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  image_url?: string;
  min_quantity: number;
  max_quantity?: number;
  sku?: string;
  weight?: number;
  notes?: string;
  stock?: number;
}

export interface SavedCart {
  id: string;
  name: string;
  items: CartItem[];
  createdAt: string;
}

export interface CartMetadata {
  createdAt: string;
  lastModified: string;
  sessionId: string;
  couponCode?: string;
  couponDiscount?: number;
}

interface CartStore {
  items: CartItem[];
  savedCarts: SavedCart[];
  metadata: CartMetadata;
  isOpen: boolean;

  // Basic cart operations
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItemNotes: (id: string, notes: string) => void;
  clearCart: () => void;

  // Bulk operations
  bulkAddItems: (items: Array<Omit<CartItem, 'quantity'> & { quantity?: number }>) => void;
  bulkRemoveItems: (ids: string[]) => void;
  replaceCart: (items: CartItem[]) => void;

  // Saved carts
  saveCartForLater: (name: string) => string;
  loadSavedCart: (cartId: string) => void;
  deleteSavedCart: (cartId: string) => void;
  mergeSavedCart: (cartId: string) => void;

  // Cart sharing
  getShareableCart: () => string;
  loadFromShareCode: (code: string) => boolean;

  // Stock validation
  validateStock: () => Promise<{ valid: boolean; issues: Array<{ id: string; available: number }> }>;

  // Calculations
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getTotalWeight: () => number;
  getTotalSavings: () => number;
  getUniqueItemCount: () => number;

  // Coupon
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;

  // UI state
  setIsOpen: (open: boolean) => void;
  toggleCart: () => void;
}

const generateSessionId = () => {
  const stored = localStorage.getItem('cart-session-id');
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem('cart-session-id', id);
  return id;
};

const createInitialMetadata = (): CartMetadata => ({
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString(),
  sessionId: generateSessionId(),
});

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      savedCarts: [],
      metadata: createInitialMetadata(),
      isOpen: false,

      addItem: (item, quantity) => {
        const existingItem = get().items.find((i) =>
          i.id === item.id && i.variantId === item.variantId
        );
        const addQty = quantity || item.min_quantity;

        if (existingItem) {
          const newQty = existingItem.quantity + addQty;
          const maxQty = item.max_quantity || Infinity;

          set({
            items: get().items.map((i) =>
              i.id === item.id && i.variantId === item.variantId
                ? { ...i, quantity: Math.min(newQty, maxQty) }
                : i
            ),
            metadata: { ...get().metadata, lastModified: new Date().toISOString() },
          });
        } else {
          const cartItem: CartItem = {
            ...item,
            productId: item.productId || item.id,
            quantity: addQty,
          };
          set({
            items: [...get().items, cartItem],
            metadata: { ...get().metadata, lastModified: new Date().toISOString() },
          });
        }
      },

      removeItem: (id) => {
        set({
          items: get().items.filter((i) => i.id !== id),
          metadata: { ...get().metadata, lastModified: new Date().toISOString() },
        });
      },

      updateQuantity: (id, quantity) => {
        const item = get().items.find((i) => i.id === id);
        if (item) {
          const minQty = item.min_quantity;
          const maxQty = item.max_quantity || Infinity;
          const validQty = Math.max(minQty, Math.min(quantity, maxQty));

          if (validQty <= 0) {
            get().removeItem(id);
          } else {
            set({
              items: get().items.map((i) =>
                i.id === id ? { ...i, quantity: validQty } : i
              ),
              metadata: { ...get().metadata, lastModified: new Date().toISOString() },
            });
          }
        }
      },

      updateItemNotes: (id, notes) => {
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, notes } : i
          ),
          metadata: { ...get().metadata, lastModified: new Date().toISOString() },
        });
      },

      clearCart: () => {
        set({
          items: [],
          metadata: {
            ...get().metadata,
            lastModified: new Date().toISOString(),
            couponCode: undefined,
            couponDiscount: undefined,
          },
        });
      },

      bulkAddItems: (items) => {
        items.forEach((item) => {
          get().addItem(item, item.quantity);
        });
      },

      bulkRemoveItems: (ids) => {
        set({
          items: get().items.filter((i) => !ids.includes(i.id)),
          metadata: { ...get().metadata, lastModified: new Date().toISOString() },
        });
      },

      replaceCart: (items) => {
        set({
          items,
          metadata: { ...get().metadata, lastModified: new Date().toISOString() },
        });
      },

      saveCartForLater: (name) => {
        const cartId = crypto.randomUUID();
        const savedCart: SavedCart = {
          id: cartId,
          name,
          items: [...get().items],
          createdAt: new Date().toISOString(),
        };
        set({
          savedCarts: [...get().savedCarts, savedCart],
        });
        return cartId;
      },

      loadSavedCart: (cartId) => {
        const savedCart = get().savedCarts.find((c) => c.id === cartId);
        if (savedCart) {
          set({
            items: [...savedCart.items],
            metadata: { ...get().metadata, lastModified: new Date().toISOString() },
          });
        }
      },

      deleteSavedCart: (cartId) => {
        set({
          savedCarts: get().savedCarts.filter((c) => c.id !== cartId),
        });
      },

      mergeSavedCart: (cartId) => {
        const savedCart = get().savedCarts.find((c) => c.id === cartId);
        if (savedCart) {
          savedCart.items.forEach((item) => {
            get().addItem(item, item.quantity);
          });
        }
      },

      getShareableCart: () => {
        const items = get().items.map((item) => ({
          id: item.productId || item.id,
          v: item.variantId,
          q: item.quantity,
        }));
        const encoded = btoa(JSON.stringify(items));
        return encoded;
      },

      loadFromShareCode: (code) => {
        try {
          const decoded = JSON.parse(atob(code));
          if (Array.isArray(decoded)) {
            // Note: This would need to fetch product details from the database
            // For now, just return true to indicate valid format
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      validateStock: async () => {
        const items = get().items;
        const issues: Array<{ id: string; available: number }> = [];

        try {
          const productIds = items.map((item) => item.productId || item.id);
          const { data: products } = await supabase
            .from('products')
            .select('id, stock_quantity')
            .in('id', productIds);

          if (products) {
            items.forEach((item) => {
              const product = products.find((p) => p.id === (item.productId || item.id));
              if (product && product.stock_quantity !== null && item.quantity > product.stock_quantity) {
                issues.push({ id: item.id, available: product.stock_quantity });
              }
            });
          }
        } catch (error) {
          console.error('Stock validation error:', error);
        }

        return { valid: issues.length === 0, issues };
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        const subtotal = get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
        const discount = get().metadata.couponDiscount || 0;
        return Math.max(0, subtotal - discount);
      },

      getTotalWeight: () => {
        return get().items.reduce(
          (total, item) => total + (item.weight || 0) * item.quantity,
          0
        );
      },

      getTotalSavings: () => {
        return get().items.reduce((total, item) => {
          if (item.compareAtPrice && item.compareAtPrice > item.price) {
            return total + (item.compareAtPrice - item.price) * item.quantity;
          }
          return total;
        }, 0);
      },

      getUniqueItemCount: () => {
        return get().items.length;
      },

      applyCoupon: (code, discount) => {
        set({
          metadata: {
            ...get().metadata,
            couponCode: code,
            couponDiscount: discount,
            lastModified: new Date().toISOString(),
          },
        });
      },

      removeCoupon: () => {
        set({
          metadata: {
            ...get().metadata,
            couponCode: undefined,
            couponDiscount: undefined,
            lastModified: new Date().toISOString(),
          },
        });
      },

      setIsOpen: (open) => set({ isOpen: open }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'cart-storage',
      version: 2,
      migrate: (persistedState: any, version) => {
        if (version === 0 || version === 1) {
          // Migration from old cart format
          return {
            ...persistedState,
            items: persistedState.items?.map((item: any) => ({
              ...item,
              productId: item.productId || item.id,
            })) || [],
            savedCarts: persistedState.savedCarts || [],
            metadata: persistedState.metadata || createInitialMetadata(),
            isOpen: false,
          };
        }
        return persistedState;
      },
    }
  )
);

// Selector hooks for optimized re-renders
export const useCartItems = () => useCartStore((state) => state.items);
export const useCartTotal = () => useCartStore((state) => state.getTotalPrice());
export const useCartItemCount = () => useCartStore((state) => state.getTotalItems());
export const useCartOpen = () => useCartStore((state) => state.isOpen);
export const useCartActions = () => useCartStore((state) => ({
  addItem: state.addItem,
  removeItem: state.removeItem,
  updateQuantity: state.updateQuantity,
  clearCart: state.clearCart,
  setIsOpen: state.setIsOpen,
  toggleCart: state.toggleCart,
}));
