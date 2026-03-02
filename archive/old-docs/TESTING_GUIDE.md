# 🧪 Testing Your App - Step by Step

## ✅ What You Should See Now

### 1. **Login Screen**

When the app loads, you should see:
- **Title**: "Food Pantry"
- **Subtitle**: "Welcome Back"
- **Email input field**
- **Password input field**
- **Sign In button** (blue)
- **Test credentials box** showing:
  ```
  Email: test@example.com
  Password: password123
  ```

**Action**: Enter the test credentials and tap "Sign In"

---

### 2. **After Login - Main App (Bottom Tabs)**

You should see 4 tabs at the bottom:
- 🏠 **Pantry** (selected by default)
- 📖 **Recipes**
- 🛒 **Shopping List**
- 👤 **Profile**

---

### 3. **Pantry Tab** (Current View)

Should display **13 items** from your database:

#### **Dairy Category** (Blue badges)
- **Butter** - 150g (60% stock - orange bar)
- **Eggs** - 6 pieces (50% stock - orange bar)
- **Milk** - 800ml (40% stock - orange bar)

#### **Meat Category** (Red badge)
- **Chicken Breast** - 400g (40% stock)

#### **Pantry Category** (Yellow badges)
- **All-Purpose Flour** - 500g (50% stock)
- **Granulated Sugar** - 300g (30% stock)
- **Olive Oil** - 250ml (50% stock)
- **Pasta** - 150g (30% stock)
- **Rice** - 800g (40% stock)
- **Salt** - 450g (90% stock - green bar)

#### **Produce Category** (Green badges)
- **Garlic** - 8 cloves (40% stock)
- **Onions** - 2 pieces (40% stock)
- **Tomatoes** - 3 pieces (30% stock)

**Features to Test**:
- ✅ Pull down to refresh (data reloads)
- ✅ Scroll through list
- ✅ See color-coded stock bars:
  - 🔴 Red = <20% (critical)
  - 🟠 Orange = 20-50% (low)
  - 🟢 Green = >50% (good)

---

### 4. **Recipes Tab**

Shows:
- "Recipes Screen"
- "Coming soon..."

*(This will be built next)*

---

### 5. **Shopping List Tab**

Shows:
- "Shopping List"
- "Coming soon..."

*(This will be built next)*

---

### 6. **Profile Tab**

Should display:
- **Email**: test@example.com
- **Display Name**: Test User
- **Unit System**: metric
- **Low Stock Threshold**: 20%
- **Sign Out button** (red)

**Action**: Tap "Sign Out" to test logout

---

## 🧪 Test Scenarios

### Test 1: Login Flow
1. ✅ Enter credentials
2. ✅ Tap "Sign In"
3. ✅ Should see Pantry screen with items
4. ✅ Bottom tabs should appear

### Test 2: Data Loading
1. ✅ Open Pantry tab
2. ✅ Should see 13 items
3. ✅ Each item should have:
   - Name
   - Quantity + unit
   - Category badge (colored)
   - Stock bar (colored)

### Test 3: Pull to Refresh
1. ✅ On Pantry tab, pull down
2. ✅ Spinner appears
3. ✅ Data refreshes

### Test 4: Navigation
1. ✅ Tap each bottom tab
2. ✅ Screen changes
3. ✅ Tab highlights

### Test 5: Profile
1. ✅ Go to Profile tab
2. ✅ See user info
3. ✅ Tap "Sign Out"
4. ✅ Confirm in alert
5. ✅ Should return to Login screen

### Test 6: Re-login
1. ✅ Login again
2. ✅ Should see same data
3. ✅ Session persists

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot connect to Supabase"

**Check:**
```bash
# Is Supabase running?
cd /Users/joao/Documents/Dev/food-pantry
supabase status

# Should show "Started supabase local development setup"
```

**Fix:**
```bash
supabase start
```

---

### Issue: Pantry shows "Your pantry is empty"

**Problem**: Sample data not loaded

**Fix:**
```bash
# Re-run sample data
docker exec -i supabase_db_food-pantry psql -U postgres -d postgres < add_sample_data.sql
```

---

### Issue: Login fails with "Invalid credentials"

**Check**: Make sure you're using:
- Email: `test@example.com` (exact)
- Password: `password123` (exact)

**Verify user exists:**
```bash
docker exec -i supabase_db_food-pantry psql -U postgres -d postgres -c "SELECT email FROM auth.users WHERE email = 'test@example.com';"
```

---

### Issue: Stuck on login screen after entering credentials

**Check browser console** (F12 or Cmd+Option+I):
- Look for errors
- Common: Supabase connection error

---

## 📱 Testing on Phone (Expo Go)

### Android:
1. Install **Expo Go** from Play Store
2. Open Expo Go app
3. Tap "Scan QR Code"
4. Scan QR in terminal
5. App loads on phone!

### iOS:
1. Install **Expo Go** from App Store
2. Open Camera app
3. Point at QR code in terminal
4. Tap notification to open in Expo Go
5. App loads on phone!

**Note**: Phone and computer must be on same WiFi

---

## ✅ Success Checklist

- [ ] Web app loads at http://localhost:8081
- [ ] Login screen appears
- [ ] Can login with test credentials
- [ ] Pantry shows 13 items with correct data
- [ ] Stock bars show colors (red/orange/green)
- [ ] Can pull to refresh
- [ ] Can navigate between tabs
- [ ] Profile shows user info
- [ ] Can sign out
- [ ] Can sign back in

---

## 🎉 If Everything Works

**Congratulations!** Your app is fully functional! 

You have:
- ✅ Real-time database connection
- ✅ Authentication working
- ✅ Data loading from Supabase
- ✅ Responsive UI
- ✅ Navigation working
- ✅ Ready to build more features!

---

## 📸 What It Should Look Like

### Login Screen
```
┌─────────────────────────┐
│                         │
│     Food Pantry         │
│     Welcome Back        │
│                         │
│  ┌─────────────────┐   │
│  │ Email           │   │
│  └─────────────────┘   │
│  ┌─────────────────┐   │
│  │ Password        │   │
│  └─────────────────┘   │
│                         │
│  ┌─────────────────┐   │
│  │    Sign In      │   │
│  └─────────────────┘   │
│                         │
│  Test Credentials:      │
│  test@example.com       │
│  password123            │
└─────────────────────────┘
```

### Pantry Screen
```
┌─────────────────────────┐
│      My Pantry          │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ Butter        DAIRY │ │
│ │ 150g                │ │
│ │ ████░░░░░░ 60%      │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Eggs          DAIRY │ │
│ │ 6 pieces            │ │
│ │ █████░░░░░ 50%      │ │
│ └─────────────────────┘ │
│                         │
│ ... more items ...      │
├─────────────────────────┤
│ [Pantry] Recipes Shop ⚙ │
└─────────────────────────┘
```

---

**Need help? Check the logs in your terminal or browser console (F12)!**
