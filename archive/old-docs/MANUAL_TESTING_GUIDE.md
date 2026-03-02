# Manual Testing Guide - Recipe Pantry Deduction Workflow

This guide will help you manually verify that the Recipe Pantry Deduction Workflow is working correctly in the browser.

---

## Prerequisites

### 1. Start the Application
```bash
# Terminal 1: Start Supabase (if not already running)
cd /Users/joao/Documents/Dev/food-pantry
npx supabase start

# Terminal 2: Start the Expo dev server (if not already running)
cd /Users/joao/Documents/Dev/food-pantry/app
npm start
```

### 2. Seed Test Data (if not already done)
```bash
cd /Users/joao/Documents/Dev/food-pantry/app
NODE_PATH=./node_modules node ../scripts/seed-test-data.js
```

Expected output:
```
✨ Test data seeded successfully!
Recipe: "Test Pancakes" (4 servings)
Pantry Items: 6 items with sufficient quantities
```

### 3. Open the App
- Open your browser and navigate to: http://localhost:8081
- Or scan the QR code with Expo Go on your mobile device

---

## Test Procedure

### Step 1: Login
1. On the login screen, enter:
   - **Email**: `test@example.com`
   - **Password**: `password123`
2. Click **"Sign In"**
3. ✅ **Expected**: You should be logged in and see the home screen

---

### Step 2: View Pantry (Initial State)
1. Click on the **"Pantry"** tab at the bottom
2. ✅ **Expected**: You should see pantry items including:
   - eggs: 12 whole
   - flour: 1000 g
   - milk: 1500 ml
   - sugar: 200 g
   - vanilla extract: 50 ml
   - butter: 50 g

**📸 SCREENSHOT THIS - "Pantry Before Cooking"**

---

### Step 3: Navigate to Recipe
1. Click on the **"Recipes"** tab at the bottom
2. ✅ **Expected**: You should see a recipe card for **"Test Pancakes"**
3. Click on the **"Test Pancakes"** recipe card
4. ✅ **Expected**: Recipe detail screen should load showing:
   - Title: "Test Pancakes"
   - Description: "Simple pancakes recipe for testing the cook workflow"
   - Servings: 4, Prep: 10 min, Cook: 15 min
   - Ingredients section with 5 ingredients:
     - 250 g flour
     - 500 ml milk
     - 2 whole eggs
     - 50 g sugar
     - 5 ml vanilla extract
   - Instructions section with 3 steps
   - Footer with:
     - Servings multiplier controls: **[−] x1 [+]**
     - **🛒 Add to Shopping List** button (blue)
     - **🍳 Cook This Recipe** button (green)

**📸 SCREENSHOT THIS - "Recipe Detail Initial"**

---

### Step 4: Test Servings Multiplier
1. On the recipe detail screen, locate the servings multiplier: **[−] x1 [+]**
2. Click the **[+]** button once
3. ✅ **Expected**: Multiplier changes from **x1** to **x2**
4. Click the **[+]** button again
5. ✅ **Expected**: Multiplier changes from **x2** to **x3**
6. Click the **[−]** button once
7. ✅ **Expected**: Multiplier changes from **x3** to **x2**
8. Click the **[−]** button twice
9. ✅ **Expected**: Multiplier stays at **x1** (cannot go below 1)

**📸 SCREENSHOT THIS - "Multiplier at x2 or x3"**

---

### Step 5: Cook Recipe (x1 Serving)
1. Ensure the multiplier is set to **x1**
2. Click the **🍳 Cook This Recipe** button (green button)
3. ✅ **Expected**: A confirmation dialog should appear:
   - **Title**: "Cook Recipe"
   - **Message**: "This will deduct ingredients from your pantry. Continue?"
   - **Buttons**: "Cancel" and "Cook"

**📸 SCREENSHOT THIS - "Confirmation Dialog"**

4. Click the **"Cook"** button
5. ⏳ Wait 1-2 seconds for processing
6. ✅ **Expected**: A success dialog should appear:
   - **Title**: "Success!"
   - **Message**: "Recipe cooked! 5 ingredients deducted from pantry."
   - **Button**: "OK"

**📸 SCREENSHOT THIS - "Success Dialog"**

7. Click **"OK"** to dismiss the dialog

---

### Step 6: Verify Pantry Changes
1. Click on the **"Pantry"** tab at the bottom
2. ✅ **Expected**: Pantry quantities should have changed:
   - eggs: **10 whole** (was 12, deducted 2) ✅
   - flour: **750 g** (was 1000g, deducted 250g) ✅
   - milk: **1000 ml** (was 1500ml, deducted 500ml) ✅
   - sugar: **150 g** (was 200g, deducted 50g) ✅
   - vanilla extract: **45 ml** (was 50ml, deducted 5ml) ✅
   - butter: **50 g** (unchanged, not in recipe) ✅

**📸 SCREENSHOT THIS - "Pantry After Cooking"**

---

### Step 7: Cook Recipe with Multiplier (x2)
1. Go back to **"Recipes"** tab
2. Click on **"Test Pancakes"** again
3. Click the **[+]** button to set multiplier to **x2**
4. ✅ **Expected**: Multiplier shows **x2**
5. Click **🍳 Cook This Recipe**
6. ✅ **Expected**: Confirmation dialog shows:
   - **Message**: "This will deduct ingredients from your pantry (x2). Continue?"
   - Note the **(x2)** in the message!

**📸 SCREENSHOT THIS - "Confirmation with Multiplier x2"**

7. Click **"Cook"**
8. ✅ **Expected**: Success dialog appears
9. Click **"OK"**

---

### Step 8: Verify Multiplier Effect
1. Go to **"Pantry"** tab
2. ✅ **Expected**: Pantry quantities should reflect x2 deduction:
   - flour: **250 g** (was 750g, deducted 500g = 250g × 2) ✅
   - milk: **0 ml** (was 1000ml, deducted 1000ml = 500ml × 2) ✅
   - eggs: **6 whole** (was 10, deducted 4 = 2 × 2) ✅
   - sugar: **50 g** (was 150g, deducted 100g = 50g × 2) ✅
   - vanilla extract: **35 ml** (was 45ml, deducted 10ml = 5ml × 2) ✅

**📸 SCREENSHOT THIS - "Pantry After Cooking x2"**

---

### Step 9: Test Shopping List Integration
1. Go to **"Recipes"** tab
2. Click on **"Test Pancakes"**
3. Click the **🛒 Add to Shopping List** button (blue button)
4. ✅ **Expected**: Success dialog appears:
   - **Title**: "Added to Shopping List!"
   - **Message**: "5 ingredient(s) from 'Test Pancakes' added."
   - **Buttons**: "OK" and "View List"

**📸 SCREENSHOT THIS - "Add to Shopping List Success"**

5. Click **"View List"**
6. ✅ **Expected**: Navigated to **"Shopping List"** tab
7. ✅ **Expected**: Shopping list shows 5 items:
   - flour 📖 Test Pancakes
   - milk 📖 Test Pancakes
   - eggs 📖 Test Pancakes
   - sugar 📖 Test Pancakes
   - vanilla extract 📖 Test Pancakes

**📸 SCREENSHOT THIS - "Shopping List with Recipe Items"**

---

## Success Criteria

✅ **All tests passed if:**
1. Login works
2. Pantry displays initial quantities correctly
3. Recipe detail screen loads with all information
4. Servings multiplier buttons work (+ and -)
5. Cook button triggers confirmation dialog
6. Cooking deducts correct quantities from pantry
7. x2 multiplier doubles the deduction
8. Shopping list integration works
9. No JavaScript errors in browser console

---

## Troubleshooting

### Issue: Recipe "Test Pancakes" not found
**Solution**: Run the seed script again:
```bash
cd /Users/joao/Documents/Dev/food-pantry/app
NODE_PATH=./node_modules node ../scripts/seed-test-data.js
```

### Issue: Pantry quantities are not correct
**Solution**: The seed script resets pantry to initial quantities. Run it again:
```bash
cd /Users/joao/Documents/Dev/food-pantry/app
NODE_PATH=./node_modules node ../scripts/seed-test-data.js
```

### Issue: Buttons not working
**Check**: 
1. Open browser DevTools (F12)
2. Check Console tab for JavaScript errors
3. Try clicking buttons with DevTools open to see if events are firing

### Issue: Can't login
**Check**: 
1. Verify Supabase is running: `npx supabase status`
2. Verify test user exists: Check the seed.sql was applied
3. Try: test@example.com / password123

---

## Reset Testing Environment

To start fresh and test again:

```bash
# 1. Reset database and reseed
cd /Users/joao/Documents/Dev/food-pantry
npx supabase db reset

# 2. Reseed test data
cd app
NODE_PATH=./node_modules node ../scripts/seed-test-data.js

# 3. Restart the app (if needed)
npm start
```

---

## Advanced Testing

### Test Missing Ingredient Scenario
1. Go to Pantry and delete "vanilla extract"
2. Go to Recipe and try to cook "Test Pancakes"
3. ✅ **Expected**: Dialog shows "1 ingredients couldn't be found in your pantry. Would you like to add them to your shopping list?"

### Test Insufficient Quantity Scenario
1. Go to Pantry and set flour quantity to 100g (less than recipe needs 250g)
2. Go to Recipe and cook "Test Pancakes"
3. ✅ **Expected**: Flour goes to 0g (not negative)
4. ✅ **Expected**: Other ingredients are still deducted normally

### Test High Multiplier
1. Set servings multiplier to **x5** or higher
2. Cook the recipe
3. ✅ **Expected**: All quantities deducted by 5x the recipe amounts
4. Verify in pantry that calculations are correct

---

## Reporting Issues

If you find any issues during manual testing:

1. **Document**:
   - What you did (steps)
   - What you expected
   - What actually happened
   - Screenshots
   - Browser console errors (F12 → Console tab)

2. **Check**:
   - Is the backend working? Run: `node ../scripts/comprehensive-test.js`
   - Are there errors in the browser console?
   - Is Supabase running? Run: `npx supabase status`

3. **Common Fixes**:
   - Refresh the page
   - Clear browser cache
   - Restart the Expo dev server
   - Reseed test data

---

**Happy Testing!** 🎉

If all steps above work correctly, the Recipe Pantry Deduction Workflow is fully functional and ready for production use.
