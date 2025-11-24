-- Enhanced Telegram Integration
-- Support messages, notifications, and customer management

-- Table for Telegram support messages
CREATE TABLE IF NOT EXISTS public.telegram_support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  message_text TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'resolved')),
  admin_response TEXT,
  responded_by UUID REFERENCES auth.users(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for order status notifications
CREATE TABLE IF NOT EXISTS public.telegram_order_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  chat_id VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  message_text TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_status VARCHAR(50) DEFAULT 'sent'
);

-- Add telegram_chat_id to customers (optional, for linking)
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(255) UNIQUE;

-- Update telegram_customers table with more fields
ALTER TABLE public.telegram_customers
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS awaiting_email_for VARCHAR(50),
ADD COLUMN IF NOT EXISTS awaiting_order_id BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"order_updates": true, "promotions": false}'::jsonb;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_telegram_support_status ON public.telegram_support_messages(status);
CREATE INDEX IF NOT EXISTS idx_telegram_support_chat_id ON public.telegram_support_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_order ON public.telegram_order_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_customers_telegram_chat ON public.customers(telegram_chat_id);

-- Function to send Telegram notification when order status changes
CREATE OR REPLACE FUNCTION public.notify_order_status_telegram()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  customer_chat_id VARCHAR(255);
  notification_text TEXT;
BEGIN
  -- Only send notifications for status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Try to find customer's telegram chat_id
    SELECT telegram_chat_id INTO customer_chat_id
    FROM public.customers
    WHERE email = NEW.customer_email
    AND telegram_chat_id IS NOT NULL;

    -- If customer has telegram linked, prepare notification
    IF customer_chat_id IS NOT NULL THEN
      notification_text := format(
        'Order #%s status updated: %s → %s',
        substring(NEW.id::text, 1, 8),
        OLD.status,
        NEW.status
      );

      -- Store notification for processing
      INSERT INTO public.telegram_order_notifications (
        order_id,
        chat_id,
        notification_type,
        message_text
      ) VALUES (
        NEW.id,
        customer_chat_id,
        'status_update',
        notification_text
      );

      -- Call Supabase Edge Function to send notification
      -- This would be handled by a separate worker/cron job
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for order status notifications
DROP TRIGGER IF EXISTS telegram_order_status_notification ON public.orders;
CREATE TRIGGER telegram_order_status_notification
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_telegram();

-- RLS Policies

-- telegram_support_messages
ALTER TABLE public.telegram_support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all support messages"
ON public.telegram_support_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.user_id = auth.uid()
    AND customers.role = 'admin'
  )
);

CREATE POLICY "Admins can update support messages"
ON public.telegram_support_messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.user_id = auth.uid()
    AND customers.role = 'admin'
  )
);

CREATE POLICY "System can insert support messages"
ON public.telegram_support_messages
FOR INSERT
TO service_role
WITH CHECK (true);

-- telegram_order_notifications
ALTER TABLE public.telegram_order_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.telegram_order_notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = telegram_order_notifications.order_id
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert notifications"
ON public.telegram_order_notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON public.telegram_support_messages TO anon, authenticated, service_role;
GRANT UPDATE ON public.telegram_support_messages TO authenticated, service_role;
GRANT SELECT ON public.telegram_order_notifications TO anon, authenticated, service_role;
GRANT INSERT ON public.telegram_order_notifications TO service_role;

-- Comments
COMMENT ON TABLE public.telegram_support_messages IS 'Customer support messages received via Telegram bot';
COMMENT ON TABLE public.telegram_order_notifications IS 'Order status notifications sent via Telegram';
COMMENT ON FUNCTION public.notify_order_status_telegram() IS 'Automatically creates Telegram notification when order status changes';
