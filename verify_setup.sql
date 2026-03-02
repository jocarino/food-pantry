-- Verification Script
-- Run this to verify your Supabase setup is working correctly

-- 1. Check all tables exist
SELECT 'Tables Created:' as check_type;
SELECT 
  schemaname, 
  tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Check units are loaded
SELECT '---' as separator;
SELECT 'Units Loaded:' as check_type;
SELECT 
  COUNT(*) as total_units,
  type,
  system
FROM units
GROUP BY type, system
ORDER BY type, system;

-- 3. Check database functions exist
SELECT '---' as separator;
SELECT 'Database Functions:' as check_type;
SELECT 
  routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 4. Check storage buckets
SELECT '---' as separator;
SELECT 'Storage Buckets:' as check_type;
SELECT 
  id, 
  name, 
  public,
  file_size_limit / 1024 / 1024 as max_size_mb
FROM storage.buckets;

-- 5. Check if test user exists
SELECT '---' as separator;
SELECT 'Test User:' as check_type;
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'test@example.com';

-- 6. Check user profile
SELECT '---' as separator;
SELECT 'User Profile:' as check_type;
SELECT 
  id,
  display_name,
  unit_system,
  low_stock_threshold_percent
FROM user_profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'test@example.com' LIMIT 1);

-- 7. Summary
SELECT '---' as separator;
SELECT 'Setup Summary:' as check_type;
SELECT 
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as total_tables,
  (SELECT COUNT(*) FROM units) as total_units,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') as total_functions,
  (SELECT COUNT(*) FROM storage.buckets) as total_buckets,
  (SELECT COUNT(*) FROM auth.users) as total_users;
