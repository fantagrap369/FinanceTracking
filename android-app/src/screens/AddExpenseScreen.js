import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ExpenseService from '../services/ExpenseService';
import DescriptionLearner from '../services/DescriptionLearner';

const AddExpenseScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    store: '',
    category: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];

  const quickAddExamples = [
    { amount: '45.00', store: 'Starbucks', description: 'Coffee', category: 'Food' },
    { amount: '120.00', store: 'Pick n Pay', description: 'Groceries', category: 'Food' },
    { amount: '350.00', store: 'Shell', description: 'Petrol', category: 'Transport' },
    { amount: '85.00', store: 'Nando\'s', description: 'Fast Food', category: 'Food' },
    { amount: '1500.00', store: 'Eskom', description: 'Electricity Bill', category: 'Bills' },
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuickAdd = (example) => {
    setFormData({
      description: example.description,
      amount: example.amount,
      store: example.store,
      category: example.category,
      notes: '',
    });
  };

  const validateForm = () => {
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }
    if (!formData.amount.trim()) {
      Alert.alert('Error', 'Please enter an amount');
      return false;
    }
    if (!formData.store.trim()) {
      Alert.alert('Error', 'Please enter a store name');
      return false;
    }
    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const expense = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        store: formData.store.trim(),
        category: formData.category,
        notes: formData.notes.trim(),
      };

      await ExpenseService.addExpense(expense);
      
      // Learn this description for future use
      await DescriptionLearner.learnDescription(
        expense.store,
        expense.description,
        expense.category,
        expense.amount
      );

      Alert.alert(
        'Success',
        'Expense added successfully!',
        [
          {
            text: 'Add Another',
            onPress: () => {
              setFormData({
                description: '',
                amount: '',
                store: '',
                category: '',
                notes: '',
              });
            }
          },
          {
            text: 'View Expenses',
            onPress: () => navigation.navigate('Expenses')
          }
        ]
      );
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Form',
      'Are you sure you want to clear all fields?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setFormData({
              description: '',
              amount: '',
              store: '',
              category: '',
              notes: '',
            });
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <Text style={styles.headerSubtext}>
            Track your spending with detailed information
          </Text>
        </View>

        {/* Quick Add Examples */}
        <View style={styles.quickAddContainer}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.quickAddGrid}>
            {quickAddExamples.map((example, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickAddButton}
                onPress={() => handleQuickAdd(example)}
              >
                <Text style={styles.quickAddAmount}>R{example.amount}</Text>
                <Text style={styles.quickAddStore}>{example.store}</Text>
                <Text style={styles.quickAddDescription}>{example.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Expense Details</Text>
          
          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Coffee, Groceries, Petrol"
              value={formData.description}
              onChangeText={(value) => handleChange('description', value)}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount (R) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0.00"
              value={formData.amount}
              onChangeText={(value) => handleChange('amount', value)}
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Store */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Store *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Pick n Pay, Shell, Starbucks"
              value={formData.store}
              onChangeText={(value) => handleChange('store', value)}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category *</Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    formData.category === category && styles.categoryButtonActive,
                  ]}
                  onPress={() => handleChange('category', category)}
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
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Additional notes about this expense..."
              value={formData.notes}
              onChangeText={(value) => handleChange('notes', value)}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
          >
            <Icon name="clear" size={20} color="#6b7280" />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.submitButtonText}>Adding...</Text>
            ) : (
              <>
                <Icon name="add" size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>Add Expense</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
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
  quickAddContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAddButton: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
    flex: 1,
  },
  quickAddAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  quickAddStore: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  quickAddDescription: {
    fontSize: 10,
    color: '#9ca3af',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
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
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clearButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AddExpenseScreen;