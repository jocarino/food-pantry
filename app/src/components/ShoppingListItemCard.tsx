import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ShoppingListItem } from '../types/database';

interface ShoppingListItemCardProps {
  item: ShoppingListItem;
  userId: string;
  onDelete: () => void;
  onItemPress: () => void;  // Changed from onItemNamePress to onItemPress (triggers add to pantry)
  onRefresh: () => void;
}

export default function ShoppingListItemCard({
  item,
  userId,
  onDelete,
  onItemPress,
  onRefresh,
}: ShoppingListItemCardProps) {

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'produce': return '#27ae60';
      case 'dairy': return '#3498db';
      case 'meat': return '#e74c3c';
      case 'pantry': return '#f39c12';
      case 'frozen': return '#9b59b6';
      default: return '#95a5a6';
    }
  };

  const getSourceBadgeColor = (source: string | null) => {
    switch (source) {
      case 'recipe': return '#3498db';
      case 'pantry_alert': return '#e74c3c';
      case 'manual': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, item.checked && styles.cardChecked]} 
      onPress={onItemPress}
      accessible={true}
      accessibilityLabel={`${item.name}, ${item.checked ? 'checked' : 'unchecked'}, ${item.category || 'no category'}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.checked }}
      accessibilityHint={item.checked ? 'Tap to uncheck' : 'Tap to add to pantry and check off'}
    >
      {/* Content */}
      <View style={styles.content}>
        {/* Header with item name and badges */}
        <View style={styles.header}>
          <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
            {item.name}
          </Text>
          <View style={styles.badges}>
            {item.category && (
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
                <Text style={styles.badgeText}>{item.category}</Text>
              </View>
            )}
            {item.source && (
              <View style={[styles.sourceBadge, { backgroundColor: getSourceBadgeColor(item.source) }]}>
                <Text style={styles.badgeText}>
                  {item.source === 'recipe' ? '📖' : item.source === 'pantry_alert' ? '⚠️' : '✏️'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {item.source_label && (
          <Text style={[styles.sourceLabel, item.checked && styles.sourceLabelChecked]}>
            {item.source_label}
          </Text>
        )}
      </View>

      {/* Delete button */}
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={(e) => {
          e.stopPropagation(); // Prevent triggering onItemPress
          onDelete();
        }}
        accessible={true}
        accessibilityLabel={`Delete ${item.name}`}
        accessibilityRole="button"
      >
        <Text style={styles.deleteButtonText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  cardChecked: {
    opacity: 0.6,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  header: {
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
    color: '#95a5a6',
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sourceLabel: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
    marginBottom: 8,
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
});
