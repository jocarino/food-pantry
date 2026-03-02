-- Simplified Test User Creation
-- Run this in Supabase Studio SQL Editor (http://localhost:54323)

-- This creates a test user with email: test@example.com and password: password123

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();
  
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_sso_user
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'test@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"display_name": "Test User"}'::jsonb,
    now(),
    now(),
    false
  );
  
  -- Output the user ID
  RAISE NOTICE 'User created with ID: %', new_user_id;
  RAISE NOTICE 'Email: test@example.com';
  RAISE NOTICE 'Password: password123';
  
END $$;

-- Verify user was created
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'test@example.com';

-- Check user profile was auto-created by trigger
SELECT * FROM user_profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
