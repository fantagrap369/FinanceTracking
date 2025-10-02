import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const PC_IP = '192.168.1.100'; // Replace with your actual PC IP
const API_BASE = `http://${PC_IP}:3000`;
const STORAGE_KEY = 'expenses';
const SYNC_KEY = 'last_sync';

class ExpenseService {
  constructor() {
    this.isOnline = false;
    this.checkConnection();
  }

  // Check if PC is connected
  async checkConnection() {
    try {
      const response = await axios.get(`${API_BASE}/api/health`, { timeout: 5000 });
      this.isOnline = response.status === 200;
      return this.isOnline;
    } catch (error) {
      this.isOnline = false;
      return false;
    }
  }

  // Get all expenses (PC first, then local fallback)
  async getExpenses() {
    try {
      // Try PC first
      if (await this.checkConnection()) {
        const response = await axios.get(`${API_BASE}/api/expenses`);
        const pcExpenses = response.data;
        
        // Update local storage with PC data
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pcExpenses));
        return pcExpenses;
      }
    } catch (error) {
      console.log('PC not available, using local data:', error.message);
    }

    // Fallback to local storage
    try {
      const localData = await AsyncStorage.getItem(STORAGE_KEY);
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error('Error reading local expenses:', error);
      return [];
    }
  }

  // Add new expense
  async addExpense(expense) {
    const newExpense = {
      id: Date.now().toString(),
      ...expense,
      date: new Date().toISOString(),
      needsSync: true
    };

    try {
      // Try PC first
      if (await this.checkConnection()) {
        const response = await axios.post(`${API_BASE}/api/expenses`, newExpense);
        newExpense.needsSync = false;
        console.log('Expense added to PC:', response.data);
      }
    } catch (error) {
      console.log('PC not available, storing locally:', error.message);
    }

    // Always store locally
    const localExpenses = await this.getExpenses();
    localExpenses.push(newExpense);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localExpenses));

    return newExpense;
  }

  // Update existing expense
  async updateExpense(id, updates) {
    const localExpenses = await this.getExpenses();
    const expenseIndex = localExpenses.findIndex(exp => exp.id === id);
    
    if (expenseIndex === -1) {
      throw new Error('Expense not found');
    }

    const updatedExpense = {
      ...localExpenses[expenseIndex],
      ...updates,
      needsSync: true
    };

    try {
      // Try PC first
      if (await this.checkConnection()) {
        await axios.put(`${API_BASE}/api/expenses/${id}`, updatedExpense);
        updatedExpense.needsSync = false;
        console.log('Expense updated on PC');
      }
    } catch (error) {
      console.log('PC not available, updating locally:', error.message);
    }

    // Update local storage
    localExpenses[expenseIndex] = updatedExpense;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localExpenses));

    return updatedExpense;
  }

  // Delete expense
  async deleteExpense(id) {
    const localExpenses = await this.getExpenses();
    const expenseIndex = localExpenses.findIndex(exp => exp.id === id);
    
    if (expenseIndex === -1) {
      throw new Error('Expense not found');
    }

    try {
      // Try PC first
      if (await this.checkConnection()) {
        await axios.delete(`${API_BASE}/api/expenses/${id}`);
        console.log('Expense deleted from PC');
      }
    } catch (error) {
      console.log('PC not available, deleting locally:', error.message);
    }

    // Remove from local storage
    localExpenses.splice(expenseIndex, 1);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localExpenses));

    return true;
  }

  // Sync local changes with PC
  async syncWithPC() {
    try {
      const localExpenses = await this.getExpenses();
      const needsSync = localExpenses.filter(exp => exp.needsSync);

      if (needsSync.length === 0) {
        console.log('No expenses need syncing');
        return true;
      }

      console.log(`Syncing ${needsSync.length} expenses to PC...`);

      for (const expense of needsSync) {
        try {
          if (expense.id && expense.id.startsWith('temp_')) {
            // New expense - create on PC
            const response = await axios.post(`${API_BASE}/api/expenses`, expense);
            expense.id = response.data.id;
            expense.needsSync = false;
          } else {
            // Existing expense - update on PC
            await axios.put(`${API_BASE}/api/expenses/${expense.id}`, expense);
            expense.needsSync = false;
          }
          
          await this.updateLocalStorage(expense.id, expense);
          console.log(`Synced expense: ${expense.description}`);
        } catch (error) {
          console.log(`Failed to sync expense ${expense.id}:`, error.message);
        }
      }

      await AsyncStorage.setItem(SYNC_KEY, new Date().toISOString());
      console.log('Sync with PC completed');
      return true;
    } catch (error) {
      console.error('Error syncing with PC:', error);
      return false;
    }
  }

  // Update local storage
  async updateLocalStorage(id, expense) {
    const localExpenses = await this.getExpenses();
    const expenseIndex = localExpenses.findIndex(exp => exp.id === id);
    
    if (expenseIndex !== -1) {
      localExpenses[expenseIndex] = expense;
    } else {
      localExpenses.push(expense);
    }
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localExpenses));
  }

  // Get last sync time
  async getLastSyncTime() {
    try {
      const lastSync = await AsyncStorage.getItem(SYNC_KEY);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  // Check if PC is connected
  async isPCConnected() {
    return await this.checkConnection();
  }

  // Get expenses by date range
  async getExpensesByDateRange(startDate, endDate) {
    const expenses = await this.getExpenses();
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }

  // Get expenses by category
  async getExpensesByCategory(category) {
    const expenses = await this.getExpenses();
    return expenses.filter(expense => expense.category === category);
  }

  // Get expenses by store
  async getExpensesByStore(store) {
    const expenses = await this.getExpenses();
    return expenses.filter(expense => 
      expense.store.toLowerCase().includes(store.toLowerCase())
    );
  }

  // Get spending summary
  async getSpendingSummary() {
    const expenses = await this.getExpenses();
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthExpenses = expenses.filter(exp => 
      new Date(exp.date) >= thisMonth
    );
    const lastMonthExpenses = expenses.filter(exp => 
      new Date(exp.date) >= lastMonth && new Date(exp.date) < thisMonth
    );

    const thisMonthTotal = thisMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Category breakdown
    const categoryBreakdown = {};
    thisMonthExpenses.forEach(expense => {
      const category = expense.category || 'Other';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + expense.amount;
    });

    return {
      thisMonth: {
        total: thisMonthTotal,
        count: thisMonthExpenses.length,
        average: thisMonthExpenses.length > 0 ? thisMonthTotal / thisMonthExpenses.length : 0
      },
      lastMonth: {
        total: lastMonthTotal,
        count: lastMonthExpenses.length,
        average: lastMonthExpenses.length > 0 ? lastMonthTotal / lastMonthExpenses.length : 0
      },
      change: lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0,
      categoryBreakdown
    };
  }

  // Clear all local data
  async clearLocalData() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(SYNC_KEY);
      console.log('Local data cleared');
      return true;
    } catch (error) {
      console.error('Error clearing local data:', error);
      return false;
    }
  }
}

export default new ExpenseService();