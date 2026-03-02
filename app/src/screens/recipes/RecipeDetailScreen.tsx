import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Recipe, RecipeVersion } from '../../types/database';

interface RecipeDetailScreenProps {
  route: {
    params: {
      recipeId: string;
    };
  };
  navigation: any;
}

export default function RecipeDetailScreen({ route, navigation }: RecipeDetailScreenProps) {
  const { user } = useAuth();
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeVersion, setRecipeVersion] = useState<RecipeVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userUnitSystem, setUserUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [servingsMultiplier, setServingsMultiplier] = useState<number>(1);
  const [showListSelector, setShowListSelector] = useState(false);
  const [availableLists, setAvailableLists] = useState<any[]>([]);

  useEffect(() => {
    loadRecipeDetails();
    loadUserPreferences();
  }, [recipeId]);

  const loadUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('unit_system')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (data) setUserUnitSystem(data.unit_system);
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const loadRecipeDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (recipeError) throw recipeError;
      setRecipe(recipeData);

      // Get active version
      if (recipeData.active_version_id) {
        const { data: versionData, error: versionError } = await supabase
          .from('recipe_versions')
          .select('*')
          .eq('id', recipeData.active_version_id)
          .single();

        if (versionError) throw versionError;
        setRecipeVersion(versionData);
      }
    } catch (error: any) {
      console.error('Error loading recipe details:', error);
      setError(error.message || 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const showListPicker = async () => {
    try {
      // Get all non-archived lists
      const { data: lists, error: listError } = await supabase
        .from('shopping_lists')
        .select('id, name')
        .eq('user_id', user?.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (listError) throw listError;

      if (!lists || lists.length === 0) {
        // No lists exist - create one and add directly
        const { data: newList, error: createError } = await supabase
          .from('shopping_lists')
          .insert({
            user_id: user?.id,
            name: 'Shopping List',
            is_archived: false,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        await addToSpecificList(newList.id);
      } else if (lists.length === 1) {
        // Only one list - add directly without showing picker
        await addToSpecificList(lists[0].id);
      } else {
        // Multiple lists - show picker
        setAvailableLists(lists);
        setShowListSelector(true);
      }
    } catch (error: any) {
      console.error('Error loading lists:', error);
      Alert.alert('Error', error.message || 'Failed to load shopping lists');
    }
  };

  const addToSpecificList = async (listId: string) => {
    if (!recipe || !recipeVersion) return;

    try {

      // Get existing items in the shopping list to check for duplicates
      const { data: existingItems, error: existingError } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('list_id', listId);

      if (existingError) throw existingError;

      let addedCount = 0;
      let updatedCount = 0;

      // Process each ingredient
      for (const ing of recipeVersion.ingredients) {
        const existingItem = existingItems?.find(
          (item: any) => item.name.toLowerCase() === ing.name.toLowerCase()
        );

        if (existingItem) {
          // Item already exists - check if recipe is already tagged
          const currentLabels = existingItem.source_label || '';
          const recipesInLabel = currentLabels.split('|').map((s: string) => s.trim());
          
          if (!recipesInLabel.includes(recipe.title)) {
            // Recipe not yet tagged - append it
            const newLabel = currentLabels 
              ? `${currentLabels} | ${recipe.title}`
              : recipe.title;

            await supabase
              .from('shopping_list_items')
              .update({ source_label: newLabel })
              .eq('id', existingItem.id);

            updatedCount++;
          }
          // If recipe already tagged, do nothing
        } else {
          // New item - add it with suggested quantities
          const qty = userUnitSystem === 'metric' 
            ? ing.metric_quantity 
            : ing.imperial_quantity;
          const unit = userUnitSystem === 'metric'
            ? ing.metric_unit
            : ing.imperial_unit;
            
          await supabase
            .from('shopping_list_items')
            .insert({
              list_id: listId,
              name: ing.name,
              quantity: null,  // Don't display in list
              unit: null,
              suggested_quantity: qty,
              suggested_unit: unit,
              source: 'recipe' as const,
              source_id: recipeVersion.id,
              source_label: recipe.title,
              checked: false,
            });

          addedCount++;
        }
      }

      const message = updatedCount > 0
        ? `${addedCount} new ingredient(s) added and ${updatedCount} existing ingredient(s) tagged with "${recipe.title}".`
        : `${addedCount} ingredient(s) from "${recipe.title}" added.`;

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
    } catch (error: any) {
      console.error('Error adding to shopping list:', error);
      Alert.alert('Error', error.message || 'Failed to add to shopping list');
    }
  };

  const handleCookRecipe = async (multiplier: number = 1) => {
    if (!recipeVersion) return;

    const servingsText = multiplier === 1 ? '' : ` (x${multiplier})`;
    Alert.alert(
      'Cook Recipe',
      `This will deduct ingredients from your pantry${servingsText}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cook',
          onPress: async () => {
            try {
              const { data, error } = await supabase.rpc('deduct_recipe_from_pantry', {
                p_user_id: user?.id,
                p_recipe_version_id: recipeVersion.id,
                p_servings: multiplier,
              });

              if (error) throw error;

              const result = data as any;
              const deductedCount = result.deducted?.length || 0;
              const needsConfirmationCount = result.needs_confirmation?.length || 0;

              if (needsConfirmationCount > 0) {
                Alert.alert(
                  'Missing Ingredients',
                  `${needsConfirmationCount} ingredients couldn't be found in your pantry. Would you like to add them to your shopping list?`,
                  [
                    { text: 'Not Now', style: 'cancel' },
                    {
                      text: 'Add to Shopping List',
                      onPress: showListPicker,
                    },
                  ]
                );
              } else {
                Alert.alert(
                  'Success!',
                  `Recipe cooked! ${deductedCount} ingredients deducted from pantry.`
                );
              }
            } catch (error: any) {
              console.error('Error cooking recipe:', error);
              Alert.alert('Error', 'Failed to deduct ingredients: ' + error.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

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

  if (!recipeVersion) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No Recipe Version</Text>
        <Text style={styles.errorSubtext}>This recipe doesn't have any versions yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}
          <View style={styles.metaRow}>
            {recipeVersion.servings && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Servings:</Text>
                <Text style={styles.metaValue}>{recipeVersion.servings}</Text>
              </View>
            )}
            {recipeVersion.prep_time_minutes && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Prep:</Text>
                <Text style={styles.metaValue}>{recipeVersion.prep_time_minutes} min</Text>
              </View>
            )}
            {recipeVersion.cook_time_minutes && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Cook:</Text>
                <Text style={styles.metaValue}>{recipeVersion.cook_time_minutes} min</Text>
              </View>
            )}
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {recipeVersion.ingredients.map((ingredient: any, index: number) => {
            const quantity = userUnitSystem === 'metric' 
              ? ingredient.metric_quantity 
              : ingredient.imperial_quantity;
            const unit = userUnitSystem === 'metric'
              ? ingredient.metric_unit
              : ingredient.imperial_unit;

            return (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.ingredientBullet}>•</Text>
                <Text style={styles.ingredientText}>
                  {quantity} {unit} {ingredient.name}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {recipeVersion.instructions.map((instruction: any, index: number) => (
            <View key={index} style={styles.instructionItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{instruction.step_number}</Text>
              </View>
              <Text style={styles.instructionText}>{instruction.text}</Text>
            </View>
          ))}
        </View>

        {/* Nutrition (if available) */}
        {recipeVersion.nutrition_per_serving && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {recipeVersion.nutrition_per_serving.calories}
                </Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {recipeVersion.nutrition_per_serving.protein}g
                </Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {recipeVersion.nutrition_per_serving.carbs}g
                </Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {recipeVersion.nutrition_per_serving.fat}g
                </Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {/* Servings Multiplier */}
        <View style={styles.multiplierContainer}>
          <Text style={styles.multiplierLabel}>Servings:</Text>
          <View style={styles.multiplierButtons}>
            <TouchableOpacity 
              style={styles.multiplierButton}
              onPress={() => setServingsMultiplier(Math.max(1, servingsMultiplier - 1))}
            >
              <Text style={styles.multiplierButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.multiplierValue}>x{servingsMultiplier}</Text>
            <TouchableOpacity 
              style={styles.multiplierButton}
              onPress={() => setServingsMultiplier(servingsMultiplier + 1)}
            >
              <Text style={styles.multiplierButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.shoppingListButton]} 
            onPress={showListPicker}
          >
            <Text style={styles.actionButtonText}>🛒 Add to Shopping List</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.cookButton]} 
            onPress={() => handleCookRecipe(servingsMultiplier)}
          >
            <Text style={styles.actionButtonText}>🍳 Cook This Recipe</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List Selector Modal */}
      <Modal
        visible={showListSelector}
        transparent
        animationType="fade"
        onRequestClose={() => setShowListSelector(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowListSelector(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select Shopping List</Text>
            <Text style={styles.modalSubtitle}>Choose which list to add ingredients to:</Text>
            
            <ScrollView style={styles.listOptions}>
              {availableLists.map((list) => (
                <TouchableOpacity
                  key={list.id}
                  style={styles.listOption}
                  onPress={() => {
                    setShowListSelector(false);
                    addToSpecificList(list.id);
                  }}
                >
                  <Text style={styles.listOptionText}>{list.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowListSelector(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 16,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 14,
    color: '#95a5a6',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  ingredientBullet: {
    fontSize: 18,
    color: '#3498db',
    marginRight: 8,
    marginTop: 2,
  },
  ingredientText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
    lineHeight: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  instructionText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
    lineHeight: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  multiplierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  multiplierLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 12,
  },
  multiplierButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  multiplierButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  multiplierButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  multiplierValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    minWidth: 48,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  shoppingListButton: {
    backgroundColor: '#3498db',
  },
  cookButton: {
    backgroundColor: '#27ae60',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  listOptions: {
    maxHeight: 300,
  },
  listOption: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listOptionText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
});
