# Remaining Shopping List Fixes

## Completed ✅
1. Database schema migration with suggested_quantity, suggested_unit, shared_by_user_id
2. Purchase history table creation and RPC functions
3. AddToPantryModal component created
4. ShoppingListItemCard updated with check/uncheck styling and accessibility

## High Priority - Still Needed 🔴

### 1. Update ShoppingListScreen.tsx
**File**: `app/src/screens/shopping/ShoppingListScreen.tsx`

**Changes needed**:
- Import AddToPantryModal
- Add state for modal visibility and selected item
- Implement handleItemPress to show AddToPantryModal for unchecked items
- Implement handleItemPress to uncheck for checked items (with pantry quantity reversal)
- Update item rendering to use new onItemPress instead of onItemNamePress
- Add fetch for shared lists (UNION query)
- Implement 30-second auto-archive countdown
- Add progress indicator showing "X of Y items checked"
- Add "+ Add Low Stock" button to header

**Code additions**:
```typescript
const [addToPantryModalVisible, setAddToPantryModalVisible] = useState(false);
const [selectedItem, setSelectedItem] = useState<ShoppingListItem | null>(null);
const [archiveCountdown, setArchiveCountdown] = useState<number | null>(null);

const handleItemPress = async (item: ShoppingListItem) => {
  if (item.checked) {
    // Uncheck item and remove from pantry
    await uncheckItem(item);
  } else {
    // Show add to pantry modal
    setSelectedItem(item);
    setAddToPantryModalVisible(true);
  }
};

// Auto-archive countdown logic
useEffect(() => {
  const allChecked = items.every(i => i.checked) && items.length > 0;
  if (allChecked && !archiveCountdown) {
    setArchiveCountdown(30);
  } else if (!allChecked && archiveCountdown) {
    setArchiveCountdown(null);
  }
}, [items]);

useEffect(() => {
  if (archiveCountdown === 0) {
    handleArchiveList();
  } else if (archiveCountdown && archiveCountdown > 0) {
    const timer = setTimeout(() => {
      setArchiveCountdown(archiveCountdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [archiveCountdown]);
```

### 2. Update AddShoppingItemModal.tsx  
**File**: `app/src/components/AddShoppingItemModal.tsx`

**Changes needed**:
- Store quantities in suggested_quantity/suggested_unit fields (not quantity/unit)
- Add autocomplete dropdown using get_item_suggestions RPC
- Add duplicate warning check using check_duplicate_shopping_item RPC
- Disable Add button if duplicate detected

**Line 88-125**: Update insert to use suggested fields:
```typescript
const { error } = await supabase
  .from('shopping_list_items')
  .insert({
    list_id: listId,
    name: itemName.trim(),
    quantity: null,  // Don't display quantity in list
    unit: null,
    suggested_quantity: quantity ? parseFloat(quantity) : null,
    suggested_unit: unit || null,
    category: selectedCategory || null,
    source: 'manual',
    checked: false,
  });
```

### 3. Update RecipeDetailScreen.tsx
**File**: `app/src/screens/recipe/RecipeDetailScreen.tsx`

**Changes needed**:
- Store recipe quantities in suggested_quantity/suggested_unit fields
- Lines 180-181 currently set quantity/unit to null - update to use ingredient quantities

**Update lines 174-185**:
```typescript
const qty = userUnitSystem === 'metric' 
  ? ing.metric_quantity 
  : ing.imperial_quantity;
const unit = userUnitSystem === 'metric'
  ? ing.metric_unit
  : ing.imperial_unit;

await supabase.from('shopping_list_items').insert({
  list_id: selectedList.id,
  name: ing.name,
  quantity: null,
  unit: null,
  suggested_quantity: qty,
  suggested_unit: unit,
  // ... rest of fields
});
```

### 4. Fix ShareListModal.tsx
**File**: `app/src/components/ShareListModal.tsx`

**Changes needed**:
- Line 107: shared_by_user_id field now exists, should work correctly
- Verify query returns shared lists properly

## Medium Priority - Still Needed 🟡

### 5. Create LowStockReviewModal.tsx
**File**: `app/src/components/LowStockReviewModal.tsx` (NEW)

**Features**:
- Show list of low stock items with checkboxes
- Allow editing suggested quantities
- "Add All" / "Clear All" toggle
- "Add Selected" button to add only checked items
- Query low stock items, show current/typical quantities

### 6. Add Category Grouping Toggle
**File**: `app/src/screens/shopping/ShoppingListScreen.tsx`

**Changes needed**:
- Add state for groupByCategory boolean
- Add toggle button in header (⋮ menu)
- Replace FlatList with SectionList when grouped
- Group items by category, then checked status

### 7. Add Accessibility Labels
**Files**: All components

**Changes needed**:
- Add accessible={true}
- Add accessibilityLabel
- Add accessibilityRole
- Add accessibilityHint

## Low Priority - Nice to Have 🟢

### 8. Performance Optimizations
- Wrap ShoppingListItemCard with React.memo
- Add useMemo for filtered/sorted lists
- Add useCallback for handlers

### 9. Search/Filter
- Add search bar component
- Filter items by name (case-insensitive)
- Optional: filter by category, source, checked status

### 10. Swipe Gestures  
- Add react-native-gesture-handler
- Implement swipe-to-delete
- Implement swipe-to-check

### 11. Offline Mode
- Add @react-native-community/netinfo
- Queue mutations when offline
- Sync when back online

## Testing Strategy

After implementing high-priority fixes:

1. Run migration: `npx supabase db push`
2. Test with qa-tester agent using shopping-list-workflow.md
3. Fix any failing tests
4. Repeat until all tests pass

## Key Files Summary

**Database**:
- ✅ `supabase/migrations/20260227000009_shopping_list_enhancements.sql` - CREATED

**Components**:
- ✅ `app/src/components/AddToPantryModal.tsx` - CREATED
- ✅ `app/src/components/ShoppingListItemCard.tsx` - UPDATED
- 🔴 `app/src/components/AddShoppingItemModal.tsx` - NEEDS UPDATE
- 🔴 `app/src/components/ShareListModal.tsx` - VERIFY WORKING
- 🟡 `app/src/components/LowStockReviewModal.tsx` - NEEDS CREATION

**Screens**:
- 🔴 `app/src/screens/shopping/ShoppingListScreen.tsx` - NEEDS MAJOR UPDATES
- 🔴 `app/src/screens/recipe/RecipeDetailScreen.tsx` - NEEDS UPDATE

**Types**:
- ✅ `app/src/types/database.ts` - UPDATED

## Estimated Time Remaining
- High Priority: 3-4 hours
- Medium Priority: 2-3 hours
- Low Priority: 3-4 hours
- **Total**: 8-11 hours

## Next Steps
1. Apply migration to database
2. Update ShoppingListScreen.tsx (largest change)
3. Update AddShoppingItemModal.tsx
4. Update RecipeDetailScreen.tsx
5. Test with qa-tester
6. Fix any issues
7. Implement medium priority features
8. Test again
9. Done!
