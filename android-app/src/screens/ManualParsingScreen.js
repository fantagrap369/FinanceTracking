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
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import FailedParsingManager from '../services/FailedParsingManager';
import ExpenseService from '../services/ExpenseService';
import DescriptionLearner from '../services/DescriptionLearner';

const ManualParsingScreen = ({ navigation }) => {
  const [failedAttempts, setFailedAttempts] = useState([]);
  const [filteredAttempts, setFilteredAttempts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    store: '',
    category: '',
    notes: ''
  });

  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];
  const sources = ['all', 'notification', 'sms'];

  useEffect(() => {
    loadFailedAttempts();
  }, []);

  useEffect(() => {
    filterAttempts();
  }, [failedAttempts, searchTerm, selectedSource]);

  const loadFailedAttempts = async () => {
    try {
      setLoading(true);
      const attempts = FailedParsingManager.getAllFailedAttempts();
      setFailedAttempts(attempts);
    } catch (error) {
      console.error('Error loading failed attempts:', error);
      Alert.alert('Error', 'Failed to load failed parsing attempts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFailedAttempts();
    setRefreshing(false);
  };

  const filterAttempts = () => {
    let filtered = failedAttempts;

    // Filter by source
    if (selectedSource !== 'all') {
      filtered = filtered.filter(attempt => attempt.source === selectedSource);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(attempt =>
        attempt.originalText.toLowerCase().includes(term)
      );
    }

    setFilteredAttempts(filtered);
  };

  const handleProcessAttempt = (attempt) => {
    setSelectedAttempt(attempt);
    
    // Try to pre-fill form with basic parsing
    const basicParsing = parseBasicText(attempt.originalText);
    setFormData({
      description: basicParsing.description,
      amount: basicParsing.amount,
      store: basicParsing.store,
      category: basicParsing.category,
      notes: `From ${attempt.source}: "${attempt.originalText}"`
    });
    
    setModalVisible(true);
  };

  const parseBasicText = (text) => {
    // Basic regex parsing as fallback
    const amountMatch = text.match(/R?\s?(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? amountMatch[1] : '';
    
    // Try to extract store name (basic patterns)
    const storePatterns = [
      /at\s+([A-Za-z\s&'.-]+?)(?:\s|$|,|\.)/i,
      /to\s+([A-Za-z\s&'.-]+?)(?:\s|$|,|\.)/i,
      /from\s+([A-Za-z\s&'.-]+?)(?:\s|$|,|\.)/i
    ];
    
    let store = '';
    for (const pattern of storePatterns) {
      const match = text.match(pattern);
      if (match) {
        store = match[1].trim();
        break;
      }
    }
    
    return {
      description: store ? 'Purchase' : 'Expense',
      amount,
      store: store || 'Unknown Store',
      category: 'Other',
      notes: ''
    };
  };

  const handleSubmit = async () => {
    if (!formData.description.trim() || !formData.amount.trim() || !formData.store.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const expense = {
        description: formData.description.trim(),
        amount,
        store: formData.store.trim(),
        category: formData.category,
        notes: formData.notes.trim(),
      };

      // Add expense
      await ExpenseService.addExpense(expense);
      
      // Learn this description
      await DescriptionLearner.learnDescription(
        expense.store,
        expense.description,
        expense.category,
        expense.amount
      );

      // Mark attempt as processed
      await FailedParsingManager.processFailedAttempt(selectedAttempt.id, expense);

      Alert.alert('Success', 'Expense added successfully!');
      setModalVisible(false);
      await loadFailedAttempts();
    } catch (error) {
      console.error('Error processing attempt:', error);
      Alert.alert('Error', 'Failed to process attempt');
    }
  };

  const handleSkip = async () => {
    Alert.alert(
      'Skip Attempt',
      'Are you sure you want to skip this parsing attempt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            await FailedParsingManager.markAsProcessed(selectedAttempt.id);
            setModalVisible(false);
            await loadFailedAttempts();
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Failed Attempts',
      'Are you sure you want to clear all failed parsing attempts? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await FailedParsingManager.clearAllFailedAttempts();
            await loadFailedAttempts();
          }
        }
      ]
    );
  };

  const renderAttemptItem = ({ item }) => (
    <TouchableOpacity
      style={styles.attemptItem}
      onPress={() => handleProcessAttempt(item)}
    >
      <View style={styles.attemptItemLeft}>
        <View style={styles.attemptItemIcon}>
          <Icon 
            name={item.source === 'notification' ? 'notifications' : 'message'} 
            size={20} 
            color="#6b7280" 
          />
        </View>
        <View style={styles.attemptItemDetails}>
          <Text style={styles.attemptItemSource}>
            {item.source === 'notification' ? 'Notification' : 'SMS'}
          </Text>
          <Text style={styles.attemptItemText} numberOfLines={2}>
            {item.originalText}
          </Text>
          <Text style={styles.attemptItemDate}>
            {format(new Date(item.timestamp), 'MMM dd, yyyy • hh:mm a')}
          </Text>
        </View>
      </View>
      <Icon name="chevron-right" size={24} color="#9ca3af" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="check-circle" size={64} color="#10b981" />
      <Text style={styles.emptyStateText}>No Failed Attempts</Text>
      <Text style={styles.emptyStateSubtext}>
        All parsing attempts have been processed successfully!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading failed attempts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manual Parsing</Text>
        <Text style={styles.headerSubtext}>
          Process failed AI parsing attempts
        </Text>
        {failedAttempts.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAll}
          >
            <Icon name="clear-all" size={16} color="#ef4444" />
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search failed attempts..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9ca3af"
          />
        </View>
        
        <View style={styles.sourceFilter}>
          {sources.map((source) => (
            <TouchableOpacity
              key={source}
              style={[
                styles.sourceButton,
                selectedSource === source && styles.sourceButtonActive,
              ]}
              onPress={() => setSelectedSource(source)}
            >
              <Text
                style={[
                  styles.sourceButtonText,
                  selectedSource === source && styles.sourceButtonTextActive,
                ]}
              >
                {source === 'all' ? 'All' : source.charAt(0).toUpperCase() + source.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Attempts List */}
      <FlatList
        data={filteredAttempts}
        renderItem={renderAttemptItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Processing Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Process Attempt</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.originalTextContainer}>
              <Text style={styles.originalTextLabel}>Original Text:</Text>
              <Text style={styles.originalText}>{selectedAttempt?.originalText}</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>Description *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Coffee, Groceries"
                value={formData.description}
                onChangeText={(value) => setFormData(prev => ({ ...prev, description: value }))}
              />

              <Text style={styles.formLabel}>Amount (R) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0.00"
                value={formData.amount}
                onChangeText={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                keyboardType="numeric"
              />

              <Text style={styles.formLabel}>Store *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Pick n Pay, Shell"
                value={formData.store}
                onChangeText={(value) => setFormData(prev => ({ ...prev, store: value }))}
              />

              <Text style={styles.formLabel}>Category *</Text>
              <View style={styles.categoryGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      formData.category === category && styles.categoryButtonActive,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, category }))}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        formData.category === category && styles.categoryButtonTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Additional notes..."
                value={formData.notes}
                onChangeText={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  clearAllButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearAllText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  sourceFilter: {
    flexDirection: 'row',
    gap: 8,
  },
  sourceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sourceButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  sourceButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  sourceButtonTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    paddingBottom: 20,
  },
  attemptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  attemptItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attemptItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attemptItemDetails: {
    flex: 1,
  },
  attemptItemSource: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
    marginBottom: 4,
  },
  attemptItemText: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 4,
  },
  attemptItemDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  originalTextContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  originalTextLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  originalText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
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
    borderColor: '#e5e7eb',
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
});

export default ManualParsingScreen;
