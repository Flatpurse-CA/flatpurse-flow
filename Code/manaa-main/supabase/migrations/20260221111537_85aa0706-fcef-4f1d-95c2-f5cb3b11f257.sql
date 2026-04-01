
-- Add priority and lost_reason columns to deals
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'warm';
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS lost_reason text NULL;

-- Create deal_activities table for activity logging
CREATE TABLE public.deal_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'note',
  title text NOT NULL,
  description text NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own deal activities"
  ON public.deal_activities FOR SELECT
  USING (is_business_owner(business_id));

CREATE POLICY "Users can create deal activities"
  ON public.deal_activities FOR INSERT
  WITH CHECK (is_business_owner(business_id));

CREATE POLICY "Users can delete own deal activities"
  ON public.deal_activities FOR DELETE
  USING (is_business_owner(business_id));

-- Enable realtime for deal_activities
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_activities;
