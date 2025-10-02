import React, { useState } from 'react';
import { DollarSign, Store, Tag, FileText, Plus, X, Calendar, Repeat } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { format } from 'date-fns';

const AddExpense = () => {
  const { addExpense } = useExpenses();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    store: '',
    category: '',
    notes: '',
    date: format(new Date(), 'yyyy-MM-dd'), // Default to today
    isRecurring: false,
    recurringType: 'monthly', // monthly, weekly, yearly
    expectedAmount: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Salary', 'Transfers', 'Healthcare', 'Rent', 'Other'];

  const quickAddExamples = [
    { amount: '45.00', store: 'Starbucks', description: 'Coffee', category: 'Food' },
    { amount: '120.00', store: 'Pick n Pay', description: 'Groceries', category: 'Food' },
    { amount: '350.00', store: 'Shell', description: 'Petrol', category: 'Transport' },
    { amount: '85.00', store: 'Nando\'s', description: 'Fast Food', category: 'Food' },
    { amount: '1500.00', store: 'Eskom', description: 'Electricity Bill', category: 'Bills' },
    { amount: '25000.00', store: 'Company', description: 'Monthly Salary', category: 'Salary' },
    { amount: '500.00', store: 'Bank Transfer', description: 'Transfer from Savings', category: 'Transfers' },
  ];

  const recurringExamples = [
    { amount: '1200.00', store: 'Rent', description: 'Monthly Rent', category: 'Bills', expectedAmount: '1200.00' },
    { amount: '450.00', store: 'Gym Membership', description: 'Monthly Gym Fee', category: 'Bills', expectedAmount: '450.00' },
    { amount: '89.00', store: 'Netflix', description: 'Streaming Service', category: 'Entertainment', expectedAmount: '89.00' },
    { amount: '2500.00', store: 'Car Payment', description: 'Vehicle Finance', category: 'Transport', expectedAmount: '2500.00' },
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleQuickAdd = (example) => {
    setFormData({
      description: example.description,
      amount: example.amount,
      store: example.store,
      category: example.category,
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      isRecurring: false,
      recurringType: 'monthly',
      expectedAmount: '',
    });
    setErrors({});
  };

  const handleRecurringAdd = (example) => {
    setFormData({
      description: example.description,
      amount: example.amount,
      store: example.store,
      category: example.category,
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      isRecurring: true,
      recurringType: 'monthly',
      expectedAmount: example.expectedAmount,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Please enter a valid amount';
      }
    }
    if (!formData.store.trim()) {
      newErrors.store = 'Store name is required';
    }
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (formData.isRecurring && !formData.expectedAmount.trim()) {
      newErrors.expectedAmount = 'Expected amount is required for recurring expenses';
    } else if (formData.isRecurring && formData.expectedAmount.trim()) {
      const expectedAmount = parseFloat(formData.expectedAmount);
      if (isNaN(expectedAmount) || expectedAmount <= 0) {
        newErrors.expectedAmount = 'Please enter a valid expected amount';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const expense = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        store: formData.store.trim(),
        category: formData.category,
        notes: formData.notes.trim(),
        date: formData.date,
        isRecurring: formData.isRecurring,
        recurringType: formData.recurringType,
        expectedAmount: formData.isRecurring ? parseFloat(formData.expectedAmount) : null,
      };

      await addExpense(expense);
      
      // Reset form
      setFormData({
        description: '',
        amount: '',
        store: '',
        category: '',
        notes: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        isRecurring: false,
        recurringType: 'monthly',
        expectedAmount: '',
      });
      
      alert('Expense added successfully!');
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all fields?')) {
      setFormData({
        description: '',
        amount: '',
        store: '',
        category: '',
        notes: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        isRecurring: false,
        recurringType: 'monthly',
        expectedAmount: '',
      });
      setErrors({});
    }
  };

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
          Add Transaction
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.125rem', color: '#6b7280' }}>
          Track your income and spending with detailed information
        </p>
      </div>

      {/* Quick Add Examples */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '0.75rem', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
          Quick Add - One-time Expenses
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          {quickAddExamples.map((example, index) => (
            <button
              key={index}
              onClick={() => handleQuickAdd(example)}
              style={{
                padding: '1rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f1f5f9';
                e.target.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f8fafc';
                e.target.style.borderColor = '#e5e7eb';
              }}
            >
              <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
                R{example.amount}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                {example.store}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                {example.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recurring Examples */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '0.75rem', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
          <Repeat size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Recurring Expenses (Debit Orders)
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          {recurringExamples.map((example, index) => (
            <button
              key={index}
              onClick={() => handleRecurringAdd(example)}
              style={{
                padding: '1rem',
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#fde68a';
                e.target.style.borderColor = '#d97706';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#fef3c7';
                e.target.style.borderColor = '#f59e0b';
              }}
            >
              <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
                R{example.amount}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                {example.store}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                {example.description}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '500' }}>
                Expected: R{example.expectedAmount}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '0.75rem', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
          Expense Details
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            {/* Description */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                <DollarSign size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Description *
              </label>
              <input
                type="text"
                placeholder="e.g., Coffee, Groceries, Petrol"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.description ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: errors.description ? '#fef2f2' : 'white'
                }}
              />
              {errors.description && (
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                  {errors.description}
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                Amount (R) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.amount ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: errors.amount ? '#fef2f2' : 'white'
                }}
              />
              {errors.amount && (
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Store */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                <Store size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Store *
              </label>
              <input
                type="text"
                placeholder="e.g., Pick n Pay, Shell, Starbucks"
                value={formData.store}
                onChange={(e) => handleChange('store', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.store ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: errors.store ? '#fef2f2' : 'white'
                }}
              />
              {errors.store && (
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                  {errors.store}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                <Calendar size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.date ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: errors.date ? '#fef2f2' : 'white'
                }}
              />
              {errors.date && (
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                  {errors.date}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                <Tag size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Category *
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                gap: '0.5rem' 
              }}>
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleChange('category', category)}
                    style={{
                      padding: '0.75rem',
                      border: `1px solid ${formData.category === category ? '#3b82f6' : '#d1d5db'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      backgroundColor: formData.category === category ? '#3b82f6' : 'white',
                      color: formData.category === category ? 'white' : '#374151',
                      transition: 'all 0.2s'
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
              {errors.category && (
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                  {errors.category}
                </p>
              )}
            </div>
          </div>

          {/* Recurring Expense Section */}
          <div style={{ 
            backgroundColor: '#fef3c7', 
            padding: '1.5rem', 
            borderRadius: '0.75rem', 
            border: '1px solid #f59e0b',
            marginBottom: '1.5rem'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '1rem' 
            }}>
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => handleChange('isRecurring', e.target.checked)}
                style={{ 
                  marginRight: '0.5rem',
                  transform: 'scale(1.2)'
                }}
              />
              <label 
                htmlFor="isRecurring"
                style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: '#1f2937',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Repeat size={20} style={{ marginRight: '0.5rem' }} />
                This is a recurring expense (debit order)
              </label>
            </div>

            {formData.isRecurring && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1rem' 
              }}>
                {/* Recurring Type */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151', 
                    marginBottom: '0.5rem' 
                  }}>
                    Frequency
                  </label>
                  <select
                    value={formData.recurringType}
                    onChange={(e) => handleChange('recurringType', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                {/* Expected Amount */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151', 
                    marginBottom: '0.5rem' 
                  }}>
                    Expected Amount (R) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.expectedAmount}
                    onChange={(e) => handleChange('expectedAmount', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.expectedAmount ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      backgroundColor: errors.expectedAmount ? '#fef2f2' : 'white'
                    }}
                  />
                  {errors.expectedAmount && (
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                      {errors.expectedAmount}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '0.5rem' 
            }}>
              <FileText size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Notes (Optional)
            </label>
            <textarea
              placeholder="Additional notes about this expense..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                outline: 'none',
                backgroundColor: 'white',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'flex-end' 
          }}>
            <button
              type="button"
              onClick={handleClear}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <X size={16} style={{ marginRight: '0.5rem' }} />
              Clear
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 1.5rem',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <div style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid #ffffff40', 
                    borderTop: '2px solid #ffffff', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite',
                    marginRight: '0.5rem'
                  }}></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={16} style={{ marginRight: '0.5rem' }} />
                  Add Transaction
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;