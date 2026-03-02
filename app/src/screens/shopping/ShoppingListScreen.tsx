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
  Alert,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingList, ShoppingListItem } from '../../types/database';
import AddShoppingItemModal from '../../components/AddShoppingItemModal';
import ShareListModal from '../../components/ShareListModal';
import ShoppingListItemCard from '../../components/ShoppingListItemCard';
import AddToPantryModal from '../../components/AddToPantryModal';

export default function ShoppingListScreen({ navigation }: any) {
  const { user } = useAuth();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddListModal, setShowAddListModal] = useState(false);
  const [showEditListModal, setShowEditListModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editListName, setEditListName] = useState('');
  const [showAddToPantryModal, setShowAddToPantryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShoppingListItem | null>(null);
  const [archiveCountdown, setArchiveCountdown] = useState<number | null>(null);
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ShoppingListItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);


  useEffect(() => {
    if (user) {
      loadLists();
    }
  }, [user]);

  useEffect(() => {
    if (activeList) {
      loadItems();
    }
  }, [activeList]);

  useEffect(() => {
    const uncheckedItems = items.filter(i => !i.checked);
    const allChecked = uncheckedItems.length === 0 && items.length > 0;
    
    if (allChecked && !archiveCountdown) {
      setArchiveCountdown(30);
    } else if (!allChecked && archiveCountdown) {
      setArchiveCountdown(null);
    }
  }, [items]);

  useEffect(() => {
    if (archiveCountdown === 0) {
      handleArchiveListAuto();
    } else if (archiveCountdown && archiveCountdown > 0) {
      const timer = setTimeout(() => {
        setArchiveCountdown(archiveCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [archiveCountdown]);


  const loadLists = async () => {
    try {
      setError(null);
      
      // Fetch owned lists
      const { data: ownedLists, error: ownedError } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (ownedError) throw ownedError;

      // Fetch shared lists
      const { data: sharedListsData, error: sharedError } = await supabase
        .from('shared_lists')
        .select(`
          shopping_lists!inner(*),
          permission
        `)
        .eq('shared_with_user_id', user?.id)
        .eq('shopping_lists.is_archived', false);

      if (sharedError) console.error('Error loading shared lists:', sharedError);

      const sharedLists = sharedListsData?.map((sl: any) => ({
        ...sl.shopping_lists,
        shared: true,
        permission: sl.permission,
      })) || [];

      const allLists = [...(ownedLists || []), ...sharedLists];
      setLists(allLists);
      
      if (!activeList && allLists.length > 0) {
        setActiveList(allLists[0]);
      }
    } catch (error: any) {
      console.error('Error loading lists:', error);
      setError(error.message || 'Failed to load shopping lists');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const handleItemPress = async (item: ShoppingListItem) => {
    if (item.checked) {
      // Uncheck item
      await uncheckItem(item);
    } else {
      // Show add to pantry modal
      setSelectedItem(item);
      setShowAddToPantryModal(true);
    }
  };

  const uncheckItem = async (item: ShoppingListItem) => {
    try {
      const { error: updateError } = await supabase
        .from('shopping_list_items')
        .update({ checked: false })
        .eq('id', item.id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('purchase_history')
        .update({ reverted_at: new Date().toISOString() })
        .eq('shopping_list_item_id', item.id)
        .is('reverted_at', null);

      if (historyError) console.error('Error updating purchase history:', historyError);

      loadItems();
    } catch (error: any) {
      console.error('Error unchecking item:', error);
      Alert.alert('Error', 'Failed to uncheck item: ' + error.message);
    }
  };

  const handleAddLowStock = async () => {
    try {
      const { data, error } = await supabase
        .rpc('auto_add_low_stock_to_shopping_list', {
          p_user_id: user?.id,
        });

      if (error) throw error;

      const itemsAdded = data?.[0]?.items_added || 0;
      
      if (itemsAdded > 0) {
        setSuccessMessage(`Added ${itemsAdded} low stock item(s) to your shopping list`);
        setTimeout(() => setSuccessMessage(null), 3000);
        loadItems();
      } else {
        setInfoMessage('No low stock items found');
        setTimeout(() => setInfoMessage(null), 3000);
      }
    } catch (error: any) {
      console.error('Error adding low stock items:', error);
      setError('Failed to add low stock items: ' + error.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleArchiveListAuto = async () => {
    if (!activeList) return;
    
    try {
      const { error } = await supabase
        .from('shopping_lists')
        .update({ is_archived: true })
        .eq('id', activeList.id);

      if (error) throw error;

      const remainingLists = lists.filter(l => l.id !== activeList.id);
      setLists(remainingLists);
      setActiveList(remainingLists[0] || null);
      setArchiveCountdown(null);
      setSuccessMessage('🎉 Shopping Complete! List has been archived');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error auto-archiving list:', error);
      setError('Failed to archive list');
      setTimeout(() => setError(null), 3000);
    }
  };


  const loadItems = async () => {
    if (!activeList) return;

    try {
      setError(null);
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('list_id', activeList.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error loading items:', error);
      setError(error.message || 'Failed to load items');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLists();
    if (activeList) {
      loadItems();
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({
          user_id: user?.id,
          name: newListName.trim(),
          is_archived: false,
        })
        .select()
        .single();

      if (error) throw error;

      setLists([data, ...lists]);
      setActiveList(data);
      setNewListName('');
      setShowAddListModal(false);
      Alert.alert('Success', 'List created successfully');
    } catch (error: any) {
      console.error('Error creating list:', error);
      Alert.alert('Error', error.message || 'Failed to create list');
    }
  };

  const handleUpdateList = async () => {
    if (!activeList || !editListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    try {
      const { error } = await supabase
        .from('shopping_lists')
        .update({ name: editListName.trim() })
        .eq('id', activeList.id);

      if (error) throw error;

      const updatedList = { ...activeList, name: editListName.trim() };
      setActiveList(updatedList);
      setLists(lists.map(l => l.id === activeList.id ? updatedList : l));
      setEditListName('');
      setShowEditListModal(false);
      Alert.alert('Success', 'List updated successfully');
    } catch (error: any) {
      console.error('Error updating list:', error);
      Alert.alert('Error', error.message || 'Failed to update list');
    }
  };

  const handleArchiveList = async () => {
    if (!activeList) return;

    Alert.alert(
      'Archive List',
      'Are you sure you want to archive this list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('shopping_lists')
                .update({ is_archived: true })
                .eq('id', activeList.id);

              if (error) throw error;

              const remainingLists = lists.filter(l => l.id !== activeList.id);
              setLists(remainingLists);
              setActiveList(remainingLists[0] || null);
              Alert.alert('Success', 'List archived successfully');
            } catch (error: any) {
              console.error('Error archiving list:', error);
              Alert.alert('Error', error.message || 'Failed to archive list');
            }
          },
        },
      ]
    );
  };

  const handleDeleteItem = (item: ShoppingListItem) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      setItems(items.filter(i => i.id !== itemToDelete.id));
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    } catch (error: any) {
      console.error('Error deleting item:', error);
      setError(error.message || 'Failed to delete item');
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const renderItem = ({ item }: { item: ShoppingListItem }) => (
    <ShoppingListItemCard
      item={item}
      userId={user?.id || ''}
      onDelete={() => handleDeleteItem(item)}
      onItemPress={() => handleItemPress(item)}
      onRefresh={loadItems}
    />
  );

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
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (lists.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No shopping lists yet</Text>
          <Text style={styles.emptySubtext}>Create your first list to get started</Text>
          <TouchableOpacity
            style={styles.createListButton}
            onPress={() => setShowAddListModal(true)}
          >
            <Text style={styles.createListButtonText}>+ Create List</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showAddListModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddListModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowAddListModal(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Create Shopping List</Text>
              
              <TextInput
                style={styles.input}
                placeholder="List name (e.g., Weekly Groceries)"
                value={newListName}
                onChangeText={setNewListName}
                autoFocus
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setNewListName('');
                    setShowAddListModal(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleCreateList}
                >
                  <Text style={styles.saveButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* List Selector */}
      <View style={styles.listSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {lists.map((list) => (
            <TouchableOpacity
              key={list.id}
              style={[
                styles.listTab,
                activeList?.id === list.id && styles.listTabActive,
              ]}
              onPress={() => setActiveList(list)}
            >
              <Text
                style={[
                  styles.listTabText,
                  activeList?.id === list.id && styles.listTabTextActive,
                ]}
              >
                {list.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.addListTab}
            onPress={() => setShowAddListModal(true)}
          >
            <Text style={styles.addListTabText}>+ New</Text>
          </TouchableOpacity>
        </ScrollView>

        {activeList && (
          <View style={styles.listActions}>
            <TouchableOpacity
              style={styles.listActionButton}
              onPress={() => setShowShareModal(true)}
            >
              <Text style={styles.listActionButtonText}>👥</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.listActionButton}
              onPress={() => {
                setEditListName(activeList.name);
                setShowEditListModal(true);
              }}
            >
              <Text style={styles.listActionButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.listActionButton}
              onPress={handleArchiveList}
            >
              <Text style={styles.listActionButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>



      {/* Items List */}
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No items in this list</Text>
          <Text style={styles.emptySubtext}>Add items manually or from recipes</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Add Item FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddItemModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add List Modal */}
      <Modal
        visible={showAddListModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddListModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddListModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Create Shopping List</Text>
            
            <TextInput
              style={styles.input}
              placeholder="List name (e.g., Weekly Groceries)"
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewListName('');
                  setShowAddListModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleCreateList}
              >
                <Text style={styles.saveButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit List Modal */}
      <Modal
        visible={showEditListModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditListModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowEditListModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Edit List Name</Text>
            
            <TextInput
              style={styles.input}
              placeholder="List name"
              value={editListName}
              onChangeText={setEditListName}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setEditListName('');
                  setShowEditListModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateList}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Shopping Item Modal */}
      {activeList && (
        <AddShoppingItemModal
          visible={showAddItemModal}
          onClose={() => setShowAddItemModal(false)}
          onSuccess={loadItems}
          listId={activeList.id}
        />
      )}


      {/* Progress Indicator & Low Stock Button */}
      {activeList && items.length > 0 && (
        <View style={styles.headerInfo}>
          <Text style={styles.progressText}>
            {items.filter(i => i.checked).length} of {items.length} items
          </Text>
          <TouchableOpacity
            style={styles.lowStockButton}
            onPress={handleAddLowStock}
          >
            <Text style={styles.lowStockButtonText}>+ Low Stock</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Auto-Archive Countdown Toast */}
      {archiveCountdown !== null && (
        <View style={styles.countdownToast}>
          <Text style={styles.countdownText}>
            🎉 Shopping complete! List will archive in {archiveCountdown}s
          </Text>
          <TouchableOpacity
            style={styles.undoButton}
            onPress={() => setArchiveCountdown(null)}
          >
            <Text style={styles.undoButtonText}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Success Message Toast */}
      {successMessage && (
        <View style={[styles.messageToast, styles.successToast]}>
          <Text style={styles.messageText}>{successMessage}</Text>
        </View>
      )}

      {/* Info Message Toast */}
      {infoMessage && (
        <View style={[styles.messageToast, styles.infoToast]}>
          <Text style={styles.messageText}>{infoMessage}</Text>
        </View>
      )}

      {/* Error Message Toast */}
      {error && (
        <View style={[styles.messageToast, styles.errorToast]}>
          <Text style={styles.messageText}>{error}</Text>
        </View>
      )}

      {/* Add To Pantry Modal */}
      {selectedItem && (
        <AddToPantryModal
          visible={showAddToPantryModal}
          item={selectedItem}
          onClose={() => {
            setShowAddToPantryModal(false);
            setSelectedItem(null);
          }}
          onSuccess={() => {
            loadItems();
            setShowAddToPantryModal(false);
            setSelectedItem(null);
          }}
          userId={user?.id || ''}
        />
      )}

      {/* Share List Modal */}
      {activeList && (
        <ShareListModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          listId={activeList.id}
          listName={activeList.name}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowDeleteConfirm(false)}
        >
          <Pressable style={styles.deleteConfirmModal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.deleteConfirmTitle}>Delete Item</Text>
            <Text style={styles.deleteConfirmMessage}>
              Are you sure you want to delete "{itemToDelete?.name}"?
            </Text>
            <View style={styles.deleteConfirmButtons}>
              <TouchableOpacity
                style={[styles.deleteConfirmButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setItemToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmButton, styles.deleteButton]}
                onPress={confirmDeleteItem}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#f5f5f5',
  },
  listSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  listTabActive: {
    backgroundColor: '#3498db',
  },
  listTabText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  listTabTextActive: {
    color: '#fff',
  },
  addListTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderStyle: 'dashed',
  },
  addListTabText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  listActions: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  listActionButton: {
    padding: 8,
    marginLeft: 4,
  },
  listActionButtonText: {
    fontSize: 18,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#3498db',
    borderRadius: 8,
    alignItems: 'center',
  },
  pantryButton: {
    backgroundColor: '#27ae60',
  },
  clearButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 12,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'flex-start',
  },
  itemCardChecked: {
    opacity: 0.6,
    backgroundColor: '#ecf0f1',
  },
  checkboxContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#7f8c8d',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  quantityText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  quantityTextChecked: {
    textDecorationLine: 'line-through',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sourceText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  sourceLabel: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
    marginTop: 2,
  },
  sourceLabelChecked: {
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  createListButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3498db',
    borderRadius: 8,
  },
  createListButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3498db',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
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
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3498db',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  progressText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  lowStockButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f39c12',
    borderRadius: 6,
  },
  lowStockButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  countdownToast: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: '#27ae60',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  countdownText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  undoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  undoButtonText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
  },
  deleteConfirmModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteConfirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  deleteConfirmMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 24,
    lineHeight: 22,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  messageToast: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  successToast: {
    backgroundColor: '#27ae60',
  },
  infoToast: {
    backgroundColor: '#3498db',
  },
  errorToast: {
    backgroundColor: '#e74c3c',
  },
  messageText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});
