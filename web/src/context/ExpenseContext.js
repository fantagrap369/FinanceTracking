import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';navigator
import LocalDataService from '../services/LocalDataService';

const ExpenseContext = createContext();

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('local'); // 'local' or 'phone'

  // Fetch all expenses
  const fetchExpenses = useCallback(async () => {
    try {
      const data = await LocalDataService.getExpenses();
      setExpenses(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch expenses from local files');
      console.error('Error fetching expenses:', err);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const data = await LocalDataService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Fetch spending summary
  const fetchSummary = useCallback(async () => {
    try {
      const data = await LocalDataService.getSpendingSummary();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  }, []);

  // Add new expense
  const addExpense = async (expense) => {
    try {
      setLoading(true);
      const newExpense = await LocalDataService.addExpense(expense);
      setExpenses(prev => [newExpense, ...prev]);
      
      // Refresh summary after adding expense
      await fetchSummary();
      
      setError(null);
      return newExpense;
    } catch (err) {
      setError('Failed to add expense');
      console.error('Error adding expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update existing expense
  const updateExpense = async (id, updates) => {
    try {
      setLoading(true);
      const updatedExpense = await LocalDataService.updateExpense(id, updates);
      setExpenses(prev => 
        prev.map(expense => 
          expense.id === id ? updatedExpense : expense
        )
      );
      
      // Refresh summary after updating expense
      await fetchSummary();
      
      setError(null);
      return updatedExpense;
    } catch (err) {
      setError('Failed to update expense');
      console.error('Error updating expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete expense
  const deleteExpense = async (id) => {
    try {
      setLoading(true);
      await LocalDataService.deleteExpense(id);
      setExpenses(prev => prev.filter(expense => expense.id !== id));
      
      // Refresh summary after deleting expense
      await fetchSummary();
      
      setError(null);
    } catch (err) {
      setError('Failed to delete expense');
      console.error('Error deleting expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get expenses by date range
  const getExpensesByDateRange = async (startDate, endDate) => {
    try {
      return await LocalDataService.getExpensesByDateRange(startDate, endDate);
    } catch (err) {
      console.error('Error fetching expenses by date range:', err);
      return [];
    }
  };

  // Get expenses by category
  const getExpensesByCategory = async (category) => {
    try {
      return await LocalDataService.getExpensesByCategory(category);
    } catch (err) {
      console.error('Error fetching expenses by category:', err);
      return [];
    }
  };

  // Get expenses by store
  const getExpensesByStore = async (store) => {
    try {
      return await LocalDataService.getExpensesByStore(store);
    } catch (err) {
      console.error('Error fetching expenses by store:', err);
      return [];
    }
  };

  // Search expenses
  const searchExpenses = async (query) => {
    try {
      return await LocalDataService.searchExpenses(query);
    } catch (err) {
      console.error('Error searching expenses:', err);
      return [];
    }
  };

  // Get monthly spending data
  const getMonthlySpendingData = async (months = 6) => {
    try {
      return await LocalDataService.getMonthlySpendingData(months);
    } catch (err) {
      console.error('Error fetching monthly spending data:', err);
      return [];
    }
  };

  // Get daily spending data
  const getDailySpendingData = async (days = 7) => {
    try {
      return await LocalDataService.getDailySpendingData(days);
    } catch (err) {
      console.error('Error fetching daily spending data:', err);
      return [];
    }
  };

  // Get statistics
  const getStatistics = async () => {
    try {
      return await LocalDataService.getStatistics();
    } catch (err) {
      console.error('Error fetching statistics:', err);
      return {
        totalExpenses: 0,
        thisMonthExpenses: 0,
        totalSpent: 0,
        averageSpent: 0,
        topCategory: null,
        categoryStats: {}
      };
    }
  };

  // Export expenses to CSV
  const exportExpensesToCSV = async () => {
    try {
      return await LocalDataService.exportExpensesToCSV();
    } catch (err) {
      console.error('Error exporting expenses to CSV:', err);
      throw err;
    }
  };

  // Refresh all data
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchExpenses(),
        fetchCategories(),
        fetchSummary()
      ]);
      setError(null);
    } catch (err) {
      setError('Failed to refresh data');
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchExpenses, fetchCategories, fetchSummary]);

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Set data source
  const setDataSourceType = (source) => {
    setDataSource(source);
  };

  // Load initial data
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const value = {
    // State
    expenses,
    categories,
    summary,
    loading,
    error,
    dataSource,
    
    // Actions
    fetchExpenses,
    fetchCategories,
    fetchSummary,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByDateRange,
    getExpensesByCategory,
    getExpensesByStore,
    searchExpenses,
    getMonthlySpendingData,
    getDailySpendingData,
    getStatistics,
    exportExpensesToCSV,
    refreshData,
    clearError,
    setDataSourceType,
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};