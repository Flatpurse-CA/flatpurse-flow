
-- 1. Warehouses / Locations
CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own warehouses" ON public.warehouses FOR SELECT USING (is_business_owner(business_id));
CREATE POLICY "Users can create warehouses" ON public.warehouses FOR INSERT WITH CHECK (is_business_owner(business_id));
CREATE POLICY "Users can update own warehouses" ON public.warehouses FOR UPDATE USING (is_business_owner(business_id));
CREATE POLICY "Users can delete own warehouses" ON public.warehouses FOR DELETE USING (is_business_owner(business_id));

-- 2. Add new columns to inventory_items
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS barcode TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS uom TEXT DEFAULT 'pcs',
  ADD COLUMN IF NOT EXISTS valuation_method TEXT DEFAULT 'weighted_average',
  ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL;

-- 3. Inventory batches (lot tracking + expiry)
CREATE TABLE public.inventory_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  manufacture_date DATE,
  expiry_date DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own batches" ON public.inventory_batches FOR SELECT USING (is_business_owner(business_id));
CREATE POLICY "Users can create batches" ON public.inventory_batches FOR INSERT WITH CHECK (is_business_owner(business_id));
CREATE POLICY "Users can update own batches" ON public.inventory_batches FOR UPDATE USING (is_business_owner(business_id));
CREATE POLICY "Users can delete own batches" ON public.inventory_batches FOR DELETE USING (is_business_owner(business_id));

-- 4. Purchase Orders
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  supplier_name TEXT NOT NULL DEFAULT '',
  supplier_contact TEXT DEFAULT '',
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own POs" ON public.purchase_orders FOR SELECT USING (is_business_owner(business_id));
CREATE POLICY "Users can create POs" ON public.purchase_orders FOR INSERT WITH CHECK (is_business_owner(business_id));
CREATE POLICY "Users can update own POs" ON public.purchase_orders FOR UPDATE USING (is_business_owner(business_id));
CREATE POLICY "Users can delete own POs" ON public.purchase_orders FOR DELETE USING (is_business_owner(business_id));

-- 5. Purchase Order Items
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  received_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Helper function for PO item ownership
CREATE OR REPLACE FUNCTION public.is_po_owner(_po_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.purchase_orders po
    JOIN public.businesses b ON po.business_id = b.id
    WHERE po.id = _po_id AND b.user_id = auth.uid()
  );
$$;

CREATE POLICY "Users can view own PO items" ON public.purchase_order_items FOR SELECT USING (is_po_owner(purchase_order_id));
CREATE POLICY "Users can create PO items" ON public.purchase_order_items FOR INSERT WITH CHECK (is_po_owner(purchase_order_id));
CREATE POLICY "Users can update own PO items" ON public.purchase_order_items FOR UPDATE USING (is_po_owner(purchase_order_id));
CREATE POLICY "Users can delete own PO items" ON public.purchase_order_items FOR DELETE USING (is_po_owner(purchase_order_id));

-- Add warehouse_id to stock_movements for location tracking
ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL;
