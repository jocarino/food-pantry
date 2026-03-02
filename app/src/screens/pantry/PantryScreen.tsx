import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { PantryItem } from '../../types/database';
import AddPantryItemModal from '../../components/AddPantryItemModal';
import EditPantryItemModal from '../../components/EditPantryItemModal';

export default function PantryScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPantryItems();
    }
  }, [user]);

  // Filter items when search query or category changes
  useEffect(() => {
    let filtered = items;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
  }, [items, searchQuery, selectedCategory]);

  const loadPantryItems = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', user?.id)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading pantry items:', error);
        setError(error.message || 'Failed to load pantry items');
        throw error;
      }
      setItems(data || []);
    } catch (error: any) {
      console.error('Error loading pantry items:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPantryItems();
  };

  const getStockPercentage = (item: PantryItem) => {
    if (!item.typical_quantity || item.typical_quantity === 0) return null;
    return Math.round((item.quantity / item.typical_quantity) * 100);
  };

  const getStockColor = (percentage: number | null) => {
    if (percentage === null) return '#95a5a6';
    if (percentage < 20) return '#e74c3c';
    if (percentage < 50) return '#f39c12';
    return '#27ae60';
  };

  const isLowStock = (item: PantryItem) => {
    const stockPercent = getStockPercentage(item);
    return stockPercent !== null && stockPercent < 50;
  };

  const handleAddToShoppingList = async (item: PantryItem, e: any) => {
    e.stopPropagation();
    
    try {
      // Get the user's first active shopping list
      const { data: lists, error: listError } = await supabase
        .from('shopping_lists')
        .select('id')
        .eq('user_id', user?.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: true })
        .limit(1);

      if (listError) throw listError;

      if (!lists || lists.length === 0) {
        alert('Please create a shopping list first');
        return;
      }

      const { error } = await supabase
        .from('shopping_list_items')
        .insert({
          list_id: lists[0].id,
          name: item.name,
          quantity: item.typical_quantity || item.quantity,
          unit: item.unit,
          category: item.category,
          checked: false,
        });

      if (error) throw error;
      alert(`Added ${item.name} to shopping list!`);
    } catch (error: any) {
      console.error('Error adding to shopping list:', error);
      alert('Failed to add to shopping list');
    }
  };

  const renderItem = ({ item }: { item: PantryItem }) => {
    const stockPercent = getStockPercentage(item);
    const stockColor = getStockColor(stockPercent);
    const lowStock = isLowStock(item);

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => {
          setSelectedItem(item);
          setShowEditModal(true);
        }}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.category && (
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.quantityText}>
            {item.quantity} {item.unit}
          </Text>
          {stockPercent !== null && (
            <View style={styles.stockIndicator}>
              <View style={styles.stockBarContainer}>
                <View style={[styles.stockBar, { width: `${Math.min(stockPercent, 100)}%`, backgroundColor: stockColor }]} />
              </View>
              <Text style={[styles.stockText, { color: stockColor }]}>
                {stockPercent}%
              </Text>
            </View>
          )}
        </View>
        
        {lowStock && (
          <TouchableOpacity
            style={styles.lowStockButton}
            onPress={(e) => handleAddToShoppingList(item, e)}
          >
            <Text style={styles.lowStockButtonText}>⚠️ Low Stock - Add to Shopping List</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>⚠️ Error Loading Pantry</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPantryItems}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categories = [
    { value: null, label: 'All', color: '#95a5a6' },
    { value: 'produce', label: 'Produce', color: '#27ae60' },
    { value: 'dairy', label: 'Dairy', color: '#3498db' },
    { value: 'meat', label: 'Meat', color: '#e74c3c' },
    { value: 'pantry', label: 'Pantry', color: '#f39c12' },
    { value: 'frozen', label: 'Frozen', color: '#9b59b6' },
    { value: 'other', label: 'Other', color: '#7f8c8d' },
  ];

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filters */}
      {items.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value || 'all'}
              style={[
                styles.filterChip,
                selectedCategory === cat.value && {
                  backgroundColor: cat.color,
                  borderColor: cat.color,
                },
              ]}
              onPress={() => setSelectedCategory(cat.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === cat.value && styles.filterChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No items found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || selectedCategory
              ? 'Try adjusting your filters'
              : 'Add items to get started!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Item Modal */}
      <AddPantryItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          loadPantryItems();
        }}
      />

      {/* Edit Item Modal */}
      <EditPantryItemModal
        visible={showEditModal}
        item={selectedItem}
        onClose={() => {
          setShowEditModal(false);
          setSelectedItem(null);
        }}
        onSuccess={() => {
          loadPantryItems();
        }}
        onDelete={() => {
          loadPantryItems();
        }}
      />
    </View>
  );
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    produce: '#27ae60',
    dairy: '#3498db',
    meat: '#e74c3c',
    pantry: '#f39c12',
    frozen: '#9b59b6',
    other: '#95a5a6',
  };
  return colors[category] || colors.other;
};

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
  list: {
    padding: 15,
    paddingBottom: 100,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  itemDetails: {
    gap: 8,
  },
  quantityText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  stockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockBarContainer: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ecf0f1',
    overflow: 'hidden',
  },
  stockBar: {
    height: '100%',
    borderRadius: 3,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7f8c8d',
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.3)',
    elevation: 8,
    zIndex: 1000,
  },
  fabText: {
    fontSize: 32,
    color: 'white',
    fontWeight: '300',
    marginTop: -2,
  },
  searchContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
  clearButton: {
    position: 'absolute',
    right: 25,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    maxHeight: 60,
  },
  filterContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: 'white',
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: 'white',
  },
  lowStockButton: {
    marginTop: 8,
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#f39c12',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  lowStockButtonText: {
    color: '#856404',
    fontSize: 13,
    fontWeight: '600',
  },
});
