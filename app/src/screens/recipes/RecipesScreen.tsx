import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Recipe } from '../../types/database';
import AddRecipeModal from '../../components/AddRecipeModal';
import ManualRecipeModal from '../../components/ManualRecipeModal';

interface RecipesScreenProps {
  navigation: any;
}

export default function RecipesScreen({ navigation }: RecipesScreenProps) {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadRecipes();
    }
  }, [user]);

  // Check for shared URLs every time screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 RecipesScreen focused, checking for shared URL...');
      checkForSharedUrl();
    }, [])
  );

  // Check if app was opened with a shared URL
  const checkForSharedUrl = async () => {
    try {
      console.log('📱 Checking AsyncStorage for pending_shared_url...');
      let pendingUrl = await AsyncStorage.getItem('pending_shared_url');
      console.log('📱 AsyncStorage Pending URL:', pendingUrl || 'none');
      
      // Also check native file (Android share intent)
      if (!pendingUrl) {
        try {
          const RNFS = await import('react-native-fs');
          const filePath = `${RNFS.DocumentDirectoryPath}/../files/pending_shared_url.txt`;
          console.log('📱 Checking native file:', filePath);
          
          const fileExists = await RNFS.exists(filePath);
          if (fileExists) {
            const nativeUrl = await RNFS.readFile(filePath, 'utf8');
            console.log('📱 Found URL in native file:', nativeUrl);
            
            if (nativeUrl && nativeUrl.trim()) {
              pendingUrl = nativeUrl.trim();
              // Copy to AsyncStorage for consistency
              await AsyncStorage.setItem('pending_shared_url', pendingUrl);
              // Delete the file
              await RNFS.unlink(filePath);
              console.log('📱 Moved URL from native file to AsyncStorage');
            }
          } else {
            console.log('📱 Native file does not exist');
          }
        } catch (error) {
          console.log('📱 Could not check native file:', error);
        }
      }
      
      console.log('📱 Final Pending URL:', pendingUrl || 'none');
      
      if (pendingUrl) {
        console.log('✅ Found pending shared URL:', pendingUrl);
        
        // Clear it immediately
        await AsyncStorage.removeItem('pending_shared_url');
        console.log('✅ Cleared pending URL from AsyncStorage');
        
        // Store the URL and open modal in paste text mode
        setSharedUrl(pendingUrl);
        
        // Show alert asking user what they want to do
        Alert.alert(
          '📱 Recipe Shared from Social Media',
          `You shared a recipe link!\n\nFrom: ${pendingUrl.includes('instagram') ? 'Instagram' : 'TikTok'}\n\nTo add it:\n\n` +
          '1. Tap "Continue" below\n' +
          '2. Go back to Instagram/TikTok and copy the recipe text\n' +
          '3. Return here and paste it\n' +
          '4. AI will extract everything!',
          [
            {
              text: 'Continue',
              onPress: () => {
                console.log('📱 User tapped Continue, opening modal...');
                setShowAddModal(true);
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                console.log('📱 User cancelled');
                setSharedUrl(null);
              }
            },
          ]
        );
      } else {
        console.log('📱 No pending URL found');
      }
    } catch (error) {
      console.error('❌ Error checking for shared URL:', error);
    }
  };

  // Filter recipes when search changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = recipes.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(query) ||
          recipe.description?.toLowerCase().includes(query)
      );
      setFilteredRecipes(filtered);
    } else {
      setFilteredRecipes(recipes);
    }
  }, [recipes, searchQuery]);

  const loadRecipes = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading recipes:', error);
        setError(error.message || 'Failed to load recipes');
        throw error;
      }
      setRecipes(data || []);
    } catch (error: any) {
      console.error('Error loading recipes:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRecipes();
  };

  const renderRecipe = ({ item }: { item: Recipe }) => {
    return (
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => {
          navigation.navigate('RecipeDetail', { recipeId: item.id });
        }}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.recipeImage} />
        ) : (
          <View style={styles.recipePlaceholder}>
            <Text style={styles.recipePlaceholderText}>🍳</Text>
          </View>
        )}
        <View style={styles.recipeContent}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={styles.recipeDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          {item.source_type && (
            <View style={styles.sourceContainer}>
              <View style={[styles.sourceBadge, { backgroundColor: getSourceColor(item.source_type) }]}>
                <Text style={styles.sourceBadgeText}>{getSourceLabel(item.source_type)}</Text>
              </View>
            </View>
          )}
        </View>
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
        <Text style={styles.errorText}>⚠️ Error Loading Recipes</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRecipes}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (recipes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyText}>No recipes yet</Text>
          <Text style={styles.emptySubtext}>
            Add your first recipe to get started!
          </Text>
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={() => setShowManualModal(true)}
          >
            <Text style={styles.addFirstButtonText}>+ Add Recipe</Text>
          </TouchableOpacity>
        </View>

        {/* Manual Recipe Modal (Primary) */}
        <ManualRecipeModal
          visible={showManualModal}
          onClose={() => setShowManualModal(false)}
          onSuccess={() => {
            setShowManualModal(false);
            loadRecipes();
          }}
          onSwitchToAI={() => {
            setShowManualModal(false);
            setShowAddModal(true);
          }}
        />

        {/* AI Import Modal (Secondary) */}
        <AddRecipeModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadRecipes();
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
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

      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipe}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        numColumns={2}
        columnWrapperStyle={styles.row}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowManualModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Manual Recipe Modal (Primary) */}
      <ManualRecipeModal
        visible={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSuccess={() => {
          setShowManualModal(false);
          loadRecipes();
        }}
        onSwitchToAI={() => {
          setShowManualModal(false);
          setShowAddModal(true);
        }}
      />

      {/* AI Import Modal (Secondary) */}
      <AddRecipeModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSharedUrl(null);
        }}
        onSuccess={() => {
          setShowAddModal(false);
          setSharedUrl(null);
          loadRecipes();
        }}
        initialMode={sharedUrl ? 'text' : null}
        sharedFromSocialMedia={!!sharedUrl}
      />
    </View>
  );
}

const getSourceLabel = (source: string) => {
  const labels: Record<string, string> = {
    web: 'Web',
    tiktok: 'TikTok',
    instagram: 'Instagram',
    manual: 'Manual',
  };
  return labels[source] || source;
};

const getSourceColor = (source: string) => {
  const colors: Record<string, string> = {
    web: '#3498db',
    tiktok: '#000',
    instagram: '#e1306c',
    manual: '#95a5a6',
  };
  return colors[source] || '#95a5a6';
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
    padding: 12,
  },
  row: {
    justifyContent: 'space-between',
  },
  recipeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    maxWidth: '48%',
  },
  recipeImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  recipePlaceholder: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipePlaceholderText: {
    fontSize: 48,
  },
  recipeContent: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 6,
  },
  recipeDescription: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 8,
    lineHeight: 18,
  },
  sourceContainer: {
    flexDirection: 'row',
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sourceBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
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
    textAlign: 'center',
    marginBottom: 20,
  },
  addFirstButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
});
