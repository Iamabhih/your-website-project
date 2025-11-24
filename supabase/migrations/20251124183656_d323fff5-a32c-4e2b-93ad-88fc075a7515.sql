-- Phase 1: Critical Security Fixes

-- ============================================
-- 1. Fix Telegram Customers Table RLS
-- ============================================

-- Drop existing public policy
DROP POLICY IF EXISTS "Public can manage telegram customers" ON public.telegram_customers;

-- Create admin-only SELECT policy
CREATE POLICY "Admins can view telegram customers"
ON public.telegram_customers FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Allow system/edge functions to manage telegram customers (for bot registration)
CREATE POLICY "System can manage telegram customers"
ON public.telegram_customers FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- 2. Fix Order Items Table RLS
-- ============================================

-- Drop existing public view policy
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;

-- Allow users to see only their own order items
CREATE POLICY "Users can view their own order items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Allow admins to view all order items
CREATE POLICY "Admins can view all order items"
ON public.order_items FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- 3. Fix Abandoned Carts Table RLS
-- ============================================

-- Drop existing public insert policy
DROP POLICY IF EXISTS "Public can create abandoned carts" ON public.abandoned_carts;

-- Allow system to insert abandoned carts (for edge function)
CREATE POLICY "System can insert abandoned carts"
ON public.abandoned_carts FOR INSERT
WITH CHECK (true);

-- Admin-only SELECT policy already exists, keeping it