// LocalDataService.js - Handles direct file operations for web app
// This service reads and writes directly to local JSON files on the PC

class LocalDataService {
  constructor() {
    this.baseUrl = '/api'; // Will be proxied to Express server
  }

  // Helper method to make API calls
  async makeRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get all expenses
  async getExpenses() {
    try {
      const response = await this.makeRequest('/expenses');
      return response || [];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      // Return empty array if server is not available
      return [];
    }
  }

  // Add new expense
  async addExpense(expense) {
    try {
      const newExpense = {
        ...expense,
        id: Date.now().toString(),
        date: new Date().toISOString(),
      };

      const response = await this.makeRequest('/expenses', {
        method: 'POST',
        body: JSON.stringify(newExpense),
      });

      return response;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  // Update existing expense
  async updateExpense(id, updates) {
    try {
      const response = await this.makeRequest(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      return response;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  // Delete expense
  async deleteExpense(id) {
    try {
      const response = await this.makeRequest(`/expenses/${id}`, {
        method: 'DELETE',
      });

      return response;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // Get expenses by date range
  async getExpensesByDateRange(startDate, endDate) {
    try {
      const expenses = await this.getExpenses();
      return expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      });
    } catch (error) {
      console.error('Error fetching expenses by date range:', error);
      return [];
    }
  }

  // Get expenses by category
  async getExpensesByCategory(category) {
    try {
      const expenses = await this.getExpenses();
      return expenses.filter(expense => expense.category === category);
    } catch (error) {
      console.error('Error fetching expenses by category:', error);
      return [];
    }
  }

  // Get expenses by store
  async getExpensesByStore(store) {
    try {
      const expenses = await this.getExpenses();
      return expenses.filter(expense => 
        expense.store.toLowerCase().includes(store.toLowerCase())
      );
    } catch (error) {
      console.error('Error fetching expenses by store:', error);
      return [];
    }
  }

  // Get spending summary
  async getSpendingSummary() {
    try {
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
    } catch (error) {
      console.error('Error calculating spending summary:', error);
      return {
        thisMonth: { total: 0, count: 0, average: 0 },
        lastMonth: { total: 0, count: 0, average: 0 },
        change: 0,
        categoryBreakdown: {}
      };
    }
  }

  // Get all categories
  async getCategories() {
    try {
      const expenses = await this.getExpenses();
      const categories = new Set();
      const defaultCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];
      
      defaultCategories.forEach(cat => categories.add(cat));
      expenses.forEach(expense => {
        if (expense.category) {
          categories.add(expense.category);
        }
      });
      
      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];
    }
  }

  // Get all stores
  async getStores() {
    try {
      const expenses = await this.getExpenses();
      const stores = new Set();
      
      expenses.forEach(expense => {
        if (expense.store) {
          stores.add(expense.store);
        }
      });
      
      return Array.from(stores).sort();
    } catch (error) {
      console.error('Error fetching stores:', error);
      return [];
    }
  }

  // Get monthly spending data for charts
  async getMonthlySpendingData(months = 6) {
    try {
      const expenses = await this.getExpenses();
      const now = new Date();
      const monthlyData = [];
      
      for (let i = months - 1; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= month && expenseDate < nextMonth;
        });
        
        const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        monthlyData.push({
          month: month.toLocaleDateString('en-US', { month: 'short' }),
          amount: total,
          count: monthExpenses.length
        });
      }
      
      return monthlyData;
    } catch (error) {
      console.error('Error fetching monthly spending data:', error);
      return [];
    }
  }

  // Get daily spending data for charts
  async getDailySpendingData(days = 7) {
    try {
      const expenses = await this.getExpenses();
      const now = new Date();
      const dailyData = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const dayExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= day && expenseDate < nextDay;
        });
        
        const total = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        dailyData.push({
          date: day.toLocaleDateString('en-US', { weekday: 'short' }),
          amount: total,
          count: dayExpenses.length
        });
      }
      
      return dailyData;
    } catch (error) {
      console.error('Error fetching daily spending data:', error);
      return [];
    }
  }

  // Search expenses
  async searchExpenses(query) {
    try {
      const expenses = await this.getExpenses();
      const searchTerm = query.toLowerCase();
      
      return expenses.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm) ||
        expense.store.toLowerCase().includes(searchTerm) ||
        expense.category?.toLowerCase().includes(searchTerm) ||
        expense.notes?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching expenses:', error);
      return [];
    }
  }

  // Export expenses to CSV
  async exportExpensesToCSV() {
    try {
      const expenses = await this.getExpenses();
      
      const headers = ['Date', 'Description', 'Store', 'Category', 'Amount', 'Notes'];
      const csvContent = [
        headers.join(','),
        ...expenses.map(expense => [
          new Date(expense.date).toLocaleDateString(),
          `"${expense.description}"`,
          `"${expense.store}"`,
          `"${expense.category || ''}"`,
          expense.amount,
          `"${expense.notes || ''}"`
        ].join(','))
      ].join('\n');
      
      return csvContent;
    } catch (error) {
      console.error('Error exporting expenses to CSV:', error);
      throw error;
    }
  }

  // Get statistics
  async getStatistics() {
    try {
      const expenses = await this.getExpenses();
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const thisMonthExpenses = expenses.filter(exp => 
        new Date(exp.date) >= thisMonth
      );
      
      const totalSpent = thisMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const averageSpent = thisMonthExpenses.length > 0 ? totalSpent / thisMonthExpenses.length : 0;
      
      const categoryStats = {};
      thisMonthExpenses.forEach(expense => {
        const category = expense.category || 'Other';
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, total: 0 };
        }
        categoryStats[category].count += 1;
        categoryStats[category].total += expense.amount;
      });
      
      const topCategory = Object.entries(categoryStats)
        .sort(([,a], [,b]) => b.total - a.total)[0];
      
      return {
        totalExpenses: expenses.length,
        thisMonthExpenses: thisMonthExpenses.length,
        totalSpent,
        averageSpent,
        topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1].total } : null,
        categoryStats
      };
    } catch (error) {
      console.error('Error calculating statistics:', error);
      return {
        totalExpenses: 0,
        thisMonthExpenses: 0,
        totalSpent: 0,
        averageSpent: 0,
        topCategory: null,
        categoryStats: {}
      };
    }
  }
}

export default new LocalDataService();