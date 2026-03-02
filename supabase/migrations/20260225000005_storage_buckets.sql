-- Migration 5: Storage Buckets
-- Sets up Supabase Storage for recipe images and user avatars
-- Note: Storage must be enabled in Supabase CLI config

-- Skip if storage schema doesn't exist (optional feature)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    -- =====================================================
    -- RECIPE IMAGES BUCKET
    -- =====================================================
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- RLS Policies for recipe images bucket
-- Users can upload images to their own folder (user_id/*)
CREATE POLICY "Users can upload recipe images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'recipe-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Recipe images are publicly accessible (for sharing)
CREATE POLICY "Recipe images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-images');

-- Users can update their own recipe images
CREATE POLICY "Users can update own recipe images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'recipe-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own recipe images
CREATE POLICY "Users can delete own recipe images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'recipe-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- USER AVATARS BUCKET (Optional, for future use)
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- RLS Policies for avatars bucket
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Avatars are publicly accessible
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

    -- =====================================================
    -- COMMENTS
    -- =====================================================
    -- Note: Cannot add comments to storage.buckets columns as they are system tables
  END IF;
END $$;
