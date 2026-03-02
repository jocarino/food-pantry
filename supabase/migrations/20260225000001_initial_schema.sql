-- Migration 1: Initial Schema
-- Creates all core tables for the Food Pantry Management App

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy string matching

-- =====================================================
-- USER PROFILES
-- =====================================================
-- Extends Supabase auth.users with app-specific preferences
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  unit_system TEXT DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
  low_stock_threshold_percent INTEGER DEFAULT 20 CHECK (low_stock_threshold_percent >= 0 AND low_stock_threshold_percent <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_unit_system ON user_profiles(unit_system);

-- =====================================================
-- UNITS TABLE
-- =====================================================
-- Standardized units for measurements
CREATE TABLE units (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plural_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('weight', 'volume', 'count')),
  system TEXT NOT NULL CHECK (system IN ('metric', 'imperial', 'universal')),
  base_unit_multiplier DECIMAL(20,10), -- For conversion to base unit (g for weight, ml for volume, NULL for count)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_units_type ON units(type);
CREATE INDEX idx_units_system ON units(system);

-- =====================================================
-- RECIPES
-- =====================================================
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  source_type TEXT CHECK (source_type IN ('web', 'tiktok', 'instagram', 'manual')),
  active_version_id UUID, -- Foreign key to recipe_versions (set after version creation)
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_updated_at ON recipes(updated_at DESC);
CREATE INDEX idx_recipes_title ON recipes USING gin(to_tsvector('english', title));

-- =====================================================
-- RECIPE VERSIONS
-- =====================================================
CREATE TABLE recipe_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  version_notes TEXT,
  
  -- Recipe content with dual unit support
  -- ingredients structure: [{
  --   name: string,
  --   original_quantity: number, original_unit: string,
  --   metric_quantity: number, metric_unit: string,
  --   imperial_quantity: number, imperial_unit: string,
  --   usda_food_id: string (optional)
  -- }]
  ingredients JSONB NOT NULL,
  
  -- instructions structure: [{ step_number: number, text: string }]
  instructions JSONB NOT NULL,
  
  servings DECIMAL(10,2) NOT NULL CHECK (servings > 0),
  prep_time_minutes INTEGER CHECK (prep_time_minutes >= 0),
  cook_time_minutes INTEGER CHECK (cook_time_minutes >= 0),
  
  -- Nutritional info per serving
  -- structure: { calories: number, protein: number, carbs: number, fat: number, fiber: number }
  nutrition_per_serving JSONB,
  portion_description TEXT, -- e.g., "1 serving = 250g"
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(recipe_id, version_number)
);

CREATE INDEX idx_recipe_versions_recipe_id ON recipe_versions(recipe_id);
CREATE INDEX idx_recipe_versions_created_at ON recipe_versions(created_at DESC);
CREATE INDEX idx_recipe_versions_version_number ON recipe_versions(recipe_id, version_number DESC);

-- =====================================================
-- PANTRY ITEMS
-- =====================================================
CREATE TABLE pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit TEXT NOT NULL,
  category TEXT CHECK (category IN ('produce', 'dairy', 'meat', 'pantry', 'frozen', 'other')),
  typical_quantity DECIMAL(10,2) CHECK (typical_quantity >= 0), -- For percentage-based alerts
  usda_food_id TEXT, -- For nutritional linking
  notes TEXT,
  expiration_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX idx_pantry_items_category ON pantry_items(category);
CREATE INDEX idx_pantry_items_name ON pantry_items USING gin(to_tsvector('english', name));
CREATE INDEX idx_pantry_items_expiration ON pantry_items(expiration_date) WHERE expiration_date IS NOT NULL;

-- =====================================================
-- PANTRY USAGE HISTORY
-- =====================================================
CREATE TABLE pantry_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pantry_item_id UUID REFERENCES pantry_items(id) ON DELETE CASCADE NOT NULL,
  quantity_change DECIMAL(10,2) NOT NULL, -- Negative for usage, positive for additions
  reason TEXT CHECK (reason IN ('recipe_cooked', 'manual_adjustment', 'purchase', 'waste', 'expired')),
  recipe_version_id UUID REFERENCES recipe_versions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pantry_usage_pantry_item ON pantry_usage_history(pantry_item_id);
CREATE INDEX idx_pantry_usage_created_at ON pantry_usage_history(created_at DESC);
CREATE INDEX idx_pantry_usage_recipe ON pantry_usage_history(recipe_version_id) WHERE recipe_version_id IS NOT NULL;

-- =====================================================
-- SHOPPING LISTS
-- =====================================================
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Shopping List',
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX idx_shopping_lists_archived ON shopping_lists(is_archived);

-- =====================================================
-- SHOPPING LIST ITEMS
-- =====================================================
CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(10,2),
  unit TEXT,
  category TEXT CHECK (category IN ('produce', 'dairy', 'meat', 'pantry', 'frozen', 'other')),
  checked BOOLEAN DEFAULT FALSE,
  source TEXT CHECK (source IN ('manual', 'recipe', 'pantry_alert')),
  source_id UUID, -- Reference to recipe_id or pantry_item_id
  source_label TEXT, -- Display label: 'Low Stock', 'From Recipe: [Recipe Name]'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shopping_list_items_list_id ON shopping_list_items(list_id);
CREATE INDEX idx_shopping_list_items_checked ON shopping_list_items(checked);
CREATE INDEX idx_shopping_list_items_source ON shopping_list_items(source);

-- =====================================================
-- SHARED LISTS
-- =====================================================
CREATE TABLE shared_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission TEXT DEFAULT 'edit' CHECK (permission IN ('view', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(list_id, shared_with_user_id)
);

CREATE INDEX idx_shared_lists_user_id ON shared_lists(shared_with_user_id);
CREATE INDEX idx_shared_lists_list_id ON shared_lists(list_id);

-- =====================================================
-- MACRO LOGS
-- =====================================================
CREATE TABLE macro_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_version_id UUID REFERENCES recipe_versions(id) ON DELETE SET NULL,
  servings_consumed DECIMAL(10,2) NOT NULL CHECK (servings_consumed > 0),
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Calculated nutrition (denormalized for historical accuracy)
  -- structure: { calories: number, protein: number, carbs: number, fat: number, fiber: number }
  calculated_nutrition JSONB NOT NULL,
  
  notes TEXT
);

CREATE INDEX idx_macro_logs_user_id ON macro_logs(user_id);
CREATE INDEX idx_macro_logs_logged_at ON macro_logs(logged_at DESC);
CREATE INDEX idx_macro_logs_recipe ON macro_logs(recipe_version_id) WHERE recipe_version_id IS NOT NULL;

-- =====================================================
-- INGREDIENT MATCH CONFIRMATIONS
-- =====================================================
-- Stores user confirmations for fuzzy ingredient matches
CREATE TABLE ingredient_match_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_ingredient_name TEXT NOT NULL,
  pantry_item_id UUID REFERENCES pantry_items(id) ON DELETE CASCADE NOT NULL,
  confirmed BOOLEAN NOT NULL, -- true = user confirmed match, false = user rejected match
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, recipe_ingredient_name, pantry_item_id)
);

CREATE INDEX idx_ingredient_match_user ON ingredient_match_confirmations(user_id);
CREATE INDEX idx_ingredient_match_ingredient ON ingredient_match_confirmations(recipe_ingredient_name);

-- =====================================================
-- LOW STOCK ALERTS
-- =====================================================
-- Tracks when low stock alerts were generated
CREATE TABLE low_stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pantry_item_id UUID REFERENCES pantry_items(id) ON DELETE CASCADE NOT NULL,
  alerted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT FALSE,
  auto_added_to_shopping_list BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_low_stock_alerts_user ON low_stock_alerts(user_id);
CREATE INDEX idx_low_stock_alerts_dismissed ON low_stock_alerts(dismissed);
CREATE INDEX idx_low_stock_alerts_alerted_at ON low_stock_alerts(alerted_at DESC);
CREATE INDEX idx_low_stock_alerts_pantry_item ON low_stock_alerts(pantry_item_id, alerted_at DESC);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE user_profiles IS 'Extended user preferences beyond Supabase auth.users';
COMMENT ON TABLE units IS 'Standardized measurement units for recipes and pantry';
COMMENT ON TABLE recipes IS 'User recipes with metadata and versioning support';
COMMENT ON TABLE recipe_versions IS 'Recipe version history with dual unit system support';
COMMENT ON TABLE pantry_items IS 'User pantry inventory with quantity tracking';
COMMENT ON TABLE pantry_usage_history IS 'Historical tracking of pantry item changes';
COMMENT ON TABLE shopping_lists IS 'User shopping lists with sharing capability';
COMMENT ON TABLE shopping_list_items IS 'Individual items in shopping lists';
COMMENT ON TABLE shared_lists IS 'Shopping list sharing permissions';
COMMENT ON TABLE macro_logs IS 'Nutritional tracking logs';
COMMENT ON TABLE ingredient_match_confirmations IS 'User confirmations for fuzzy ingredient matching';
COMMENT ON TABLE low_stock_alerts IS 'Low stock alert tracking';
