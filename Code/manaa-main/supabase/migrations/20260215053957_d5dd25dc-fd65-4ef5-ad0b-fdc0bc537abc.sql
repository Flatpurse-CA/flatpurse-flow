
-- ==========================================
-- INVENTORY
-- ==========================================
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  sku TEXT DEFAULT '',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  supplier TEXT DEFAULT '',
  category TEXT DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory" ON public.inventory_items FOR SELECT USING (is_business_owner(business_id));
CREATE POLICY "Users can create inventory" ON public.inventory_items FOR INSERT WITH CHECK (is_business_owner(business_id));
CREATE POLICY "Users can update own inventory" ON public.inventory_items FOR UPDATE USING (is_business_owner(business_id));
CREATE POLICY "Users can delete own inventory" ON public.inventory_items FOR DELETE USING (is_business_owner(business_id));

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- INVOICES
-- ==========================================
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_email TEXT DEFAULT '',
  customer_address TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (is_business_owner(business_id));
CREATE POLICY "Users can create invoices" ON public.invoices FOR INSERT WITH CHECK (is_business_owner(business_id));
CREATE POLICY "Users can update own invoices" ON public.invoices FOR UPDATE USING (is_business_owner(business_id));
CREATE POLICY "Users can delete own invoices" ON public.invoices FOR DELETE USING (is_business_owner(business_id));

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- For invoice_items, check ownership through the invoice
CREATE OR REPLACE FUNCTION public.is_invoice_owner(_invoice_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.invoices i
    JOIN public.businesses b ON i.business_id = b.id
    WHERE i.id = _invoice_id AND b.user_id = auth.uid()
  );
$$;

CREATE POLICY "Users can view own invoice items" ON public.invoice_items FOR SELECT USING (is_invoice_owner(invoice_id));
CREATE POLICY "Users can create invoice items" ON public.invoice_items FOR INSERT WITH CHECK (is_invoice_owner(invoice_id));
CREATE POLICY "Users can update own invoice items" ON public.invoice_items FOR UPDATE USING (is_invoice_owner(invoice_id));
CREATE POLICY "Users can delete own invoice items" ON public.invoice_items FOR DELETE USING (is_invoice_owner(invoice_id));

-- ==========================================
-- CRM - CONTACTS
-- ==========================================
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  company TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contacts" ON public.contacts FOR SELECT USING (is_business_owner(business_id));
CREATE POLICY "Users can create contacts" ON public.contacts FOR INSERT WITH CHECK (is_business_owner(business_id));
CREATE POLICY "Users can update own contacts" ON public.contacts FOR UPDATE USING (is_business_owner(business_id));
CREATE POLICY "Users can delete own contacts" ON public.contacts FOR DELETE USING (is_business_owner(business_id));

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- CRM - DEAL STAGES (custom per business)
-- ==========================================
CREATE TABLE public.deal_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deal stages" ON public.deal_stages FOR SELECT USING (is_business_owner(business_id));
CREATE POLICY "Users can create deal stages" ON public.deal_stages FOR INSERT WITH CHECK (is_business_owner(business_id));
CREATE POLICY "Users can update own deal stages" ON public.deal_stages FOR UPDATE USING (is_business_owner(business_id));
CREATE POLICY "Users can delete own deal stages" ON public.deal_stages FOR DELETE USING (is_business_owner(business_id));

-- ==========================================
-- CRM - DEALS
-- ==========================================
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  stage_id UUID NOT NULL REFERENCES public.deal_stages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  expected_close_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deals" ON public.deals FOR SELECT USING (is_business_owner(business_id));
CREATE POLICY "Users can create deals" ON public.deals FOR INSERT WITH CHECK (is_business_owner(business_id));
CREATE POLICY "Users can update own deals" ON public.deals FOR UPDATE USING (is_business_owner(business_id));
CREATE POLICY "Users can delete own deals" ON public.deals FOR DELETE USING (is_business_owner(business_id));

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- CRM - REMINDERS
-- ==========================================
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders" ON public.reminders FOR SELECT USING (is_business_owner(business_id));
CREATE POLICY "Users can create reminders" ON public.reminders FOR INSERT WITH CHECK (is_business_owner(business_id));
CREATE POLICY "Users can update own reminders" ON public.reminders FOR UPDATE USING (is_business_owner(business_id));
CREATE POLICY "Users can delete own reminders" ON public.reminders FOR DELETE USING (is_business_owner(business_id));

-- ==========================================
-- STOCK MOVEMENTS for inventory tracking
-- ==========================================
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'purchase', 'sale', 'adjustment', 'return'
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_inventory_owner(_item_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.inventory_items i
    JOIN public.businesses b ON i.business_id = b.id
    WHERE i.id = _item_id AND b.user_id = auth.uid()
  );
$$;

CREATE POLICY "Users can view own stock movements" ON public.stock_movements FOR SELECT USING (is_inventory_owner(inventory_item_id));
CREATE POLICY "Users can create stock movements" ON public.stock_movements FOR INSERT WITH CHECK (is_inventory_owner(inventory_item_id));
CREATE POLICY "Users can delete own stock movements" ON public.stock_movements FOR DELETE USING (is_inventory_owner(inventory_item_id));
