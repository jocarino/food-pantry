-- Migration 4: Functions and Triggers
-- Database functions for business logic and automation

-- =====================================================
-- TRIGGER: Auto-update updated_at column
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pantry_items_updated_at
  BEFORE UPDATE ON pantry_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_list_items_updated_at
  BEFORE UPDATE ON shopping_list_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Auto-increment recipe version number
-- =====================================================
CREATE OR REPLACE FUNCTION set_recipe_version_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.version_number IS NULL THEN
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO NEW.version_number
    FROM recipe_versions
    WHERE recipe_id = NEW.recipe_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_version_number
  BEFORE INSERT ON recipe_versions
  FOR EACH ROW EXECUTE FUNCTION set_recipe_version_number();

-- =====================================================
-- TRIGGER: Auto-create user profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- =====================================================
-- FUNCTION: Find fuzzy pantry matches
-- =====================================================
CREATE OR REPLACE FUNCTION find_pantry_match(
  p_user_id UUID,
  p_ingredient_name TEXT
)
RETURNS TABLE (
  pantry_item_id UUID,
  pantry_item_name TEXT,
  similarity_score DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    name,
    similarity(LOWER(name), LOWER(p_ingredient_name))::DOUBLE PRECISION as score
  FROM pantry_items
  WHERE user_id = p_user_id
    AND similarity(LOWER(name), LOWER(p_ingredient_name)) > 0.3
  ORDER BY score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Deduct recipe ingredients from pantry
-- =====================================================
CREATE OR REPLACE FUNCTION deduct_recipe_from_pantry(
  p_user_id UUID,
  p_recipe_version_id UUID,
  p_servings DECIMAL
)
RETURNS JSONB AS $$
DECLARE
  v_ingredients JSONB;
  v_ingredient JSONB;
  v_pantry_item_id UUID;
  v_result JSONB := '{"deducted": [], "needs_confirmation": [], "not_found": []}'::JSONB;
  v_unit_system TEXT;
  v_quantity DECIMAL;
  v_unit TEXT;
  v_ingredient_name TEXT;
BEGIN
  -- Get user's preferred unit system
  SELECT unit_system INTO v_unit_system
  FROM user_profiles WHERE id = p_user_id;
  
  -- Default to metric if no preference set
  IF v_unit_system IS NULL THEN
    v_unit_system := 'metric';
  END IF;
  
  -- Get ingredients from recipe version
  SELECT ingredients INTO v_ingredients
  FROM recipe_versions
  WHERE id = p_recipe_version_id;
  
  -- Loop through each ingredient
  FOR v_ingredient IN SELECT * FROM jsonb_array_elements(v_ingredients)
  LOOP
    v_ingredient_name := v_ingredient->>'name';
    
    -- Get quantity based on user's unit preference
    IF v_unit_system = 'metric' THEN
      v_quantity := (v_ingredient->>'metric_quantity')::DECIMAL;
      v_unit := v_ingredient->>'metric_unit';
    ELSE
      v_quantity := (v_ingredient->>'imperial_quantity')::DECIMAL;
      v_unit := v_ingredient->>'imperial_unit';
    END IF;
    
    -- Try exact match first (case-insensitive)
    SELECT id INTO v_pantry_item_id
    FROM pantry_items
    WHERE user_id = p_user_id
      AND LOWER(TRIM(name)) = LOWER(TRIM(v_ingredient_name))
    LIMIT 1;
    
    IF v_pantry_item_id IS NOT NULL THEN
      -- Exact match found - deduct
      UPDATE pantry_items
      SET quantity = GREATEST(0, quantity - (v_quantity * p_servings))
      WHERE id = v_pantry_item_id;
      
      -- Log usage
      INSERT INTO pantry_usage_history (
        pantry_item_id, quantity_change, reason, recipe_version_id
      ) VALUES (
        v_pantry_item_id, 
        -(v_quantity * p_servings), 
        'recipe_cooked', 
        p_recipe_version_id
      );
      
      v_result := jsonb_set(
        v_result, 
        '{deducted}', 
        (v_result->'deducted') || jsonb_build_object(
          'ingredient_name', v_ingredient_name,
          'pantry_item_id', v_pantry_item_id,
          'quantity_deducted', v_quantity * p_servings,
          'unit', v_unit,
          'match_type', 'exact'
        )
      );
    ELSE
      -- No exact match - check for previous user confirmation
      SELECT pantry_item_id INTO v_pantry_item_id
      FROM ingredient_match_confirmations
      WHERE user_id = p_user_id
        AND LOWER(TRIM(recipe_ingredient_name)) = LOWER(TRIM(v_ingredient_name))
        AND confirmed = true
      LIMIT 1;
      
      IF v_pantry_item_id IS NOT NULL THEN
        -- User previously confirmed this match - use it
        UPDATE pantry_items
        SET quantity = GREATEST(0, quantity - (v_quantity * p_servings))
        WHERE id = v_pantry_item_id;
        
        INSERT INTO pantry_usage_history (
          pantry_item_id, quantity_change, reason, recipe_version_id
        ) VALUES (
          v_pantry_item_id, 
          -(v_quantity * p_servings), 
          'recipe_cooked', 
          p_recipe_version_id
        );
        
        v_result := jsonb_set(
          v_result, 
          '{deducted}', 
          (v_result->'deducted') || jsonb_build_object(
            'ingredient_name', v_ingredient_name,
            'pantry_item_id', v_pantry_item_id,
            'quantity_deducted', v_quantity * p_servings,
            'unit', v_unit,
            'match_type', 'confirmed_fuzzy'
          )
        );
      ELSE
        -- No confirmed match - return for user confirmation or add to shopping list
        v_result := jsonb_set(
          v_result,
          '{needs_confirmation}',
          (v_result->'needs_confirmation') || jsonb_build_object(
            'ingredient_name', v_ingredient_name,
            'quantity', v_quantity * p_servings,
            'unit', v_unit
          )
        );
      END IF;
    END IF;
  END LOOP;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Get low stock items
-- =====================================================
CREATE OR REPLACE FUNCTION get_low_stock_items(p_user_id UUID)
RETURNS TABLE (
  item_id UUID,
  item_name TEXT,
  current_quantity DECIMAL,
  typical_quantity DECIMAL,
  unit TEXT,
  percentage_remaining DECIMAL,
  category TEXT
) AS $$
DECLARE
  v_threshold INTEGER;
BEGIN
  -- Get user's low stock threshold
  SELECT low_stock_threshold_percent INTO v_threshold
  FROM user_profiles
  WHERE id = p_user_id;
  
  -- Default to 20% if not set
  IF v_threshold IS NULL THEN
    v_threshold := 20;
  END IF;
  
  RETURN QUERY
  SELECT 
    pi.id,
    pi.name,
    pi.quantity,
    pi.typical_quantity,
    pi.unit,
    CASE 
      WHEN pi.typical_quantity > 0 THEN ROUND((pi.quantity / pi.typical_quantity * 100)::NUMERIC, 2)
      ELSE 100
    END as percentage_remaining,
    pi.category
  FROM pantry_items pi
  WHERE pi.user_id = p_user_id
    AND pi.typical_quantity IS NOT NULL
    AND pi.typical_quantity > 0
    AND (pi.quantity / pi.typical_quantity * 100) < v_threshold
  ORDER BY (pi.quantity / pi.typical_quantity * 100) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Auto-add low stock items to shopping list
-- =====================================================
CREATE OR REPLACE FUNCTION auto_add_low_stock_to_shopping_list(
  p_user_id UUID
)
RETURNS INT AS $$
DECLARE
  v_list_id UUID;
  v_item RECORD;
  v_count INT := 0;
  v_needed_quantity DECIMAL;
BEGIN
  -- Get or create default shopping list
  SELECT id INTO v_list_id
  FROM shopping_lists
  WHERE user_id = p_user_id
    AND is_archived = false
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_list_id IS NULL THEN
    INSERT INTO shopping_lists (user_id, name)
    VALUES (p_user_id, 'Shopping List')
    RETURNING id INTO v_list_id;
  END IF;
  
  -- Add low stock items that aren't already in the list
  FOR v_item IN 
    SELECT * FROM get_low_stock_items(p_user_id)
  LOOP
    -- Check if item already exists in shopping list (unchecked)
    IF NOT EXISTS (
      SELECT 1 FROM shopping_list_items
      WHERE list_id = v_list_id
        AND LOWER(TRIM(name)) = LOWER(TRIM(v_item.item_name))
        AND checked = false
    ) THEN
      -- Calculate needed quantity to reach typical quantity
      v_needed_quantity := GREATEST(0, v_item.typical_quantity - v_item.current_quantity);
      
      INSERT INTO shopping_list_items (
        list_id, 
        name, 
        quantity, 
        unit, 
        category, 
        source, 
        source_id, 
        source_label
      ) VALUES (
        v_list_id,
        v_item.item_name,
        v_needed_quantity,
        v_item.unit,
        v_item.category,
        'pantry_alert',
        v_item.item_id,
        'Low Stock'
      );
      
      -- Create or update alert
      -- Check if alert was already created today
      IF NOT EXISTS (
        SELECT 1 FROM low_stock_alerts
        WHERE pantry_item_id = v_item.item_id
          AND alerted_at::date = CURRENT_DATE
      ) THEN
        INSERT INTO low_stock_alerts (
          user_id, 
          pantry_item_id, 
          auto_added_to_shopping_list
        ) VALUES (
          p_user_id,
          v_item.item_id,
          true
        );
      END IF;
      
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Add recipe ingredients to shopping list
-- =====================================================
CREATE OR REPLACE FUNCTION add_recipe_to_shopping_list(
  p_user_id UUID,
  p_recipe_version_id UUID,
  p_servings DECIMAL DEFAULT 1
)
RETURNS INT AS $$
DECLARE
  v_list_id UUID;
  v_recipe_title TEXT;
  v_ingredients JSONB;
  v_ingredient JSONB;
  v_count INT := 0;
  v_unit_system TEXT;
  v_quantity DECIMAL;
  v_unit TEXT;
BEGIN
  -- Get or create default shopping list
  SELECT id INTO v_list_id
  FROM shopping_lists
  WHERE user_id = p_user_id
    AND is_archived = false
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_list_id IS NULL THEN
    INSERT INTO shopping_lists (user_id, name)
    VALUES (p_user_id, 'Shopping List')
    RETURNING id INTO v_list_id;
  END IF;
  
  -- Get recipe title and ingredients
  SELECT r.title, rv.ingredients
  INTO v_recipe_title, v_ingredients
  FROM recipe_versions rv
  JOIN recipes r ON r.id = rv.recipe_id
  WHERE rv.id = p_recipe_version_id;
  
  -- Get user's preferred unit system
  SELECT unit_system INTO v_unit_system
  FROM user_profiles WHERE id = p_user_id;
  
  IF v_unit_system IS NULL THEN
    v_unit_system := 'metric';
  END IF;
  
  -- Add each ingredient to shopping list
  FOR v_ingredient IN SELECT * FROM jsonb_array_elements(v_ingredients)
  LOOP
    -- Get quantity based on user's unit preference
    IF v_unit_system = 'metric' THEN
      v_quantity := (v_ingredient->>'metric_quantity')::DECIMAL * p_servings;
      v_unit := v_ingredient->>'metric_unit';
    ELSE
      v_quantity := (v_ingredient->>'imperial_quantity')::DECIMAL * p_servings;
      v_unit := v_ingredient->>'imperial_unit';
    END IF;
    
    INSERT INTO shopping_list_items (
      list_id,
      name,
      suggested_quantity,
      suggested_unit,
      source,
      source_id,
      source_label
    ) VALUES (
      v_list_id,
      v_ingredient->>'name',
      v_quantity,
      v_unit,
      'recipe',
      p_recipe_version_id,
      'From Recipe: ' || v_recipe_title
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Calculate total macros for a date range
-- =====================================================
CREATE OR REPLACE FUNCTION get_macro_totals(
  p_user_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  total_calories DECIMAL,
  total_protein DECIMAL,
  total_carbs DECIMAL,
  total_fat DECIMAL,
  total_fiber DECIMAL,
  meal_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM((calculated_nutrition->>'calories')::DECIMAL), 0) as total_calories,
    COALESCE(SUM((calculated_nutrition->>'protein')::DECIMAL), 0) as total_protein,
    COALESCE(SUM((calculated_nutrition->>'carbs')::DECIMAL), 0) as total_carbs,
    COALESCE(SUM((calculated_nutrition->>'fat')::DECIMAL), 0) as total_fat,
    COALESCE(SUM((calculated_nutrition->>'fiber')::DECIMAL), 0) as total_fiber,
    COUNT(*)::INTEGER as meal_count
  FROM macro_logs
  WHERE user_id = p_user_id
    AND logged_at >= p_start_date
    AND logged_at <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at timestamp on row modification';
COMMENT ON FUNCTION set_recipe_version_number() IS 'Automatically sets the next version number for recipe versions';
COMMENT ON FUNCTION create_user_profile() IS 'Automatically creates a user profile when a new user signs up';
COMMENT ON FUNCTION find_pantry_match(UUID, TEXT) IS 'Finds fuzzy matches for ingredient names in pantry items';
COMMENT ON FUNCTION deduct_recipe_from_pantry(UUID, UUID, DECIMAL) IS 'Deducts recipe ingredients from pantry and returns results';
COMMENT ON FUNCTION get_low_stock_items(UUID) IS 'Returns list of pantry items below low stock threshold';
COMMENT ON FUNCTION auto_add_low_stock_to_shopping_list(UUID) IS 'Automatically adds low stock items to shopping list';
COMMENT ON FUNCTION add_recipe_to_shopping_list(UUID, UUID, DECIMAL) IS 'Adds all recipe ingredients to shopping list';
COMMENT ON FUNCTION get_macro_totals(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Calculates total macros for a date range';
