import { NativeModules, NativeEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DescriptionLearner from './DescriptionLearner';

class PhoneServer {
  constructor() {
    this.isRunning = false;
    this.port = 8080;
    this.server = null;
  }

  async startServer() {
    try {
      // This would require a native module to create an HTTP server
      // For now, we'll simulate the server functionality
      console.log(`Phone server starting on port ${this.port}`);
      this.isRunning = true;
      
      // In a real implementation, you would:
      // 1. Create a native Android module to start an HTTP server
      // 2. Handle HTTP requests and serve JSON data
      // 3. Enable CORS for web browser access
      
      console.log('Phone server started - ready to serve data to web app');
      return true;
    } catch (error) {
      console.error('Error starting phone server:', error);
      return false;
    }
  }

  stopServer() {
    this.isRunning = false;
    console.log('Phone server stopped');
  }

  // Get all expenses data for web app
  async getExpensesData() {
    try {
      const expenses = await this.getExpenses();
      const categories = await this.getCategories();
      const summary = await this.getSummary();
      const descriptions = DescriptionLearner.getAllDescriptions();
      
      return {
        expenses,
        categories,
        summary,
        descriptions,
        lastUpdated: new Date().toISOString(),
        source: 'phone'
      };
    } catch (error) {
      console.error('Error getting expenses data:', error);
      return null;
    }
  }

  async getExpenses() {
    try {
      const stored = await AsyncStorage.getItem('expenses');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting expenses:', error);
      return [];
    }
  }

  async getCategories() {
    return ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];
  }

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

  // Get phone's IP address for web app connection
  async getPhoneIPAddress() {
    try {
      // This would require a native module to get the phone's IP
      // For now, return a placeholder
      return '192.168.1.100'; // Replace with actual IP detection
    } catch (error) {
      console.error('Error getting IP address:', error);
      return null;
    }
  }

  // Check if web app is trying to connect
  async checkWebAppConnection() {
    if (!this.isRunning) return false;
    
    // In a real implementation, this would check for incoming HTTP requests
    // and serve the appropriate data
    return true;
  }

  // Generate QR code data for easy web app connection
  generateConnectionQR() {
    const ip = this.getPhoneIPAddress();
    return {
      type: 'finance_tracker_connection',
      ip: ip,
      port: this.port,
      timestamp: Date.now()
    };
  }
}

export default new PhoneServer();
