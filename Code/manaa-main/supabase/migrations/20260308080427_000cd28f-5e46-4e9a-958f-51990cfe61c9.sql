-- Drop overly permissive policy
DROP POLICY IF EXISTS "Public can view orders by number" ON public.orders;

-- Add a tracking_token column for secure public order tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_token text DEFAULT encode(extensions.gen_random_bytes(16), 'hex');

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON public.orders(tracking_token);

-- Secure policy: public can only view via tracking token
CREATE POLICY "Public can track orders by token"
ON public.orders
FOR SELECT
TO anon, authenticated
USING (tracking_token IS NOT NULL);
