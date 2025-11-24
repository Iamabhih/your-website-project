-- Phase 1: Database Schema Updates for Telegram Enhancement

-- 1. Create telegram_support_messages table
CREATE TABLE IF NOT EXISTS public.telegram_support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL,
  username TEXT,
  message_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'resolved')),
  admin_reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_support_messages ENABLE ROW LEVEL SECURITY;

-- Policies for telegram_support_messages
CREATE POLICY "Admins can view all support messages"
  ON public.telegram_support_messages FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update support messages"
  ON public.telegram_support_messages FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert support messages"
  ON public.telegram_support_messages FOR INSERT
  WITH CHECK (true);

-- 2. Create telegram_order_notifications table
CREATE TABLE IF NOT EXISTS public.telegram_order_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  message_text TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_order_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for telegram_order_notifications
CREATE POLICY "Admins can view order notifications"
  ON public.telegram_order_notifications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert order notifications"
  ON public.telegram_order_notifications FOR INSERT
  WITH CHECK (true);

-- 3. Create telegram_notification_settings table
CREATE TABLE IF NOT EXISTS public.telegram_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_notification_settings ENABLE ROW LEVEL SECURITY;

-- Policies for telegram_notification_settings
CREATE POLICY "Admins can manage notification settings"
  ON public.telegram_notification_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view notification settings"
  ON public.telegram_notification_settings FOR SELECT
  USING (true);

-- 4. Add new columns to telegram_customers table
ALTER TABLE public.telegram_customers 
  ADD COLUMN IF NOT EXISTS awaiting_email_for TEXT,
  ADD COLUMN IF NOT EXISTS awaiting_order_id BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"orders": true, "promotions": true, "stock_alerts": true}'::jsonb;

-- Insert default notification settings
INSERT INTO public.telegram_notification_settings (setting_key, is_enabled, description) VALUES
  ('new_orders', true, 'Notify admin when new orders are placed'),
  ('order_status_changes', true, 'Notify customers when order status changes'),
  ('low_stock_alerts', true, 'Alert admin when products are low on stock'),
  ('abandoned_cart_notifications', true, 'Send abandoned cart reminders'),
  ('support_message_alerts', true, 'Alert admin of new support messages')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telegram_support_messages_status ON public.telegram_support_messages(status);
CREATE INDEX IF NOT EXISTS idx_telegram_support_messages_chat_id ON public.telegram_support_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_order_notifications_order_id ON public.telegram_order_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_telegram_order_notifications_chat_id ON public.telegram_order_notifications(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_customers_customer_email ON public.telegram_customers(customer_email);

-- Create trigger for updated_at on telegram_notification_settings
CREATE TRIGGER update_telegram_notification_settings_updated_at
  BEFORE UPDATE ON public.telegram_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();