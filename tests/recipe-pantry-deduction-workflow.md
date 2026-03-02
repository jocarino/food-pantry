# Recipe Pantry Deduction Workflow - Comprehensive Test Plan

**Test File Type:** Agent Testing Guide  
**Workflow:** Recipe to Pantry Deduction (Cook Recipe Feature)  
**Last Updated:** 2026-02-27  
**Target Screen:** RecipeDetailScreen.tsx  
**Target RPC Function:** deduct_recipe_from_pantry  

---

## Overview

This test plan provides comprehensive step-by-step instructions for testing the "Cook This Recipe" workflow, which automatically deducts recipe ingredients from the user's pantry inventory. This workflow involves:

1. Viewing recipe details
2. Adjusting serving multipliers
3. Cooking the recipe (triggers pantry deduction)
4. Handling exact matches, fuzzy matches, and missing ingredients
5. Optional shopping list integration for missing items

---

## Prerequisites & Setup

### Required Test Data

Before starting tests, ensure the following data exists in the database:

#### Test User Profile
```sql
-- User should have:
- Valid authenticated user account
- user_profiles entry with:
  - unit_system: 'metric' or 'imperial'
  - low_stock_threshold_percent: 20 (default)
```

#### Test Recipe with Ingredients
```sql
-- Recipe with title: "Test Pancakes"
-- Recipe Version with:
  - servings: 4
  - prep_time_minutes: 10
  - cook_time_minutes: 15
  - ingredients: [
      {
        "name": "flour",
        "metric_quantity": 250,
        "metric_unit": "g",
        "imperial_quantity": 2,
        "imperial_unit": "cups"
      },
      {
        "name": "milk",
        "metric_quantity": 500,
        "metric_unit": "ml",
        "imperial_quantity": 2,
        "imperial_unit": "cups"
      },
      {
        "name": "eggs",
        "metric_quantity": 2,
        "metric_unit": "whole",
        "imperial_quantity": 2,
        "imperial_unit": "whole"
      },
      {
        "name": "sugar",
        "metric_quantity": 50,
        "metric_unit": "g",
        "imperial_quantity": 0.25,
        "imperial_unit": "cups"
      },
      {
        "name": "vanilla extract",
        "metric_quantity": 5,
        "metric_unit": "ml",
        "imperial_quantity": 1,
        "imperial_unit": "tsp"
      }
    ]
  - instructions: [
      { "step_number": 1, "text": "Mix dry ingredients" },
      { "step_number": 2, "text": "Add wet ingredients" },
      { "step_number": 3, "text": "Cook on griddle" }
    ]
```

#### Test Pantry Items
```sql
-- Create pantry items for testing different match scenarios:

1. Exact Match Items:
   - name: "flour", quantity: 1000, unit: "g", category: "pantry"
   - name: "milk", quantity: 1500, unit: "ml", category: "dairy"
   - name: "eggs", quantity: 12, unit: "whole", category: "dairy"

2. Sufficient Stock Items:
   - name: "sugar", quantity: 200, unit: "g", category: "pantry"

3. Low Stock Item (will go to 0):
   - name: "butter", quantity: 50, unit: "g", category: "dairy"

4. Missing Ingredient:
   - (Do NOT create "vanilla extract" in pantry)
```

---

## Test Scenarios

---

## **TEST 1: Navigate to Recipe Detail Screen**

### Objective
Verify that the recipe detail screen loads correctly with all recipe information displayed.

### Steps
1. Launch the app and ensure user is logged in
2. Navigate to "Recipes" tab (bottom navigation)
3. Locate "Test Pancakes" recipe in the list
4. Tap on the "Test Pancakes" recipe card

### Expected Results
✅ Recipe detail screen loads without errors  
✅ Recipe title "Test Pancakes" is displayed prominently  
✅ Recipe description is shown (if present)  
✅ Recipe metadata is visible:
   - Servings: 4
   - Prep time: 10 min
   - Cook time: 15 min  
✅ "Ingredients" section is visible with 5 ingredients listed  
✅ "Instructions" section is visible with 3 steps  
✅ Each ingredient shows quantity in user's preferred unit system (metric or imperial)  
✅ Footer section is visible with:
   - Servings multiplier controls (-, x1, +)
   - "🛒 Add to Shopping List" button
   - "🍳 Cook This Recipe" button (green background)  

### UI Elements to Verify
- Title font size: 28, bold, color: #2c3e50
- Ingredients with bullet points (• symbol in blue #3498db)
- Instructions with numbered circles (blue background #3498db)
- Footer is fixed at bottom with white background
- Multiplier buttons are circular, blue (#3498db)
- Cook button has green background (#27ae60)

### Error Scenarios
❌ If loading fails, should show error message with retry button  
❌ If recipe has no active version, should show "No Recipe Version" message  

### Test Data Reference
- Recipe ID: [Insert recipe ID]
- Recipe Version ID: [Insert version ID]
- User unit system: [metric/imperial]

---

## **TEST 2: Servings Multiplier - Decrease**

### Objective
Verify that the servings multiplier can be decreased and displays correctly.

### Steps
1. From Recipe Detail Screen (following TEST 1)
2. Locate the servings multiplier section in the footer
3. Verify current multiplier shows "x1"
4. Tap the minus (-) button once

### Expected Results
✅ Multiplier value remains at "x1" (cannot go below 1)  
✅ No visual change occurs  
✅ Button remains functional (not disabled)  

### Edge Case Test
5. Tap the minus (-) button multiple times rapidly

### Expected Results
✅ Value stays at "x1" consistently  
✅ No errors or crashes occur  
✅ UI remains responsive  

### UI Elements to Verify
- Multiplier displays: "x1"
- Minus button remains blue (#3498db)
- No error alerts appear
- Label "Servings:" is visible

---

## **TEST 3: Servings Multiplier - Increase**

### Objective
Verify that the servings multiplier can be increased and displays correctly.

### Steps
1. From Recipe Detail Screen with multiplier at x1
2. Tap the plus (+) button once
3. Observe the multiplier value change

### Expected Results
✅ Multiplier value changes from "x1" to "x2"  
✅ Transition is smooth and immediate  
✅ Plus button remains functional  

### Extended Test Steps
4. Continue tapping plus (+) button to test higher values
5. Tap to increment to x3, x4, x5, x10

### Expected Results
✅ Each tap increments by 1  
✅ Value displays correctly (x3, x4, x5, x10)  
✅ No maximum limit is enforced (can go arbitrarily high)  
✅ UI does not break with large numbers  

### Combination Test
6. Tap minus (-) button once from x5

### Expected Results
✅ Multiplier decreases to x4  
✅ Plus button remains functional to increment again  

### UI Elements to Verify
- Multiplier value is centered and bold
- Font size: 18, color: #2c3e50
- Both +/- buttons are circular, size: 36x36
- Buttons have consistent spacing (gap: 8)

---

## **TEST 4: Servings Multiplier - Reset Behavior**

### Objective
Verify multiplier state behavior when navigating away and returning.

### Steps
1. From Recipe Detail Screen, set multiplier to x5
2. Navigate back to Recipes list (press back button)
3. Re-enter the same recipe detail screen
4. Observe multiplier value

### Expected Results
✅ Multiplier resets to x1 (default state)  
✅ Recipe details load fresh  
✅ No state persists from previous visit  

### State Management Verification
- Verify useState initializes at 1: `const [servingsMultiplier, setServingsMultiplier] = useState<number>(1);`
- Confirm no localStorage or AsyncStorage is used for multiplier

---

## **TEST 5: Cook Recipe - Confirmation Dialog (Basic)**

### Objective
Verify that clicking "Cook This Recipe" button shows a confirmation alert.

### Steps
1. From Recipe Detail Screen with multiplier at x1
2. Locate the green "🍳 Cook This Recipe" button in footer
3. Tap the button once

### Expected Results
✅ Alert dialog appears immediately  
✅ Alert title: "Cook Recipe"  
✅ Alert message: "This will deduct ingredients from your pantry. Continue?"  
✅ Two buttons are present:
   - "Cancel" (left, cancel style)
   - "Cook" (right, default style)  
✅ Recipe detail screen dims/blurs in background  
✅ No network call is made yet (RPC not triggered)  

### UI Elements to Verify
- Alert is modal (blocks interaction with background)
- Button text is clear and readable
- Alert follows platform conventions (iOS/Android)

### User Action Options
- **Option 1:** Tap "Cancel"
  - Expected: Alert dismisses, returns to recipe screen, no changes made
- **Option 2:** Tap "Cook" 
  - Expected: Proceeds to TEST 6

---

## **TEST 6: Cook Recipe - Confirmation with Multiplier**

### Objective
Verify that the confirmation dialog adjusts message based on servings multiplier.

### Steps
1. From Recipe Detail Screen, set multiplier to x3
2. Tap "🍳 Cook This Recipe" button
3. Read the alert message carefully

### Expected Results
✅ Alert title: "Cook Recipe"  
✅ Alert message: "This will deduct ingredients from your pantry (x3). Continue?"  
✅ Message explicitly shows "(x3)" multiplier  
✅ Two buttons: "Cancel" and "Cook"  

### Multiplier Display Verification
4. Tap "Cancel" to dismiss
5. Change multiplier to x10
6. Tap "🍳 Cook This Recipe" button again
7. Verify message shows "(x10)"

### Expected Results
✅ Message dynamically updates: "...pantry (x10). Continue?"  
✅ Different multipliers display correctly  

### Edge Case: x1 Multiplier
8. Tap "Cancel", set multiplier to x1
9. Tap "🍳 Cook This Recipe" button

### Expected Results
✅ Message: "This will deduct ingredients from your pantry. Continue?"  
✅ NO "(x1)" text is shown (multiplier text is omitted when value is 1)  
✅ Code reference: `const servingsText = multiplier === 1 ? '' : \` (x\${multiplier})\`;`

---

## **TEST 7: Cook Recipe - RPC Call Trigger**

### Objective
Verify that the RPC function `deduct_recipe_from_pantry` is called with correct parameters.

### Steps
1. From Recipe Detail Screen with multiplier at x2
2. Tap "🍳 Cook This Recipe" button
3. In confirmation alert, tap "Cook"
4. Observe loading behavior (may be brief)

### Expected Results (Developer Verification Required)
✅ RPC function `deduct_recipe_from_pantry` is invoked  
✅ Parameters passed:
   - `p_user_id`: Current authenticated user's UUID
   - `p_recipe_version_id`: Active recipe version ID
   - `p_servings`: 2 (multiplier value)  
✅ Function executes in database  
✅ Response is awaited before showing result  

### Code Reference
```typescript
const { data, error } = await supabase.rpc('deduct_recipe_from_pantry', {
  p_user_id: user?.id,
  p_recipe_version_id: recipeVersion.id,
  p_servings: multiplier,
});
```

### Database Function Verification
- Function should loop through all 5 ingredients in recipe
- For each ingredient, attempts exact match: `LOWER(TRIM(name)) = LOWER(TRIM(recipe_ingredient))`
- Uses user's unit system (metric/imperial) to get correct quantities
- Calculates: `quantity_to_deduct = ingredient_quantity * p_servings`

### Expected Database Actions
1. Match "flour" → Deduct 500g (250g × 2)
2. Match "milk" → Deduct 1000ml (500ml × 2)
3. Match "eggs" → Deduct 4 whole (2 × 2)
4. Match "sugar" → Deduct 100g (50g × 2)
5. NOT found "vanilla extract" → Add to needs_confirmation array

---

## **TEST 8: Cook Recipe - Success with All Matches**

### Objective
Test the success scenario where all ingredients are found and deducted.

### Setup Requirements
- Ensure ALL recipe ingredients exist in pantry with sufficient quantities
- Add "vanilla extract" to pantry: 50ml

### Steps
1. From Recipe Detail Screen with multiplier at x1
2. Tap "🍳 Cook This Recipe" button
3. In confirmation alert, tap "Cook"
4. Wait for processing to complete

### Expected Results
✅ Success alert appears  
✅ Alert title: "Success!"  
✅ Alert message: "Recipe cooked! 5 ingredients deducted from pantry."  
✅ Message specifies the count (5 in this case)  
✅ One button: "OK" (dismisses alert)  

### Database Verification (Post-Test)
✅ Pantry items updated:
   - flour: 1000g → 750g (deducted 250g)
   - milk: 1500ml → 1000ml (deducted 500ml)
   - eggs: 12 → 10 (deducted 2)
   - sugar: 200g → 150g (deducted 50g)
   - vanilla extract: 50ml → 45ml (deducted 5ml)  
✅ No items dropped below 0 (GREATEST(0, quantity - deduction) enforced)  

### Pantry Usage History Verification
✅ 5 new entries created in `pantry_usage_history` table:
   - quantity_change: negative values (-250, -500, -2, -50, -5)
   - reason: 'recipe_cooked'
   - recipe_version_id: [Test recipe version ID]
   - created_at: current timestamp  

### RPC Response Structure
```json
{
  "deducted": [
    {
      "ingredient_name": "flour",
      "pantry_item_id": "[uuid]",
      "quantity_deducted": 250,
      "unit": "g",
      "match_type": "exact"
    },
    // ... 4 more items
  ],
  "needs_confirmation": [],
  "not_found": []
}
```

---

## **TEST 9: Cook Recipe - Missing Ingredients Dialog**

### Objective
Test the scenario where some ingredients are NOT found in the pantry.

### Setup Requirements
- Ensure "vanilla extract" is NOT in pantry (delete if exists)
- Ensure other 4 ingredients exist with sufficient stock

### Steps
1. From Recipe Detail Screen with multiplier at x1
2. Tap "🍳 Cook This Recipe" button
3. In confirmation alert, tap "Cook"
4. Wait for processing

### Expected Results
✅ Different alert appears (NOT success)  
✅ Alert title: "Missing Ingredients"  
✅ Alert message: "1 ingredients couldn't be found in your pantry. Would you like to add them to your shopping list?"  
✅ Note: Message shows "1 ingredients" (grammatically awkward but functional)  
✅ Two buttons:
   - "Not Now" (left, cancel style)
   - "Add to Shopping List" (right, default style)  

### Database Verification (Post-Test)
✅ 4 ingredients were successfully deducted (flour, milk, eggs, sugar)  
✅ "vanilla extract" NOT deducted (not in pantry)  
✅ 4 entries in pantry_usage_history (only for matched items)  

### RPC Response Structure
```json
{
  "deducted": [
    // 4 matched ingredients
  ],
  "needs_confirmation": [
    {
      "ingredient_name": "vanilla extract",
      "quantity": 5,
      "unit": "ml"
    }
  ],
  "not_found": []
}
```

### Code Reference
```typescript
const needsConfirmationCount = result.needs_confirmation?.length || 0;

if (needsConfirmationCount > 0) {
  Alert.alert(
    'Missing Ingredients',
    `${needsConfirmationCount} ingredients couldn't be found in your pantry. Would you like to add them to your shopping list?`,
    [
      { text: 'Not Now', style: 'cancel' },
      { text: 'Add to Shopping List', onPress: showListPicker },
    ]
  );
}
```

---

## **TEST 10: Missing Ingredients - "Not Now" Action**

### Objective
Verify that declining to add missing ingredients simply closes the dialog.

### Steps
1. Follow TEST 9 to trigger missing ingredients alert
2. In "Missing Ingredients" alert, tap "Not Now" button

### Expected Results
✅ Alert dismisses immediately  
✅ Returns to Recipe Detail Screen  
✅ No further dialogs or modals appear  
✅ Recipe screen remains functional  
✅ No shopping list items are created  
✅ User can trigger cook action again if desired  

### Post-Action State
- Pantry still shows deductions for matched items (flour, milk, eggs, sugar)
- "vanilla extract" remains absent from pantry
- Shopping list remains unchanged
- Recipe detail screen is still active (not navigated away)

---

## **TEST 11: Missing Ingredients - Add to Shopping List (No Lists Exist)**

### Objective
Test the shopping list picker when user has NO shopping lists yet.

### Setup Requirements
- Ensure user has NO shopping lists (delete all or use fresh user)
- Ensure database allows shopping list creation

### Steps
1. Follow TEST 9 to trigger missing ingredients alert
2. In "Missing Ingredients" alert, tap "Add to Shopping List"
3. Observe behavior (no list picker should appear)

### Expected Results
✅ NO modal/picker appears  
✅ System automatically creates a default shopping list:
   - name: "Shopping List"
   - is_archived: false
   - user_id: current user  
✅ Missing ingredients automatically added to new list  
✅ Success alert appears: "Added to Shopping List!"  
✅ Alert message: "5 ingredient(s) from 'Test Pancakes' added."  
   - Note: Shows ALL recipe ingredients, not just missing one  
✅ Two alert buttons:
   - "OK" (dismisses)
   - "View List" (navigates to shopping list screen)  

### Database Verification (Post-Test)
✅ New shopping_lists entry created:
   - name: "Shopping List"
   - user_id: [test user ID]
   - is_archived: false  
✅ 5 shopping_list_items entries created (one per recipe ingredient):
   - name: "flour", "milk", "eggs", "sugar", "vanilla extract"
   - quantity: null (no quantity set initially)
   - unit: null
   - source: 'recipe'
   - source_id: [recipe_version_id]
   - source_label: "Test Pancakes"
   - checked: false  

### Code Flow
1. `showListPicker()` called
2. Query finds 0 lists
3. Creates new list: `INSERT INTO shopping_lists ...`
4. Calls `addToSpecificList(newList.id)` directly
5. Loops through ALL recipe ingredients and adds them

### Important Note
⚠️ **BEHAVIOR:** The system adds ALL recipe ingredients to shopping list, not just missing ones. This is because the "Add to Shopping List" button is shared functionality, used both from:
- Missing ingredients flow (after cooking)
- "🛒 Add to Shopping List" button (independent action)

---

## **TEST 12: Missing Ingredients - Add to Shopping List (One List Exists)**

### Objective
Test the shopping list picker when user has exactly ONE shopping list.

### Setup Requirements
- Ensure user has exactly 1 non-archived shopping list (name: "Groceries")
- No modal should appear in this case

### Steps
1. Follow TEST 9 to trigger missing ingredients alert
2. In "Missing Ingredients" alert, tap "Add to Shopping List"
3. Observe behavior (no picker modal expected)

### Expected Results
✅ NO modal/picker appears  
✅ Ingredients automatically added to the single existing list  
✅ Success alert appears: "Added to Shopping List!"  
✅ Alert message varies based on duplicates:
   - If no duplicates: "5 ingredient(s) from 'Test Pancakes' added."
   - If duplicates exist: "X new ingredient(s) added and Y existing ingredient(s) tagged with 'Test Pancakes'."  
✅ Two alert buttons:
   - "OK" (dismisses)
   - "View List" (navigates to shopping list screen)  

### Database Verification (Post-Test)
✅ Shopping list "Groceries" receives new items  
✅ Items structure:
   - name: ingredient names from recipe
   - source: 'recipe'
   - source_id: recipe_version_id
   - source_label: "Test Pancakes"  

### Duplicate Handling Test
**Scenario A: No existing items with same names**
- Result: All 5 ingredients added as new items

**Scenario B: Item "flour" already exists in shopping list**
- Existing item: name: "flour", source_label: "Low Stock"
- Action: source_label updated to "Low Stock | Test Pancakes"
- Result: 4 new items added, 1 item tagged
- Alert message: "4 new ingredient(s) added and 1 existing ingredient(s) tagged with 'Test Pancakes'."

**Scenario C: Item "flour" exists with recipe already tagged**
- Existing item: name: "flour", source_label: "Test Pancakes"
- Action: No change (recipe already in label)
- Result: 4 new items added, 0 items updated
- Alert message: "4 ingredient(s) from 'Test Pancakes' added."

### Code Logic (Duplicate Detection)
```typescript
const existingItem = existingItems?.find(
  (item: any) => item.name.toLowerCase() === ing.name.toLowerCase()
);

if (existingItem) {
  const currentLabels = existingItem.source_label || '';
  const recipesInLabel = currentLabels.split('|').map((s: string) => s.trim());
  
  if (!recipesInLabel.includes(recipe.title)) {
    // Recipe not yet tagged - append it
    const newLabel = currentLabels 
      ? `${currentLabels} | ${recipe.title}`
      : recipe.title;
    await supabase.from('shopping_list_items').update({ source_label: newLabel });
    updatedCount++;
  }
} else {
  // New item - insert
  await supabase.from('shopping_list_items').insert({ ... });
  addedCount++;
}
```

---

## **TEST 13: Missing Ingredients - Add to Shopping List (Multiple Lists)**

### Objective
Test the shopping list picker modal when user has 2+ shopping lists.

### Setup Requirements
- Create 3 shopping lists for test user:
  - "Weekly Groceries"
  - "Costco Run"
  - "Farmers Market"
- All lists must have is_archived: false

### Steps
1. Follow TEST 9 to trigger missing ingredients alert
2. In "Missing Ingredients" alert, tap "Add to Shopping List"
3. Observe that a modal appears

### Expected Results
✅ Modal appears with semi-transparent overlay (rgba(0,0,0,0.5))  
✅ Modal content displayed in white rounded card (borderRadius: 16)  
✅ Modal title: "Select Shopping List"  
✅ Modal subtitle: "Choose which list to add ingredients to:"  
✅ Scrollable list of 3 options:
   - "Weekly Groceries"
   - "Costco Run"
   - "Farmers Market"  
✅ Each option is a touchable row with list name  
✅ "Cancel" button at bottom (gray background #ecf0f1)  
✅ Modal is centered on screen  
✅ Tapping overlay dismisses modal  

### UI Elements to Verify
- Modal width: 85% of screen, max 400px
- Modal max height: 70% of screen
- List options have bottom borders (#e0e0e0)
- List option text: fontSize 16, color #2c3e50, fontWeight 500
- Cancel button text: fontSize 16, color #7f8c8d

### User Interactions
**Option 1: Select a list**
1. Tap "Costco Run" list option

### Expected Results
✅ Modal dismisses immediately  
✅ Ingredients added to "Costco Run" list  
✅ Success alert appears: "Added to Shopping List!"  
✅ Alert shows count of added/updated items  
✅ "View List" button navigates to shopping list screen (will show "Costco Run" tab)  

**Option 2: Cancel**
1. Tap "Cancel" button

### Expected Results
✅ Modal dismisses  
✅ Returns to Recipe Detail Screen  
✅ No items added to any list  
✅ No success alert appears  

**Option 3: Tap overlay**
1. Tap the dark overlay area outside modal

### Expected Results
✅ Modal dismisses (same behavior as Cancel)  
✅ No items added  
✅ Recipe screen remains active  

### Code Reference
```typescript
<Modal visible={showListSelector} transparent animationType="fade">
  <Pressable style={styles.modalOverlay} onPress={() => setShowListSelector(false)}>
    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
      {/* Modal content */}
    </Pressable>
  </Pressable>
</Modal>
```

---

## **TEST 14: View Shopping List Navigation**

### Objective
Verify that the "View List" button in success alert navigates correctly.

### Steps
1. Follow TEST 11, 12, or 13 to add ingredients to shopping list
2. In success alert, tap "View List" button
3. Observe navigation behavior

### Expected Results
✅ Navigation occurs immediately  
✅ User is taken to "ShoppingList" screen (tab navigation)  
✅ Bottom tab bar highlights "Shopping List" tab  
✅ Shopping list shows the list where items were added  
✅ New items are visible in the list:
   - 5 items from "Test Pancakes" recipe
   - Each item shows:
     - Name (e.g., "flour", "milk")
     - No quantity/unit (shows as null initially)
     - Category badge (if set)
     - Source badge: "recipe"
     - Source label: "Test Pancakes"  
✅ Items are unchecked (checked: false)  

### Code Reference
```typescript
Alert.alert(
  'Added to Shopping List!',
  message,
  [
    { text: 'OK', style: 'default' },
    {
      text: 'View List',
      onPress: () => navigation.navigate('ShoppingList'),
    },
  ]
);
```

### Navigation Verification
- Navigator type: Bottom Tab Navigator
- Target route: 'ShoppingList'
- Shopping list tab is 3rd tab in navigation bar

---

## **TEST 15: Cook Recipe - Multiple Missing Ingredients**

### Objective
Test behavior when multiple ingredients are missing from pantry.

### Setup Requirements
- Remove 3 ingredients from pantry: "milk", "sugar", "vanilla extract"
- Keep "flour" and "eggs" in pantry

### Steps
1. From Recipe Detail Screen with multiplier at x1
2. Tap "🍳 Cook This Recipe" button
3. In confirmation, tap "Cook"
4. Observe alert message

### Expected Results
✅ Alert title: "Missing Ingredients"  
✅ Alert message: "3 ingredients couldn't be found in your pantry. Would you like to add them to your shopping list?"  
✅ Count correctly shows 3  
✅ Two buttons: "Not Now" and "Add to Shopping List"  

### Database Verification
✅ 2 ingredients deducted: "flour" and "eggs"  
✅ 3 ingredients in needs_confirmation: "milk", "sugar", "vanilla extract"  
✅ 2 entries in pantry_usage_history  

### RPC Response
```json
{
  "deducted": [
    { "ingredient_name": "flour", ... },
    { "ingredient_name": "eggs", ... }
  ],
  "needs_confirmation": [
    { "ingredient_name": "milk", "quantity": 500, "unit": "ml" },
    { "ingredient_name": "sugar", "quantity": 50, "unit": "g" },
    { "ingredient_name": "vanilla extract", "quantity": 5, "unit": "ml" }
  ]
}
```

### Add to Shopping List
5. Tap "Add to Shopping List"
6. Select a shopping list (if multiple)
7. Verify success alert

### Expected Results
✅ Success alert shows: "5 ingredient(s) from 'Test Pancakes' added."  
✅ ALL 5 recipe ingredients added (not just the 3 missing)  
✅ Shopping list contains all 5 items  

---

## **TEST 16: Cook Recipe - Servings Multiplier Effect on Quantities**

### Objective
Verify that servings multiplier correctly scales ingredient deductions.

### Setup Requirements
- Ensure all 5 ingredients exist in pantry with high quantities:
  - flour: 2000g
  - milk: 3000ml
  - eggs: 24 whole
  - sugar: 500g
  - vanilla extract: 100ml

### Test Scenario A: x2 Multiplier
1. Set servings multiplier to x2
2. Tap "🍳 Cook This Recipe" button
3. Confirm with "Cook"

### Expected Results
✅ Success alert: "Recipe cooked! 5 ingredients deducted from pantry."  
✅ Pantry quantities updated:
   - flour: 2000g → 1500g (deducted 500g = 250g × 2)
   - milk: 3000ml → 2000ml (deducted 1000ml = 500ml × 2)
   - eggs: 24 → 20 (deducted 4 = 2 × 2)
   - sugar: 500g → 400g (deducted 100g = 50g × 2)
   - vanilla extract: 100ml → 90ml (deducted 10ml = 5ml × 2)  

### Test Scenario B: x5 Multiplier
1. Navigate back to recipe (to reset quantities for clean test)
2. Set servings multiplier to x5
3. Tap "🍳 Cook This Recipe" button
4. Confirm dialog should show "(x5)"
5. Tap "Cook"

### Expected Results
✅ Alert message includes "(x5)"  
✅ Success alert: "Recipe cooked! 5 ingredients deducted from pantry."  
✅ Pantry quantities updated:
   - flour: 1500g → 250g (deducted 1250g = 250g × 5)
   - milk: 2000ml → 500ml (deducted 2500ml = 500ml × 5)
   - eggs: 20 → 10 (deducted 10 = 2 × 5)
   - sugar: 400g → 150g (deducted 250g = 50g × 5)
   - vanilla extract: 90ml → 65ml (deducted 25ml = 5ml × 5)  

### Database Function Logic
```sql
UPDATE pantry_items
SET quantity = GREATEST(0, quantity - (v_quantity * p_servings))
WHERE id = v_pantry_item_id;
```
- `v_quantity`: ingredient quantity from recipe
- `p_servings`: multiplier value
- `GREATEST(0, ...)`: ensures quantity never goes negative

---

## **TEST 17: Cook Recipe - Insufficient Quantity (Goes to Zero)**

### Objective
Test behavior when pantry item quantity is insufficient (should go to 0, not negative).

### Setup Requirements
- Set pantry item quantities to very low:
  - flour: 100g (recipe needs 250g)
  - milk: 200ml (recipe needs 500ml)
  - eggs: 1 whole (recipe needs 2)

### Steps
1. From Recipe Detail Screen with multiplier at x1
2. Tap "🍳 Cook This Recipe" button
3. Tap "Cook" to confirm
4. Wait for processing

### Expected Results
✅ Function executes without errors  
✅ Success or partial success alert appears  
✅ Pantry quantities set to 0 (not negative):
   - flour: 100g → 0g (attempted to deduct 250g)
   - milk: 200ml → 0ml (attempted to deduct 500ml)
   - eggs: 1 → 0 (attempted to deduct 2)  
✅ GREATEST(0, quantity - deduction) function prevents negatives  
✅ Usage history records actual deduction:
   - flour: -100g (not -250g)
   - milk: -200ml (not -500ml)
   - eggs: -1 (not -2)  

### Database Verification
```sql
-- Check pantry_items
SELECT name, quantity FROM pantry_items WHERE user_id = [test_user_id];
-- All should show 0 or positive values

-- Check pantry_usage_history
SELECT pantry_item_id, quantity_change 
FROM pantry_usage_history 
WHERE recipe_version_id = [test_recipe_version_id]
ORDER BY created_at DESC;
-- Should show negative values equal to starting quantities
```

### Important Note
⚠️ **CURRENT BEHAVIOR:** The system does not alert users about insufficient quantities. It silently sets quantities to 0. This may be unexpected user behavior but is the current implementation.

**Potential Improvement:** Add logic to detect insufficient stock and warn user before deducting.

---

## **TEST 18: Cook Recipe - Unit System Preference (Metric)**

### Objective
Verify that ingredient quantities are deducted based on user's unit system preference.

### Setup Requirements
- Set user profile: unit_system = 'metric'
- Create pantry items in grams/ml:
  - flour: 1000g
  - milk: 1500ml

### Steps
1. Navigate to Profile screen
2. Verify unit system is set to "Metric"
3. Navigate to Recipe Detail Screen
4. Verify ingredients display in metric units:
   - flour: 250g
   - milk: 500ml
5. Tap "🍳 Cook This Recipe" button (multiplier x1)
6. Confirm with "Cook"

### Expected Results
✅ Recipe displays metric units (g, ml)  
✅ RPC function retrieves metric quantities:
   - `v_quantity := (v_ingredient->>'metric_quantity')::DECIMAL;`
   - `v_unit := v_ingredient->>'metric_unit';`  
✅ Deductions use metric values:
   - flour: 1000g → 750g (deducted 250g)
   - milk: 1500ml → 1000ml (deducted 500ml)  
✅ Usage history records metric units  

### Database Function Logic
```sql
IF v_unit_system = 'metric' THEN
  v_quantity := (v_ingredient->>'metric_quantity')::DECIMAL;
  v_unit := v_ingredient->>'metric_unit';
ELSE
  v_quantity := (v_ingredient->>'imperial_quantity')::DECIMAL;
  v_unit := v_ingredient->>'imperial_unit';
END IF;
```

---

## **TEST 19: Cook Recipe - Unit System Preference (Imperial)**

### Objective
Verify that imperial unit system preference correctly uses imperial quantities.

### Setup Requirements
- Set user profile: unit_system = 'imperial'
- Create pantry items in imperial units:
  - flour: 10 cups
  - milk: 8 cups

### Steps
1. Navigate to Profile screen
2. Change unit system to "Imperial" (if setting exists)
3. Navigate to Recipe Detail Screen
4. Verify ingredients display in imperial units:
   - flour: 2 cups
   - milk: 2 cups
5. Tap "🍳 Cook This Recipe" button (multiplier x1)
6. Confirm with "Cook"

### Expected Results
✅ Recipe displays imperial units (cups, tsp)  
✅ RPC function retrieves imperial quantities:
   - flour: 2 cups
   - milk: 2 cups  
✅ Deductions use imperial values:
   - flour: 10 cups → 8 cups (deducted 2 cups)
   - milk: 8 cups → 6 cups (deducted 2 cups)  
✅ Usage history records imperial units  

### Database Verification
```sql
-- Check user profile
SELECT unit_system FROM user_profiles WHERE id = [test_user_id];
-- Should return 'imperial'

-- Check usage history
SELECT quantity_change, notes 
FROM pantry_usage_history 
WHERE recipe_version_id = [test_recipe_version_id];
-- Should show deductions in imperial units
```

---

## **TEST 20: Cook Recipe - Error Handling (RPC Failure)**

### Objective
Test error handling when RPC function fails.

### Setup Requirements
- Temporarily break RPC access (e.g., invalid recipe_version_id)
- Or simulate network failure

### Steps
1. From Recipe Detail Screen
2. Pass invalid recipe version ID or disconnect network
3. Tap "🍳 Cook This Recipe" button
4. Confirm with "Cook"

### Expected Results
✅ Error alert appears  
✅ Alert title: "Error"  
✅ Alert message: "Failed to deduct ingredients: [error message]"  
✅ Alert includes actual error from RPC or network  
✅ One button: "OK" (dismisses)  
✅ No pantry items are modified  
✅ No usage history entries created  
✅ User can retry the action  

### Code Reference
```typescript
try {
  const { data, error } = await supabase.rpc('deduct_recipe_from_pantry', { ... });
  if (error) throw error;
  // Success handling
} catch (error: any) {
  console.error('Error cooking recipe:', error);
  Alert.alert('Error', 'Failed to deduct ingredients: ' + error.message);
}
```

### Error Scenarios to Test
1. **Invalid recipe_version_id**: "Recipe version not found"
2. **Network disconnected**: "Network request failed"
3. **Database error**: SQL error message
4. **Permission denied**: RLS policy violation (if user_id mismatch)

---

## **TEST 21: Add to Shopping List Button (Independent Action)**

### Objective
Test the "🛒 Add to Shopping List" button independently of cooking workflow.

### Steps
1. From Recipe Detail Screen (do NOT click Cook button)
2. Locate "🛒 Add to Shopping List" button in footer (blue background)
3. Tap the button

### Expected Results
✅ Button triggers `showListPicker()` function immediately  
✅ No confirmation dialog appears (unlike Cook button)  
✅ Behavior branches based on existing lists:
   - 0 lists: Creates new list, adds items, shows success
   - 1 list: Adds to that list, shows success
   - 2+ lists: Shows modal picker  

### Difference from Cook Workflow
- Does NOT trigger pantry deduction
- Does NOT show "Cook Recipe" confirmation
- Directly invokes shopping list logic
- Adds ALL recipe ingredients (not just missing ones)

### Use Case
- User wants to shop for recipe ingredients before cooking
- User is planning meals and adding ingredients proactively
- User doesn't want to deduct from pantry yet

---

## **TEST 22: Shopping List - Duplicate Item Tagging**

### Objective
Verify that adding recipe to shopping list correctly handles existing items.

### Setup Requirements
- Create shopping list "Test List"
- Add item to list manually:
  - name: "flour"
  - quantity: 5
  - unit: "cups"
  - source: 'manual'
  - source_label: null

### Steps
1. From Recipe Detail Screen
2. Tap "🛒 Add to Shopping List" button
3. Select "Test List" (if multiple lists)
4. Observe success message

### Expected Results
✅ Success alert shows: "4 new ingredient(s) added and 1 existing ingredient(s) tagged with 'Test Pancakes'."  
✅ "flour" item is updated:
   - quantity: 5 (unchanged)
   - unit: "cups" (unchanged)
   - source: 'manual' (unchanged)
   - source_label: "Test Pancakes" (UPDATED)  
✅ 4 new items added: milk, eggs, sugar, vanilla extract  

### Database Verification
```sql
SELECT name, source_label 
FROM shopping_list_items 
WHERE list_id = [test_list_id] AND name = 'flour';
-- source_label should be: "Test Pancakes"
```

### Multiple Recipe Tagging
**Setup:** Add recipe "Test Pancakes" again (repeat steps)

### Expected Results
✅ No change to "flour" item (recipe already tagged)  
✅ Alert shows: "4 ingredient(s) from 'Test Pancakes' added."  
✅ Duplicate tag prevention works  

**Setup:** Add different recipe "Chocolate Cake" that also uses flour

### Expected Results
✅ "flour" item updated:
   - source_label: "Test Pancakes | Chocolate Cake"  
✅ Recipe names separated by " | "  
✅ Can accumulate multiple recipe tags  

### Code Reference
```typescript
const recipesInLabel = currentLabels.split('|').map((s: string) => s.trim());

if (!recipesInLabel.includes(recipe.title)) {
  const newLabel = currentLabels 
    ? `${currentLabels} | ${recipe.title}`
    : recipe.title;
  // Update source_label
}
```

---

## **TEST 23: Recipe Navigation - Back Button**

### Objective
Verify navigation back to recipe list works correctly.

### Steps
1. From Recipe Detail Screen
2. Tap the back button (top-left, platform-specific)
3. Observe navigation

### Expected Results
✅ Navigates back to Recipes list screen  
✅ Recipe list displays all user recipes  
✅ "Test Pancakes" recipe is visible in list  
✅ No data loss or errors occur  
✅ Bottom tab navigation remains functional  

### State Cleanup
- Servings multiplier state is reset (useState re-initializes on next visit)
- No memory leaks
- No lingering modals or alerts

---

## **TEST 24: Recipe Loading - Error State**

### Objective
Test error handling when recipe fails to load.

### Setup Requirements
- Use invalid recipe ID or delete recipe from database

### Steps
1. Navigate to Recipe Detail Screen with invalid recipe_id
2. Wait for loading to complete

### Expected Results
✅ Loading spinner appears briefly  
✅ Error state renders:
   - ⚠️ emoji displayed
   - Title: "Error Loading Recipe"
   - Message: Error description  
   - "Retry" button (blue, rounded)  
✅ No recipe content is displayed  
✅ Footer with action buttons is NOT visible  

### Retry Functionality
3. Tap "Retry" button

### Expected Results
✅ `loadRecipeDetails()` function called again  
✅ Loading spinner reappears  
✅ If still invalid: Error state shows again  
✅ If fixed: Recipe loads successfully  

### Code Reference
```typescript
if (error || !recipe) {
  return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>⚠️ Error Loading Recipe</Text>
      <Text style={styles.errorSubtext}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadRecipeDetails}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## **TEST 25: Recipe Versions - No Active Version**

### Objective
Test display when recipe has no active version.

### Setup Requirements
- Create recipe with active_version_id = null
- Or delete the recipe_version record

### Steps
1. Navigate to Recipe Detail Screen for recipe without version
2. Wait for loading

### Expected Results
✅ Loading completes  
✅ No error state (recipe loaded successfully)  
✅ Special message displayed:
   - "No Recipe Version"
   - "This recipe doesn't have any versions yet."  
✅ No recipe content (ingredients/instructions) shown  
✅ No action buttons visible  

### Code Reference
```typescript
if (!recipeVersion) {
  return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>No Recipe Version</Text>
      <Text style={styles.errorSubtext}>
        This recipe doesn't have any versions yet.
      </Text>
    </View>
  );
}
```

---

## **TEST 26: Pantry Item Matching - Case Insensitivity**

### Objective
Verify that ingredient matching ignores case differences.

### Setup Requirements
- Create pantry items with varied casing:
  - name: "FLOUR" (all caps)
  - name: "MiLk" (mixed case)
  - name: "Eggs" (title case)

### Steps
1. Recipe has ingredients: "flour", "milk", "eggs" (lowercase)
2. From Recipe Detail Screen, tap "Cook This Recipe"
3. Confirm with "Cook"

### Expected Results
✅ All 3 items matched successfully  
✅ Case differences ignored  
✅ Success alert: "Recipe cooked! 5 ingredients deducted from pantry."  
✅ Pantry items "FLOUR", "MiLk", "Eggs" are updated  

### Database Function Logic
```sql
WHERE LOWER(TRIM(name)) = LOWER(TRIM(v_ingredient_name))
```
- `LOWER()`: Converts both to lowercase
- `TRIM()`: Removes leading/trailing whitespace
- Ensures robust matching

### Additional Test Cases
- Pantry: " flour " (with spaces) → Should match "flour"
- Pantry: "Flour" → Should match "flour"
- Pantry: "EGGS" → Should match "eggs"

---

## **TEST 27: Pantry Item Matching - Exact Match Only**

### Objective
Verify that only exact name matches are used (no fuzzy matching in initial implementation).

### Setup Requirements
- Create pantry items:
  - name: "all-purpose flour"
  - name: "whole milk"
- Recipe ingredients:
  - name: "flour"
  - name: "milk"

### Steps
1. From Recipe Detail Screen, tap "Cook This Recipe"
2. Confirm with "Cook"

### Expected Results
✅ "flour" NOT matched with "all-purpose flour"  
✅ "milk" NOT matched with "whole milk"  
✅ Both ingredients added to needs_confirmation array  
✅ Alert: "2 ingredients couldn't be found in your pantry..."  
✅ No fuzzy/partial matching occurs in this implementation  

### Expected Behavior
- Current system requires EXACT name match (after lowercase/trim)
- "flour" ≠ "all-purpose flour"
- Future enhancement could add fuzzy matching with user confirmation

### Database Function
- Only exact match attempted: `LOWER(TRIM(name)) = LOWER(TRIM(v_ingredient_name))`
- Ingredient match confirmations table exists but not fully implemented in UI

---

## **TEST 28: Ingredient Match Confirmations (Future Feature)**

### Objective
Document behavior of ingredient_match_confirmations table (infrastructure exists but not in UI).

### Database Schema
```sql
CREATE TABLE ingredient_match_confirmations (
  user_id UUID,
  recipe_ingredient_name TEXT,
  pantry_item_id UUID,
  confirmed BOOLEAN
);
```

### Current Implementation
- Database function checks for confirmed matches after exact match fails
- If user previously confirmed "flour" → "all-purpose flour", that match is reused
- However, UI to create confirmations does not exist yet

### Expected Future Behavior
1. User cooks recipe
2. "flour" not found in pantry
3. System suggests "all-purpose flour" (fuzzy match)
4. User confirms match
5. Record saved to ingredient_match_confirmations
6. Future recipe cooks automatically use confirmed match

### Current Test Result
✅ Database function supports this feature  
❌ UI does not prompt for confirmations yet  
✅ Table exists and is queried in RPC function  

---

## **TEST 29: Performance - Large Ingredient List**

### Objective
Test performance with recipe containing many ingredients (stress test).

### Setup Requirements
- Create recipe with 30 ingredients
- Create corresponding pantry items for all 30

### Steps
1. Navigate to Recipe Detail Screen
2. Scroll through ingredients list (verify rendering)
3. Tap "🍳 Cook This Recipe" button
4. Confirm with "Cook"
5. Measure time to complete

### Expected Results
✅ Recipe detail screen loads smoothly  
✅ Ingredients list scrolls without lag  
✅ Cook action completes in reasonable time (<5 seconds)  
✅ Success alert appears  
✅ All 30 pantry items updated correctly  
✅ 30 entries in pantry_usage_history  

### Performance Notes
- RPC function loops through ingredients sequentially
- Each ingredient: 1 SELECT + 1 UPDATE + 1 INSERT
- For 30 ingredients: ~90 database operations
- Should complete within seconds

### Potential Optimization
- Batch operations could improve performance
- Current implementation prioritizes clarity over performance

---

## **TEST 30: Concurrency - Multiple Cook Actions**

### Objective
Test behavior if user rapidly taps Cook button multiple times.

### Steps
1. From Recipe Detail Screen
2. Tap "🍳 Cook This Recipe" button
3. When confirmation appears, tap "Cook"
4. Immediately tap "Cook This Recipe" button again (before first completes)

### Expected Results
✅ First RPC call processes completely  
✅ Second alert appears after first completes  
✅ Second cook action also processes  
✅ Pantry items deducted twice (if sufficient stock)  
✅ Two sets of usage history entries created  

### Potential Issue
⚠️ **RACE CONDITION:** No locking mechanism prevents double-deduction if user clicks very fast.

### Suggested Improvement
- Add loading state while RPC is processing
- Disable Cook button during processing
- Show loading indicator

### Current Behavior
- No protection against multiple simultaneous cooks
- Could lead to over-deduction if user clicks rapidly
- Acceptable for single-user app, but should be improved

---

## Summary of Test Coverage

### ✅ Fully Tested Areas
1. Recipe detail screen loading and display
2. Servings multiplier increment/decrement
3. Cook recipe confirmation dialog
4. RPC function invocation with correct parameters
5. Exact ingredient matching (case-insensitive)
6. Pantry quantity deduction with multiplier
7. Missing ingredient detection and alerts
8. Shopping list picker with 0, 1, or multiple lists
9. Shopping list item creation and duplicate handling
10. Recipe tagging in shopping list source labels
11. Navigation between screens
12. Unit system preference (metric/imperial)
13. Error handling for RPC failures
14. Insufficient quantity handling (goes to 0)
15. Usage history logging

### ⚠️ Partially Implemented
1. Ingredient match confirmations (database ready, UI missing)
2. Fuzzy matching for ingredient names
3. Concurrency protection (no locking)

### 🔮 Future Enhancements
1. Visual indication of insufficient stock before cooking
2. Batch database operations for performance
3. Loading states during RPC calls
4. Undo/redo for pantry deductions
5. Recipe scaling based on available pantry quantities
6. Ingredient substitution suggestions

---

## Database Verification Queries

Use these queries to manually verify test results:

```sql
-- Check pantry item quantities
SELECT name, quantity, unit, updated_at 
FROM pantry_items 
WHERE user_id = '[test_user_id]'
ORDER BY name;

-- Check usage history
SELECT 
  pi.name,
  puh.quantity_change,
  puh.reason,
  puh.created_at
FROM pantry_usage_history puh
JOIN pantry_items pi ON pi.id = puh.pantry_item_id
WHERE puh.recipe_version_id = '[test_recipe_version_id]'
ORDER BY puh.created_at DESC;

-- Check shopping list items
SELECT 
  name,
  source,
  source_label,
  checked,
  created_at
FROM shopping_list_items
WHERE list_id = '[test_list_id]'
ORDER BY created_at DESC;

-- Check RPC function result (run manually)
SELECT deduct_recipe_from_pantry(
  '[user_id]'::UUID,
  '[recipe_version_id]'::UUID,
  1.0
);
```

---

## Test Completion Checklist

- [ ] TEST 1: Navigate to Recipe Detail Screen
- [ ] TEST 2: Servings Multiplier - Decrease
- [ ] TEST 3: Servings Multiplier - Increase
- [ ] TEST 4: Servings Multiplier - Reset Behavior
- [ ] TEST 5: Cook Recipe - Confirmation Dialog (Basic)
- [ ] TEST 6: Cook Recipe - Confirmation with Multiplier
- [ ] TEST 7: Cook Recipe - RPC Call Trigger
- [ ] TEST 8: Cook Recipe - Success with All Matches
- [ ] TEST 9: Cook Recipe - Missing Ingredients Dialog
- [ ] TEST 10: Missing Ingredients - "Not Now" Action
- [ ] TEST 11: Missing Ingredients - Add to Shopping List (No Lists)
- [ ] TEST 12: Missing Ingredients - Add to Shopping List (One List)
- [ ] TEST 13: Missing Ingredients - Add to Shopping List (Multiple Lists)
- [ ] TEST 14: View Shopping List Navigation
- [ ] TEST 15: Cook Recipe - Multiple Missing Ingredients
- [ ] TEST 16: Cook Recipe - Servings Multiplier Effect
- [ ] TEST 17: Cook Recipe - Insufficient Quantity
- [ ] TEST 18: Cook Recipe - Unit System Preference (Metric)
- [ ] TEST 19: Cook Recipe - Unit System Preference (Imperial)
- [ ] TEST 20: Cook Recipe - Error Handling
- [ ] TEST 21: Add to Shopping List Button (Independent)
- [ ] TEST 22: Shopping List - Duplicate Item Tagging
- [ ] TEST 23: Recipe Navigation - Back Button
- [ ] TEST 24: Recipe Loading - Error State
- [ ] TEST 25: Recipe Versions - No Active Version
- [ ] TEST 26: Pantry Item Matching - Case Insensitivity
- [ ] TEST 27: Pantry Item Matching - Exact Match Only
- [ ] TEST 28: Ingredient Match Confirmations (Future)
- [ ] TEST 29: Performance - Large Ingredient List
- [ ] TEST 30: Concurrency - Multiple Cook Actions

---

**End of Test Plan**
