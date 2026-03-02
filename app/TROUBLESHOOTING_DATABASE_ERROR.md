# 🔧 Troubleshooting "Database Error Querying Schema"

## What This Error Means

This error happens when the app tries to query the database but something goes wrong. Common causes:

1. **Network issue** - Can't reach Supabase
2. **RLS (Row Level Security)** - Policies preventing access
3. **Missing data** - User profile doesn't exist
4. **Authentication issue** - Session expired or invalid

---

## 🔍 Quick Diagnosis

### Step 1: Check If You Can See the Error Details

I've updated the app to show more details. Restart the app and look at the error message on the screen.

**Restart the app:**
```bash
# Stop Expo (Ctrl+C)
cd /Users/joao/Documents/Dev/food-pantry/app
npm start -- --clear
```

Scan the QR code again and login. The error screen will now show more details.

---

### Step 2: Check Console Logs

On Android, you can see logs in the terminal where `npm start` is running.

Look for lines like:
```
Error loading pantry items: {...}
Error details: {...}
```

---

### Step 3: Test Supabase Connection

**From your phone's browser:**
1. Open browser on your phone
2. Go to: `http://192.168.0.193:54321`
3. You should see JSON response like: `{"msg":"Database is reachable"}`

**If you see an error:**
- Your phone can't reach Supabase
- Check WiFi (same network as Mac?)
- Check IP address is correct

---

## 🛠️ Common Fixes

### Fix 1: User Profile Missing

The error might happen if your user profile wasn't created properly.

**Check if profile exists:**
```bash
cd /Users/joao/Documents/Dev/food-pantry

docker exec -i supabase_db_food-pantry psql -U postgres -d postgres << 'EOF'
SELECT id, display_name, unit_system 
FROM user_profiles 
WHERE id = 'a9a045ee-93c2-4be2-bd4a-6a235ae156ae';
EOF
```

**If no results, create it:**
```bash
docker exec -i supabase_db_food-pantry psql -U postgres -d postgres << 'EOF'
INSERT INTO user_profiles (id, display_name, unit_system, low_stock_threshold_percent)
VALUES ('a9a045ee-93c2-4be2-bd4a-6a235ae156ae', 'Test User', 'metric', 20)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  unit_system = EXCLUDED.unit_system;
EOF
```

---

### Fix 2: RLS Policies Issue

Sometimes RLS policies can block legitimate queries.

**Test RLS policies:**
```bash
cd /Users/joao/Documents/Dev/food-pantry

docker exec -i supabase_db_food-pantry psql -U postgres -d postgres << 'EOF'
-- Set context to test user
SET request.jwt.claims TO '{"sub":"a9a045ee-93c2-4be2-bd4a-6a235ae156ae"}';

-- Try to select pantry items
SELECT COUNT(*) FROM pantry_items WHERE user_id = 'a9a045ee-93c2-4be2-bd4a-6a235ae156ae';
EOF
```

**Should show:** `count = 13`

**If shows 0 or error:**
```bash
# Re-apply RLS policies
cd /Users/joao/Documents/Dev/food-pantry
supabase db reset
```

---

### Fix 3: Session/Token Issue

The authentication token might be invalid.

**Test:**
1. In the app, go to Profile tab
2. Tap "Sign Out"
3. Login again
4. Go to Pantry tab

**If still fails:**
- Clear app data in Expo Go
- Or restart Expo with: `npm start -- --clear`

---

### Fix 4: Network/IP Issue

**Verify your Mac's IP hasn't changed:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**If different from 192.168.0.193:**
1. Update `.env` with new IP
2. Restart Expo: `npm start -- --clear`
3. Scan new QR code

---

### Fix 5: Supabase Not Running

**Check Supabase status:**
```bash
cd /Users/joao/Documents/Dev/food-pantry
supabase status
```

**Should show:** "Started supabase local development setup"

**If not running:**
```bash
supabase start
```

---

## 🔬 Advanced Debugging

### Check Supabase Logs

```bash
cd /Users/joao/Documents/Dev/food-pantry
supabase logs

# Or specific service:
supabase logs --service postgres
supabase logs --service auth
```

### Test Direct Query from Terminal

```bash
# Test with anon key (same as app uses)
curl -X GET 'http://192.168.0.193:54321/rest/v1/pantry_items?user_id=eq.a9a045ee-93c2-4be2-bd4a-6a235ae156ae' \
  -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
  -H "Authorization: Bearer sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
```

**Should return:** JSON array with 13 items

---

## ✅ Checklist

Run through these checks:

- [ ] Supabase is running (`supabase status`)
- [ ] IP address in `.env` is correct (`192.168.0.193`)
- [ ] Phone is on same WiFi as Mac
- [ ] Can access `http://192.168.0.193:54321` from phone browser
- [ ] User profile exists in database
- [ ] Pantry items exist (13 items)
- [ ] Restarted Expo with `--clear` flag
- [ ] Tried signing out and back in

---

## 📞 Get More Info

After updating the code, the error screen will show:
- ⚠️ Error icon
- Error message
- Retry button

**The error message will tell you exactly what's wrong!**

---

## 🎯 Most Likely Solution

Based on the error "database error querying schema", the most common causes are:

1. **User profile doesn't exist** (Fix 1 above)
2. **RLS policy blocking query** (Fix 2 above)
3. **Network connection issue** (Fix 4 above)

**Try Fix 1 first** - Make sure the user profile exists.

---

## 🔄 After Fixes

1. Stop Expo (Ctrl+C)
2. Restart: `npm start -- --clear`
3. Scan QR code again
4. Login
5. Check Pantry tab

**The detailed error message will guide you!**
