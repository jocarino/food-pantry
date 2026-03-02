-- Seed Data for Local Development and Testing
-- This file creates a test user and sample data automatically

-- =====================================================
-- CREATE TEST USER
-- =====================================================
-- Create test user with a fixed UUID for consistency
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001', -- Fixed UUID for test user
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')), -- Bcrypt hash of 'password123'
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Test User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create user profile
INSERT INTO public.user_profiles (
  id,
  display_name,
  unit_system,
  low_stock_threshold_percent,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test User',
  'metric',
  20,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

SELECT 'Test user created successfully: test@example.com / password123' as message;
