
-- Drop the restrictive public SELECT policy and recreate as permissive
DROP POLICY IF EXISTS "Anyone can view active forms by slug" ON public.lead_forms;

-- Create a PERMISSIVE policy so anonymous/public users can view active forms
CREATE POLICY "Anyone can view active forms by slug"
ON public.lead_forms
FOR SELECT
TO anon, authenticated
USING (is_active = true);
