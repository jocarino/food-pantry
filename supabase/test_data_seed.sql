-- Test Data Seed for Recipe Pantry Deduction Workflow Testing
-- Creates test recipes and pantry items with sufficient quantities

-- =====================================================
-- CREATE TEST RECIPE: Test Pancakes
-- =====================================================

-- Insert recipe
INSERT INTO recipes (
  id,
  user_id,
  title,
  description,
  created_at,
  updated_at
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Test Pancakes',
  'Simple pancakes recipe for testing the cook workflow',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Insert recipe version with ingredients
INSERT INTO recipe_versions (
  id,
  recipe_id,
  version_number,
  servings,
  prep_time_minutes,
  cook_time_minutes,
  ingredients,
  instructions,
  created_at,
  updated_at
) VALUES (
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  1,
  4,
  10,
  15,
  '[
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
  ]'::jsonb,
  '[
    {"step_number": 1, "text": "Mix dry ingredients"},
    {"step_number": 2, "text": "Add wet ingredients"},
    {"step_number": 3, "text": "Cook on griddle"}
  ]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  servings = EXCLUDED.servings,
  prep_time_minutes = EXCLUDED.prep_time_minutes,
  cook_time_minutes = EXCLUDED.cook_time_minutes,
  ingredients = EXCLUDED.ingredients,
  instructions = EXCLUDED.instructions,
  updated_at = NOW();

-- Set as active version
UPDATE recipes 
SET active_version_id = '10000000-0000-0000-0000-000000000002',
    updated_at = NOW()
WHERE id = '10000000-0000-0000-0000-000000000001';

-- =====================================================
-- CREATE PANTRY ITEMS (with sufficient quantities)
-- =====================================================

-- Delete existing test pantry items to avoid duplicates
DELETE FROM pantry_items 
WHERE user_id = '00000000-0000-0000-0000-000000000001'
  AND name IN ('flour', 'milk', 'eggs', 'sugar', 'vanilla extract', 'butter');

-- Exact Match Items with plenty of stock
INSERT INTO pantry_items (
  user_id,
  name,
  quantity,
  unit,
  category,
  typical_quantity,
  created_at,
  updated_at
) VALUES 
  -- flour: 1000g (enough for 4x recipe)
  (
    '00000000-0000-0000-0000-000000000001',
    'flour',
    1000,
    'g',
    'pantry',
    1000,
    NOW(),
    NOW()
  ),
  -- milk: 1500ml (enough for 3x recipe)
  (
    '00000000-0000-0000-0000-000000000001',
    'milk',
    1500,
    'ml',
    'dairy',
    2000,
    NOW(),
    NOW()
  ),
  -- eggs: 12 whole (enough for 6x recipe)
  (
    '00000000-0000-0000-0000-000000000001',
    'eggs',
    12,
    'whole',
    'dairy',
    12,
    NOW(),
    NOW()
  ),
  -- sugar: 200g (enough for 4x recipe)
  (
    '00000000-0000-0000-0000-000000000001',
    'sugar',
    200,
    'g',
    'pantry',
    500,
    NOW(),
    NOW()
  ),
  -- vanilla extract: 50ml (plenty for 10x recipe)
  (
    '00000000-0000-0000-0000-000000000001',
    'vanilla extract',
    50,
    'ml',
    'pantry',
    50,
    NOW(),
    NOW()
  ),
  -- butter: for low stock testing
  (
    '00000000-0000-0000-0000-000000000001',
    'butter',
    50,
    'g',
    'dairy',
    200,
    NOW(),
    NOW()
  );

SELECT 'Test data seeded successfully!' as message;
SELECT 'Recipe: Test Pancakes (4 servings)' as recipe_info;
SELECT 'Pantry items created with sufficient quantities for testing' as pantry_info;
