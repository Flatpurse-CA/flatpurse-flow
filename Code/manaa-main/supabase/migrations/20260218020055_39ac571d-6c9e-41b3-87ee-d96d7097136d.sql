-- Enable realtime for accounts table (so balance updates propagate instantly)
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;

-- Enable realtime for notifications table (so new notifications appear instantly)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;