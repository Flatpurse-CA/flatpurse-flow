ALTER TABLE public.transactions ADD COLUMN mono_tx_id TEXT DEFAULT NULL;
CREATE INDEX idx_transactions_mono_tx_id ON public.transactions (mono_tx_id) WHERE mono_tx_id IS NOT NULL;