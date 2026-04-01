
-- Drop overly permissive policies and replace with scoped ones
DROP POLICY "Service role can insert referrals" ON public.referrals;
DROP POLICY "Service role can update referrals" ON public.referrals;
DROP POLICY "Service role can insert earnings" ON public.referral_earnings;
DROP POLICY "Service role can update earnings" ON public.referral_earnings;

-- Referrals: users can only insert referrals where they are the referred person
CREATE POLICY "Users can create referral for themselves"
  ON public.referrals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referred_id);
