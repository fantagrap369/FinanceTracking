import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DescriptionLearner from '../services/DescriptionLearner';

const StoreManagerScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('stores'); // 'stores' or 'categories'
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('store'); // 'store' or 'category'
  const [formData, setFormData] = useState({
    storeName: '',
    description: '',
    category: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storeData = DescriptionLearner.getAllDescriptions();
      setStores(storeData);
      
      const categoryData = DescriptionLearner.getAvailableCategories();
      setCategories(categoryData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const handleCreateStore = async () => {
    try {
      if (!formData.storeName.trim() || !formData.description.trim() || !formData.category) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      await DescriptionLearner.createManualStore(
        formData.storeName.trim(),
        formData.description.trim(),
        formData.category
      );
      
      await loadData();
      setModalVisible(false);
      setFormData({ storeName: '', description: '', category: '' });
      Alert.alert('Success', 'Store created successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCreateCategory = async () => {
    try {
      if (!formData.category.trim()) {
        Alert.alert('Error', 'Please enter a category name');
        return;
      }

      await DescriptionLearner.createCustomCategory(formData.category.trim());
      
      await loadData();
      setModalVisible(false);
      setFormData({ storeName: '', description: '', category: '' });
      Alert.alert('Success', 'Category created successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteStore = (storeName) => {
    Alert.alert(
      'Delete Store',
      `Are you sure you want to delete "${storeName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DescriptionLearner.deleteDescription(storeName);
              await loadData();
              Alert.alert('Success', 'Store deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete store');
            }
          },
        },
      ]
    );
  };

  const openCreateModal = (type) => {
    setModalType(type);
    setFormData({ storeName: '', description: '', category: '' });
    setModalVisible(true);
  };

  const filteredStores = stores.filter(store =>
    store.store.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStore = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.storeName}>{item.store}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <View style={styles.metaInfo}>
          <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(item.category) }]}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          {item.isManual && (
            <View style={styles.manualTag}>
              <Text style={styles.manualText}>Manual</Text>
            </View>
          )}
          <Text style={styles.countText}>
            {item.count > 0 ? `Used ${item.count} times` : 'Not used yet'}
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            // TODO: Implement edit functionality
            Alert.alert('Edit', 'Edit functionality coming soon!');
          }}
        >
          <Icon name="edit" size={20} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteStore(item.store)}
        >
          <Icon name="delete" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategory = ({ item }) => (
    <View style={styles.categoryCard}>
      <View style={[styles.categoryIndicator, { backgroundColor: getCategoryColor(item) }]} />
      <Text style={styles.categoryName}>{item}</Text>
      <Text style={styles.categoryCount}>
        {stores.filter(store => store.category === item).length} stores
      </Text>
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
        <Text style={styles.title}>Store Manager</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stores' && styles.activeTab]}
          onPress={() => setActiveTab('stores')}
        >
          <Text style={[styles.tabText, activeTab === 'stores' && styles.activeTabText]}>
            Stores
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'categories' && styles.activeTab]}
          onPress={() => setActiveTab('categories')}
        >
          <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>
            Categories
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Content */}
      {activeTab === 'stores' ? (
        <FlatList
          data={filteredStores}
          renderItem={renderStore}
          keyExtractor={(item) => item.store}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="store" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No stores found</Text>
              <Text style={styles.emptySubtext}>
                {searchTerm ? 'Try adjusting your search' : 'Create your first store to get started'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => openCreateModal(activeTab === 'stores' ? 'store' : 'category')}
      >
        <Icon name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {modalType === 'store' ? 'Create Store' : 'Create Category'}
            </Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={modalType === 'store' ? handleCreateStore : handleCreateCategory}
            >
              <Text style={styles.saveButtonText}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {modalType === 'store' ? (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Store Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter store name..."
                    value={formData.storeName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, storeName: text }))}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter description..."
                    value={formData.description}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
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
                          formData.category === category && styles.categoryButtonSelected
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, category }))}
                      >
                        <Text style={[
                          styles.categoryButtonText,
                          formData.category === category && styles.categoryButtonTextSelected
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Category Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter category name..."
                  value={formData.category}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
                />
                <Text style={styles.helpText}>
                  This category will be available for use when creating stores.
                </Text>
              </View>
            )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
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
  itemCard: {
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
  itemInfo: {
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
  manualTag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  manualText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#1e40af',
  },
  countText: {
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
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  categoryIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6b7280',
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
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
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

export default StoreManagerScreen;
