-- Set REPLICA IDENTITY FULL so Supabase Realtime sends full row data
-- This is required for RLS-filtered realtime subscriptions to work correctly
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.accounts REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;