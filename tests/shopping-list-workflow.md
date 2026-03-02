# Shopping List Workflow - Comprehensive Test Plan

**Test File Type:** Agent Testing Guide  
**Workflow:** Complete Shopping List Management  
**Last Updated:** 2026-02-27  
**Target Screen:** ShoppingListScreen.tsx  
**Related Components:** AddShoppingItemModal.tsx, ShoppingListItemCard.tsx, ShareListModal.tsx, AddToPantryModal.tsx (new)  
**Target RPC Functions:** add_recipe_to_shopping_list, auto_add_low_stock_to_shopping_list  

---

## Overview

This test plan provides comprehensive step-by-step instructions for testing the complete shopping list workflow, which includes:

1. Creating and managing multiple shopping lists
2. Adding items manually with autocomplete suggestions
3. Adding recipe ingredients to shopping lists
4. Auto-adding low stock pantry items
5. In-store shopping experience (checking off items)
6. Adding checked items to pantry
7. Auto-archiving completed lists
8. Sharing lists with other users
9. Category grouping and organization

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

#### Test Shopping Lists
```sql
-- Create 3 shopping lists for comprehensive testing:
1. "Weekly Groceries"
   - is_archived: false
   - user_id: [test_user_id]
   
2. "Costco Run"
   - is_archived: false
   - user_id: [test_user_id]
   
3. "Archived List"
   - is_archived: true
   - user_id: [test_user_id]
```

#### Test Shopping List Items
```sql
-- For "Weekly Groceries" list:
1. name: "Tomatoes", category: "produce", checked: false, source: "manual"
2. name: "Milk", category: "dairy", checked: false, source: "manual"
3. name: "Bread", category: "pantry", checked: true, source: "manual"
4. name: "Eggs", category: "dairy", checked: false, source: "recipe", source_label: "Pancakes"
5. name: "Butter", category: "dairy", checked: false, source: "pantry_alert", source_label: "Low Stock"
```

#### Test Recipe
```sql
-- Recipe: "Chicken Alfredo"
-- Recipe Version with ingredients:
  - "chicken breast" (500g / 1 lb)
  - "pasta" (400g / 14 oz)
  - "heavy cream" (250ml / 1 cup)
  - "parmesan cheese" (100g / 1 cup)
  - "garlic" (3 cloves)
```

#### Test Pantry Items (for low stock testing)
```sql
-- Low stock items (below threshold):
1. name: "Olive Oil", quantity: 50, typical_quantity: 500, unit: "ml"
2. name: "Salt", quantity: 20, typical_quantity: 200, unit: "g"
3. name: "Sugar", quantity: 100, typical_quantity: 1000, unit: "g"

-- Normal stock items:
4. name: "Flour", quantity: 800, typical_quantity: 1000, unit: "g"
```

---

## Test Scenarios

---

## **TEST 1: Navigate to Shopping List Screen (First Use)**

### Objective
Verify that the shopping list screen displays correctly on first use when no lists exist.

### Steps
1. Launch the app and ensure user is logged in
2. Navigate to "Shopping List" tab (bottom navigation, 3rd tab)
3. Observe the screen state

### Expected Results
✅ Shopping List screen loads without errors  
✅ Empty state is displayed:
   - Large icon or emoji (🛒)
   - Title: "No Shopping Lists"
   - Message: "Create your first shopping list to get started"
   - "Create List" button (prominent, blue #3498db)  
✅ No list tabs visible  
✅ No items displayed  
✅ FAB (+) button visible in bottom-right corner  
✅ Pull-to-refresh works but shows same empty state  

### UI Elements to Verify
- Empty state is centered vertically and horizontally
- Button has rounded corners, padding 12x24
- Screen background: white or light gray #f5f5f5
- Bottom tab bar shows "Shopping List" tab as active

### Error Scenarios
❌ If loading fails, should show error message with retry button  
❌ If database connection fails, should show offline state  

---

## **TEST 2: Create First Shopping List**

### Objective
Verify that creating the first shopping list works correctly.

### Steps
1. From empty state (TEST 1)
2. Tap "Create List" button
3. Observe behavior

### Expected Results
✅ Alert/prompt appears asking for list name  
✅ Prompt title: "New Shopping List"  
✅ Prompt message: "Enter a name for your shopping list"  
✅ Text input field is visible and focused  
✅ Input placeholder: "e.g., Weekly Groceries"  
✅ Two buttons:
   - "Cancel" (left, cancel style)
   - "Create" (right, default style)  

### Steps Continued
4. Type "My Shopping List" in the input field
5. Tap "Create" button

### Expected Results
✅ Prompt dismisses immediately  
✅ New shopping list created in database:
   - name: "My Shopping List"
   - is_archived: false
   - user_id: current user
   - created_at: current timestamp  
✅ Screen updates to show:
   - List tab at top showing "My Shopping List"
   - Empty list message: "No items yet. Tap + to add items."
   - FAB (+) button remains visible  
✅ No loading spinner needed (creates instantly)  

### Database Verification
```sql
SELECT id, name, user_id, is_archived, created_at
FROM shopping_lists
WHERE user_id = '[test_user_id]' AND name = 'My Shopping List';
```

### Edge Cases
**Test A: Empty name**
- Input: "" (empty string)
- Tap "Create"
- Expected: Error alert "Please enter a list name"

**Test B: Very long name**
- Input: "This is a very long shopping list name that exceeds normal expectations"
- Expected: Accepts input, may truncate display in tab

**Test C: Cancel action**
- Tap "Cancel" in prompt
- Expected: Prompt dismisses, no list created, returns to empty state

---

## **TEST 3: Add First Item Manually**

### Objective
Test adding an item manually to an empty shopping list.

### Steps
1. From shopping list with 0 items (following TEST 2)
2. Tap the FAB (+) button in bottom-right
3. Observe modal

### Expected Results
✅ `AddShoppingItemModal` appears  
✅ Modal slides up from bottom with animation  
✅ Modal title: "Add Item"  
✅ Form fields visible:
   - "Item Name" input (required, focused)
   - "Quantity" input (optional, numeric)
   - "Unit" picker (optional)
   - "Category" chip selector  
✅ Category chips displayed:
   - Produce (green)
   - Dairy (blue)
   - Meat (red)
   - Pantry (orange)
   - Frozen (cyan)
   - Other (gray)  
✅ Buttons:
   - "Cancel" (text button, top-left or bottom)
   - "Add Item" (primary button, blue)  

### Steps Continued
4. Type "Apples" in Item Name field
5. Leave quantity/unit empty
6. Tap "Produce" category chip (should highlight)
7. Tap "Add Item" button

### Expected Results
✅ Modal dismisses with slide-down animation  
✅ Item added to database:
   - name: "Apples"
   - quantity: null
   - unit: null
   - category: "produce"
   - checked: false
   - source: "manual"
   - source_label: null
   - list_id: current list ID  
✅ Item appears in list immediately:
   - Shows "Apples"
   - Category badge: green "Produce"
   - Source badge: pencil icon (manual)
   - Delete button (X) visible
   - NOT checked  
✅ Empty list message disappears  
✅ Success feedback (optional toast)  

### UI Elements to Verify
- Item card has white background, shadow, rounded corners
- Item name: fontSize 16, color #2c3e50, fontWeight 500
- Category badge: fontSize 12, padding 4x8, rounded
- Delete button: right side, red color on press

---

## **TEST 4: Add Item with Quantity and Unit**

### Objective
Test adding an item with full details (quantity, unit, category).

### Steps
1. From shopping list screen
2. Tap FAB (+) button
3. In modal, enter:
   - Item Name: "Chicken Breast"
   - Quantity: "2"
   - Unit: Select "lbs" from picker
   - Category: Tap "Meat"
4. Tap "Add Item"

### Expected Results
✅ Item added with complete data:
   - name: "Chicken Breast"
   - quantity: 2
   - unit: "lbs"
   - category: "meat"  
✅ Item displays in list:
   - "Chicken Breast" (name only, no quantity in display)
   - Red "Meat" category badge
   - Manual source indicator
   - Suggested quantity stored for later pantry add  

### Database Verification
```sql
SELECT name, quantity, unit, category, suggested_quantity, suggested_unit
FROM shopping_list_items
WHERE list_id = '[test_list_id]' AND name = 'Chicken Breast';
-- suggested_quantity: 2, suggested_unit: 'lbs'
```

### Important Note
⚠️ **DISPLAY BEHAVIOR:** Item cards show ONLY the item name, not quantity/unit. The quantity is stored in `suggested_quantity` field for use when adding to pantry.

---

## **TEST 5: Item Name Autocomplete Suggestions**

### Objective
Test autocomplete functionality when typing item names.

### Setup Requirements
- Add purchase history or previous shopping items:
  - "Tomatoes" (bought 5 times)
  - "Cherry Tomatoes" (bought 2 times)
  - "Tomato Paste" (in pantry)

### Steps
1. Tap FAB (+) to open add item modal
2. Type "tom" in Item Name field
3. Observe suggestions

### Expected Results
✅ Autocomplete dropdown appears below input  
✅ Suggestions displayed (max 5-10):
   - "Tomatoes" with indicator "(purchased 5 times)"
   - "Tomato Paste" with indicator "(in pantry)"
   - "Cherry Tomatoes" with indicator "(purchased 2 times)"  
✅ Suggestions ordered by relevance:
   1. User's previous purchases (most frequent first)
   2. Items in user's pantry
   3. Popular items across all users  
✅ Suggestions update as user types more characters  

### Steps Continued
4. Type "tomato" (more specific)
5. Observe updated suggestions
6. Tap "Tomatoes" suggestion

### Expected Results
✅ Input field populates with "Tomatoes"  
✅ Autocomplete dropdown dismisses  
✅ Cursor positioned at end of text  
✅ User can continue to add quantity/category  
✅ If "Tomatoes" already in list:
   - Show warning below input: "⚠️ Already in list"
   - Disable "Add Item" button
   - Allow user to cancel or change name  

### Duplicate Prevention
**Scenario A: Add "Tomatoes" when "tomatoes" exists (case-insensitive)**
- Expected: Warning shown, duplicate prevented

**Scenario B: Add "Tomatoes" when "Cherry Tomatoes" exists (different items)**
- Expected: No warning, both items allowed

---

## **TEST 6: Add Recipe to Shopping List (Quick Add - Default List)**

### Objective
Test the quick add flow from recipe to shopping list when user has one default list.

### Setup Requirements
- User has 1 non-archived shopping list: "My Shopping List"
- Recipe "Chicken Alfredo" with 5 ingredients

### Steps
1. Navigate to Recipes tab
2. Open "Chicken Alfredo" recipe detail
3. Locate "🛒 Add to Shopping List" button in footer
4. Tap the button (single tap, not dropdown)

### Expected Results
✅ NO modal/picker appears (quick add)  
✅ All 5 recipe ingredients added to "My Shopping List"  
✅ Success toast/alert appears:
   - "Added to Shopping List!"
   - "5 ingredient(s) from 'Chicken Alfredo' added."  
✅ Toast shows "View List" action button  
✅ Items added to database:
   - names: "chicken breast", "pasta", "heavy cream", "parmesan cheese", "garlic"
   - category: inferred from ingredient type (meat, pantry, dairy, produce)
   - source: "recipe"
   - source_id: recipe_version_id
   - source_label: "Chicken Alfredo"
   - checked: false
   - suggested_quantity: from recipe (500, 400, 250, 100, 3)
   - suggested_unit: from recipe (g, g, ml, g, cloves)  

### Database Verification
```sql
SELECT name, source, source_label, suggested_quantity, suggested_unit
FROM shopping_list_items
WHERE list_id = '[test_list_id]' 
  AND source = 'recipe'
  AND source_label = 'Chicken Alfredo';
-- Should return 5 rows
```

### UI Flow
5. Tap "View List" in toast

### Expected Results
✅ Navigates to Shopping List tab  
✅ "My Shopping List" is active tab  
✅ 5 new items visible with:
   - Recipe source badge (📖 icon)
   - Source label: "Chicken Alfredo"
   - Appropriate category colors  

---

## **TEST 7: Add Recipe to Shopping List (Advanced - Multiple Lists)**

### Objective
Test the list picker flow when user has multiple shopping lists.

### Setup Requirements
- User has 3 non-archived lists:
  - "My Shopping List"
  - "Costco Run"
  - "Farmers Market"

### Steps
1. From Recipe Detail Screen ("Chicken Alfredo")
2. Tap the dropdown arrow (▾) next to "Add to Shopping List" button
3. Observe picker modal

### Expected Results
✅ Modal appears with semi-transparent overlay  
✅ Modal title: "Select Shopping List"  
✅ Modal subtitle: "Choose which list to add ingredients to:"  
✅ List options displayed:
   - "My Shopping List" (default indicator if applicable)
   - "Costco Run"
   - "Farmers Market"  
✅ "+ Create New List" option at bottom  
✅ "Cancel" button  
✅ Each list option is tappable row  

### Steps Continued
4. Tap "Costco Run" option

### Expected Results
✅ Modal dismisses immediately  
✅ 5 ingredients added to "Costco Run" list  
✅ Success alert: "Added to Shopping List!"  
✅ Alert message: "5 ingredient(s) from 'Chicken Alfredo' added."  
✅ "View List" button navigates to Shopping List screen showing "Costco Run" tab  

### Database Verification
```sql
SELECT list_id, name, source_label
FROM shopping_list_items
WHERE source_label = 'Chicken Alfredo';
-- Should show list_id = "Costco Run" ID
```

---

## **TEST 8: Add Recipe with Duplicate Items**

### Objective
Test duplicate handling when recipe ingredients already exist in shopping list.

### Setup Requirements
- Shopping list "My Shopping List" contains:
  - "garlic" (source: manual, source_label: null)
  - "pasta" (source: recipe, source_label: "Spaghetti Bolognese")

### Steps
1. From Recipe Detail Screen ("Chicken Alfredo" has "garlic" and "pasta")
2. Tap "🛒 Add to Shopping List" button
3. Confirm quick add to "My Shopping List"

### Expected Results
✅ Success alert shows: "3 new ingredient(s) added and 2 existing ingredient(s) tagged with 'Chicken Alfredo'."  
✅ 3 NEW items added:
   - "chicken breast"
   - "heavy cream"
   - "parmesan cheese"  
✅ 2 EXISTING items updated:
   - "garlic": source_label updated to "Chicken Alfredo"
   - "pasta": source_label updated to "Spaghetti Bolognese | Chicken Alfredo"  
✅ NO duplicate items created  
✅ Case-insensitive matching: "Garlic" = "garlic"  

### Database Verification
```sql
SELECT name, source_label
FROM shopping_list_items
WHERE list_id = '[test_list_id]' AND name IN ('garlic', 'pasta');

-- Expected:
-- garlic: "Chicken Alfredo"
-- pasta: "Spaghetti Bolognese | Chicken Alfredo"
```

### Code Logic
```typescript
const existingItem = existingItems?.find(
  (item) => item.name.toLowerCase() === ingredient.name.toLowerCase()
);

if (existingItem) {
  const currentLabels = existingItem.source_label || '';
  const recipesInLabel = currentLabels.split('|').map(s => s.trim());
  
  if (!recipesInLabel.includes(recipe.title)) {
    const newLabel = currentLabels 
      ? `${currentLabels} | ${recipe.title}`
      : recipe.title;
    // Update source_label
    updatedCount++;
  }
} else {
  // Insert new item
  addedCount++;
}
```

---

## **TEST 9: Auto-Add Low Stock Items (Bulk Add)**

### Objective
Test the auto-add low stock feature that adds pantry items below threshold.

### Setup Requirements
- User has 3 pantry items below threshold:
  - Olive Oil: 50ml (typical: 500ml, 10% stock)
  - Salt: 20g (typical: 200g, 10% stock)
  - Sugar: 100g (typical: 1000g, 10% stock)
- User has 1 shopping list: "My Shopping List"

### Steps
1. Navigate to Shopping List screen
2. Locate "+ Add Low Stock" button in header (below list tabs)
3. Tap the button

### Expected Results
✅ Function `auto_add_low_stock_to_shopping_list` called with user_id  
✅ System calculates needed quantities:
   - Olive Oil: need 450ml (500 - 50)
   - Salt: need 180g (200 - 20)
   - Sugar: need 900g (1000 - 100)  
✅ Success alert appears:
   - Title: "Low Stock Items Added"
   - Message: "3 item(s) added to your shopping list"  
✅ 3 items added to shopping list:
   - names: "Olive Oil", "Salt", "Sugar"
   - source: "pantry_alert"
   - source_label: "Low Stock"
   - suggested_quantity: calculated amounts (450, 180, 900)
   - suggested_unit: from pantry (ml, g, g)
   - checked: false  
✅ Items appear in list with ⚠️ alert icon  

### Database Verification
```sql
SELECT name, source, source_label, suggested_quantity, suggested_unit
FROM shopping_list_items
WHERE source = 'pantry_alert'
  AND source_label = 'Low Stock';
-- Should return 3 rows

-- Verify low stock alerts created
SELECT item_name, alert_type, resolved
FROM low_stock_alerts
WHERE user_id = '[test_user_id]' AND resolved = false;
-- Should show 3 unresolved alerts
```

### RPC Function Logic
```sql
-- For each pantry item below threshold:
INSERT INTO shopping_list_items (
  list_id, name, source, source_label,
  suggested_quantity, suggested_unit, category
) VALUES (
  v_list_id,
  v_item_name,
  'pantry_alert',
  'Low Stock',
  (v_typical_quantity - v_current_quantity),
  v_unit,
  v_category
)
ON CONFLICT (list_id, LOWER(name)) DO NOTHING;
```

---

## **TEST 10: Auto-Add Low Stock Items (Review Flow)**

### Objective
Test the review flow where user can select which low stock items to add.

### Setup Requirements
- Same as TEST 9: 3 low stock items

### Steps
1. Navigate to Shopping List screen
2. See header banner: "⚠️ 3 pantry items running low"
3. Tap "Review & Add" button
4. Observe modal

### Expected Results
✅ Modal appears: "Low Stock Items"  
✅ Subtitle: "Select items to add to shopping list"  
✅ List of 3 items with checkboxes (all checked by default):
   - ☑ Olive Oil: 50ml remaining (typical: 500ml)
       Add: [450ml]
   - ☑ Salt: 20g remaining (typical: 200g)
       Add: [180g]
   - ☑ Sugar: 100g remaining (typical: 1000g)
       Add: [900g]  
✅ Each item shows:
   - Checkbox (checked by default)
   - Item name
   - Current quantity
   - Typical quantity
   - Suggested add amount (editable)  
✅ "Add All" / "Clear All" toggle button  
✅ "Cancel" and "Add Selected" buttons  

### Steps Continued
5. Uncheck "Salt" (deselect)
6. Edit "Sugar" suggested amount to 500g
7. Tap "Add Selected"

### Expected Results
✅ Modal dismisses  
✅ 2 items added to shopping list (not 3):
   - Olive Oil: 450ml
   - Sugar: 500g (custom amount)  
✅ Salt NOT added  
✅ Success alert: "2 item(s) added to your shopping list"  

### Database Verification
```sql
SELECT name, suggested_quantity
FROM shopping_list_items
WHERE source = 'pantry_alert';
-- Should show:
-- Olive Oil: 450
-- Sugar: 500
-- (Salt not present)
```

---

## **TEST 11: Check Off Item (In-Store Shopping)**

### Objective
Test checking off an item during shopping, triggering add-to-pantry flow.

### Setup Requirements
- Shopping list "My Shopping List" has:
  - "Milk" (unchecked)
  - "Bread" (unchecked)
  - "Eggs" (checked)

### Steps
1. From Shopping List screen showing "My Shopping List"
2. Items grouped by checked/unchecked
3. Locate "Milk" item (unchecked)
4. Tap on "Milk" item card

### Expected Results
✅ `AddToPantryModal` appears immediately  
✅ Modal title: "Add Milk to Pantry"  
✅ Modal shows suggested quantities:
   - "Suggested based on:"
   - "• Your usual: 1 gallon" (from purchase history)
   - Quick add buttons:
     - [Quick Add 1 gallon]
     - [Quick Add 1 liter]  (if metric user)
✅ Custom amount section:
   - Quantity input: numeric field
   - Unit picker: dropdown
✅ Buttons:
   - "Skip" (left, gray)
   - "Add to Pantry" (right, blue)  

### Steps Continued
5. Tap "Quick Add 1 gallon" button

### Expected Results
✅ Modal dismisses immediately  
✅ Item added to pantry:
   - name: "Milk"
   - quantity: 1
   - unit: "gallon"
   - category: "dairy"
   - purchased_at: current timestamp  
✅ Shopping list item updated:
   - checked: true  
✅ Item moves to bottom of list with strikethrough  
✅ Item shows: "M̶i̶l̶k̶" (strikethrough style)  
✅ Progress indicator updates: "1 of 3 items"  
✅ Purchase history record created  
✅ Success toast (optional): "Milk added to pantry"  

### Database Verification
```sql
-- Check shopping list item
SELECT name, checked FROM shopping_list_items
WHERE name = 'Milk' AND list_id = '[test_list_id]';
-- checked: true

-- Check pantry item
SELECT name, quantity, unit FROM pantry_items
WHERE user_id = '[test_user_id]' AND name = 'Milk';
-- quantity: 1, unit: 'gallon'

-- Check purchase history
SELECT item_name, quantity, unit, purchased_at
FROM purchase_history
WHERE user_id = '[test_user_id]' AND item_name = 'Milk';
-- Should have new entry
```

---

## **TEST 12: Check Off Item - Skip Pantry Add**

### Objective
Test checking off an item without adding to pantry.

### Steps
1. From Shopping List screen
2. Tap "Bread" item
3. In `AddToPantryModal`, tap "Skip" button

### Expected Results
✅ Modal dismisses  
✅ Item checked off in shopping list:
   - "Bread" shows with strikethrough
   - checked: true  
✅ Item NOT added to pantry  
✅ Item moves to "Checked" section at bottom  
✅ Progress updates: "2 of 3 items"  
✅ Purchase history still created (tracks that item was purchased even if not added to pantry)  

### Use Case
- User doesn't want item in pantry (e.g., fresh bread eaten immediately)
- User already added item to pantry manually
- Item not suitable for pantry tracking

---

## **TEST 13: Uncheck Item (Error Correction)**

### Objective
Test unchecking an item to correct a mistake.

### Steps
1. From Shopping List screen with "Milk" checked (from TEST 11)
2. Tap "Milk" item again (in checked section)
3. Observe behavior

### Expected Results
✅ Item immediately unchecked (no modal)  
✅ Item moves back to top (unchecked section)  
✅ Strikethrough removed  
✅ Progress updates: "1 of 3 items"  
✅ Pantry item updated:
   - Quantity deducted (1 gallon removed)
   - If quantity goes to 0, item soft-deleted or marked as out of stock  
✅ Purchase history entry marked as reverted or deleted  

### Important Note
⚠️ **30-SECOND GRACE PERIOD:** User has 30 seconds to uncheck items before list auto-archives. After that, changes may not be reversible.

---

## **TEST 14: Custom Quantity Add to Pantry**

### Objective
Test adding item to pantry with custom quantity instead of quick-add.

### Steps
1. From Shopping List screen
2. Tap unchecked item "Eggs"
3. In `AddToPantryModal`, scroll to custom section
4. Enter:
   - Quantity: 12
   - Unit: Select "count" from picker
5. Tap "Add to Pantry"

### Expected Results
✅ Item added to pantry with custom values:
   - quantity: 12
   - unit: "count"  
✅ Item checked off in shopping list  
✅ Progress updates: "2 of 3 items"  

### UI Elements to Verify
- Quantity input: numeric keyboard on mobile
- Unit picker shows common units first:
  - count, lbs, oz, kg, g, ml, cups, tbsp, tsp
- Input validation: must enter quantity if adding custom

---

## **TEST 15: Complete Shopping - Auto-Archive**

### Objective
Test auto-archive flow when all items are checked off.

### Setup Requirements
- Shopping list with 3 items
- 2 items already checked

### Steps
1. From Shopping List screen
2. Check off the last unchecked item (follows TEST 11 flow)
3. Add to pantry and confirm
4. Observe behavior

### Expected Results
✅ All items now checked (3 of 3)  
✅ Toast appears immediately:
   - "🎉 Shopping complete!"
   - "List will archive in 30 seconds"
   - [Undo] button visible  
✅ 30-second countdown visible (optional: progress bar)  
✅ User can still interact with list during countdown  
✅ User can uncheck items to cancel auto-archive  

### Steps Continued
5. Wait 30 seconds without interaction

### Expected Results
✅ List automatically archived:
   - is_archived: true
   - archived_at: current timestamp  
✅ List disappears from main view  
✅ User returned to lists overview or next available list  
✅ If no other lists exist, shows empty state  
✅ Success toast: "List archived"  

### Database Verification
```sql
SELECT name, is_archived, updated_at
FROM shopping_lists
WHERE id = '[test_list_id]';
-- is_archived: true
```

### Undo Flow
6. Before 30 seconds, tap [Undo] button

### Expected Results
✅ Auto-archive cancelled  
✅ Toast dismisses  
✅ Countdown stops  
✅ List remains active  
✅ User can continue shopping or unchecking items  

---

## **TEST 16: Auto-Archive Cancel (Uncheck During Countdown)**

### Objective
Test that unchecking an item during the 30-second countdown cancels auto-archive.

### Steps
1. From shopping list with all items checked (auto-archive countdown started)
2. Before 30 seconds elapse, tap a checked item to uncheck it
3. Observe behavior

### Expected Results
✅ Item unchecked immediately  
✅ Auto-archive countdown CANCELLED  
✅ Toast dismisses or updates: "Auto-archive cancelled"  
✅ Progress updates: "2 of 3 items"  
✅ List remains active and editable  

### Use Case
- User forgot to buy one item
- User made a mistake checking something off
- User wants to add more items to list

---

## **TEST 17: Multiple Lists - Switching Between Lists**

### Objective
Test navigation between multiple shopping lists using tabs.

### Setup Requirements
- User has 3 active lists:
  - "My Shopping List" (5 items)
  - "Costco Run" (3 items)
  - "Farmers Market" (2 items)

### Steps
1. Navigate to Shopping List screen
2. Observe list tabs at top (horizontal scrolling)
3. Current tab: "My Shopping List" (highlighted)
4. Tap "Costco Run" tab

### Expected Results
✅ Tab changes immediately (smooth transition)  
✅ "Costco Run" tab highlighted  
✅ List content updates to show 3 items from "Costco Run"  
✅ Progress indicator updates for this list  
✅ FAB (+) button remains available  
✅ List actions (share, edit, delete) update to current list  

### Steps Continued
5. Tap "Farmers Market" tab
6. Tap back to "My Shopping List" tab

### Expected Results
✅ Tab switching smooth in both directions  
✅ Each list maintains its own state:
   - Checked items remain checked
   - Scroll position preserved (optional)
   - Items unique to each list  

### UI Elements to Verify
- Active tab has blue underline or background
- Inactive tabs have gray text
- Tab scroll is horizontal with snap-to-tab behavior
- Tab width adjusts to content (with min/max width)

---

## **TEST 18: Create Additional List**

### Objective
Test creating a new list when others already exist.

### Steps
1. From Shopping List screen with existing lists
2. Locate "+ New" tab at end of tab row
3. Tap "+ New" tab

### Expected Results
✅ Prompt appears: "New Shopping List"  
✅ Input field focused with placeholder  
✅ Cancel and Create buttons visible  

### Steps Continued
4. Type "Holiday Groceries"
5. Tap "Create"

### Expected Results
✅ New list created in database  
✅ New tab appears: "Holiday Groceries"  
✅ Tab automatically selected (becomes active)  
✅ Empty list state shown: "No items yet"  
✅ User can immediately start adding items  

### Database Verification
```sql
SELECT id, name, created_at
FROM shopping_lists
WHERE user_id = '[test_user_id]'
ORDER BY created_at DESC;
-- Should show "Holiday Groceries" as most recent
```

---

## **TEST 19: Rename Shopping List**

### Objective
Test renaming an existing shopping list.

### Steps
1. From Shopping List screen showing "Costco Run"
2. Locate list actions area (typically header or tab long-press)
3. Tap edit icon (✏️) next to list name
4. Observe prompt

### Expected Results
✅ Prompt appears: "Rename Shopping List"  
✅ Input field pre-filled with current name: "Costco Run"  
✅ Text is selected (ready to replace)  
✅ Cancel and Save buttons visible  

### Steps Continued
5. Change name to "Costco Shopping"
6. Tap "Save"

### Expected Results
✅ List name updated in database  
✅ Tab updates to show "Costco Shopping"  
✅ No data loss (items remain in list)  
✅ Success toast (optional): "List renamed"  

### Database Verification
```sql
SELECT name, updated_at FROM shopping_lists
WHERE id = '[test_list_id]';
-- name: 'Costco Shopping'
```

### Edge Cases
**Test A: Rename to empty string**
- Expected: Error "Name cannot be empty"

**Test B: Rename to duplicate name**
- If "My Shopping List" exists, try renaming to "My Shopping List"
- Expected: Either allow (duplicate names okay) or error "Name already exists"
- **Recommended:** Allow duplicates for flexibility

---

## **TEST 20: Delete Shopping List**

### Objective
Test deleting a shopping list (soft delete / archive).

### Steps
1. From Shopping List screen showing "Costco Shopping"
2. Tap delete icon (🗑️) next to list name
3. Observe confirmation dialog

### Expected Results
✅ Alert appears: "Delete List?"  
✅ Message: "Are you sure you want to delete 'Costco Shopping'? This will archive the list."  
✅ Two buttons:
   - "Cancel"
   - "Delete" (destructive style, red)  

### Steps Continued
4. Tap "Delete"

### Expected Results
✅ List archived in database (soft delete):
   - is_archived: true
   - updated_at: current timestamp  
✅ List tab disappears from view  
✅ If other lists exist, switches to next available list  
✅ If no other lists, shows empty state  
✅ Items preserved in database (not deleted)  
✅ Success toast: "List archived"  

### Database Verification
```sql
SELECT name, is_archived FROM shopping_lists
WHERE id = '[test_list_id]';
-- is_archived: true

-- Items still exist
SELECT COUNT(*) FROM shopping_list_items
WHERE list_id = '[test_list_id]';
-- Should return item count
```

### Recovery (Optional Feature)
- User can view archived lists in settings/profile
- User can restore archived list
- User can permanently delete archived list

---

## **TEST 21: Delete Individual Item**

### Objective
Test deleting a single item from the shopping list.

### Steps
1. From Shopping List screen with items
2. Locate "Tomatoes" item
3. Tap delete button (X) on right side of item card
4. Observe behavior

### Expected Results
✅ Confirmation alert appears:
   - "Delete Item?"
   - "Remove 'Tomatoes' from shopping list?"
   - Buttons: Cancel, Delete  

### Steps Continued
5. Tap "Delete"

### Expected Results
✅ Item removed from database  
✅ Item disappears from list with animation (slide out)  
✅ Other items adjust position smoothly  
✅ If last item deleted, shows empty list message  

### Database Verification
```sql
SELECT COUNT(*) FROM shopping_list_items
WHERE list_id = '[test_list_id]' AND name = 'Tomatoes';
-- Should return 0
```

### Alternative: Swipe to Delete
- User swipes left on item card
- Delete button reveals
- Tap to confirm delete
- Same behavior as tapping X button

---

## **TEST 22: Category Grouping Toggle**

### Objective
Test grouping items by category for easier shopping.

### Steps
1. From Shopping List screen with diverse items:
   - Tomatoes (produce)
   - Milk (dairy)
   - Bread (pantry)
   - Chicken (meat)
   - Ice Cream (frozen)
2. Locate grouping toggle in header (⋮ menu or filter icon)
3. Tap "Group by Category"

### Expected Results
✅ Items reorganize into category sections:
   ```
   Produce (1 item)
     ☐ Tomatoes
   
   Dairy (1 item)
     ☐ Milk
   
   Pantry (1 item)
     ☐ Bread
   
   Meat (1 item)
     ☐ Chicken
   
   Frozen (1 item)
     ☐ Ice Cream
   
   ─────────────────────
   Checked (0 items)
   ```
✅ Each category shows item count  
✅ Category headers have distinct styling:
   - Bold text
   - Light background (#f0f0f0)
   - Padding 8x16  
✅ Checked items still move to bottom "Checked" section  
✅ Empty categories not displayed  

### Steps Continued
4. Check off "Milk" item

### Expected Results
✅ "Milk" moves to "Checked" section at bottom  
✅ Dairy section updates: "Dairy (0 items)" or disappears  
✅ Checked section shows: "Checked (1 item)"  

### Toggle Off
5. Tap "Group by Category" again to toggle off

### Expected Results
✅ Flat list view restored  
✅ Items in original order (or by creation time)  
✅ Grouping preference saved for next session  

---

## **TEST 23: Share Shopping List**

### Objective
Test sharing a shopping list with another user.

### Setup Requirements
- Two test users:
  - User A (sharer): test@example.com
  - User B (recipient): recipient@example.com

### Steps (User A)
1. From Shopping List screen showing "Weekly Groceries"
2. Tap share icon (👥) next to list name
3. Observe `ShareListModal`

### Expected Results
✅ Modal appears: "Share Shopping List"  
✅ Subtitle: "Invite others to view or edit this list"  
✅ Email/username input field  
✅ Permission selector:
   - ⦿ View Only
   - ⚪ Can Edit  
✅ "Share" button (primary)  
✅ List of current shares (if any):
   - Shows usernames/emails
   - Shows permissions
   - Remove button for each  

### Steps Continued
4. Enter email: "recipient@example.com"
5. Select "Can Edit" permission
6. Tap "Share" button

### Expected Results
✅ Email lookup performed in database  
✅ User found (or error if not found)  
✅ Share record created:
   - list_id: current list
   - shared_with_user_id: User B's ID
   - permission: 'edit'
   - created_at: current timestamp  
✅ Success toast: "List shared with recipient@example.com"  
✅ Modal updates to show new share:
   - "recipient@example.com - Can Edit [Remove]"  

### Database Verification
```sql
SELECT list_id, shared_with_user_id, permission
FROM shared_lists
WHERE list_id = '[test_list_id]' 
  AND shared_with_user_id = '[user_b_id]';
-- permission: 'edit'
```

---

## **TEST 24: View Shared Shopping List (Recipient)**

### Objective
Test viewing a shopping list shared with the user.

### Steps (User B)
1. Log in as recipient@example.com
2. Navigate to Shopping List screen
3. Observe list tabs

### Expected Results
✅ Shared list appears in tabs: "Weekly Groceries"  
✅ List has shared indicator (👥 icon on tab)  
✅ User can tap to view list  
✅ All items visible  
✅ User can check off items (because permission is 'edit')  
✅ User can add items  
✅ Changes sync in real-time (or on refresh)  

### Permission: View Only
**Setup:** Change User B's permission to 'view'

### Expected Results
✅ List still visible  
✅ Items displayed with disabled state:
   - Cannot check off items
   - Cannot add items
   - Cannot delete items  
✅ FAB (+) button hidden or disabled  
✅ Message: "This is a shared list (view only)"  

---

## **TEST 25: Real-Time Sync (Shared Lists)**

### Objective
Test that changes to shared lists sync across users.

### Steps
1. User A and User B both viewing "Weekly Groceries" list
2. User A adds item "Bananas"
3. User A checks off "Milk"

### Expected Results (User B's view)
✅ "Bananas" appears in list after refresh or real-time sync  
✅ "Milk" shows as checked (moved to bottom)  
✅ Progress indicator updates  
✅ Changes visible within 1-2 seconds (if real-time)  
✅ Or changes visible after pull-to-refresh  

### Implementation Options
**Option A: Real-time sync (WebSocket/Supabase Realtime)**
- Listen to INSERT, UPDATE events on shopping_list_items
- Filter by list_id
- Update UI immediately

**Option B: Pull-to-refresh**
- User must pull down to refresh
- Simpler implementation
- Still effective for most use cases

---

## **TEST 26: Remove Share Access**

### Objective
Test removing a user's access to a shared list.

### Steps (User A - list owner)
1. From Shopping List screen
2. Tap share icon (👥) on "Weekly Groceries"
3. In `ShareListModal`, locate "recipient@example.com - Can Edit"
4. Tap [Remove] button

### Expected Results
✅ Confirmation alert: "Remove access for recipient@example.com?"  
✅ Buttons: Cancel, Remove  

### Steps Continued
5. Tap "Remove"

### Expected Results
✅ Share record deleted from database  
✅ User removed from shared users list in modal  
✅ Success toast: "Access removed"  

### Steps (User B - recipient)
6. User B refreshes Shopping List screen

### Expected Results
✅ "Weekly Groceries" list disappears from User B's tabs  
✅ User B can no longer access list  
✅ No error messages (graceful removal)  

### Database Verification
```sql
SELECT COUNT(*) FROM shared_lists
WHERE list_id = '[test_list_id]' 
  AND shared_with_user_id = '[user_b_id]';
-- Should return 0
```

---

## **TEST 27: Pull to Refresh**

### Objective
Test pull-to-refresh functionality to sync latest data.

### Steps
1. From Shopping List screen
2. Pull down from top of list (swipe gesture)
3. Observe loading indicator

### Expected Results
✅ Loading spinner appears at top  
✅ List data re-fetched from database  
✅ Any new items appear  
✅ Any checked items sync (from other users)  
✅ Deleted items disappear  
✅ Spinner disappears when complete  
✅ List scrolls back to top smoothly  

### Use Cases
- Sync shared list changes
- Refresh after network reconnection
- Check for items added via web or other device

---

## **TEST 28: Empty List Actions**

### Objective
Test various actions on a list with no items.

### Steps
1. Create new list "Test Empty"
2. Observe empty state: "No items yet. Tap + to add items."
3. Test the following actions:
   - Pull to refresh
   - Rename list
   - Share list
   - Delete list

### Expected Results
✅ Pull to refresh: Works, still shows empty state  
✅ Rename list: Works as normal  
✅ Share list: Works, recipient sees empty list  
✅ Delete list: Works, archives empty list  
✅ No errors with empty data sets  
✅ "Group by Category" toggle: Disabled or shows "No items"  

---

## **TEST 29: Large Shopping List (Performance)**

### Objective
Test performance with large number of items.

### Setup Requirements
- Create shopping list with 100+ items
- Mix of categories, checked/unchecked

### Steps
1. Navigate to large shopping list
2. Observe initial load time
3. Scroll through entire list
4. Check off multiple items
5. Search/filter items (if implemented)

### Expected Results
✅ List loads in <2 seconds  
✅ Smooth scrolling (60 FPS)  
✅ Checking items responsive (<100ms)  
✅ No memory leaks or crashes  
✅ FlatList virtualization working:
   - Only visible items rendered
   - Off-screen items recycled  

### Performance Optimization
- Use FlatList with proper keyExtractor
- Use React.memo for item cards
- Batch state updates
- Optimize re-renders with useMemo/useCallback

---

## **TEST 30: Offline Mode**

### Objective
Test behavior when device is offline.

### Steps
1. From Shopping List screen with items
2. Disable device network (airplane mode)
3. Attempt various actions:
   - Check off item
   - Add new item
   - Create new list
   - Share list

### Expected Results
✅ Offline indicator shown (optional)  
✅ Read operations work (data cached):
   - Can view lists
   - Can view items  
✅ Write operations queued or show error:
   - Check off item: Queued for sync
   - Add item: Queued for sync
   - Share: Error "Network required"  
✅ When back online:
   - Queued changes sync automatically
   - Success confirmations shown  

### Error Messages
- "You are offline. Changes will sync when reconnected."
- "Network required to share lists."
- "Changes saved locally and will sync."

---

## **TEST 31: Source Indicators and Labels**

### Objective
Test that items show correct source badges and labels.

### Setup Requirements
- Shopping list with items from different sources:
  - "Apples" (manual)
  - "Chicken" (recipe: "Chicken Alfredo")
  - "Olive Oil" (pantry_alert: "Low Stock")

### Steps
1. From Shopping List screen
2. Observe each item's visual indicators

### Expected Results
✅ "Apples" shows:
   - Manual badge: ✏️ icon or "Manual" text
   - No source label  
✅ "Chicken" shows:
   - Recipe badge: 📖 icon or "Recipe" text
   - Source label: "Chicken Alfredo"  
✅ "Olive Oil" shows:
   - Alert badge: ⚠️ icon or "Low Stock" text
   - Source label: "Low Stock"  

### Multiple Recipe Tags
**Setup:** "Garlic" item with source_label: "Chicken Alfredo | Pasta Carbonara"

### Expected Results
✅ Shows recipe badge  
✅ Source label displays both recipes:
   - "Chicken Alfredo | Pasta Carbonara"
   - Or split into two lines
   - Or truncated with "... +1 more"  

### UI Elements to Verify
- Badges: small, rounded, appropriate colors
- Labels: fontSize 12, gray color, below item name
- Icons: 16x16 size, align with text

---

## **TEST 32: Item Quick Actions (Swipe Gestures)**

### Objective
Test swipe gestures for quick item actions.

### Steps
1. From Shopping List screen with unchecked item "Tomatoes"
2. Swipe left on "Tomatoes" item card

### Expected Results (Option A: Single Action)
✅ Delete button reveals in red  
✅ Swipe animation smooth  
✅ Tap delete to remove item  

### Expected Results (Option B: Multiple Actions)
✅ Two action buttons reveal:
   - "Edit" (blue)
   - "Delete" (red)  
✅ Tap "Edit" to open edit modal  
✅ Tap "Delete" to remove item  

### Steps
3. Swipe right on "Tomatoes" item

### Expected Results
✅ Quick check action:
   - Item immediately checked off
   - Triggers `AddToPantryModal`
   - Or marks as checked without pantry add  

### Platform Behavior
- iOS: Swipe actions standard
- Android: May use long-press menu instead
- Both should support tap on item for primary action

---

## **TEST 33: Search/Filter Items**

### Objective
Test searching for items within a shopping list.

### Steps
1. From Shopping List screen with 20+ items
2. Locate search bar (top of list, below tabs)
3. Tap search bar to focus
4. Type "tom"

### Expected Results
✅ List filters in real-time  
✅ Shows only matching items:
   - "Tomatoes"
   - "Tomato Paste"  
✅ Case-insensitive matching  
✅ Partial matches included  
✅ Category grouping maintained (if enabled)  
✅ Checked items hidden or shown separately  

### Steps Continued
5. Clear search (X button)

### Expected Results
✅ Full list restored  
✅ Scroll position preserved (if possible)  

### Advanced Filters (Optional)
- Filter by category (dropdown)
- Filter by source (manual, recipe, alert)
- Filter checked/unchecked only
- Multiple filters combine with AND logic

---

## **TEST 34: Accessibility (Screen Reader)**

### Objective
Test screen reader compatibility and accessibility.

### Steps
1. Enable screen reader (TalkBack on Android, VoiceOver on iOS)
2. Navigate to Shopping List screen
3. Test the following with screen reader:
   - Hear list names in tabs
   - Hear item names
   - Hear category labels
   - Hear checked/unchecked state
   - Activate check action
   - Activate delete action

### Expected Results
✅ All interactive elements have accessibility labels  
✅ Item reads: "Tomatoes, unchecked, produce category, manual item"  
✅ Check button reads: "Add Tomatoes to pantry"  
✅ Delete button reads: "Delete Tomatoes"  
✅ Tab navigation works with keyboard/screen reader  
✅ Focus indicators visible  
✅ Modals announce when opening/closing  

### Accessibility Properties
```typescript
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Add Tomatoes to pantry"
  accessibilityRole="button"
  accessibilityHint="Tap to mark item as purchased and add to pantry"
>
  <Text>Tomatoes</Text>
</TouchableOpacity>
```

---

## **TEST 35: Error Handling - Database Failures**

### Objective
Test error handling when database operations fail.

### Steps
1. Simulate database error (disconnect network or use invalid data)
2. Attempt to add item to shopping list
3. Observe error behavior

### Expected Results
✅ Error alert appears:
   - Title: "Error"
   - Message: "Failed to add item: [error details]"
   - Button: "OK"  
✅ Item NOT added to list  
✅ UI remains stable (no crash)  
✅ User can retry action  
✅ Error logged to console for debugging  

### Error Scenarios
1. **Network timeout**: "Network request timed out"
2. **Invalid data**: "Invalid item data"
3. **Permission denied**: "You don't have permission to edit this list"
4. **Database full** (unlikely): "Storage limit reached"

### Recovery
- User can retry immediately
- Queued operations retry automatically when back online
- Clear error messages guide user

---

## **TEST 36: Unit System Consistency**

### Objective
Test that suggested quantities use user's preferred unit system.

### Setup Requirements
- User profile: unit_system = 'metric'
- Recipe "Chicken Alfredo" with ingredients in both metric and imperial

### Steps
1. Add recipe to shopping list
2. Navigate to shopping list
3. Check off "Chicken Breast" item
4. Observe `AddToPantryModal` suggested quantities

### Expected Results
✅ Suggested quantities in metric:
   - "500 g" (not "1 lb")
   - "250 ml" (not "1 cup")  
✅ Unit picker defaults to metric units  
✅ Purchase history records metric values  

### Imperial User Test
**Setup:** Change user profile to unit_system = 'imperial'

### Expected Results
✅ Suggested quantities in imperial:
   - "1 lb" (not "500 g")
   - "1 cup" (not "250 ml")  
✅ Unit picker defaults to imperial units  

### Code Logic
```typescript
const suggestedQuantity = user.unit_system === 'metric'
  ? item.metric_quantity
  : item.imperial_quantity;

const suggestedUnit = user.unit_system === 'metric'
  ? item.metric_unit
  : item.imperial_unit;
```

---

## Summary of Test Coverage

### ✅ Fully Tested Areas
1. List creation and management (create, rename, delete)
2. Item addition (manual, recipe, low stock)
3. Item autocomplete and duplicate prevention
4. Check/uncheck items with pantry integration
5. Add to pantry flow with quick-add and custom amounts
6. Auto-archive on completion with 30-second grace period
7. Multiple list management with tabs
8. Category grouping and organization
9. Sharing lists with permissions
10. Real-time sync for shared lists
11. Pull-to-refresh functionality
12. Performance with large lists
13. Offline mode and error handling
14. Source indicators and labels
15. Unit system consistency

### ⚠️ Areas Needing Implementation
1. AddToPantryModal component (new)
2. Autocomplete suggestions (new)
3. 30-second auto-archive countdown (new)
4. Purchase history table and tracking (schema exists, needs implementation)
5. Category grouping toggle (UI needs implementation)
6. Search/filter functionality (optional enhancement)
7. Swipe gestures for quick actions (optional)
8. Real-time sync (WebSocket/Realtime) vs pull-to-refresh

### 🔮 Future Enhancements
1. Store/aisle customization
2. Barcode scanning for items
3. Price tracking and budget features
4. Shopping list templates (weekly, monthly, etc.)
5. Smart suggestions based on purchase frequency
6. Location-based reminders (e.g., "Near Costco, you have a list!")
7. Voice input for adding items
8. Meal planning integration
9. Collaborative shopping (mark who's buying what)
10. Export/share list via text/email

---

## Database Verification Queries

Use these queries to manually verify test results:

```sql
-- Check shopping lists
SELECT id, name, user_id, is_archived, created_at, updated_at
FROM shopping_lists
WHERE user_id = '[test_user_id]'
ORDER BY created_at DESC;

-- Check shopping list items
SELECT 
  sl.name AS list_name,
  sli.name AS item_name,
  sli.category,
  sli.checked,
  sli.source,
  sli.source_label,
  sli.suggested_quantity,
  sli.suggested_unit
FROM shopping_list_items sli
JOIN shopping_lists sl ON sl.id = sli.list_id
WHERE sl.user_id = '[test_user_id]'
ORDER BY sl.name, sli.checked, sli.created_at;

-- Check shared lists
SELECT 
  sl.name,
  u.email AS shared_with,
  shl.permission,
  shl.created_at
FROM shared_lists shl
JOIN shopping_lists sl ON sl.id = shl.list_id
JOIN auth.users u ON u.id = shl.shared_with_user_id
WHERE sl.user_id = '[test_user_id]';

-- Check purchase history
SELECT 
  item_name,
  quantity,
  unit,
  purchased_at,
  list_id
FROM purchase_history
WHERE user_id = '[test_user_id]'
ORDER BY purchased_at DESC
LIMIT 20;

-- Check low stock items that should be added
SELECT 
  pi.name,
  pi.quantity,
  pi.typical_quantity,
  pi.unit,
  (pi.quantity::FLOAT / NULLIF(pi.typical_quantity, 0)) * 100 AS stock_percent
FROM pantry_items pi
JOIN user_profiles up ON up.id = pi.user_id
WHERE pi.user_id = '[test_user_id]'
  AND pi.quantity < (pi.typical_quantity * (up.low_stock_threshold_percent::FLOAT / 100))
ORDER BY stock_percent ASC;

-- Test RPC function manually
SELECT auto_add_low_stock_to_shopping_list('[user_id]'::UUID);

SELECT add_recipe_to_shopping_list(
  '[user_id]'::UUID,
  '[recipe_version_id]'::UUID,
  1.0
);
```

---

## Test Completion Checklist

- [ ] TEST 1: Navigate to Shopping List Screen (First Use)
- [ ] TEST 2: Create First Shopping List
- [ ] TEST 3: Add First Item Manually
- [ ] TEST 4: Add Item with Quantity and Unit
- [ ] TEST 5: Item Name Autocomplete Suggestions
- [ ] TEST 6: Add Recipe to Shopping List (Quick Add)
- [ ] TEST 7: Add Recipe to Shopping List (Multiple Lists)
- [ ] TEST 8: Add Recipe with Duplicate Items
- [ ] TEST 9: Auto-Add Low Stock Items (Bulk Add)
- [ ] TEST 10: Auto-Add Low Stock Items (Review Flow)
- [ ] TEST 11: Check Off Item (In-Store Shopping)
- [ ] TEST 12: Check Off Item - Skip Pantry Add
- [ ] TEST 13: Uncheck Item (Error Correction)
- [ ] TEST 14: Custom Quantity Add to Pantry
- [ ] TEST 15: Complete Shopping - Auto-Archive
- [ ] TEST 16: Auto-Archive Cancel (Uncheck During Countdown)
- [ ] TEST 17: Multiple Lists - Switching Between Lists
- [ ] TEST 18: Create Additional List
- [ ] TEST 19: Rename Shopping List
- [ ] TEST 20: Delete Shopping List
- [ ] TEST 21: Delete Individual Item
- [ ] TEST 22: Category Grouping Toggle
- [ ] TEST 23: Share Shopping List
- [ ] TEST 24: View Shared Shopping List (Recipient)
- [ ] TEST 25: Real-Time Sync (Shared Lists)
- [ ] TEST 26: Remove Share Access
- [ ] TEST 27: Pull to Refresh
- [ ] TEST 28: Empty List Actions
- [ ] TEST 29: Large Shopping List (Performance)
- [ ] TEST 30: Offline Mode
- [ ] TEST 31: Source Indicators and Labels
- [ ] TEST 32: Item Quick Actions (Swipe Gestures)
- [ ] TEST 33: Search/Filter Items
- [ ] TEST 34: Accessibility (Screen Reader)
- [ ] TEST 35: Error Handling - Database Failures
- [ ] TEST 36: Unit System Consistency

---

**End of Test Plan**
