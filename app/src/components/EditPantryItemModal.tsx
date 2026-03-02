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
  Alert,
} from 'react-native';
import { supabase } from '../services/supabase';
import { PantryItem } from '../types/database';

interface EditPantryItemModalProps {
  visible: boolean;
  item: PantryItem | null;
  onClose: () => void;
  onSuccess: () => void;
  onDelete: () => void;
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

// Suggested units that cover most common use cases
const SUGGESTED_UNITS = [
  { code: 'bag', name: 'Bag', type: 'COUNT' },
  { code: 'bottle', name: 'Bottle', type: 'COUNT' },
  { code: 'can', name: 'Can', type: 'COUNT' },
  { code: 'g', name: 'Gram', type: 'WEIGHT' },
  { code: 'kg', name: 'Kilogram', type: 'WEIGHT' },
  { code: 'ml', name: 'Milliliter', type: 'VOLUME' },
  { code: 'l', name: 'Liter', type: 'VOLUME' },
];

export default function EditPantryItemModal({
  visible,
  item,
  onClose,
  onSuccess,
  onDelete,
}: EditPantryItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [showAllUnits, setShowAllUnits] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('g');
  const [category, setCategory] = useState<string | null>('pantry');
  const [typicalQuantity, setTypicalQuantity] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible && item) {
      // Pre-fill form with existing item data
      setName(item.name);
      setQuantity(item.quantity.toString());
      setUnit(item.unit);
      setCategory(item.category);
      setTypicalQuantity(item.typical_quantity?.toString() || '');
      setNotes(item.notes || '');
      loadUnits();
    }
  }, [visible, item]);

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

  const handleSubmit = async () => {
    if (!item) return;

    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    if (!unit) {
      Alert.alert('Error', 'Please select a unit');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('pantry_items')
        .update({
          name: name.trim(),
          quantity: parseFloat(quantity),
          unit: unit,
          category: category,
          typical_quantity: typicalQuantity ? parseFloat(typicalQuantity) : null,
          notes: notes.trim() || null,
        })
        .eq('id', item.id);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating pantry item:', error);
      Alert.alert('Error', 'Failed to update item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!item) return;
            try {
              setLoading(true);
              const { error } = await supabase
                .from('pantry_items')
                .delete()
                .eq('id', item.id);

              if (error) throw error;

              onDelete();
              onClose();
            } catch (error: any) {
              console.error('Error deleting pantry item:', error);
              Alert.alert('Error', 'Failed to delete item: ' + error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const groupedUnits = units.reduce((acc, unitItem) => {
    if (!acc[unitItem.type]) {
      acc[unitItem.type] = [];
    }
    acc[unitItem.type].push(unitItem);
    return acc;
  }, {} as Record<string, Unit[]>);

  if (!item) return null;

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
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Item</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              {/* Item Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Item Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Tomatoes, Milk, Rice"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Quantity and Unit */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Current Quantity *</Text>
                <View style={styles.quantityRow}>
                  <TextInput
                    style={[styles.input, styles.quantityInput]}
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="0"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                  />
                  
                  {/* Suggested Units */}
                  <View style={styles.unitSelectionContainer}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.suggestedUnitsScroll}
                    >
                      {SUGGESTED_UNITS.map((u) => (
                        <TouchableOpacity
                          key={u.code}
                          style={[
                            styles.unitButton,
                            unit === u.code && styles.unitButtonActive,
                          ]}
                          onPress={() => setUnit(u.code)}
                        >
                          <Text
                            style={[
                              styles.unitButtonText,
                              unit === u.code && styles.unitButtonTextActive,
                            ]}
                          >
                            {u.code}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    
                    {/* More Units Button */}
                    <TouchableOpacity
                      style={styles.moreUnitsButton}
                      onPress={() => setShowAllUnits(!showAllUnits)}
                    >
                      <Text style={styles.moreUnitsButtonText}>
                        {showAllUnits ? '▲ Less' : '▼ More'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* All Units Dropdown */}
                {showAllUnits && (
                  <View style={styles.allUnitsContainer}>
                    <Text style={styles.allUnitsTitle}>All Units</Text>
                    {loadingUnits ? (
                      <ActivityIndicator size="small" color="#3498db" />
                    ) : (
                      <ScrollView style={styles.allUnitsScroll} nestedScrollEnabled>
                        {Object.entries(groupedUnits).map(([type, typeUnits]) => (
                          <View key={type} style={styles.unitTypeSection}>
                            <Text style={styles.unitTypeLabel}>{type}</Text>
                            <View style={styles.unitTypeGrid}>
                              {typeUnits.map((u) => (
                                <TouchableOpacity
                                  key={u.code}
                                  style={[
                                    styles.unitGridButton,
                                    unit === u.code && styles.unitButtonActive,
                                  ]}
                                  onPress={() => {
                                    setUnit(u.code);
                                    setShowAllUnits(false);
                                  }}
                                >
                                  <Text
                                    style={[
                                      styles.unitGridButtonText,
                                      unit === u.code && styles.unitButtonTextActive,
                                    ]}
                                  >
                                    {u.code}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
              </View>

              {/* Category */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryContainer}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryButton,
                        category === cat.value && {
                          backgroundColor: cat.color,
                          borderColor: cat.color,
                        },
                      ]}
                      onPress={() => setCategory(cat.value)}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          category === cat.value && styles.categoryButtonTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Typical Quantity */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Typical Quantity (Optional)</Text>
                <Text style={styles.fieldHint}>
                  Used for low stock alerts. Leave empty if not tracking.
                </Text>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.quantityInput]}
                    value={typicalQuantity}
                    onChangeText={setTypicalQuantity}
                    placeholder="0"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.unitLabel}>{unit}</Text>
                </View>
              </View>

              {/* Notes */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g., Brand, location, expiration date..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Delete Button */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={loading}
              >
                <Text style={styles.deleteButtonText}>🗑️ Delete Item</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Save Changes</Text>
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
  fieldGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  fieldHint: {
    fontSize: 12,
    color: '#7f8c8d',
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
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  quantityRow: {
    gap: 12,
  },
  quantityInput: {
    flex: 0,
    minWidth: 100,
  },
  unitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
    minWidth: 50,
  },
  unitSelectionContainer: {
    marginTop: 8,
  },
  suggestedUnitsScroll: {
    flexDirection: 'row',
  },
  unitButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  unitButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  unitButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  moreUnitsButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3498db',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  moreUnitsButtonText: {
    fontSize: 13,
    color: '#3498db',
    fontWeight: '600',
  },
  allUnitsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 200,
  },
  allUnitsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  allUnitsScroll: {
    maxHeight: 160,
  },
  unitTypeSection: {
    marginBottom: 12,
  },
  unitTypeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#95a5a6',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  unitTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  unitGridButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    minWidth: 60,
    alignItems: 'center',
  },
  unitGridButtonText: {
    fontSize: 13,
    color: '#666',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  deleteButton: {
    backgroundColor: '#fee',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#3498db',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
