import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Edit, Trash2, Calendar, DollarSign, Store, Repeat, AlertTriangle, X, Save, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { format } from 'date-fns';
import AccountSelector from './AccountSelector';

const Expenses = () => {
  const { expenses, loading, fetchExpenses, deleteExpense, updateExpense, selectedAccount, getAccountExpenses } = useExpenses();
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm, setEditForm] = useState({
    description: '',
    amount: '',
    category: '',
    date: '',
    store: '',
    notes: ''
  });
  const [showTable, setShowTable] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const categories = ['All', 'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Salary', 'Transfers', 'Healthcare', 'Rent', 'Other'];

  const filterAndSortExpenses = useCallback(() => {
    // Get account-specific expenses
    const accountExpenses = selectedAccount ? getAccountExpenses() : expenses;
    let filtered = [...accountExpenses];

    // Filter by time period
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (timeFilter === '7days') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      filtered = filtered.filter(expense => new Date(expense.date) >= sevenDaysAgo);
    } else if (timeFilter === '30days') {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      filtered = filtered.filter(expense => new Date(expense.date) >= thirtyDaysAgo);
    } else if (timeFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
      const startDate = new Date(customDateRange.startDate);
      const endDate = new Date(customDateRange.endDate);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      });
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(term) ||
        expense.store.toLowerCase().includes(term) ||
        expense.notes?.toLowerCase().includes(term)
      );
    }

    // Sort expenses
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'store':
          aValue = a.store.toLowerCase();
          bValue = b.store.toLowerCase();
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, selectedCategory, sortBy, sortOrder, selectedAccount, getAccountExpenses, timeFilter, customDateRange]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    filterAndSortExpenses();
  }, [filterAndSortExpenses]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const isIncome = (expense) => {
    return expense.category === 'Salary' || (expense.category === 'Transfers' && expense.isIncome) || expense.isIncome;
  };

  const getAmountColor = (expense) => {
    return isIncome(expense) ? '#22c55e' : '#ef4444'; // Green for income, red for spending
  };

  const getTotalAmount = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  // Display all filtered expenses
  const displayExpenses = filteredExpenses;

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return <ArrowUpDown size={14} />;
    return sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const handleDeleteExpense = (expense) => {
    if (window.confirm(`Are you sure you want to delete "${expense.description}"?`)) {
      deleteExpense(expense.id);
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setEditForm({
      description: expense.description || '',
      amount: expense.amount || '',
      category: expense.category || '',
      date: expense.date ? format(new Date(expense.date), 'yyyy-MM-dd') : '',
      store: expense.store || '',
      notes: expense.notes || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingExpense) return;

    try {
      const updates = {
        description: editForm.description,
        amount: parseFloat(editForm.amount),
        category: editForm.category,
        date: editForm.date,
        store: editForm.store,
        notes: editForm.notes
      };

      await updateExpense(editingExpense.id, updates);
      setEditingExpense(null);
      setEditForm({
        description: '',
        amount: '',
        category: '',
        date: '',
        store: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Failed to update transaction. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setEditForm({
      description: '',
      amount: '',
      category: '',
      date: '',
      store: '',
      notes: ''
    });
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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f4f6', 
            borderTop: '4px solid #3b82f6', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
              Transactions
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.125rem', color: '#6b7280' }}>
              {formatCurrency(getTotalAmount())} • {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}
              {selectedAccount ? ` • ${selectedAccount}` : ''}
            </p>
          </div>
          <AccountSelector />
        </div>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            textDecoration: 'none'
          }}
          onClick={() => window.location.href = '/add'}
        >
          <DollarSign size={16} style={{ marginRight: '0.5rem' }} />
          Add Transaction
        </button>
      </div>

      {/* Search and Filters */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '0.75rem', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} color="#6b7280" style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)' 
            }} />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                outline: 'none',
                backgroundColor: '#f9fafb'
              }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              backgroundColor: showFilters ? '#3b82f6' : '#f3f4f6',
              color: showFilters ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <Filter size={16} style={{ marginRight: '0.5rem' }} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                Time Period
              </label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {timeFilter === 'custom' && (
              <>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151', 
                    marginBottom: '0.5rem' 
                  }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(e) => setCustomDateRange({...customDateRange, startDate: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151', 
                    marginBottom: '0.5rem' 
                  }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) => setCustomDateRange({...customDateRange, endDate: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'white'
                }}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="description">Description</option>
                <option value="store">Store</option>
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* View Toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-start', 
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowTable(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: showTable ? '#3b82f6' : '#f3f4f6',
              color: showTable ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Table View
          </button>
          <button
            onClick={() => setShowTable(false)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: !showTable ? '#3b82f6' : '#f3f4f6',
              color: !showTable ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Card View
          </button>
        </div>
      </div>

      {/* Transactions List */}
      {showTable ? (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '0.75rem', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          {/* Quick Filters for Table */}
          <div style={{ 
            padding: '1rem 1.5rem', 
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginRight: '0.5rem' }}>
                Quick Filters:
              </span>
            <button
              onClick={() => setSelectedCategory('All')}
              style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: selectedCategory === 'All' ? '#3b82f6' : '#f3f4f6',
                color: selectedCategory === 'All' ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500'
              }}
            >
              All
            </button>
            {categories.filter(cat => cat !== 'All').map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: selectedCategory === category ? '#3b82f6' : '#f3f4f6',
                  color: selectedCategory === category ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}
              >
                {category}
              </button>
            ))}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={16} color="#6b7280" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: 'white',
                  minWidth: '200px'
                }}
              />
            </div>
          </div>

          {displayExpenses.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th 
                      style={{ 
                        padding: '1rem', 
                        textAlign: 'left', 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#374151',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      onClick={() => handleSort('date')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Date {getSortIcon('date')}
                      </div>
                    </th>
                    <th 
                      style={{ 
                        padding: '1rem', 
                        textAlign: 'left', 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#374151',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      onClick={() => handleSort('description')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Description {getSortIcon('description')}
                      </div>
                    </th>
                    <th 
                      style={{ 
                        padding: '1rem', 
                        textAlign: 'left', 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#374151',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      onClick={() => handleSort('category')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Category {getSortIcon('category')}
                      </div>
                    </th>
                    <th 
                      style={{ 
                        padding: '1rem', 
                        textAlign: 'left', 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#374151',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      onClick={() => handleSort('store')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Store {getSortIcon('store')}
                      </div>
                    </th>
                    <th 
                      style={{ 
                        padding: '1rem', 
                        textAlign: 'right', 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#374151',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      onClick={() => handleSort('amount')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        Amount {getSortIcon('amount')}
                      </div>
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayExpenses.map((expense, index) => (
                    <tr key={expense.id || index} style={{ 
                      borderBottom: index < displayExpenses.length - 1 ? '1px solid #f3f4f6' : 'none',
                      backgroundColor: index % 2 === 0 ? 'white' : '#fafafa'
                    }}>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                          {expense.description}
                        </div>
                        {expense.notes && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic', marginTop: '0.25rem' }}>
                            {expense.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          backgroundColor: getCategoryColor(expense.category),
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {expense.category}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {expense.store || '-'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: getAmountColor(expense) }}>
                          {formatCurrency(expense.amount)}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEditExpense(expense)}
                            style={{
                              padding: '0.375rem',
                              backgroundColor: '#f3f4f6',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Edit transaction"
                          >
                            <Edit size={14} color="#6b7280" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense)}
                            style={{
                              padding: '0.375rem',
                              backgroundColor: '#fef2f2',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Delete transaction"
                          >
                            <Trash2 size={14} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          ) : (
            <div style={{ 
              padding: '3rem', 
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <DollarSign size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                No transactions found
              </h3>
              <p style={{ margin: '0 0 1.5rem 0' }}>
                {searchTerm || selectedCategory !== 'All' || timeFilter !== 'all' ? 
                  'Try adjusting your filters or search terms.' : 
                  'Get started by adding your first transaction.'}
              </p>
              {!searchTerm && selectedCategory === 'All' && timeFilter === 'all' && (
                <button
                  onClick={() => window.location.href = '/add'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Add Transaction
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '0.75rem', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
        {displayExpenses.length > 0 ? (
          <div>
            {displayExpenses.map((expense, index) => (
              <div key={expense.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '1.5rem',
                borderBottom: index < displayExpenses.length - 1 ? '1px solid #e5e7eb' : 'none',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{ 
                    backgroundColor: '#dbeafe', 
                    padding: '0.75rem', 
                    borderRadius: '0.5rem',
                    marginRight: '1rem'
                  }}>
                    <DollarSign size={20} color="#3b82f6" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                        {expense.description}
                      </h3>
                      {expense.isRecurring && (
                        <div style={{
                          marginLeft: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#fef3c7',
                          color: '#d97706',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          borderRadius: '0.25rem'
                        }}>
                          <Repeat size={12} style={{ marginRight: '0.25rem' }} />
                          {expense.recurringType}
                        </div>
                      )}
                      <span style={{
                        marginLeft: '0.75rem',
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
                        {format(new Date(expense.date), 'MMM dd, yyyy • hh:mm a')}
                      </div>
                    </div>
                    {expense.notes && (
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                        {expense.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: getAmountColor(expense) }}>
                      {formatCurrency(expense.amount)}
                    </p>
                    {expense.isRecurring && expense.expectedAmount && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: getAmountColor(expense) }}>
                          Expected: {formatCurrency(expense.expectedAmount)}
                        </span>
                        {Math.abs(expense.amount - expense.expectedAmount) > 0.01 && (
                          <AlertTriangle size={12} color="#ef4444" />
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      onClick={() => handleEditExpense(expense)}
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
                      onClick={() => handleDeleteExpense(expense)}
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
            ))}
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            padding: '4rem',
            color: '#6b7280'
          }}>
            <DollarSign size={64} color="#d1d5db" />
            <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '500' }}>
              No transactions found
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', textAlign: 'center' }}>
              {searchTerm || selectedCategory !== 'All' || timeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first transaction to get started'}
            </p>
            {!searchTerm && selectedCategory === 'All' && timeFilter === 'all' && (
              <button
                style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
                onClick={() => window.location.href = '/add'}
              >
                Add Transaction
              </button>
            )}
          </div>
        )}
        </div>
      )}

      {/* Edit Modal */}
      {editingExpense && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                Edit Transaction
              </h2>
              <button
                onClick={handleCancelEdit}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: '#6b7280'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Description */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Description *
                </label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  placeholder="Enter description"
                />
              </div>

              {/* Amount and Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Category *
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  >
                    <option value="">Select category</option>
                    {categories.filter(cat => cat !== 'All').map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date and Store */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Store
                  </label>
                  <input
                    type="text"
                    value={editForm.store}
                    onChange={(e) => setEditForm({ ...editForm, store: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                    placeholder="Store name"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Notes
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                  placeholder="Additional notes"
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={handleSaveEdit}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <Save size={16} />
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;