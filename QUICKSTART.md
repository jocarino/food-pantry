# Food Pantry App - Quick Start Guide

## 🚀 Your Supabase is Running!

Supabase is currently running on your machine. Here's how to get started:

---

## 📍 Important URLs

- **Supabase Studio**: http://localhost:54323
- **API URL**: http://localhost:54321
- **Database**: postgresql://postgres:postgres@127.0.0.1:54322/postgres

---

## 🔧 Step 1: Create a Test User

The Studio UI had an issue creating users. Use SQL instead:

### Option A: Using SQL Editor (Recommended)

1. Open **Supabase Studio**: http://localhost:54323
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `create_simple_test_user.sql`
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. You should see: "User created with ID: ..."

**Credentials created:**
- Email: `test@example.com`
- Password: `password123`

### Option B: Using Command Line

```bash
# Navigate to project directory
cd /Users/joao/Documents/Dev/food-pantry

# Run the SQL file
cat create_simple_test_user.sql | docker exec -i supabase_db_food-pantry psql -U postgres
```

---

## ✅ Step 2: Verify Everything Works

In Supabase Studio SQL Editor, run the verification script:

1. Copy contents of `verify_setup.sql`
2. Paste in SQL Editor
3. Click **Run**
4. Check the output - you should see:
   - 12 tables created
   - 45+ units loaded
   - 9 database functions
   - 2 storage buckets
   - 1 test user
   - 1 user profile

---

## 📝 Step 3: Add Sample Data (Optional)

Once you have a test user, add sample pantry items:

```sql
-- Get your user ID first
SELECT id FROM auth.users WHERE email = 'test@example.com';

-- Then insert sample data (replace YOUR-USER-ID with actual ID from above)
INSERT INTO pantry_items (user_id, name, quantity, unit, category, typical_quantity) VALUES
  ('YOUR-USER-ID', 'All-Purpose Flour', 500, 'g', 'pantry', 1000),
  ('YOUR-USER-ID', 'Granulated Sugar', 300, 'g', 'pantry', 1000),
  ('YOUR-USER-ID', 'Salt', 450, 'g', 'pantry', 500),
  ('YOUR-USER-ID', 'Olive Oil', 250, 'ml', 'pantry', 500),
  ('YOUR-USER-ID', 'Butter', 150, 'g', 'dairy', 250),
  ('YOUR-USER-ID', 'Eggs', 6, 'piece', 'dairy', 12),
  ('YOUR-USER-ID', 'Milk', 800, 'ml', 'dairy', 2000),
  ('YOUR-USER-ID', 'Tomatoes', 3, 'piece', 'produce', 10),
  ('YOUR-USER-ID', 'Onions', 2, 'piece', 'produce', 5),
  ('YOUR-USER-ID', 'Garlic', 8, 'clove', 'produce', 20);

-- View your pantry
SELECT * FROM pantry_items WHERE user_id = 'YOUR-USER-ID';
```

---

## 🧪 Step 4: Test Database Functions

Test some of the cool features:

```sql
-- Get your user ID
SELECT id FROM auth.users WHERE email = 'test@example.com';

-- Test low stock detection (replace YOUR-USER-ID)
SELECT * FROM get_low_stock_items('YOUR-USER-ID');

-- Test fuzzy ingredient matching
SELECT * FROM find_pantry_match('YOUR-USER-ID', 'tomatoe');  -- Intentional typo!

-- Test auto-add low stock items to shopping list
SELECT auto_add_low_stock_to_shopping_list('YOUR-USER-ID');

-- View shopping list
SELECT sl.name as list_name, sli.* 
FROM shopping_list_items sli
JOIN shopping_lists sl ON sl.id = sli.list_id
WHERE sl.user_id = 'YOUR-USER-ID';
```

---

## 🎯 What You Have Now

✅ **12 Database Tables**
- user_profiles, units, recipes, recipe_versions
- pantry_items, pantry_usage_history
- shopping_lists, shopping_list_items, shared_lists
- macro_logs, ingredient_match_confirmations, low_stock_alerts

✅ **45+ Measurement Units**
- Weight: g, kg, oz, lb
- Volume: ml, l, cup, tbsp, tsp
- Count: piece, clove, bunch, etc.

✅ **9 Database Functions**
- Fuzzy ingredient matching
- Recipe pantry deduction
- Low stock detection
- Auto-add to shopping list
- Macro calculations
- And more!

✅ **2 Storage Buckets**
- recipe-images
- avatars

✅ **Security**
- Row Level Security enabled
- Users can only access their own data
- Shopping lists can be shared

---

## 🔄 Useful Commands

```bash
# Check Supabase status
supabase status

# Stop Supabase
supabase stop

# Start Supabase
supabase start

# View logs
supabase logs

# Reset database (WARNING: Deletes all data)
supabase db reset
```

---

## 🐛 Troubleshooting

### "User creation failed"
- Use the SQL script method: `create_simple_test_user.sql`
- The Studio UI can be temperamental for user creation

### "Can't connect to database"
- Check Supabase is running: `docker ps | grep supabase`
- Should see 12 containers running
- Restart if needed: `supabase stop && supabase start`

### "Tables don't exist"
- Run: `supabase db reset`
- This will reapply all migrations

---

## 📚 Next Steps

Once you've verified everything works:

1. ✅ **Database Setup** (COMPLETE!)
2. 🔄 **Build React Native App**
3. 🔄 **Integrate Gemini API for Recipe Extraction**
4. 🔄 **Implement Pantry Features**
5. 🔄 **Build Shopping List UI**
6. 🔄 **Add Macro Tracking Dashboard**
7. 🔄 **Implement Offline Sync**

---

## 💡 Pro Tips

1. **Bookmark Supabase Studio**: http://localhost:54323
2. **Use SQL Editor** for quick testing
3. **Check Table Editor** to view data visually
4. **Authentication Tab** to manage users
5. **Storage Tab** to upload test images

---

## 🎉 You're Ready!

Your Food Pantry Management App database is fully operational and ready for development!

Need help? Check:
- Full documentation: `README.md`
- Test queries: `test_db.sql`
- Verification: `verify_setup.sql`
