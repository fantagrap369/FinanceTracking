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

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.description.trim() || !formData.amount.trim()) {
      Alert.alert('Error', 'Please fill in description and amount');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await ExpenseService.addExpense({
        ...formData,
        amount: amount,
        source: 'manual'
      });
      
      Alert.alert('Success', 'Expense added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      
      // Reset form
      setFormData({
        description: '',
        amount: '',
        store: '',
        category: '',
        notes: '',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickAdd = (description, amount, store, category) => {
    setFormData(prev => ({
      ...prev,
      description,
      amount: amount.toString(),
      store,
      category
    }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={styles.input}
              placeholder="What did you buy?"
              value={formData.description}
              onChangeText={(value) => handleChange('description', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={formData.amount}
              onChangeText={(value) => handleChange('amount', value)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store/Merchant</Text>
            <TextInput
              style={styles.input}
              placeholder="Where did you buy it?"
              value={formData.store}
              onChangeText={(value) => handleChange('store', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    formData.category === category && styles.categoryButtonSelected
                  ]}
                  onPress={() => handleChange('category', category)}
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any additional notes..."
              value={formData.notes}
              onChangeText={(value) => handleChange('notes', value)}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Quick Add Examples */}
        <View style={styles.quickAddContainer}>
          <Text style={styles.quickAddTitle}>Quick Add</Text>
          <View style={styles.quickAddGrid}>
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => quickAdd('Coffee', '45.00', 'Starbucks', 'Food')}
            >
              <Icon name="local-cafe" size={24} color="#3b82f6" />
              <Text style={styles.quickAddText}>Coffee</Text>
              <Text style={styles.quickAddAmount}>R45.00</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => quickAdd('Petrol', '450.00', 'Shell', 'Transport')}
            >
              <Icon name="local-gas-station" size={24} color="#3b82f6" />
              <Text style={styles.quickAddText}>Petrol</Text>
              <Text style={styles.quickAddAmount}>R450.00</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => quickAdd('Groceries', '853.00', 'Pick n Pay', 'Food')}
            >
              <Icon name="shopping-cart" size={24} color="#3b82f6" />
              <Text style={styles.quickAddText}>Groceries</Text>
              <Text style={styles.quickAddAmount}>R853.00</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => quickAdd('Lunch', '125.00', 'Restaurant', 'Food')}
            >
              <Icon name="restaurant" size={24} color="#3b82f6" />
              <Text style={styles.quickAddText}>Lunch</Text>
              <Text style={styles.quickAddAmount}>R125.00</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Icon name="save" size={20} color="white" />
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding...' : 'Add Expense'}
          </Text>
        </TouchableOpacity>
      </View>
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
  form: {
    padding: 16,
  },
  inputGroup: {
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  quickAddContainer: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickAddTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAddButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickAddText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
  },
  quickAddAmount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddExpenseScreen;
