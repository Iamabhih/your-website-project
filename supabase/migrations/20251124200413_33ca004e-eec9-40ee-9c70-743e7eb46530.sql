-- Create newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  source TEXT DEFAULT 'homepage',
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public can subscribe
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
TO public
WITH CHECK (true);

-- Public can view their own subscription
CREATE POLICY "Anyone can view subscriptions"
ON public.newsletter_subscribers
FOR SELECT
TO public
USING (true);

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage newsletter subscriptions"
ON public.newsletter_subscribers
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for email lookups
CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX idx_newsletter_active ON public.newsletter_subscribers(is_active);