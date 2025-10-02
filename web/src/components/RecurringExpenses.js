import React, { useState, useEffect } from 'react';
import { Repeat, Plus, Edit, Trash2, AlertTriangle, CheckCircle, Calendar, DollarSign, Store, Tag } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';

const RecurringExpenses = () => {
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    store: '',
    category: '',
    notes: '',
    recurringType: 'monthly',
    expectedAmount: '',
    nextDueDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [errors, setErrors] = useState({});

  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];

  useEffect(() => {
    loadRecurringExpenses();
  }, [expenses]);

  const loadRecurringExpenses = () => {
    // Get unique recurring expenses (grouped by store and description)
    const recurringMap = new Map();
    
    expenses
      .filter(expense => expense.isRecurring)
      .forEach(expense => {
        const key = `${expense.store}-${expense.description}`;
        if (!recurringMap.has(key)) {
          recurringMap.set(key, {
            ...expense,
            lastOccurrence: expense.date,
            totalOccurrences: 1,
            averageAmount: expense.amount,
            nextDueDate: calculateNextDueDate(expense.date, expense.recurringType)
          });
        } else {
          const existing = recurringMap.get(key);
          existing.totalOccurrences += 1;
          existing.averageAmount = (existing.averageAmount + expense.amount) / 2;
          if (new Date(expense.date) > new Date(existing.lastOccurrence)) {
            existing.lastOccurrence = expense.date;
            existing.nextDueDate = calculateNextDueDate(expense.date, expense.recurringType);
          }
        }
      });

    setRecurringExpenses(Array.from(recurringMap.values()));
  };

  const calculateNextDueDate = (lastDate, recurringType) => {
    const date = new Date(lastDate);
    switch (recurringType) {
      case 'weekly':
        return addWeeks(date, 1);
      case 'monthly':
        return addMonths(date, 1);
      case 'yearly':
        return addYears(date, 1);
      default:
        return addMonths(date, 1);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Food': '#ef4444',
      'Transport': '#3b82f6',
      'Shopping': '#8b5cf6',
      'Bills': '#f59e0b',
      'Entertainment': '#10b981',
      'Other': '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
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
    if (!formData.expectedAmount.trim()) {
      newErrors.expectedAmount = 'Expected amount is required';
    } else {
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
      const expense = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        store: formData.store.trim(),
        category: formData.category,
        notes: formData.notes.trim(),
        date: formData.nextDueDate,
        isRecurring: true,
        recurringType: formData.recurringType,
        expectedAmount: parseFloat(formData.expectedAmount),
      };

      if (editingExpense) {
        await updateExpense({ ...editingExpense, ...expense });
        setEditingExpense(null);
      } else {
        await addExpense(expense);
      }

      // Reset form
      setFormData({
        description: '',
        amount: '',
        store: '',
        category: '',
        notes: '',
        recurringType: 'monthly',
        expectedAmount: '',
        nextDueDate: format(new Date(), 'yyyy-MM-dd'),
      });
      setShowAddForm(false);
      setErrors({});
    } catch (error) {
      console.error('Error saving recurring expense:', error);
      alert('Failed to save recurring expense. Please try again.');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.expectedAmount || expense.averageAmount,
      store: expense.store,
      category: expense.category,
      notes: expense.notes || '',
      recurringType: expense.recurringType,
      expectedAmount: expense.expectedAmount || expense.averageAmount,
      nextDueDate: expense.nextDueDate,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (expense) => {
    if (window.confirm(`Are you sure you want to delete this recurring expense: ${expense.description}?`)) {
      try {
        // Delete all occurrences of this recurring expense
        const expensesToDelete = expenses.filter(exp => 
          exp.isRecurring && 
          exp.store === expense.store && 
          exp.description === expense.description
        );
        
        for (const exp of expensesToDelete) {
          await deleteExpense(exp.id);
        }
      } catch (error) {
        console.error('Error deleting recurring expense:', error);
        alert('Failed to delete recurring expense. Please try again.');
      }
    }
  };

  const handleQuickAdd = (expense) => {
    const newExpense = {
      description: expense.description,
      amount: expense.expectedAmount || expense.averageAmount,
      store: expense.store,
      category: expense.category,
      notes: `Recurring ${expense.recurringType} expense`,
      date: format(new Date(), 'yyyy-MM-dd'),
      isRecurring: true,
      recurringType: expense.recurringType,
      expectedAmount: expense.expectedAmount || expense.averageAmount,
    };

    addExpense(newExpense);
  };

  const isOverdue = (nextDueDate) => {
    return new Date(nextDueDate) < new Date();
  };

  const getDaysUntilDue = (nextDueDate) => {
    const today = new Date();
    const due = new Date(nextDueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
            <Repeat size={28} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Recurring Expenses
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.125rem', color: '#6b7280' }}>
            Manage your monthly debit orders and recurring payments
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} style={{ marginRight: '0.5rem' }} />
          Add Recurring Expense
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
            {editingExpense ? 'Edit Recurring Expense' : 'Add New Recurring Expense'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1rem',
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
                  Description *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Monthly Rent, Gym Membership"
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

              {/* Store */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '0.5rem' 
                }}>
                  Store/Provider *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Landlord, Virgin Active"
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

              {/* Category */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '0.5rem' 
                }}>
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${errors.category ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    backgroundColor: errors.category ? '#fef2f2' : 'white'
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                    {errors.category}
                  </p>
                )}
              </div>

              {/* Frequency */}
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

              {/* Next Due Date */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '0.5rem' 
                }}>
                  Next Due Date
                </label>
                <input
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) => handleChange('nextDueDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                />
              </div>
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
                Notes (Optional)
              </label>
              <textarea
                placeholder="Additional notes about this recurring expense..."
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
                onClick={() => {
                  setShowAddForm(false);
                  setEditingExpense(null);
                  setFormData({
                    description: '',
                    amount: '',
                    store: '',
                    category: '',
                    notes: '',
                    recurringType: 'monthly',
                    expectedAmount: '',
                    nextDueDate: format(new Date(), 'yyyy-MM-dd'),
                  });
                  setErrors({});
                }}
                style={{
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
                Cancel
              </button>

              <button
                type="submit"
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {editingExpense ? 'Update' : 'Add'} Recurring Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recurring Expenses List */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '0.75rem', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
          Active Recurring Expenses ({recurringExpenses.length})
        </h3>
        
        {recurringExpenses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recurringExpenses.map((expense, index) => {
              const daysUntilDue = getDaysUntilDue(expense.nextDueDate);
              const isOverdueExpense = isOverdue(expense.nextDueDate);
              
              return (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1.5rem',
                  backgroundColor: isOverdueExpense ? '#fef2f2' : '#f8fafc',
                  borderRadius: '0.5rem',
                  border: `1px solid ${isOverdueExpense ? '#fecaca' : '#e5e7eb'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div style={{ 
                      backgroundColor: getCategoryColor(expense.category) + '20', 
                      padding: '0.75rem', 
                      borderRadius: '0.5rem',
                      marginRight: '1rem'
                    }}>
                      <Repeat size={20} color={getCategoryColor(expense.category)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                          {expense.description}
                        </h4>
                        <span style={{
                          marginLeft: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#fef3c7',
                          color: '#d97706',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          borderRadius: '0.25rem'
                        }}>
                          {expense.recurringType}
                        </span>
                        <span style={{
                          marginLeft: '0.5rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: getCategoryColor(expense.category) + '20',
                          color: getCategoryColor(expense.category),
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          borderRadius: '0.25rem'
                        }}>
                          {expense.category}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Store size={14} style={{ marginRight: '0.25rem' }} />
                          {expense.store}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Calendar size={14} style={{ marginRight: '0.25rem' }} />
                          Next due: {format(new Date(expense.nextDueDate), 'MMM dd, yyyy')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <DollarSign size={14} style={{ marginRight: '0.25rem' }} />
                          {expense.totalOccurrences} occurrence{expense.totalOccurrences !== 1 ? 's' : ''}
                        </div>
                      </div>
                      {expense.notes && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                          {expense.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                        {formatCurrency(expense.expectedAmount || expense.averageAmount)}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                        {isOverdueExpense ? (
                          <>
                            <AlertTriangle size={12} color="#ef4444" />
                            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '500' }}>
                              Overdue by {Math.abs(daysUntilDue)} days
                            </span>
                          </>
                        ) : daysUntilDue <= 7 ? (
                          <>
                            <AlertTriangle size={12} color="#f59e0b" />
                            <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '500' }}>
                              Due in {daysUntilDue} days
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={12} color="#10b981" />
                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '500' }}>
                              Due in {daysUntilDue} days
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleQuickAdd(expense)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                        title="Add this expense now"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => handleEdit(expense)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#f3f4f6',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Edit size={16} color="#6b7280" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#fef2f2',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            padding: '4rem',
            color: '#6b7280'
          }}>
            <Repeat size={64} color="#d1d5db" />
            <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '500' }}>
              No recurring expenses found
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', textAlign: 'center' }}>
              Add your first recurring expense to start tracking monthly payments
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecurringExpenses;
