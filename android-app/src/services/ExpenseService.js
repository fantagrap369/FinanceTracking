import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Your PC's IP address - update this to match your local network
const PC_IP = '192.168.1.100'; // Replace with your actual PC IP
const API_BASE = `http://${PC_IP}:3000`;
const STORAGE_KEY = 'expenses';
const SYNC_KEY = 'last_sync';

class ExpenseService {
  async getExpenses() {
    try {
      // Try to fetch from PC first
      const response = await axios.get(`${API_BASE}/api/expenses`);
      const pcExpenses = response.data;
      
      // Update local storage with PC data
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pcExpenses));
      await AsyncStorage.setItem(SYNC_KEY, new Date().toISOString());
      
      return pcExpenses;
    } catch (error) {
      console.log('PC unavailable, using local storage');
      // Fallback to local storage
      const localExpenses = await AsyncStorage.getItem(STORAGE_KEY);
      return localExpenses ? JSON.parse(localExpenses) : [];
    }
  }

  async addExpense(expenseData) {
    try {
      // Try to add to PC first
      const response = await axios.post(`${API_BASE}/api/expenses`, expenseData);
      
      // Also save locally as backup
      await this.saveToLocalStorage(response.data);
      
      return response.data;
    } catch (error) {
      console.log('PC unavailable, saving locally for later sync');
      // Fallback to local storage - will sync when PC is available
      const expense = {
        id: Date.now().toString(),
        ...expenseData,
        createdAt: new Date().toISOString(),
        needsSync: true // Mark for sync
      };
      
      await this.saveToLocalStorage(expense);
      return expense;
    }
  }

  async updateExpense(id, expenseData) {
    try {
      // Try to update on server first
      const response = await axios.put(`${API_BASE}/api/expenses/${id}`, expenseData);
      
      // Also update locally
      await this.updateLocalStorage(id, expenseData);
      
      return response.data;
    } catch (error) {
      console.log('Server unavailable, updating locally');
      // Fallback to local storage
      await this.updateLocalStorage(id, expenseData);
      return { id, ...expenseData };
    }
  }

  async deleteExpense(id) {
    try {
      // Try to delete from server first
      await axios.delete(`${API_BASE}/api/expenses/${id}`);
      
      // Also delete locally
      await this.deleteFromLocalStorage(id);
      
      return true;
    } catch (error) {
      console.log('Server unavailable, deleting locally');
      // Fallback to local storage
      await this.deleteFromLocalStorage(id);
      return true;
    }
  }

  async getSummary() {
    try {
      // Try to fetch from server first
      const response = await axios.get(`${API_BASE}/api/summary`);
      return response.data;
    } catch (error) {
      console.log('Server unavailable, calculating local summary');
      // Fallback to local calculation
      const expenses = await this.getExpenses();
      return this.calculateLocalSummary(expenses);
    }
  }

  async saveToLocalStorage(expense) {
    try {
      const existingExpenses = await this.getExpenses();
      const updatedExpenses = [...existingExpenses, expense];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedExpenses));
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }

  async updateLocalStorage(id, expenseData) {
    try {
      const existingExpenses = await this.getExpenses();
      const updatedExpenses = existingExpenses.map(exp => 
        exp.id === id ? { ...exp, ...expenseData, updatedAt: new Date().toISOString() } : exp
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedExpenses));
    } catch (error) {
      console.error('Error updating local storage:', error);
    }
  }

  async deleteFromLocalStorage(id) {
    try {
      const existingExpenses = await this.getExpenses();
      const updatedExpenses = existingExpenses.filter(exp => exp.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedExpenses));
    } catch (error) {
      console.error('Error deleting from local storage:', error);
    }
  }

  calculateLocalSummary(expenses) {
    const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalTransactions = expenses.length;
    
    const byCategory = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      if (!byCategory[category]) {
        byCategory[category] = { count: 0, total: 0 };
      }
      byCategory[category].count++;
      byCategory[category].total += expense.amount || 0;
    });

    const byMonth = {};
    expenses.forEach(expense => {
      const month = new Date(expense.createdAt).toISOString().substring(0, 7);
      if (!byMonth[month]) {
        byMonth[month] = { count: 0, total: 0 };
      }
      byMonth[month].count++;
      byMonth[month].total += expense.amount || 0;
    });

    const recentExpenses = expenses
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    return {
      totalSpent,
      totalTransactions,
      byCategory,
      byMonth,
      recentExpenses
    };
  }

  async syncWithPC() {
    try {
      const localExpenses = await this.getExpenses();
      const needsSync = localExpenses.filter(exp => exp.needsSync);
      
      if (needsSync.length === 0) {
        console.log('No expenses need syncing');
        return true;
      }
      
      console.log(`Syncing ${needsSync.length} expenses to PC...`);
      
      // Send expenses that need syncing to PC
      for (const expense of needsSync) {
        try {
          await axios.post(`${API_BASE}/api/expenses`, expense);
          
          // Remove needsSync flag
          expense.needsSync = false;
          await this.updateLocalStorage(expense.id, expense);
          
          console.log(`Synced expense: ${expense.description}`);
        } catch (error) {
          console.log(`Failed to sync expense ${expense.id}:`, error.message);
        }
      }
      
      // Update last sync time
      await AsyncStorage.setItem(SYNC_KEY, new Date().toISOString());
      
      console.log('Sync with PC completed');
      return true;
    } catch (error) {
      console.error('Error syncing with PC:', error);
      return false;
    }
  }

  async getLastSyncTime() {
    try {
      const lastSync = await AsyncStorage.getItem(SYNC_KEY);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  async isPCConnected() {
    try {
      const response = await axios.get(`${API_BASE}/api/health`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export default new ExpenseService();
