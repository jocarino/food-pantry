export interface UserProfile {
  id: string;
  display_name: string | null;
  unit_system: 'metric' | 'imperial';
  low_stock_threshold_percent: number;
  created_at: string;
  updated_at: string;
}

export interface PantryItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'other' | null;
  typical_quantity: number | null;
  usda_food_id: string | null;
  notes: string | null;
  expiration_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  source_url: string | null;
  source_type: 'web' | 'tiktok' | 'instagram' | 'manual' | null;
  active_version_id: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  name: string;
  original_quantity: number;
  original_unit: string;
  metric_quantity: number;
  metric_unit: string;
  imperial_quantity: number;
  imperial_unit: string;
  usda_food_id?: string;
}

export interface RecipeInstruction {
  step_number: number;
  text: string;
}

export interface RecipeNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface RecipeVersion {
  id: string;
  recipe_id: string;
  version_number: number;
  version_notes: string | null;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  servings: number;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  nutrition_per_serving: RecipeNutrition | null;
  portion_description: string | null;
  created_at: string;
  created_by: string | null;
}

export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  list_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'other' | null;
  checked: boolean;
  source: 'manual' | 'recipe' | 'pantry_alert' | null;
  source_id: string | null;
  source_label: string | null;
  suggested_quantity: number | null;
  suggested_unit: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseHistory {
  id: string;
  user_id: string;
  item_name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  purchased_at: string;
  list_id: string | null;
  shopping_list_item_id: string | null;
  reverted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedList {
  id: string;
  list_id: string;
  shared_with_user_id: string;
  shared_by_user_id: string;
  permission: 'view' | 'edit';
  created_at: string;
}

export interface MacroLog {
  id: string;
  user_id: string;
  recipe_version_id: string | null;
  servings_consumed: number;
  logged_at: string;
  calculated_nutrition: RecipeNutrition;
  notes: string | null;
}
