
ALTER TABLE public.businesses
ADD COLUMN bank_name text DEFAULT '' NULL,
ADD COLUMN bank_account_number text DEFAULT '' NULL,
ADD COLUMN bank_account_name text DEFAULT '' NULL;
