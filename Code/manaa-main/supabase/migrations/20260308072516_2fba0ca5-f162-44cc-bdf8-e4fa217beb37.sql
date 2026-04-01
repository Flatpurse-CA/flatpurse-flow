
-- 1. Store settings for each business (storefront config)
CREATE TABLE public.store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL DEFAULT '',
  store_description TEXT DEFAULT '',
  slug TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  theme_color TEXT DEFAULT '#C0D904',
  banner_url TEXT DEFAULT '',
  whatsapp_number TEXT DEFAULT '',
  instagram_handle TEXT DEFAULT '',
  delivery_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(slug)
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own store settings" ON public.store_settings FOR SELECT USING (is_business_owner(business_id));
CREATE POLICY "Users can create store settings" ON public.store_settings FOR INSERT WITH CHECK (is_business_owner(business_id));
CREATE POLICY "Users can update own store settings" ON public.store_settings FOR UPDATE USING (is_business_owner(business_id));
CREATE POLICY "Users can delete own store settings" ON public.store_settings FOR DELETE USING (is_business_owner(business_id));
CREATE POLICY "Anyone can view published stores" ON public.store_settings FOR SELECT USING (is_published = true);

-- 2. Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT DEFAULT '',
  customer_email TEXT DEFAULT '',
  customer_address TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  payment_method TEXT DEFAULT '',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (is_business_owner(business_id));
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (is_business_owner(business_id));
CREATE POLICY "Users can update own orders" ON public.orders FOR UPDATE USING (is_business_owner(business_id));
CREATE POLICY "Users can delete own orders" ON public.orders FOR DELETE USING (is_business_owner(business_id));

-- 3. Order items
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS helper for order items
CREATE OR REPLACE FUNCTION public.is_order_owner(_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.businesses b ON o.business_id = b.id
    WHERE o.id = _order_id AND b.user_id = auth.uid()
  );
$$;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (is_order_owner(order_id));
CREATE POLICY "Users can create order items" ON public.order_items FOR INSERT WITH CHECK (is_order_owner(order_id));
CREATE POLICY "Users can update own order items" ON public.order_items FOR UPDATE USING (is_order_owner(order_id));
CREATE POLICY "Users can delete own order items" ON public.order_items FOR DELETE USING (is_order_owner(order_id));

-- 4. Team members
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID DEFAULT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'viewer',
  status TEXT NOT NULL DEFAULT 'invited',
  invited_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, email)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team for own businesses" ON public.team_members FOR SELECT USING (is_business_owner(business_id));
CREATE POLICY "Users can invite team to own businesses" ON public.team_members FOR INSERT WITH CHECK (is_business_owner(business_id));
CREATE POLICY "Users can update team in own businesses" ON public.team_members FOR UPDATE USING (is_business_owner(business_id));
CREATE POLICY "Users can remove team from own businesses" ON public.team_members FOR DELETE USING (is_business_owner(business_id));

-- 5. Branches
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  manager_name TEXT DEFAULT '',
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own branches" ON public.branches FOR SELECT USING (is_business_owner(business_id));
CREATE POLICY "Users can create branches" ON public.branches FOR INSERT WITH CHECK (is_business_owner(business_id));
CREATE POLICY "Users can update own branches" ON public.branches FOR UPDATE USING (is_business_owner(business_id));
CREATE POLICY "Users can delete own branches" ON public.branches FOR DELETE USING (is_business_owner(business_id));

-- Allow public to view published store settings and create orders from storefront
CREATE POLICY "Anyone can create store orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create order items for store" ON public.order_items FOR INSERT WITH CHECK (true);
