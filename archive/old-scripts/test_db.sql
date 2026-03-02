-- Quick database test queries

-- Check if all tables exist
SELECT 
  schemaname, 
  tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check units count
SELECT COUNT(*) as total_units, type, system
FROM units
GROUP BY type, system
ORDER BY type, system;

-- Check if all database functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%pantry%' OR routine_name LIKE '%recipe%' OR routine_name LIKE '%stock%'
ORDER BY routine_name;

-- Check storage buckets
SELECT id, name, public, file_size_limit
FROM storage.buckets;
