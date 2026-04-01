
-- Create inventory_sales table for tracking product sales
CREATE TABLE public.inventory_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'paid',
  payment_method TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_sales ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own sales"
  ON public.inventory_sales FOR SELECT
  USING (is_business_owner(business_id));

CREATE POLICY "Users can create sales"
  ON public.inventory_sales FOR INSERT
  WITH CHECK (is_business_owner(business_id));

CREATE POLICY "Users can update own sales"
  ON public.inventory_sales FOR UPDATE
  USING (is_business_owner(business_id));

CREATE POLICY "Users can delete own sales"
  ON public.inventory_sales FOR DELETE
  USING (is_business_owner(business_id));

-- Updated_at trigger
CREATE TRIGGER update_inventory_sales_updated_at
  BEFORE UPDATE ON public.inventory_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
