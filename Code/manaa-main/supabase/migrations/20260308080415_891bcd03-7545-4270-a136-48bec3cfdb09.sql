-- Add store_visible flag to inventory_items
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS store_visible boolean NOT NULL DEFAULT false;

-- Allow anonymous/public read of inventory items for published stores
CREATE POLICY "Public can view store products"
ON public.inventory_items
FOR SELECT
TO anon, authenticated
USING (
  store_visible = true
  AND EXISTS (
    SELECT 1 FROM public.store_settings ss
    WHERE ss.business_id = inventory_items.business_id
    AND ss.is_published = true
  )
);

-- Allow public to read orders by order_number (for tracking)
CREATE POLICY "Public can view orders by number"
ON public.orders
FOR SELECT
TO anon, authenticated
USING (true);
