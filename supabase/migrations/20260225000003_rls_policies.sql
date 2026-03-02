-- Migration 3: Row Level Security (RLS) Policies
-- Ensures users can only access their own data, with special rules for shared lists

-- =====================================================
-- USER PROFILES
-- =====================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- UNITS (Public Read-Only)
-- =====================================================
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Units are publicly readable"
  ON units FOR SELECT
  USING (true);

-- =====================================================
-- RECIPES
-- =====================================================
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- RECIPE VERSIONS
-- =====================================================
ALTER TABLE recipe_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recipe versions"
  ON recipe_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_versions.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own recipe versions"
  ON recipe_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_versions.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own recipe versions"
  ON recipe_versions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_versions.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own recipe versions"
  ON recipe_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_versions.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );

-- =====================================================
-- PANTRY ITEMS
-- =====================================================
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pantry items"
  ON pantry_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pantry items"
  ON pantry_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pantry items"
  ON pantry_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pantry items"
  ON pantry_items FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- PANTRY USAGE HISTORY
-- =====================================================
ALTER TABLE pantry_usage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pantry usage history"
  ON pantry_usage_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pantry_items
      WHERE pantry_items.id = pantry_usage_history.pantry_item_id
        AND pantry_items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own pantry usage history"
  ON pantry_usage_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pantry_items
      WHERE pantry_items.id = pantry_usage_history.pantry_item_id
        AND pantry_items.user_id = auth.uid()
    )
  );

-- =====================================================
-- SHOPPING LISTS
-- =====================================================
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own and shared shopping lists"
  ON shopping_lists FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM shared_lists
      WHERE shared_lists.list_id = shopping_lists.id
        AND shared_lists.shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own shopping lists"
  ON shopping_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping lists"
  ON shopping_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping lists"
  ON shopping_lists FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- SHOPPING LIST ITEMS
-- =====================================================
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items in accessible lists"
  ON shopping_list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_list_items.list_id
        AND (
          shopping_lists.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM shared_lists
            WHERE shared_lists.list_id = shopping_lists.id
              AND shared_lists.shared_with_user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Users can insert items in own lists"
  ON shopping_list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_list_items.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in lists with edit permission"
  ON shopping_list_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_list_items.list_id
        AND (
          shopping_lists.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM shared_lists
            WHERE shared_lists.list_id = shopping_lists.id
              AND shared_lists.shared_with_user_id = auth.uid()
              AND shared_lists.permission = 'edit'
          )
        )
    )
  );

CREATE POLICY "Users can delete items in lists with edit permission"
  ON shopping_list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_list_items.list_id
        AND (
          shopping_lists.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM shared_lists
            WHERE shared_lists.list_id = shopping_lists.id
              AND shared_lists.shared_with_user_id = auth.uid()
              AND shared_lists.permission = 'edit'
          )
        )
    )
  );

-- =====================================================
-- SHARED LISTS
-- =====================================================
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "List owners can view shares"
  ON shared_lists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shared_lists.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Shared users can view their shares"
  ON shared_lists FOR SELECT
  USING (auth.uid() = shared_with_user_id);

CREATE POLICY "List owners can share their lists"
  ON shared_lists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shared_lists.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "List owners can update shares"
  ON shared_lists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shared_lists.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "List owners can delete shares"
  ON shared_lists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shared_lists.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );

-- =====================================================
-- MACRO LOGS
-- =====================================================
ALTER TABLE macro_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own macro logs"
  ON macro_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own macro logs"
  ON macro_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own macro logs"
  ON macro_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own macro logs"
  ON macro_logs FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- INGREDIENT MATCH CONFIRMATIONS
-- =====================================================
ALTER TABLE ingredient_match_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ingredient confirmations"
  ON ingredient_match_confirmations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ingredient confirmations"
  ON ingredient_match_confirmations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ingredient confirmations"
  ON ingredient_match_confirmations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ingredient confirmations"
  ON ingredient_match_confirmations FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- LOW STOCK ALERTS
-- =====================================================
ALTER TABLE low_stock_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own low stock alerts"
  ON low_stock_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own low stock alerts"
  ON low_stock_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own low stock alerts"
  ON low_stock_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own low stock alerts"
  ON low_stock_alerts FOR DELETE
  USING (auth.uid() = user_id);
