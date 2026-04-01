
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their product images" ON storage.objects;

-- Create ownership-scoped policies using business_id folder path
CREATE POLICY "Users can upload own product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id::text = (storage.foldername(name))[1]
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id::text = (storage.foldername(name))[1]
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id::text = (storage.foldername(name))[1]
    AND user_id = auth.uid()
  )
);
