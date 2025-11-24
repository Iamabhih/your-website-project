-- Create comprehensive logging tables for end-to-end system monitoring

-- 1. system_logs table - stores all application logs
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type text NOT NULL CHECK (log_type IN ('debug', 'info', 'warning', 'error', 'critical')),
  source text NOT NULL CHECK (source IN ('frontend', 'edge-function', 'database', 'system')),
  category text NOT NULL,
  message text NOT NULL,
  stack_trace text,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  session_id text,
  url text,
  user_agent text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- 2. error_tracking table - groups and tracks recurring errors
CREATE TABLE IF NOT EXISTS public.error_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_hash text NOT NULL UNIQUE,
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  occurrence_count integer DEFAULT 1,
  error_message text NOT NULL,
  error_type text,
  stack_trace text,
  source_file text,
  line_number integer,
  column_number integer,
  browser_info jsonb DEFAULT '{}'::jsonb,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_notes text,
  severity text DEFAULT 'error' CHECK (severity IN ('critical', 'error', 'warning', 'info')),
  affected_users_count integer DEFAULT 0
);

-- 3. Create indexes for performance
CREATE INDEX idx_system_logs_type ON public.system_logs(log_type);
CREATE INDEX idx_system_logs_source ON public.system_logs(source);
CREATE INDEX idx_system_logs_category ON public.system_logs(category);
CREATE INDEX idx_system_logs_created ON public.system_logs(created_at DESC);
CREATE INDEX idx_system_logs_user ON public.system_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_system_logs_session ON public.system_logs(session_id) WHERE session_id IS NOT NULL;

CREATE INDEX idx_error_tracking_hash ON public.error_tracking(error_hash);
CREATE INDEX idx_error_tracking_resolved ON public.error_tracking(is_resolved) WHERE is_resolved = false;
CREATE INDEX idx_error_tracking_severity ON public.error_tracking(severity);
CREATE INDEX idx_error_tracking_last_seen ON public.error_tracking(last_seen DESC);

-- 4. Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_tracking ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - Admin-only read access
CREATE POLICY "Admins can view all system logs"
  ON public.system_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert system logs"
  ON public.system_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view error tracking"
  ON public.error_tracking FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update error tracking"
  ON public.error_tracking FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert error tracking"
  ON public.error_tracking FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update error tracking"
  ON public.error_tracking FOR UPDATE
  WITH CHECK (true);

-- 6. Function to increment error occurrence
CREATE OR REPLACE FUNCTION public.increment_error_occurrence(error_hash_param text)
RETURNS void AS $$
BEGIN
  UPDATE public.error_tracking
  SET 
    occurrence_count = occurrence_count + 1,
    last_seen = now(),
    affected_users_count = affected_users_count + 1
  WHERE error_hash = error_hash_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;