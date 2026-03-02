# Recipe Creation Fix

## Problem
Users could not add recipes to the application. The app was failing when trying to insert recipes into the database.

## Root Cause
**Missing database permissions** for the `authenticated` role. The RLS (Row Level Security) policies were correctly configured, but the `authenticated` role lacked the necessary table-level permissions to INSERT, UPDATE, SELECT, and DELETE records.

### What Happened
1. RLS policies were defined correctly (allowing users to manage their own recipes)
2. But the underlying PostgreSQL GRANT permissions were missing
3. Without GRANT permissions, even correct RLS policies don't work
4. This is a common issue when setting up Supabase projects

## Fixes Applied

### 1. Created New Migration (20260225000007_grant_permissions.sql)
Added comprehensive permissions for the `anon` and `authenticated` roles:

```sql
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Future permissions (for new tables/functions)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;
```

### 2. Fixed Missing Import in RecipesScreen.tsx
Added missing `TextInput` import that was causing the search bar to fail.

**Before:**
```typescript
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
```

**After:**
```typescript
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,  // Added this
} from 'react-native';
```

## Testing
Verified that the following operations now work:

1. ✅ Create recipes (INSERT)
2. ✅ Create recipe versions (INSERT)
3. ✅ View recipes (SELECT)
4. ✅ Update recipes (UPDATE)
5. ✅ Delete recipes (DELETE)
6. ✅ Execute database functions (EXECUTE)

## How RLS + Grants Work Together

### Important Concept
Supabase security has two layers:

1. **PostgreSQL GRANT Permissions** (Table-level)
   - Controls which roles can access which tables
   - Must be granted explicitly
   - Without grants, NO operations work (even with RLS)

2. **Row Level Security (RLS) Policies** (Row-level)
   - Controls which specific rows users can access
   - Only works AFTER grants are in place
   - Enforces business logic (e.g., "users can only see their own data")

**Both must be configured correctly!**

### Example
```sql
-- 1. GRANT gives the authenticated role permission to use the recipes table
GRANT ALL ON recipes TO authenticated;

-- 2. RLS policy restricts which rows they can actually access
CREATE POLICY "Users can insert own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

Without the GRANT, the RLS policy is useless because the role can't even touch the table.

## Files Changed

1. `supabase/migrations/20260225000007_grant_permissions.sql` - New migration
2. `app/src/screens/recipes/RecipesScreen.tsx` - Added TextInput import

## No Action Required from You

The migration has been automatically applied. Just refresh your app and try adding a recipe again. Everything should work now!

## Verification Steps

To verify the fix worked:

1. Clear your browser cache and storage (or use the `clear_storage.html` utility)
2. Log in with: `test@example.com` / `password123`
3. Navigate to the Recipes tab
4. Click the "+" button
5. Fill out the recipe form
6. Save the recipe
7. Recipe should appear in your list!

## Why This Wasn't Caught Earlier

This is a common setup issue with Supabase. The Supabase starter templates and documentation sometimes assume you'll set up permissions manually through the dashboard or SQL editor. When creating migrations from scratch, it's easy to forget the GRANT statements.

Best practice: Always add a permissions migration after creating your schema!
