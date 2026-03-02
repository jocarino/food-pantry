import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ShareListModalProps {
  visible: boolean;
  onClose: () => void;
  listId: string;
  listName: string;
}

interface SharedUser {
  id: string;
  shared_with_user_id: string;
  permission: 'view' | 'edit';
  user_email?: string;
  created_at: string;
}

export default function ShareListModal({
  visible,
  onClose,
  listId,
  listName,
}: ShareListModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('edit');

  useEffect(() => {
    if (visible) {
      loadSharedUsers();
    }
  }, [visible, listId]);

  const loadSharedUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shared_lists')
        .select('*')
        .eq('list_id', listId);

      if (error) throw error;
      setSharedUsers(data || []);
    } catch (error: any) {
      console.error('Error loading shared users:', error);
      Alert.alert('Error', error.message || 'Failed to load shared users');
    } finally {
      setLoading(false);
    }
  };

  const handleShareList = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      setLoading(true);

      // Find user by email
      const { data: targetUser, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', email.trim()) // In production, you'd query by email field
        .single();

      if (userError || !targetUser) {
        Alert.alert('Error', 'User not found. Make sure they have an account.');
        return;
      }

      // Check if already shared
      const { data: existing } = await supabase
        .from('shared_lists')
        .select('*')
        .eq('list_id', listId)
        .eq('shared_with_user_id', targetUser.id)
        .single();

      if (existing) {
        Alert.alert('Error', 'This list is already shared with this user');
        return;
      }

      // Share the list
      const { error: shareError } = await supabase
        .from('shared_lists')
        .insert({
          list_id: listId,
          shared_by_user_id: user?.id,
          shared_with_user_id: targetUser.id,
          permission: permission,
        });

      if (shareError) throw shareError;

      Alert.alert('Success', `List shared with ${email}`);
      setEmail('');
      loadSharedUsers();
    } catch (error: any) {
      console.error('Error sharing list:', error);
      Alert.alert('Error', error.message || 'Failed to share list');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    Alert.alert(
      'Remove Access',
      'Are you sure you want to remove this user from the shared list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('shared_lists')
                .delete()
                .eq('id', shareId);

              if (error) throw error;

              setSharedUsers(sharedUsers.filter(u => u.id !== shareId));
              Alert.alert('Success', 'User removed from shared list');
            } catch (error: any) {
              console.error('Error removing share:', error);
              Alert.alert('Error', error.message || 'Failed to remove share');
            }
          },
        },
      ]
    );
  };

  const handleUpdatePermission = async (shareId: string, newPermission: 'view' | 'edit') => {
    try {
      const { error } = await supabase
        .from('shared_lists')
        .update({ permission: newPermission })
        .eq('id', shareId);

      if (error) throw error;

      setSharedUsers(
        sharedUsers.map(u =>
          u.id === shareId ? { ...u, permission: newPermission } : u
        )
      );
    } catch (error: any) {
      console.error('Error updating permission:', error);
      Alert.alert('Error', error.message || 'Failed to update permission');
    }
  };

  const renderSharedUser = ({ item }: { item: SharedUser }) => (
    <View style={styles.sharedUserItem}>
      <View style={styles.sharedUserInfo}>
        <Text style={styles.sharedUserEmail}>
          {item.user_email || item.shared_with_user_id}
        </Text>
        <View style={styles.permissionButtons}>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              item.permission === 'view' && styles.permissionButtonActive,
            ]}
            onPress={() => handleUpdatePermission(item.id, 'view')}
          >
            <Text
              style={[
                styles.permissionButtonText,
                item.permission === 'view' && styles.permissionButtonTextActive,
              ]}
            >
              View
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              item.permission === 'edit' && styles.permissionButtonActive,
            ]}
            onPress={() => handleUpdatePermission(item.id, 'edit')}
          >
            <Text
              style={[
                styles.permissionButtonText,
                item.permission === 'edit' && styles.permissionButtonTextActive,
              ]}
            >
              Edit
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveShare(item.id)}
      >
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Share "{listName}"</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Add User Section */}
          <View style={styles.addSection}>
            <Text style={styles.sectionTitle}>Share with someone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email or user ID"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.permissionSelector}>
              <Text style={styles.label}>Permission:</Text>
              <View style={styles.permissionButtons}>
                <TouchableOpacity
                  style={[
                    styles.permissionButton,
                    permission === 'view' && styles.permissionButtonActive,
                  ]}
                  onPress={() => setPermission('view')}
                >
                  <Text
                    style={[
                      styles.permissionButtonText,
                      permission === 'view' && styles.permissionButtonTextActive,
                    ]}
                  >
                    View Only
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.permissionButton,
                    permission === 'edit' && styles.permissionButtonActive,
                  ]}
                  onPress={() => setPermission('edit')}
                >
                  <Text
                    style={[
                      styles.permissionButtonText,
                      permission === 'edit' && styles.permissionButtonTextActive,
                    ]}
                  >
                    Can Edit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareList}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.shareButtonText}>Share List</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Shared Users List */}
          <View style={styles.sharedSection}>
            <Text style={styles.sectionTitle}>Shared with</Text>
            {loading && sharedUsers.length === 0 ? (
              <ActivityIndicator size="small" color="#3498db" />
            ) : sharedUsers.length === 0 ? (
              <Text style={styles.emptyText}>
                Not shared with anyone yet
              </Text>
            ) : (
              <FlatList
                data={sharedUsers}
                keyExtractor={(item) => item.id}
                renderItem={renderSharedUser}
                style={styles.sharedList}
              />
            )}
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
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
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#7f8c8d',
  },
  addSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  permissionSelector: {
    marginBottom: 16,
  },
  permissionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  permissionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  permissionButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  permissionButtonTextActive: {
    color: '#fff',
  },
  shareButton: {
    backgroundColor: '#3498db',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sharedSection: {
    flex: 1,
    marginBottom: 16,
  },
  sharedList: {
    maxHeight: 200,
  },
  sharedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  sharedUserInfo: {
    flex: 1,
  },
  sharedUserEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 20,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  doneButton: {
    backgroundColor: '#ecf0f1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
  },
});
