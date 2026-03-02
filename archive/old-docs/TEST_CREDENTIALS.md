# Test Credentials

## User Account
- **Email:** test@example.com
- **Password:** password123
- **User ID:** ce62e73c-c6d6-4786-aa4d-a4bef6f46712

## Database Contents
- ✅ User profile created (metric units, 20% low stock threshold)
- ✅ 13 pantry items loaded with realistic stock levels:
  - Chicken Breast (400g / 1000g typical) - 40% stock
  - Tomatoes (3 / 10 typical) - 30% stock ⚠️ LOW
  - Onions (2 / 8 typical) - 25% stock ⚠️ LOW
  - Olive Oil (250ml / 500ml typical) - 50% stock
  - Salt (450g / 500g typical) - 90% stock
  - Milk (800ml / 2000ml typical) - 40% stock
  - Eggs (6 / 12 typical) - 50% stock
  - Butter (100g / 250g typical) - 40% stock
  - Flour (1500g / 2000g typical) - 75% stock
  - Sugar (500g / 1000g typical) - 50% stock
  - Rice (200g / 2000g typical) - 10% stock ⚠️ VERY LOW
  - Pasta (150g / 1000g typical) - 15% stock ⚠️ VERY LOW
  - Cheese (80g / 400g typical) - 20% stock ⚠️ LOW

## Connection Test Results
✅ Sign in successful
✅ User profile fetch successful
✅ Pantry items fetch successful (13 items)
✅ RLS working correctly (unauthorized requests blocked)

## Fixed Issues
1. **Root Cause:** The `create_user_profile()` trigger function wasn't schema-qualified
   - The `supabase_auth_admin` role has `search_path=auth` (not `public`)
   - Function needed `INSERT INTO public.user_profiles` (not just `user_profiles`)
   
2. **Solution Applied:**
   - Updated migration file: `20260225000004_functions_triggers.sql`
   - Added `public.` prefix to table name in function
   - Function now works correctly on user signup

## Next Steps
- Open web app at http://localhost:8081
- Sign in with test@example.com / password123
- Verify pantry screen displays all 13 items
- Test on mobile device via Expo Go
