import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ManualRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Ingredient {
  name: string;
  metric_quantity: number;
  metric_unit: string;
  imperial_quantity: number;
  imperial_unit: string;
}

interface Instruction {
  step_number: number;
  text: string;
}

interface ManualRecipeModalPropsExtended extends ManualRecipeModalProps {
  onSwitchToAI?: () => void;
}

export default function ManualRecipeModal({ visible, onClose, onSuccess, onSwitchToAI }: ManualRecipeModalPropsExtended) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Recipe fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('4');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');

  // Ingredient fields
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', metric_quantity: 0, metric_unit: 'g', imperial_quantity: 0, imperial_unit: 'oz' },
  ]);

  // Instruction fields
  const [instructions, setInstructions] = useState<Instruction[]>([
    { step_number: 1, text: '' },
  ]);

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { name: '', metric_quantity: 0, metric_unit: 'g', imperial_quantity: 0, imperial_unit: 'oz' },
    ]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...ingredients];
    (updated[index] as any)[field] = value;
    setIngredients(updated);
  };

  const addInstruction = () => {
    setInstructions([
      ...instructions,
      { step_number: instructions.length + 1, text: '' },
    ]);
  };

  const removeInstruction = (index: number) => {
    const updated = instructions.filter((_, i) => i !== index);
    // Renumber steps
    updated.forEach((inst, idx) => {
      inst.step_number = idx + 1;
    });
    setInstructions(updated);
  };

  const updateInstruction = (index: number, text: string) => {
    const updated = [...instructions];
    updated[index].text = text;
    setInstructions(updated);
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title');
      return;
    }

    const validIngredients = ingredients.filter(
      (ing) => ing.name.trim() && ing.metric_quantity > 0
    );

    if (validIngredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }

    const validInstructions = instructions.filter((inst) => inst.text.trim());

    if (validInstructions.length === 0) {
      Alert.alert('Error', 'Please add at least one instruction');
      return;
    }

    try {
      setLoading(true);

      // Format ingredients for database
      const formattedIngredients = validIngredients.map((ing) => ({
        name: ing.name.trim(),
        original_quantity: ing.metric_quantity,
        original_unit: ing.metric_unit,
        metric_quantity: ing.metric_quantity,
        metric_unit: ing.metric_unit,
        imperial_quantity: ing.imperial_quantity,
        imperial_unit: ing.imperial_unit,
      }));

      // Create recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          user_id: user?.id,
          title: title.trim(),
          description: description.trim() || null,
          source_type: 'manual',
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Create recipe version
      const { data: versionData, error: versionError } = await supabase
        .from('recipe_versions')
        .insert({
          recipe_id: recipeData.id,
          ingredients: formattedIngredients,
          instructions: validInstructions,
          servings: parseInt(servings) || 4,
          prep_time_minutes: prepTime ? parseInt(prepTime) : null,
          cook_time_minutes: cookTime ? parseInt(cookTime) : null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // Update recipe with active version
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ active_version_id: versionData.id })
        .eq('id', recipeData.id);

      if (updateError) throw updateError;

      Alert.alert('Success!', 'Recipe saved successfully');
      
      // Reset form
      setTitle('');
      setDescription('');
      setServings('4');
      setPrepTime('');
      setCookTime('');
      setIngredients([{ name: '', metric_quantity: 0, metric_unit: 'g', imperial_quantity: 0, imperial_unit: 'oz' }]);
      setInstructions([{ step_number: 1, text: '' }]);
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving recipe:', error);
      Alert.alert('Error', 'Failed to save recipe: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Recipe Manually</Text>
              <View style={styles.headerButtons}>
                {onSwitchToAI && (
                  <TouchableOpacity onPress={onSwitchToAI} style={styles.switchButton}>
                    <Text style={styles.switchButtonText}>🌐 AI Import</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              {/* Basic Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Chocolate Chip Cookies"
                  placeholderTextColor="#999"
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Brief description of the recipe"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Servings</Text>
                    <TextInput
                      style={styles.input}
                      value={servings}
                      onChangeText={setServings}
                      placeholder="4"
                      placeholderTextColor="#999"
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Prep (min)</Text>
                    <TextInput
                      style={styles.input}
                      value={prepTime}
                      onChangeText={setPrepTime}
                      placeholder="15"
                      placeholderTextColor="#999"
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Cook (min)</Text>
                    <TextInput
                      style={styles.input}
                      value={cookTime}
                      onChangeText={setCookTime}
                      placeholder="30"
                      placeholderTextColor="#999"
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </View>

              {/* Ingredients */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredients *</Text>
                {ingredients.map((ing, index) => (
                  <View key={index} style={styles.ingredientRow}>
                    <TextInput
                      style={[styles.input, styles.flex2]}
                      value={ing.name}
                      onChangeText={(text) => updateIngredient(index, 'name', text)}
                      placeholder="Ingredient name"
                      placeholderTextColor="#999"
                    />
                    <TextInput
                      style={[styles.input, styles.flex1]}
                      value={ing.metric_quantity.toString()}
                      onChangeText={(text) => updateIngredient(index, 'metric_quantity', parseFloat(text) || 0)}
                      placeholder="250"
                      placeholderTextColor="#999"
                      keyboardType="decimal-pad"
                    />
                    <TextInput
                      style={[styles.input, styles.flex1]}
                      value={ing.metric_unit}
                      onChangeText={(text) => updateIngredient(index, 'metric_unit', text)}
                      placeholder="g"
                      placeholderTextColor="#999"
                    />
                    {ingredients.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeIngredient(index)}
                      >
                        <Text style={styles.removeButtonText}>−</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
                  <Text style={styles.addButtonText}>+ Add Ingredient</Text>
                </TouchableOpacity>
              </View>

              {/* Instructions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions *</Text>
                {instructions.map((inst, index) => (
                  <View key={index} style={styles.instructionRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{inst.step_number}</Text>
                    </View>
                    <TextInput
                      style={[styles.input, styles.flex1, styles.instructionInput]}
                      value={inst.text}
                      onChangeText={(text) => updateInstruction(index, text)}
                      placeholder={`Step ${inst.step_number}`}
                      placeholderTextColor="#999"
                      multiline
                    />
                    {instructions.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeInstruction(index)}
                      >
                        <Text style={styles.removeButtonText}>−</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity style={styles.addButton} onPress={addInstruction}>
                  <Text style={styles.addButtonText}>+ Add Step</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Recipe</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3498db',
    borderRadius: 6,
  },
  switchButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  ingredientRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  instructionInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#27ae60',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
