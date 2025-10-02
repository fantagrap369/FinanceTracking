// LocalDataService.js - Handles direct file operations for web app
// This service reads and writes directly to local JSON files on the PC

class LocalDataService {
  constructor() {
    // For development, we'll use sample data
    // In production, this would read from actual JSON files
    this.sampleData = {
      expenses: [
                {
                  id: '1',
                  description: 'Woolworths Groceries',
                  amount: 245.50,
                  store: 'Woolworths',
                  category: 'Groceries',
                  date: new Date().toISOString().split('T')[0], // Today
                  notes: 'Weekly grocery shopping',
                  isRecurring: false,
                  recurringType: null,
                  expectedAmount: null
                },
        {
          id: '2',
          description: 'Petrol Station',
          amount: 180.00,
          store: 'Shell',
          category: 'Transport',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
          notes: 'Fuel for car',
          isRecurring: false,
          recurringType: null,
          expectedAmount: null
        },
        {
          id: '3',
          description: 'Restaurant Dinner',
          amount: 320.75,
          store: 'Spur',
          category: 'Dining',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
          notes: 'Family dinner out',
          isRecurring: false,
          recurringType: null,
          expectedAmount: null
        },
        {
          id: '4',
          description: 'Pick n Pay',
          amount: 156.30,
          store: 'Pick n Pay',
          category: 'Groceries',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
          notes: 'Quick grocery run',
          isRecurring: false,
          recurringType: null,
          expectedAmount: null
        },
        {
          id: '5',
          description: 'Engen Fuel',
          amount: 220.00,
          store: 'Engen',
          category: 'Transport',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
          notes: 'Long drive fuel',
          isRecurring: false,
          recurringType: null,
          expectedAmount: null
        },
        {
          id: '6',
          description: 'Checkers',
          amount: 89.45,
          store: 'Checkers',
          category: 'Groceries',
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days ago
          notes: 'Small shopping',
          isRecurring: false,
          recurringType: null,
          expectedAmount: null
        },
        {
          id: '7',
          description: 'McDonald\'s',
          amount: 65.80,
          store: 'McDonald\'s',
          category: 'Dining',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
          notes: 'Quick lunch',
          isRecurring: false,
          recurringType: null,
          expectedAmount: null
        },
        {
          id: '8',
          description: 'Monthly Rent',
          amount: 1200.00,
          store: 'Landlord',
          category: 'Bills',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
          notes: 'Monthly rent payment',
          isRecurring: true,
          recurringType: 'monthly',
          expectedAmount: 1200.00
        },
        {
          id: '9',
          description: 'Gym Membership',
          amount: 450.00,
          store: 'Virgin Active',
          category: 'Bills',
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days ago
          notes: 'Monthly gym membership',
          isRecurring: true,
          recurringType: 'monthly',
          expectedAmount: 450.00
        }
      ],
      descriptions: {
        'Woolworths': {
          description: 'Woolworths Groceries',
          category: 'Groceries',
          count: 1
        },
        'Shell': {
          description: 'Petrol Station',
          category: 'Transport',
          count: 1
        },
        'Spur': {
          description: 'Restaurant Dinner',
          category: 'Dining',
          count: 1
        }
      }
    };
  }

  // Helper method to simulate async file operations
  async makeRequest(endpoint, options = {}) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    switch (endpoint) {
      case '/expenses':
        return this.sampleData.expenses;
      case '/descriptions':
        return this.sampleData.descriptions;
      case '/categories':
        return ['Groceries', 'Transport', 'Dining', 'Entertainment', 'Utilities'];
      case '/summary':
        return this.calculateSummary();
      default:
        console.error(`Unknown endpoint: ${endpoint}`);
        return null;
    }
  }

  calculateSummary() {
    const expenses = this.sampleData.expenses;
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const thisMonth = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() && 
             expenseDate.getFullYear() === now.getFullYear();
    });
    const thisMonthTotal = thisMonth.reduce((sum, expense) => sum + expense.amount, 0);
    
    return {
      totalExpenses: total,
      thisMonthTotal: thisMonthTotal,
      totalTransactions: expenses.length,
      thisMonthTransactions: thisMonth.length,
      averageTransaction: expenses.length > 0 ? total / expenses.length : 0
    };
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

const localDataService = new LocalDataService();
export default localDataService;