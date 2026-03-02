-- Check current users and their profiles
SELECT 'Users in auth.users:' as info;
SELECT id, email, created_at FROM auth.users;

SELECT 'Users in user_profiles:' as info;
SELECT id, display_name, created_at FROM user_profiles;

-- Create missing user profiles for any users that don't have them
INSERT INTO public.user_profiles (id, display_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'display_name', u.email)
FROM auth.users u
LEFT JOIN public.user_profiles up ON up.id = u.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify all users now have profiles
SELECT 'After fix - Users with profiles:' as info;
SELECT 
  u.id, 
  u.email, 
  up.display_name,
  CASE WHEN up.id IS NOT NULL THEN 'Has Profile' ELSE 'Missing Profile' END as status
FROM auth.users u
LEFT JOIN public.user_profiles up ON up.id = u.id;
