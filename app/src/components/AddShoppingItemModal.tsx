import React, { useState, useEffect } from 'react';
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
  Pressable,
} from 'react-native';
import { supabase } from '../services/supabase';

interface AddShoppingItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  listId: string;
}

interface Unit {
  code: string;
  name: string;
  type: string;
  system: string;
}

const CATEGORIES = [
  { value: 'produce', label: 'Produce', color: '#27ae60' },
  { value: 'dairy', label: 'Dairy', color: '#3498db' },
  { value: 'meat', label: 'Meat', color: '#e74c3c' },
  { value: 'pantry', label: 'Pantry', color: '#f39c12' },
  { value: 'frozen', label: 'Frozen', color: '#9b59b6' },
  { value: 'other', label: 'Other', color: '#95a5a6' },
];

export default function AddShoppingItemModal({ 
  visible, 
  onClose, 
  onSuccess, 
  listId 
}: AddShoppingItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);

  // Form fields
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('g');
  const [category, setCategory] = useState<string | null>('pantry');

  useEffect(() => {
    if (visible) {
      loadUnits();
      resetForm();
    }
  }, [visible]);

  const loadUnits = async () => {
    try {
      setLoadingUnits(true);
      const { data, error } = await supabase
        .from('units')
        .select('code, name, type, system')
        .order('type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error loading units:', error);
    } finally {
      setLoadingUnits(false);
    }
  };


  const fetchSuggestions = async (searchText: string) => {
    if (searchText.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_item_suggestions', {
          p_user_id: supabase.auth.getUser().then(r => r.data.user?.id),
          p_search_text: searchText,
          p_limit: 5,
        });

      if (!error && data) {
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const checkDuplicate = async (itemName: string) => {
    if (!itemName.trim() || !listId) return;

    setCheckingDuplicate(true);
    try {
      const { data, error } = await supabase
        .rpc('check_duplicate_shopping_item', {
          p_list_id: listId,
          p_item_name: itemName.trim(),
        });

      if (!error) {
        setIsDuplicate(data === true);
      }
    } catch (error) {
      console.error('Error checking duplicate:', error);
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const resetForm = () => {
    setName('');
    setQuantity('');
    setUnit('g');
    setCategory('pantry');
  };

  const handleNameChange = (text: string) => {
    setName(text);
    fetchSuggestions(text);
    if (text.trim()) {
      checkDuplicate(text);
    } else {
      setIsDuplicate(false);
    }
  };


  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      alert('Please enter an item name');
      return;
    }

    try {
      setLoading(true);

      const itemData = {
        list_id: listId,
        name: name.trim(),
        quantity: null,  // Don't display quantity in list
        unit: null,
        suggested_quantity: quantity ? parseFloat(quantity) : null,
        suggested_unit: quantity ? unit : null,
        category: category,
        checked: false,
        source: 'manual' as const,
        source_id: null,
        source_label: null,
      };

      const { error } = await supabase
        .from('shopping_list_items')
        .insert(itemData);

      if (error) throw error;

      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding item:', error);
      alert(error.message || 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>Add Item to Shopping List</Text>

              {/* Name */}
              <View style={styles.field}>
                <Text style={styles.label}>Item Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Milk"
                  value={name}
                  onChangeText={handleNameChange}
                  autoFocus
                  accessible={true}
                  accessibilityLabel="Item name input"
                />
                
                {/* Duplicate Warning */}
                {isDuplicate && (
                  <Text style={styles.warningText}>
                    ⚠️ This item is already in the list
                  </Text>
                )}
                
                {/* Autocomplete Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {suggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setName(suggestion.item_name);
                          setShowSuggestions(false);
                          checkDuplicate(suggestion.item_name);
                        }}
                      >
                        <Text style={styles.suggestionText}>
                          {suggestion.item_name}
                        </Text>
                        <Text style={styles.suggestionSource}>
                          {suggestion.source_type === 'purchase_history' 
                            ? `Purchased ${suggestion.frequency_count}x` 
                            : 'In pantry'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Quantity and Unit */}
              <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={[styles.field, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.label}>Unit</Text>
                  {loadingUnits ? (
                    <ActivityIndicator size="small" color="#3498db" />
                  ) : (
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.unitScroll}
                    >
                      {units.slice(0, 10).map((u) => (
                        <TouchableOpacity
                          key={u.code}
                          style={[
                            styles.unitChip,
                            unit === u.code && styles.unitChipSelected,
                          ]}
                          onPress={() => setUnit(u.code)}
                        >
                          <Text
                            style={[
                              styles.unitChipText,
                              unit === u.code && styles.unitChipTextSelected,
                            ]}
                          >
                            {u.code}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </View>

              {/* Category */}
              <View style={styles.field}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryChip,
                        { borderColor: cat.color },
                        category === cat.value && { backgroundColor: cat.color },
                      ]}
                      onPress={() => setCategory(cat.value)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          { color: category === cat.value ? '#fff' : cat.color },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.submitButton,
                    isDuplicate && styles.addButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={loading || isDuplicate}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Add Item</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '80%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
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
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unitScroll: {
    maxHeight: 50,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  unitChipSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  unitChipText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  unitChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#3498db',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 4,
    fontWeight: '500',
  },
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  suggestionSource: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
  addButtonDisabled: {
    backgroundColor: '#bdc3c7',
    opacity: 0.6,
  },
});
