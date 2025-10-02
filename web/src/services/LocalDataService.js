// Local data service that reads from JSON files on your PC
class LocalDataService {
  constructor() {
    this.dataPath = '/data'; // Path to your local JSON files
    this.cache = {
      expenses: null,
      descriptions: null,
      lastUpdated: null
    };
  }

  // Read expenses from local JSON file
  async getExpenses() {
    try {
      const response = await fetch(`${this.dataPath}/expenses.json`);
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const data = await response.json();
      this.cache.expenses = data.expenses || [];
      this.cache.lastUpdated = data.lastUpdated;
      return this.cache.expenses;
    } catch (error) {
      console.error('Error reading expenses from local file:', error);
      return this.cache.expenses || [];
    }
  }

  // Read descriptions from local JSON file
  async getDescriptions() {
    try {
      const response = await fetch(`${this.dataPath}/descriptions.json`);
      if (!response.ok) {
        throw new Error('Failed to fetch descriptions');
      }
      const data = await response.json();
      this.cache.descriptions = data.descriptions || [];
      return this.cache.descriptions;
    } catch (error) {
      console.error('Error reading descriptions from local file:', error);
      return this.cache.descriptions || [];
    }
  }

  // Get categories
  async getCategories() {
    try {
      const response = await fetch(`${this.dataPath}/expenses.json`);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      return data.categories || ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];
    } catch (error) {
      console.error('Error reading categories:', error);
      return ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];
    }
  }

  // Calculate summary from local data
  async getSummary() {
    try {
      const expenses = await this.getExpenses();
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
    } catch (error) {
      console.error('Error calculating summary:', error);
      return {
        totalSpent: 0,
        totalTransactions: 0,
        byCategory: {},
        byMonth: {},
        recentExpenses: []
      };
    }
  }

  // Add new expense (this would need to be handled by a local API)
  async addExpense(expenseData) {
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add expense');
      }
      
      // Clear cache to force refresh
      this.cache.expenses = null;
      return await response.json();
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  // Update expense
  async updateExpense(id, expenseData) {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update expense');
      }
      
      // Clear cache to force refresh
      this.cache.expenses = null;
      return await response.json();
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  // Delete expense
  async deleteExpense(id) {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }
      
      // Clear cache to force refresh
      this.cache.expenses = null;
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // Check if data is available locally
  async isDataAvailable() {
    try {
      const response = await fetch(`${this.dataPath}/expenses.json`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Get last updated timestamp
  getLastUpdated() {
    return this.cache.lastUpdated;
  }

  // Clear cache
  clearCache() {
    this.cache = {
      expenses: null,
      descriptions: null,
      lastUpdated: null
    };
  }
}

export default new LocalDataService();
