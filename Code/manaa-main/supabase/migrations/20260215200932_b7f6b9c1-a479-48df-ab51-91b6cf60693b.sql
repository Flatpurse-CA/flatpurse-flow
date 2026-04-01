
-- Add address, phone, official_email to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS address text DEFAULT '';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS official_email text DEFAULT '';
