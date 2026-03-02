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
import { parseRecipeFromUrl, parseRecipeFromText, ParsedRecipe } from '../services/gemini';

interface AddRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: ImportMode;
  sharedFromSocialMedia?: boolean;
}

type ImportMode = 'manual' | 'url' | 'text' | null;

export default function AddRecipeModal({ 
  visible, 
  onClose, 
  onSuccess,
  initialMode = null,
  sharedFromSocialMedia = false 
}: AddRecipeModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>(initialMode);
  const [url, setUrl] = useState('');
  const [recipeText, setRecipeText] = useState('');
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);

  const handleClose = () => {
    setImportMode(null);
    setUrl('');
    setRecipeText('');
    setParsedRecipe(null);
    onClose();
  };

  const handleImportFromUrl = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    try {
      setLoading(true);
      const recipe = await parseRecipeFromUrl(url.trim());
      setParsedRecipe(recipe);
    } catch (error: any) {
      console.error('Error importing recipe:', error);
      
      // Check if it's a social media platform or CORS error
      const isSocialMediaError = error.message && (
        error.message.includes('Instagram') ||
        error.message.includes('TikTok') ||
        error.message.includes('Facebook') ||
        error.message.includes('social media')
      );
      
      const isCorsError = error.message && (
        error.message.includes('CORS') || 
        error.message.includes('Unable to fetch')
      );
      
      if (isSocialMediaError) {
        Alert.alert(
          'Social Media Detected',
          error.message,
          [
            { text: 'Use Paste Text', onPress: () => setImportMode('text') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else if (isCorsError) {
        Alert.alert(
          'Cannot Fetch Website',
          error.message,
          [
            { text: 'Use Paste Text', onPress: () => setImportMode('text') },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to import recipe: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImportFromText = async () => {
    if (!recipeText.trim()) {
      Alert.alert('Error', 'Please enter recipe text');
      return;
    }

    try {
      setLoading(true);
      const recipe = await parseRecipeFromText(recipeText.trim());
      setParsedRecipe(recipe);
    } catch (error: any) {
      console.error('Error parsing recipe:', error);
      Alert.alert('Error', 'Failed to parse recipe: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!parsedRecipe) return;

    try {
      setLoading(true);

      // Create recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          user_id: user?.id,
          title: parsedRecipe.title,
          description: parsedRecipe.description,
          source_url: importMode === 'url' ? url : null,
          source_type: importMode === 'url' ? 'web' : 'manual',
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Create recipe version
      const { data: versionData, error: versionError } = await supabase
        .from('recipe_versions')
        .insert({
          recipe_id: recipeData.id,
          ingredients: parsedRecipe.ingredients,
          instructions: parsedRecipe.instructions,
          servings: parsedRecipe.servings,
          prep_time_minutes: parsedRecipe.prep_time_minutes,
          cook_time_minutes: parsedRecipe.cook_time_minutes,
          nutrition_per_serving: parsedRecipe.nutrition_per_serving,
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
      onSuccess();
      handleClose();
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
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Recipe</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              {!importMode && !parsedRecipe && (
                <View style={styles.modeSelection}>
                  <Text style={styles.modeTitle}>How would you like to add a recipe?</Text>
                  
                  <TouchableOpacity
                    style={styles.modeButton}
                    onPress={handleClose}
                  >
                    <Text style={styles.modeButtonIcon}>✍️</Text>
                    <Text style={styles.modeButtonTitle}>Enter Manually (Recommended)</Text>
                    <Text style={styles.modeButtonSubtext}>
                      Full control - add ingredients and steps one by one
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modeButton}
                    onPress={() => setImportMode('url')}
                  >
                    <Text style={styles.modeButtonIcon}>🌐</Text>
                    <Text style={styles.modeButtonTitle}>Import from URL (AI)</Text>
                    <Text style={styles.modeButtonSubtext}>
                      Requires Gemini API key - auto-extracts recipe
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modeButton}
                    onPress={() => setImportMode('text')}
                  >
                    <Text style={styles.modeButtonIcon}>📝</Text>
                    <Text style={styles.modeButtonTitle}>Paste Recipe Text (AI)</Text>
                    <Text style={styles.modeButtonSubtext}>
                      Requires Gemini API key - AI parses the text
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {importMode === 'url' && !parsedRecipe && (
                <View style={styles.importForm}>
                  <Text style={styles.label}>Recipe URL</Text>
                  <TextInput
                    style={styles.input}
                    value={url}
                    onChangeText={setUrl}
                    placeholder="https://example.com/recipe"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  {url && (url.toLowerCase().includes('instagram.com') || url.toLowerCase().includes('tiktok.com')) && (
                    <View style={styles.warningBox}>
                      <Text style={styles.warningText}>⚠️ Social Media Detected</Text>
                      <Text style={styles.warningSubtext}>
                        Instagram and TikTok block automated access. We recommend using "Paste Recipe Text" instead for best results.
                      </Text>
                    </View>
                  )}
                  <Text style={styles.hint}>
                    We'll automatically extract the recipe ingredients and instructions.
                    {'\n\n'}
                    Note: Social media sites require using "Paste Recipe Text" option.
                  </Text>
                  <TouchableOpacity
                    style={styles.importButton}
                    onPress={handleImportFromUrl}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.importButtonText}>Import Recipe</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setImportMode(null)}
                  >
                    <Text style={styles.backButtonText}>← Back</Text>
                  </TouchableOpacity>
                </View>
              )}

              {importMode === 'text' && !parsedRecipe && (
                <View style={styles.importForm}>
                  {sharedFromSocialMedia && (
                    <View style={[styles.warningBox, { backgroundColor: '#e3f2fd', borderLeftColor: '#2196f3' }]}>
                      <Text style={[styles.warningText, { color: '#1565c0' }]}>📱 Shared from Social Media</Text>
                      <Text style={[styles.warningSubtext, { color: '#1976d2' }]}>
                        1. Go back to Instagram/TikTok{'\n'}
                        2. Copy the recipe text from the post{'\n'}
                        3. Come back here and paste it below{'\n'}
                        4. AI will extract and format everything!
                      </Text>
                    </View>
                  )}
                  <Text style={styles.label}>Recipe Text</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={recipeText}
                    onChangeText={setRecipeText}
                    placeholder="Paste or type your recipe here..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={10}
                  />
                  <Text style={styles.hint}>
                    Include ingredients, quantities, and instructions
                  </Text>
                  <TouchableOpacity
                    style={styles.importButton}
                    onPress={handleImportFromText}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.importButtonText}>Parse Recipe</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setImportMode(null)}
                  >
                    <Text style={styles.backButtonText}>← Back</Text>
                  </TouchableOpacity>
                </View>
              )}

              {parsedRecipe && (
                <View style={styles.preview}>
                  <Text style={styles.previewTitle}>Preview - Verify This is Correct!</Text>
                  
                  <View style={[styles.previewSection, styles.warningSection]}>
                    <Text style={styles.warningText}>⚠️ Please verify this is the recipe you wanted</Text>
                    <Text style={styles.warningSubtext}>
                      AI sometimes extracts sidebar or related recipes by mistake.
                      Check the title and ingredients carefully!
                    </Text>
                  </View>
                  
                  <View style={styles.previewSection}>
                    <Text style={styles.recipeTitle}>{parsedRecipe.title}</Text>
                    {parsedRecipe.description && (
                      <Text style={styles.recipeDescription}>{parsedRecipe.description}</Text>
                    )}
                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>🍽️ {parsedRecipe.servings} servings</Text>
                      {parsedRecipe.prep_time_minutes && (
                        <Text style={styles.metaText}>⏱️ {parsedRecipe.prep_time_minutes} min prep</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.previewSection}>
                    <Text style={styles.sectionTitle}>Ingredients ({parsedRecipe.ingredients.length})</Text>
                    {parsedRecipe.ingredients.slice(0, 5).map((ing, idx) => (
                      <Text key={idx} style={styles.ingredientPreview}>
                        • {ing.metric_quantity} {ing.metric_unit} {ing.name}
                      </Text>
                    ))}
                    {parsedRecipe.ingredients.length > 5 && (
                      <Text style={styles.moreText}>
                        + {parsedRecipe.ingredients.length - 5} more...
                      </Text>
                    )}
                  </View>

                  <View style={styles.previewSection}>
                    <Text style={styles.sectionTitle}>Instructions ({parsedRecipe.instructions.length} steps)</Text>
                    {parsedRecipe.instructions.slice(0, 2).map((inst, idx) => (
                      <Text key={idx} style={styles.instructionPreview}>
                        {inst.step_number}. {inst.text}
                      </Text>
                    ))}
                    {parsedRecipe.instructions.length > 2 && (
                      <Text style={styles.moreText}>
                        + {parsedRecipe.instructions.length - 2} more steps...
                      </Text>
                    )}
                  </View>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        setParsedRecipe(null);
                      }}
                    >
                      <Text style={styles.editButtonText}>← Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSaveRecipe}
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
              )}
            </ScrollView>
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
  modeSelection: {
    paddingVertical: 20,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 24,
    textAlign: 'center',
  },
  modeButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  modeButtonIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  modeButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 6,
  },
  modeButtonSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  importForm: {
    paddingVertical: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
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
    height: 200,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  importButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  importButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  preview: {
    paddingVertical: 10,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 20,
  },
  previewSection: {
    marginBottom: 24,
  },
  warningSection: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    padding: 12,
    borderRadius: 6,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 4,
  },
  warningSubtext: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
  recipeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#95a5a6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  ingredientPreview: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 6,
    lineHeight: 20,
  },
  instructionPreview: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 10,
    lineHeight: 20,
  },
  moreText: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
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
