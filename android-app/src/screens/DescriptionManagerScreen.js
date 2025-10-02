import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DescriptionLearner from '../services/DescriptionLearner';

const DescriptionManagerScreen = ({ navigation }) => {
  const [descriptions, setDescriptions] = useState([]);
  const [filteredDescriptions, setFilteredDescriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDescription, setSelectedDescription] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    store: '',
    description: '',
    category: ''
  });
  const [stats, setStats] = useState(null);

  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];

  useEffect(() => {
    loadDescriptions();
  }, []);

  useEffect(() => {
    filterDescriptions();
  }, [descriptions, searchTerm]);

  const loadDescriptions = async () => {
    try {
      const data = DescriptionLearner.getAllDescriptions();
      setDescriptions(data);
      
      const statsData = DescriptionLearner.getStats();
      setStats(statsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load descriptions');
    }
  };

  const filterDescriptions = () => {
    if (!searchTerm) {
      setFilteredDescriptions(descriptions);
      return;
    }

    const filtered = descriptions.filter(desc =>
      desc.store.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredDescriptions(filtered);
  };

  const handleEdit = (description) => {
    setSelectedDescription(description);
    setEditForm({
      store: description.store,
      description: description.description,
      category: description.category
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (editForm.description.trim() && editForm.category) {
        await DescriptionLearner.updateDescription(
          editForm.store,
          editForm.description.trim(),
          editForm.category
        );
        
        await loadDescriptions();
        setEditModalVisible(false);
        Alert.alert('Success', 'Description updated successfully');
      } else {
        Alert.alert('Error', 'Please fill in all fields');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update description');
    }
  };

  const handleDelete = (store) => {
    Alert.alert(
      'Delete Description',
      `Are you sure you want to delete the description for "${store}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DescriptionLearner.deleteDescription(store);
              await loadDescriptions();
              Alert.alert('Success', 'Description deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete description');
            }
          },
        },
      ]
    );
  };

  const renderDescription = ({ item }) => (
    <View style={styles.descriptionItem}>
      <View style={styles.descriptionInfo}>
        <Text style={styles.storeName}>{item.store}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <View style={styles.metaInfo}>
          <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(item.category) }]}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Text style={styles.countText}>Used {item.count} times</Text>
          <Text style={styles.dateText}>
            {new Date(item.lastUsed).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEdit(item)}
        >
          <Icon name="edit" size={20} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.store)}
        >
          <Icon name="delete" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const getCategoryColor = (category) => {
    const colors = {
      'Food': '#fef3c7',
      'Transport': '#dbeafe',
      'Shopping': '#f3e8ff',
      'Bills': '#fecaca',
      'Entertainment': '#d1fae5',
      'Other': '#f3f4f6'
    };
    return colors[category] || '#f3f4f6';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.title}>Description Manager</Text>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalStores}</Text>
            <Text style={styles.statLabel}>Stores</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalTransactions}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.averageTransactionsPerStore}</Text>
            <Text style={styles.statLabel}>Avg/Store</Text>
          </View>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search descriptions..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Descriptions List */}
      <FlatList
        data={filteredDescriptions}
        renderItem={renderDescription}
        keyExtractor={(item) => item.store}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="description" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No descriptions found</Text>
            <Text style={styles.emptySubtext}>
              {searchTerm ? 'Try adjusting your search' : 'Descriptions will appear as you add expenses'}
            </Text>
          </View>
        }
      />

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Description</Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveEdit}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Store Name</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={editForm.store}
                editable={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={styles.input}
                value={editForm.description}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, description: text }))}
                placeholder="Enter description..."
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      editForm.category === category && styles.categoryButtonSelected
                    ]}
                    onPress={() => setEditForm(prev => ({ ...prev, category }))}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      editForm.category === category && styles.categoryButtonTextSelected
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  listContainer: {
    padding: 16,
  },
  descriptionItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  descriptionInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
  },
  countText: {
    fontSize: 10,
    color: '#6b7280',
    marginRight: 8,
  },
  dateText: {
    fontSize: 10,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 4,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#f9fafb',
    color: '#6b7280',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  categoryButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  categoryButtonTextSelected: {
    color: 'white',
  },
});

export default DescriptionManagerScreen;
