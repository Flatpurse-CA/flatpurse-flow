
-- Lead capture forms table
CREATE TABLE public.lead_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  fields JSONB NOT NULL DEFAULT '[{"name":"name","label":"Name","type":"text","required":true},{"name":"email","label":"Email","type":"email","required":false},{"name":"phone","label":"Phone","type":"tel","required":false}]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  theme_color TEXT DEFAULT '#6366f1',
  success_message TEXT DEFAULT 'Thank you! We''ll be in touch soon.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.lead_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lead forms" ON public.lead_forms
  FOR SELECT USING (is_business_owner(business_id));

CREATE POLICY "Users can create lead forms" ON public.lead_forms
  FOR INSERT WITH CHECK (is_business_owner(business_id));

CREATE POLICY "Users can update own lead forms" ON public.lead_forms
  FOR UPDATE USING (is_business_owner(business_id));

CREATE POLICY "Users can delete own lead forms" ON public.lead_forms
  FOR DELETE USING (is_business_owner(business_id));

-- Public read policy for the slug lookup (anyone can read active forms)
CREATE POLICY "Anyone can view active forms by slug" ON public.lead_forms
  FOR SELECT USING (is_active = true);

-- Updated_at trigger
CREATE TRIGGER update_lead_forms_updated_at
  BEFORE UPDATE ON public.lead_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
