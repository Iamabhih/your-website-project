import { useEffect, useRef } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const DEBOUNCE_DELAY = 5 * 60 * 1000; // 5 minutes

export function useCartTracking() {
  const { items, getTotalPrice } = useCartStore();
  const { user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const sessionIdRef = useRef<string>();

  useEffect(() => {
    // Generate or retrieve session ID
    if (!sessionIdRef.current) {
      sessionIdRef.current = localStorage.getItem('cart_session_id') || 
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_session_id', sessionIdRef.current);
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only track if cart has items
    if (items.length === 0) {
      return;
    }

    // Debounce: wait 5 minutes before saving as abandoned
    timeoutRef.current = setTimeout(async () => {
      await saveAbandonedCart();
    }, DEBOUNCE_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [items, user]);

  const saveAbandonedCart = async () => {
    if (items.length === 0) return;

    try {
      const totalAmount = getTotalPrice();
      
      // Get customer info
      let customerEmail = user?.email || localStorage.getItem('guest_email') || null;
      let customerName = localStorage.getItem('guest_name') || null;
      let customerPhone = localStorage.getItem('guest_phone') || null;
      let telegramChatId = null;

      // If we have an email, try to get Telegram chat ID
      if (customerEmail) {
        const { data: telegramCustomer } = await supabase
          .from('telegram_customers')
          .select('chat_id')
          .eq('email', customerEmail)
          .single();
        
        if (telegramCustomer) {
          telegramChatId = telegramCustomer.chat_id;
        }
      }

      // Upsert abandoned cart
      const { error } = await supabase
        .from('abandoned_carts')
        .upsert({
          cart_items: items as any,
          total_amount: totalAmount,
          customer_email: customerEmail,
          customer_name: customerName,
          customer_phone: customerPhone,
          telegram_chat_id: telegramChatId,
          recovered: false,
        } as any);

      if (error) {
        console.error('Error saving abandoned cart:', error);
      }
    } catch (error) {
      console.error('Error in saveAbandonedCart:', error);
    }
  };

  const markCartAsRecovered = async () => {
    if (!sessionIdRef.current) return;

    try {
      const { error } = await supabase
        .from('abandoned_carts')
        .update({ recovered: true })
        .eq('id', sessionIdRef.current);

      if (error) {
        console.error('Error marking cart as recovered:', error);
      } else {
        // Clear session
        localStorage.removeItem('cart_session_id');
        sessionIdRef.current = undefined;
      }
    } catch (error) {
      console.error('Error in markCartAsRecovered:', error);
    }
  };

  return { markCartAsRecovered };
}
