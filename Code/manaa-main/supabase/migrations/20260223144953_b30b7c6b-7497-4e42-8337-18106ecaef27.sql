-- Table to store Mono-linked bank accounts
CREATE TABLE public.linked_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  mono_account_id text NOT NULL UNIQUE,
  institution_name text NOT NULL DEFAULT '',
  account_number text DEFAULT '',
  account_name text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.linked_bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own linked accounts"
  ON public.linked_bank_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own linked accounts"
  ON public.linked_bank_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own linked accounts"
  ON public.linked_bank_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own linked accounts"
  ON public.linked_bank_accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_linked_bank_accounts_updated_at
  BEFORE UPDATE ON public.linked_bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();