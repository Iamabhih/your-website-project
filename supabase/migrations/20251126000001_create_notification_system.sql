-- Create notification system tables for PWA notifications

-- Table for notification campaigns (admin-sent notifications)
CREATE TABLE IF NOT EXISTS public.notification_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('promotion', 'order', 'system', 'info', 'success', 'warning', 'error')),
  target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'subscribers', 'customers', 'admins')),
  link VARCHAR(500),
  icon VARCHAR(50),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  is_push BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Table for promotional banners
CREATE TABLE IF NOT EXISTS public.promo_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  action_text VARCHAR(100),
  background_color VARCHAR(100) DEFAULT 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-500',
  text_color VARCHAR(50) DEFAULT 'text-white',
  icon VARCHAR(50) DEFAULT 'sparkles',
  show_countdown BOOLEAN DEFAULT false,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_dismissible BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  display_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  dismiss_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Table for push notification subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for user notifications (inbox)
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.notification_campaigns(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('promotion', 'order', 'system', 'info', 'success', 'warning', 'error')),
  link VARCHAR(500),
  icon VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for user notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  vibration_enabled BOOLEAN DEFAULT true,
  promotions_enabled BOOLEAN DEFAULT true,
  order_updates_enabled BOOLEAN DEFAULT true,
  system_notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for dismissed banners (track which users dismissed which banners)
CREATE TABLE IF NOT EXISTS public.banner_dismissals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  banner_id UUID REFERENCES public.promo_banners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(banner_id, user_id),
  UNIQUE(banner_id, session_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_notification_campaigns_status ON public.notification_campaigns(status);
CREATE INDEX idx_notification_campaigns_type ON public.notification_campaigns(type);
CREATE INDEX idx_notification_campaigns_created_at ON public.notification_campaigns(created_at DESC);

CREATE INDEX idx_promo_banners_active ON public.promo_banners(is_active);
CREATE INDEX idx_promo_banners_dates ON public.promo_banners(start_date, end_date);
CREATE INDEX idx_promo_banners_priority ON public.promo_banners(priority DESC);

CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON public.push_subscriptions(is_active);

CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_read ON public.user_notifications(is_read);
CREATE INDEX idx_user_notifications_created_at ON public.user_notifications(created_at DESC);

CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);

CREATE INDEX idx_banner_dismissals_banner_id ON public.banner_dismissals(banner_id);
CREATE INDEX idx_banner_dismissals_user_id ON public.banner_dismissals(user_id);

-- Enable Row Level Security
ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_dismissals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_campaigns
CREATE POLICY "Admin can manage notification campaigns"
  ON public.notification_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for promo_banners
CREATE POLICY "Public can view active banners"
  ON public.promo_banners FOR SELECT
  USING (
    is_active = true
    AND start_date <= NOW()
    AND (end_date IS NULL OR end_date >= NOW())
  );

CREATE POLICY "Admin can manage promo banners"
  ON public.promo_banners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can manage their own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anonymous can create push subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Admin can view all push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for user_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.user_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.user_notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create user notifications"
  ON public.user_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can manage all user notifications"
  ON public.user_notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences"
  ON public.notification_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can view all notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for banner_dismissals
CREATE POLICY "Users can manage their own banner dismissals"
  ON public.banner_dismissals FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anonymous can create banner dismissals"
  ON public.banner_dismissals FOR INSERT
  WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

CREATE POLICY "Admin can view all banner dismissals"
  ON public.banner_dismissals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Function to get active banner for a user
CREATE OR REPLACE FUNCTION public.get_active_banner(
  p_user_id UUID DEFAULT NULL,
  p_session_id VARCHAR(255) DEFAULT NULL
)
RETURNS SETOF public.promo_banners
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT b.*
  FROM public.promo_banners b
  WHERE b.is_active = true
    AND b.start_date <= NOW()
    AND (b.end_date IS NULL OR b.end_date >= NOW())
    AND NOT EXISTS (
      SELECT 1 FROM public.banner_dismissals d
      WHERE d.banner_id = b.id
      AND (
        (p_user_id IS NOT NULL AND d.user_id = p_user_id)
        OR (p_session_id IS NOT NULL AND d.session_id = p_session_id)
      )
    )
  ORDER BY b.priority DESC, b.created_at DESC
  LIMIT 1;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_notifications
  SET is_read = true, read_at = NOW()
  WHERE id = p_notification_id
  AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.user_notifications
  SET is_read = true, read_at = NOW()
  WHERE user_id = auth.uid()
  AND is_read = false;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Function to track banner interaction
CREATE OR REPLACE FUNCTION public.track_banner_interaction(
  p_banner_id UUID,
  p_interaction_type VARCHAR(20)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_interaction_type = 'display' THEN
    UPDATE public.promo_banners
    SET display_count = display_count + 1
    WHERE id = p_banner_id;
  ELSIF p_interaction_type = 'click' THEN
    UPDATE public.promo_banners
    SET click_count = click_count + 1
    WHERE id = p_banner_id;
  ELSIF p_interaction_type = 'dismiss' THEN
    UPDATE public.promo_banners
    SET dismiss_count = dismiss_count + 1
    WHERE id = p_banner_id;
  END IF;

  RETURN FOUND;
END;
$$;

-- Function to send notification to all users (used by admin)
CREATE OR REPLACE FUNCTION public.send_notification_to_all(
  p_campaign_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_campaign RECORD;
  v_user_id UUID;
  v_count INTEGER := 0;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get campaign details
  SELECT * INTO v_campaign
  FROM public.notification_campaigns
  WHERE id = p_campaign_id;

  IF v_campaign IS NULL THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;

  -- Insert notification for each user based on target audience
  FOR v_user_id IN
    SELECT u.id FROM auth.users u
    LEFT JOIN public.user_roles ur ON u.id = ur.user_id
    WHERE
      v_campaign.target_audience = 'all'
      OR (v_campaign.target_audience = 'admins' AND ur.role = 'admin')
      OR (v_campaign.target_audience = 'customers' AND (ur.role IS NULL OR ur.role != 'admin'))
  LOOP
    INSERT INTO public.user_notifications (
      user_id, campaign_id, title, message, type, link, icon
    ) VALUES (
      v_user_id, p_campaign_id, v_campaign.title, v_campaign.message,
      v_campaign.type, v_campaign.link, v_campaign.icon
    );
    v_count := v_count + 1;
  END LOOP;

  -- Update campaign status
  UPDATE public.notification_campaigns
  SET status = 'sent', sent_at = NOW(), sent_count = v_count
  WHERE id = p_campaign_id;

  RETURN v_count;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_campaigns_timestamp
  BEFORE UPDATE ON public.notification_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_notification_timestamp();

CREATE TRIGGER update_promo_banners_timestamp
  BEFORE UPDATE ON public.promo_banners
  FOR EACH ROW EXECUTE FUNCTION public.update_notification_timestamp();

CREATE TRIGGER update_push_subscriptions_timestamp
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_notification_timestamp();

CREATE TRIGGER update_notification_preferences_timestamp
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_notification_timestamp();

-- Enable realtime for user_notifications (for live notification updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
