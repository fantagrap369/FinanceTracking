import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await LocalDataService.getExpenses();
      setExpenses(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch expenses from local files');
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const data = await LocalDataService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch summary
  const fetchSummary = async () => {
    try {
      const data = await LocalDataService.getSummary();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  // Add expense
  const addExpense = async (expenseData) => {
    try {
      const data = await LocalDataService.addExpense(expenseData);
      setExpenses(prev => [...prev, data]);
      await fetchSummary(); // Refresh summary
      return data;
    } catch (err) {
      setError('Failed to add expense');
      console.error('Error adding expense:', err);
      throw err;
    }
  };

  // Update expense
  const updateExpense = async (id, expenseData) => {
    try {
      const data = await LocalDataService.updateExpense(id, expenseData);
      setExpenses(prev => prev.map(exp => exp.id === id ? data : exp));
      await fetchSummary(); // Refresh summary
      return data;
    } catch (err) {
      setError('Failed to update expense');
      console.error('Error updating expense:', err);
      throw err;
    }
  };

  // Delete expense
  const deleteExpense = async (id) => {
    try {
      await LocalDataService.deleteExpense(id);
      setExpenses(prev => prev.filter(exp => exp.id !== id));
      await fetchSummary(); // Refresh summary
    } catch (err) {
      setError('Failed to delete expense');
      console.error('Error deleting expense:', err);
      throw err;
    }
  };

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchExpenses(),
        fetchCategories(),
        fetchSummary()
      ]);
    };
    loadData();
  }, []);

  const value = {
    expenses,
    categories,
    summary,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    fetchExpenses,
    fetchSummary
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};
