import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';
import { Picker } from '@react-native-picker/picker';
import { ShoppingListItem, PurchaseHistory } from '../types/database';

interface AddToPantryModalProps {
  visible: boolean;
  item: ShoppingListItem | null;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

interface QuickAddOption {
  quantity: number;
  unit: string;
  label: string;
  frequency?: number;
}

const AddToPantryModal: React.FC<AddToPantryModalProps> = ({
  visible,
  item,
  onClose,
  onSuccess,
  userId,
}) => {
  const [loading, setLoading] = useState(false);
  const [quickOptions, setQuickOptions] = useState<QuickAddOption[]>([]);
  const [customQuantity, setCustomQuantity] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [availableUnits, setAvailableUnits] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (visible && item) {
      loadQuickAddOptions();
      loadAvailableUnits();
      
      // Pre-fill custom input with suggested quantity if available
      if (item.suggested_quantity && item.suggested_unit) {
        setCustomQuantity(item.suggested_quantity.toString());
        setCustomUnit(item.suggested_unit);
      }
    }
  }, [visible, item]);

  const loadQuickAddOptions = async () => {
    if (!item) return;

    try {
      const options: QuickAddOption[] = [];

      // Add suggested quantity from shopping list (from recipe or manual entry)
      if (item.suggested_quantity && item.suggested_unit) {
        options.push({
          quantity: item.suggested_quantity,
          unit: item.suggested_unit,
          label: `Suggested: ${item.suggested_quantity} ${item.suggested_unit}`,
        });
      }

      // Get purchase history for this item
      const { data: history, error } = await supabase
        .rpc('get_purchase_history_for_item', {
          p_user_id: userId,
          p_item_name: item.name,
          p_limit: 3,
        });

      if (!error && history) {
        history.forEach((h: any, index: number) => {
          // Only add if not already in options
          const isDuplicate = options.some(
            (opt) => opt.quantity === h.quantity && opt.unit === h.unit
          );
          if (!isDuplicate) {
            options.push({
              quantity: h.quantity,
              unit: h.unit,
              label: `Your usual: ${h.quantity} ${h.unit}${h.frequency > 1 ? ` (${h.frequency}x)` : ''}`,
              frequency: h.frequency,
            });
          }
        });
      }

      setQuickOptions(options);
    } catch (error) {
      console.error('Error loading quick add options:', error);
    }
  };

  const loadAvailableUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('unit_name')
        .order('unit_name')
        .limit(20);

      if (!error && data) {
        setAvailableUnits(data.map((u) => u.unit_name));
      }
    } catch (error) {
      console.error('Error loading units:', error);
    }
  };

  const handleQuickAdd = async (option: QuickAddOption) => {
    await addToPantry(option.quantity, option.unit);
  };

  const handleCustomAdd = async () => {
    const quantity = parseFloat(customQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity');
      return;
    }
    if (!customUnit.trim()) {
      Alert.alert('Missing Unit', 'Please select a unit');
      return;
    }
    await addToPantry(quantity, customUnit);
  };

  const handleSkip = async () => {
    if (!item) return;

    try {
      setLoading(true);

      // Mark item as checked without adding to pantry
      const { error: updateError } = await supabase
        .from('shopping_list_items')
        .update({ checked: true })
        .eq('id', item.id);

      if (updateError) throw updateError;

      // Still create purchase history record (tracking purchase even if not added to pantry)
      const { error: historyError } = await supabase
        .from('purchase_history')
        .insert({
          user_id: userId,
          item_name: item.name,
          quantity: null,
          unit: null,
          category: item.category,
          list_id: item.list_id,
          shopping_list_item_id: item.id,
        });

      if (historyError) console.error('Error creating purchase history:', historyError);

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error skipping item:', error);
      Alert.alert('Error', 'Failed to check off item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addToPantry = async (quantity: number, unit: string) => {
    if (!item) return;

    try {
      setLoading(true);

      // Check if item already exists in pantry
      const { data: existingItems, error: searchError } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', item.name)
        .limit(1);

      if (searchError) throw searchError;

      if (existingItems && existingItems.length > 0) {
        // Update existing pantry item (add quantity)
        const existingItem = existingItems[0];
        const newQuantity = existingItem.quantity + quantity;

        const { error: updateError } = await supabase
          .from('pantry_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);

        if (updateError) throw updateError;
      } else {
        // Create new pantry item
        const { error: insertError } = await supabase
          .from('pantry_items')
          .insert({
            user_id: userId,
            name: item.name,
            quantity,
            unit,
            category: item.category,
            typical_quantity: quantity, // Set initial typical quantity
          });

        if (insertError) throw insertError;
      }

      // Mark item as checked in shopping list
      const { error: checkError } = await supabase
        .from('shopping_list_items')
        .update({ checked: true })
        .eq('id', item.id);

      if (checkError) throw checkError;

      // Create purchase history record
      const { error: historyError } = await supabase
        .from('purchase_history')
        .insert({
          user_id: userId,
          item_name: item.name,
          quantity,
          unit,
          category: item.category,
          list_id: item.list_id,
          shopping_list_item_id: item.id,
        });

      if (historyError) console.error('Error creating purchase history:', historyError);

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding to pantry:', error);
      Alert.alert('Error', 'Failed to add item to pantry: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <ScrollView style={styles.scrollView}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add {item.name} to Pantry</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Add Options */}
            {quickOptions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Suggested based on:</Text>
                {quickOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickAddButton}
                    onPress={() => handleQuickAdd(option)}
                    disabled={loading}
                    accessible={true}
                    accessibilityLabel={`Quick add ${option.quantity} ${option.unit} of ${item.name} to pantry`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.quickAddLabel}>{option.label}</Text>
                    <Text style={styles.quickAddValue}>
                      {option.quantity} {option.unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Custom Amount Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.customToggle}
                onPress={() => setShowCustomInput(!showCustomInput)}
              >
                <Text style={styles.sectionTitle}>Custom amount</Text>
                <Text style={styles.toggleIcon}>{showCustomInput ? '▼' : '▶'}</Text>
              </TouchableOpacity>

              {showCustomInput && (
                <View style={styles.customInputs}>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Quantity</Text>
                      <TextInput
                        style={styles.textInput}
                        value={customQuantity}
                        onChangeText={setCustomQuantity}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        accessible={true}
                        accessibilityLabel="Enter custom quantity"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Unit</Text>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={customUnit}
                          onValueChange={setCustomUnit}
                          style={styles.picker}
                        >
                          <Picker.Item label="Select unit" value="" />
                          {availableUnits.map((unit) => (
                            <Picker.Item key={unit} label={unit} value={unit} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.button, styles.addButton]}
                    onPress={handleCustomAdd}
                    disabled={loading}
                    accessible={true}
                    accessibilityLabel="Add custom amount to pantry"
                    accessibilityRole="button"
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Add to Pantry</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={handleSkip}
              disabled={loading}
              accessible={true}
              accessibilityLabel="Skip adding to pantry"
              accessibilityRole="button"
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  scrollView: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#7f8c8d',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 12,
  },
  quickAddButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  quickAddLabel: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  quickAddValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  customToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleIcon: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  customInputs: {
    marginTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#3498db',
  },
  skipButton: {
    backgroundColor: '#ecf0f1',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
  },
});

export default AddToPantryModal;
