
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'transaction',
  is_read BOOLEAN NOT NULL DEFAULT false,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_notifications_user_read ON public.notifications (user_id, is_read, created_at DESC);

-- Trigger function: auto-create notification on new transaction
CREATE OR REPLACE FUNCTION public.notify_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id UUID;
  _biz_name TEXT;
  _acct_name TEXT;
  _title TEXT;
  _message TEXT;
BEGIN
  -- Get user_id through account -> business -> user chain
  SELECT b.user_id, b.name, a.name
  INTO _user_id, _biz_name, _acct_name
  FROM public.accounts a
  JOIN public.businesses b ON a.business_id = b.id
  WHERE a.id = NEW.account_id;

  IF NEW.type = 'cash_in' THEN
    _title := 'Cash In Recorded';
    _message := format('₦%s received in %s (%s) — %s', 
      trim(to_char(NEW.amount, 'FM999,999,999.00')), 
      _acct_name, _biz_name, 
      COALESCE(NEW.description, NEW.category));
  ELSE
    _title := 'Cash Out Recorded';
    _message := format('₦%s spent from %s (%s) — %s', 
      trim(to_char(NEW.amount, 'FM999,999,999.00')), 
      _acct_name, _biz_name, 
      COALESCE(NEW.description, NEW.category));
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, reference_id)
  VALUES (_user_id, _title, _message, 'transaction', NEW.id);

  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER on_transaction_created
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_transaction();
