-- Add Sample Data for Testing
-- User ID: a9a045ee-93c2-4be2-bd4a-6a235ae156ae

-- =====================================================
-- SAMPLE PANTRY ITEMS
-- =====================================================
INSERT INTO pantry_items (user_id, name, quantity, unit, category, typical_quantity, usda_food_id) VALUES
  ('a9a045ee-93c2-4be2-bd4a-6a235ae156ae', 'All-Purpose Flour', 500, 'g', 'pantry', 1000, '169762'),
  ('a9a045ee-93c2-4be2-bd4a-6a235ae156ae', 'Granulated Sugar', 300, 'g', 'pantry', 1000, '169655'),
  ('a9a045ee-93c2-4be2-bd4a-6a235ae156ae', 'Salt', 450, 'g', 'pantry', 500, '172670'),
  ('a9a045ee-93c2-4be2-bd4a-6a235ae156ae', 'Olive Oil', 250, 'ml', 'pantry', 500, '171413'),
  ('a9a045ee-93c2-4be2-bd4a-6a235ae156ae', 'Butter', 150, 'g', 'dairy', 250, '173430'),
  ('a9a045ee-93c2-4be2-bd4a-6a235ae156ae', 'Eggs', 6, 'piece', 'dairy', 12, '173424'),
  ('a9a045ee-93c2-4be2-bd4a-6a235ae156ae', 'Milk', 800, 'ml', 'dairy', 2000, '171265'),
  ('a9a045ee-93c2-4be2-bd4a-6a235ae156ae', 'Chicken Breast', 400, 'g', 'meat', 1000, '171477'),
  ('a9a045ee-93c2-4be2-bd4a-6a235ae156ae', 'Tomatoes', 3, 'piece', 'produce', 10, '170457'),
  ('a9a045ee-93c2-4be2-bd4a-6a235ae156ae', 'Onions', 2, 'piece', 'produce', 5, '170000'),
  ('a9a045ee-93c2-4be2-bd4a-6a235ae156ae', 'Garlic', 8, 'clove', 'produce', 20, '169230'),
  ('a9a045ee-93c2-4be2-bd4a-6a235ae156ae', 'Pasta', 150, 'g', 'pantry', 500, '169736'),
  ('a9a045ee-93c2-4be2-bd4a-6a235ae156ae', 'Rice', 800, 'g', 'pantry', 2000, '168878');

SELECT 'Sample pantry items added!' as status;

-- View pantry items
SELECT 
  name,
  quantity,
  unit,
  category,
  ROUND((quantity / NULLIF(typical_quantity, 0) * 100)::numeric, 0) as stock_percent
FROM pantry_items
WHERE user_id = 'a9a045ee-93c2-4be2-bd4a-6a235ae156ae'
ORDER BY category, name;

-- =====================================================
-- SAMPLE RECIPE: Classic Pancakes
-- =====================================================
DO $$
DECLARE
  recipe_uuid uuid := gen_random_uuid();
  version_uuid uuid := gen_random_uuid();
BEGIN
  -- Insert recipe
  INSERT INTO recipes (id, user_id, title, description, source_url, source_type)
  VALUES (
    recipe_uuid,
    'a9a045ee-93c2-4be2-bd4a-6a235ae156ae',
    'Classic Pancakes',
    'Fluffy homemade pancakes perfect for breakfast',
    'https://example.com/pancakes',
    'web'
  );

  -- Add recipe version
  INSERT INTO recipe_versions (
    id, 
    recipe_id, 
    version_number, 
    version_notes, 
    ingredients, 
    instructions,
    servings, 
    prep_time_minutes, 
    cook_time_minutes, 
    nutrition_per_serving, 
    portion_description
  ) VALUES (
    version_uuid,
    recipe_uuid,
    1,
    'Original recipe',
    '[
      {"name": "all-purpose flour", "original_quantity": 1.5, "original_unit": "cup", "metric_quantity": 180, "metric_unit": "g", "imperial_quantity": 1.5, "imperial_unit": "cup"},
      {"name": "milk", "original_quantity": 1.25, "original_unit": "cup", "metric_quantity": 300, "metric_unit": "ml", "imperial_quantity": 1.25, "imperial_unit": "cup"},
      {"name": "eggs", "original_quantity": 1, "original_unit": "piece", "metric_quantity": 1, "metric_unit": "piece", "imperial_quantity": 1, "imperial_unit": "piece"},
      {"name": "butter", "original_quantity": 2, "original_unit": "tbsp", "metric_quantity": 28, "metric_unit": "g", "imperial_quantity": 2, "imperial_unit": "tbsp"},
      {"name": "granulated sugar", "original_quantity": 2, "original_unit": "tbsp", "metric_quantity": 25, "metric_unit": "g", "imperial_quantity": 2, "imperial_unit": "tbsp"}
    ]'::jsonb,
    '[
      {"step_number": 1, "text": "Mix flour, sugar, and salt in a large bowl"},
      {"step_number": 2, "text": "Whisk together milk, egg, and melted butter in another bowl"},
      {"step_number": 3, "text": "Pour wet ingredients into dry ingredients and mix until just combined"},
      {"step_number": 4, "text": "Heat a lightly oiled griddle over medium-high heat"},
      {"step_number": 5, "text": "Pour batter onto griddle and cook until bubbles form, then flip"}
    ]'::jsonb,
    4,
    10,
    15,
    '{"calories": 220, "protein": 6, "carbs": 35, "fat": 6, "fiber": 1}'::jsonb,
    '1 serving = 2 medium pancakes (approx 150g)'
  );

  -- Update recipe to point to active version
  UPDATE recipes 
  SET active_version_id = version_uuid
  WHERE id = recipe_uuid;
  
  RAISE NOTICE 'Recipe created with ID: %', recipe_uuid;
  RAISE NOTICE 'Version created with ID: %', version_uuid;
END $$;

SELECT 'Sample recipe added!' as status;

-- View the recipe
SELECT 
  r.title,
  rv.version_number,
  rv.servings,
  rv.prep_time_minutes,
  rv.cook_time_minutes,
  rv.nutrition_per_serving
FROM recipes r
JOIN recipe_versions rv ON rv.id = r.active_version_id
WHERE r.user_id = 'a9a045ee-93c2-4be2-bd4a-6a235ae156ae';

-- =====================================================
-- TEST DATABASE FUNCTIONS
-- =====================================================

-- 1. Get low stock items (should show items below 20% of typical quantity)
SELECT '=== LOW STOCK ITEMS ===' as test;
SELECT 
  item_name,
  current_quantity,
  unit,
  typical_quantity,
  ROUND(percentage_remaining::numeric, 0) as stock_percent
FROM get_low_stock_items('a9a045ee-93c2-4be2-bd4a-6a235ae156ae')
ORDER BY percentage_remaining;

-- 2. Test fuzzy ingredient matching (with intentional typo)
SELECT '=== FUZZY MATCHING TEST ===' as test;
SELECT 
  pantry_item_name,
  ROUND((similarity_score * 100)::numeric, 0) as match_percent
FROM find_pantry_match('a9a045ee-93c2-4be2-bd4a-6a235ae156ae', 'tomatoe')
ORDER BY similarity_score DESC;

-- 3. Auto-add low stock items to shopping list
SELECT '=== AUTO-ADD TO SHOPPING LIST ===' as test;
SELECT auto_add_low_stock_to_shopping_list('a9a045ee-93c2-4be2-bd4a-6a235ae156ae') as items_added;

-- 4. View shopping list
SELECT '=== SHOPPING LIST ===' as test;
SELECT 
  sli.name,
  sli.quantity,
  sli.unit,
  sli.category,
  sli.source_label,
  sli.checked
FROM shopping_list_items sli
JOIN shopping_lists sl ON sl.id = sli.list_id
WHERE sl.user_id = 'a9a045ee-93c2-4be2-bd4a-6a235ae156ae'
ORDER BY sli.category, sli.name;

-- 5. Test recipe ingredient deduction
SELECT '=== DEDUCT RECIPE FROM PANTRY ===' as test;
DO $$
DECLARE
  v_version_id uuid;
  v_result jsonb;
BEGIN
  -- Get the recipe version ID
  SELECT rv.id INTO v_version_id
  FROM recipe_versions rv
  JOIN recipes r ON r.id = rv.recipe_id
  WHERE r.user_id = 'a9a045ee-93c2-4be2-bd4a-6a235ae156ae'
  LIMIT 1;
  
  -- Deduct ingredients
  SELECT deduct_recipe_from_pantry(
    'a9a045ee-93c2-4be2-bd4a-6a235ae156ae',
    v_version_id,
    1.0  -- Cook 1 serving
  ) INTO v_result;
  
  RAISE NOTICE 'Deduction result: %', v_result;
END $$;

-- 6. View updated pantry quantities
SELECT '=== PANTRY AFTER COOKING ===' as test;
SELECT 
  name,
  quantity,
  unit,
  category
FROM pantry_items
WHERE user_id = 'a9a045ee-93c2-4be2-bd4a-6a235ae156ae'
ORDER BY category, name;

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT '=== SETUP COMPLETE! ===' as message;
SELECT 
  (SELECT COUNT(*) FROM pantry_items WHERE user_id = 'a9a045ee-93c2-4be2-bd4a-6a235ae156ae') as pantry_items,
  (SELECT COUNT(*) FROM recipes WHERE user_id = 'a9a045ee-93c2-4be2-bd4a-6a235ae156ae') as recipes,
  (SELECT COUNT(*) FROM recipe_versions WHERE created_by = 'a9a045ee-93c2-4be2-bd4a-6a235ae156ae') as recipe_versions,
  (SELECT COUNT(*) FROM shopping_list_items sli JOIN shopping_lists sl ON sl.id = sli.list_id WHERE sl.user_id = 'a9a045ee-93c2-4be2-bd4a-6a235ae156ae') as shopping_list_items;