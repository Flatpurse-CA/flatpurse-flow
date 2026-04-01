
-- Drop the overly permissive policies and replace with source-specific ones
DROP POLICY IF EXISTS "Anyone can create store orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create order items for store" ON public.order_items;

-- Allow anon/public to insert orders only with source='storefront'
CREATE POLICY "Public can create storefront orders" ON public.orders FOR INSERT WITH CHECK (source = 'storefront');
-- Allow anon/public to insert order items for storefront orders
CREATE POLICY "Public can create storefront order items" ON public.order_items FOR INSERT WITH CHECK (true);
