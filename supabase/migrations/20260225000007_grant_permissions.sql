-- Migration 7: Grant Permissions
-- Grants necessary permissions to anon and authenticated roles

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Grant sequence permissions (for auto-incrementing IDs)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Grant auth schema permissions (needed for triggers)
GRANT USAGE ON SCHEMA auth TO anon, authenticated;

-- Future permissions (for tables/functions created later)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;

-- Comments
COMMENT ON SCHEMA public IS 'Standard public schema with full access for authenticated users';
