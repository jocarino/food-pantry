# Fixes Applied - Database and Authentication Issues

## Problems Identified

### 1. User Profile Missing (PGRST116 Error)
**Error Message:** 
```
Error loading profile: {code: 'PGRST116', details: 'The result contains 0 rows', 
hint: null, message: 'Cannot coerce the result to a single JSON object'}
```

**Root Cause:** 
- User logged in with a session ID (`1bb21e54-5800-48c7-8e64-cba21220c588`) that doesn't exist in the fresh database
- Database was reset but browser still had old authentication tokens
- No user_profile record exists for this user ID

### 2. Shopping List Foreign Key Constraint Error
**Error Message:**
```
Error creating list: {code: '23503', details: 'Key is not present in table "users".', 
hint: null, message: 'insert or update on table "shopping_lists" violate foreign key constraint "shopping_lists_user_id_fkey"'}
```

**Root Cause:**
- Same issue - attempting to create a shopping list with a user_id that doesn't exist in auth.users
- The foreign key constraint correctly prevents orphaned records

### 3. Recipe Creation Issue
**Root Cause:**
- Same underlying authentication problem
- Can't create recipes without a valid user_id

### 4. Deprecated pointerEvents Warning
**Warning Message:**
```
props.pointerEvents is deprecated. Use style.pointerEvents
```

**Root Cause:**
- Internal React Native Web deprecation warning, not from our code
- Non-critical, will be fixed in library updates

## Fixes Applied

### 1. Enhanced AuthContext with Auto-Profile Creation

**File:** `app/src/contexts/AuthContext.tsx`

**Changes:**
- Modified `loadProfile()` function to detect missing profiles (PGRST116 error)
- When profile is missing, automatically attempt to create one
- If profile creation fails (user doesn't exist in auth.users), automatically sign out the user
- This prevents cascading errors and forces fresh authentication

**Code Changes:**
```typescript
const loadProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist - create it
        console.log('Profile not found, creating one...');
        const { data: userData } = await supabase.auth.getUser();
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            display_name: userData?.user?.email || 'User',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          // If we can't create a profile, the user probably doesn't exist in auth.users
          // This means the session is stale - sign out
          console.error('Stale session detected - signing out');
          await supabase.auth.signOut();
        } else {
          setProfile(newProfile);
        }
      } else {
        console.error('Error loading profile:', error);
        throw error;
      }
    } else {
      setProfile(data);
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  } finally {
    setLoading(false);
  }
};
```

### 2. Database Reset

**Action:** Reset local Supabase database to ensure all migrations are properly applied

```bash
npx supabase db reset
```

**Result:**
- All migrations applied fresh
- Test user created: `test@example.com` / `password123`
- Triggers properly set up for auto-creating user profiles

### 3. Storage Clear Utility

**File:** `clear_storage.html`

Created a utility page to help users clear browser storage when needed. This page can clear:
- LocalStorage
- SessionStorage  
- Cookies
- IndexedDB

**Usage:** Open `clear_storage.html` in your browser and click "Clear All Storage"

## How to Fix Your Current Issue

### Step 1: Clear Browser Storage

**Option A - Use the utility (Recommended):**
1. Open `clear_storage.html` in your browser
2. Click "Clear All Storage"
3. Refresh your app

**Option B - Manual clearing:**
1. Open browser DevTools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Clear all Local Storage, Session Storage, and Cookies for localhost
4. Refresh the page

### Step 2: Log In with Test Credentials

After clearing storage, you'll be logged out. Use these credentials:

- **Email:** test@example.com
- **Password:** password123

### Step 3: Verify Everything Works

After logging in, test:
1. ✅ Profile loads without errors
2. ✅ Can create shopping lists
3. ✅ Can add items to shopping lists
4. ✅ Can create recipes (manual or AI-powered)
5. ✅ Can add recipes to shopping lists

## Additional Notes

### Database Trigger
The database has a trigger that automatically creates user profiles when new users sign up:

```sql
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();
```

This ensures all new signups automatically get a user profile.

### Row Level Security (RLS)
All tables have RLS policies that ensure users can only access their own data:

- Users can only see their own profiles
- Users can only access their own recipes
- Users can only access their own pantry items
- Users can only access shopping lists they own or that are shared with them

## Prevention

To avoid this issue in the future:

1. **Don't reset the database while users are logged in**
2. **Always clear browser storage after a database reset**
3. **In production, use proper migrations instead of resets**
4. **Consider adding a version check in the app to detect database resets**

## Testing

To verify the fixes are working:

```bash
# 1. Start the development server
cd app
npm start

# 2. In another terminal, ensure Supabase is running
cd ..
npx supabase status

# 3. Open the app in your browser
# 4. Clear storage using clear_storage.html
# 5. Log in with test@example.com / password123
# 6. Test all features
```

## Summary

All errors were caused by a **stale authentication session** after the database was reset. The fixes:

1. ✅ Enhanced AuthContext to handle missing profiles gracefully
2. ✅ Auto-create profiles when missing
3. ✅ Auto-logout when user doesn't exist (stale session)
4. ✅ Provided storage clear utility
5. ✅ Reset database with fresh migrations

**Action Required:** Clear your browser storage and log in again with the test credentials.
