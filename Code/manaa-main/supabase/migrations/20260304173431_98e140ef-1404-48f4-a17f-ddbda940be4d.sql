
-- Allow service role to insert referrals (for edge function)
CREATE POLICY "Service role can insert referrals"
  ON public.referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow service role to update referrals
CREATE POLICY "Service role can update referrals"
  ON public.referrals FOR UPDATE
  TO authenticated
  USING (true);

-- Allow service role to insert earnings
CREATE POLICY "Service role can insert earnings"
  ON public.referral_earnings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow service role to update earnings  
CREATE POLICY "Service role can update earnings"
  ON public.referral_earnings FOR UPDATE
  TO authenticated
  USING (true);

-- Generate referral codes for existing users who don't have one
INSERT INTO public.referral_codes (user_id, code)
SELECT u.id, 'MNA-' || 
  chr(65 + floor(random()*26)::int) ||
  chr(65 + floor(random()*26)::int) ||
  chr(48 + floor(random()*10)::int) ||
  chr(65 + floor(random()*26)::int) ||
  chr(48 + floor(random()*10)::int) ||
  chr(65 + floor(random()*26)::int)
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.referral_codes rc WHERE rc.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;
