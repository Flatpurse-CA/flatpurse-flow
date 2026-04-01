-- Add read-only policy for push_config so service role can access it
-- Regular users should NOT access this table (it stores VAPID keys)
CREATE POLICY "Service role only - no user access"
ON public.push_config
FOR SELECT
USING (false);
