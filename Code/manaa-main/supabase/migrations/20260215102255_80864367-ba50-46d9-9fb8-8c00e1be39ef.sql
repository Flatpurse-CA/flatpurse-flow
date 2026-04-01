
-- Add TIN (Tax Identification Number) to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS tin text DEFAULT '';

-- Add currency to businesses (default NGN for Nigerian market)
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'NGN';
