-- Add status column to contacts to distinguish leads from contacts
ALTER TABLE public.contacts ADD COLUMN status text NOT NULL DEFAULT 'lead';

-- Index for filtering
CREATE INDEX idx_contacts_status ON public.contacts (status);
