import { NativeModules, NativeEventEmitter } from 'react-native';
import ExpenseService from './ExpenseService';
import DescriptionLearner from './DescriptionLearner';
import AIParser from './AIParser';

class NotificationListener {
  constructor() {
    this.eventEmitter = null;
    this.isListening = false;
  }

  startListening() {
    try {
      // This would require a native module to read notifications
      // For now, we'll simulate the functionality
      console.log('Notification listener started (simulated)');
      this.isListening = true;
      
      // In a real implementation, you would:
      // 1. Create a native Android module to access notification listener service
      // 2. Set up event listeners for incoming notifications
      // 3. Parse notification content for expense information
      
      this.simulateNotificationProcessing();
    } catch (error) {
      console.error('Error starting notification listener:', error);
    }
  }

  stopListening() {
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners();
      this.eventEmitter = null;
    }
    this.isListening = false;
    console.log('Notification listener stopped');
  }

  // Simulate processing notifications for expense detection
  simulateNotificationProcessing() {
    // This is a simulation - in reality, this would be triggered by actual notifications
    const sampleNotifications = [
      {
        title: 'Payment Alert',
        text: 'You spent R45.00 at Starbucks',
        packageName: 'com.bank.app'
      },
      {
        title: 'Transaction',
        text: 'Debit: R450.00 at Shell Petrol Station',
        packageName: 'com.bank.app'
      }
    ];

    // Process each sample notification
    sampleNotifications.forEach((notification, index) => {
      setTimeout(() => {
        this.processNotification(notification);
      }, (index + 1) * 2000); // Process every 2 seconds
    });
  }

  async processNotification(notification) {
    try {
      const expenseData = await this.parseNotificationForExpense(notification);
      
      if (expenseData) {
        console.log('Detected expense from notification:', expenseData);
        
        // Add the expense to the database
        ExpenseService.addExpense({
          ...expenseData,
          source: 'notification'
        }).catch(error => {
          console.error('Error adding expense from notification:', error);
        });
      }
    } catch (error) {
      console.error('Error processing notification:', error);
    }
  }

  async parseNotificationForExpense(notification) {
    const { title, text } = notification;
    
    try {
      // Try AI parsing first (with fallback to regex)
      const parseResult = await AIParser.parseWithFallback(text, 'notification');
      
      if (parseResult.isExpense && parseResult.confidence > 0.5) {
        // Use the learning system to get description and category
        const description = await DescriptionLearner.getDescription(parseResult.store, parseResult.amount);
        const category = await this.categorizeStore(parseResult.store);
        
        return {
          description,
          amount: parseResult.amount,
          store: parseResult.store,
          category,
          notes: `Auto-detected from notification (AI confidence: ${Math.round(parseResult.confidence * 100)}%): "${text}"`,
          aiParsed: true
        };
      }
    } catch (error) {
      console.error('AI parsing failed, using fallback:', error);
    }

    // Fallback to original regex parsing
    return this.parseWithRegex(notification);
  }

  // Fallback regex parsing method
  async parseWithRegex(notification) {
    const { title, text } = notification;
    
    // Common patterns for expense notifications (South African Rand)
    const patterns = [
      // Pattern: "You spent R X.XX at Store"
      /you spent\s*R?\s*(\d+\.?\d*)\s+at\s+(.+)/i,
      
      // Pattern: "Debit: R X.XX at Store"
      /debit:\s*R?\s*(\d+\.?\d*)\s+at\s+(.+)/i,
      
      // Pattern: "Payment of R X.XX to Store"
      /payment of\s*R?\s*(\d+\.?\d*)\s+to\s+(.+)/i,
      
      // Pattern: "Transaction: R X.XX at Store"
      /transaction:\s*R?\s*(\d+\.?\d*)\s+at\s+(.+)/i,
      
      // Pattern: "Card ending in XXXX charged R X.XX at Store"
      /card ending in \d+\s+charged\s*R?\s*(\d+\.?\d*)\s+at\s+(.+)/i,
      
      // Pattern: "Spent R X.XX at Store"
      /spent\s*R?\s*(\d+\.?\d*)\s+at\s+(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        const store = match[2].trim();
        
        if (!isNaN(amount) && amount > 0) {
          // Use the learning system to get description and category
          const description = await DescriptionLearner.getDescription(store, amount);
          const category = await this.categorizeStore(store);
          
          return {
            description,
            amount,
            store,
            category,
            notes: `Auto-detected from notification (regex): "${text}"`,
            aiParsed: false
          };
        }
      }
    }

    return null;
  }


  async categorizeStore(store) {
    // First, try to find a similar store we've learned about
    const similarData = DescriptionLearner.findSimilarStore(store);
    if (similarData) {
      return similarData.category;
    }

    // If no similar store found, generate a default category
    const defaultCategory = this.generateDefaultCategory(store);
    
    // Learn this new category for future use
    await DescriptionLearner.learnDescription(store, this.generateDefaultDescription(store), defaultCategory, 0);
    
    return defaultCategory;
  }

  generateDefaultCategory(store) {
    const storeLower = store.toLowerCase();
    
    // Basic pattern matching for initial categorization
    if (storeLower.includes('coffee') || storeLower.includes('cafe') ||
        storeLower.includes('restaurant') || storeLower.includes('food') ||
        storeLower.includes('dining') || storeLower.includes('grocery') ||
        storeLower.includes('supermarket') || storeLower.includes('pick') ||
        storeLower.includes('checkers') || storeLower.includes('woolworths') ||
        storeLower.includes('spar') || storeLower.includes('mcdonalds') ||
        storeLower.includes('kfc') || storeLower.includes('nandos')) {
      return 'Food';
    }
    
    if (storeLower.includes('petrol') || storeLower.includes('gas') || 
        storeLower.includes('fuel') || storeLower.includes('shell') ||
        storeLower.includes('engen') || storeLower.includes('sasol') ||
        storeLower.includes('bp') || storeLower.includes('station')) {
      return 'Transport';
    }
    
    if (storeLower.includes('pharmacy') || storeLower.includes('dischem') ||
        storeLower.includes('clicks') || storeLower.includes('medical') ||
        storeLower.includes('health')) {
      return 'Shopping';
    }
    
    if (storeLower.includes('entertainment') || storeLower.includes('movie') ||
        storeLower.includes('theater') || storeLower.includes('netflix') ||
        storeLower.includes('spotify') || storeLower.includes('showmax') ||
        storeLower.includes('dstv')) {
      return 'Entertainment';
    }
    
    if (storeLower.includes('electric') || storeLower.includes('water') || 
        storeLower.includes('internet') || storeLower.includes('phone') ||
        storeLower.includes('bill') || storeLower.includes('utility') ||
        storeLower.includes('municipality') || storeLower.includes('rates') ||
        storeLower.includes('eskom')) {
      return 'Bills';
    }
    
    return 'Other';
  }

  generateDefaultDescription(store) {
    const storeLower = store.toLowerCase();
    
    if (storeLower.includes('coffee') || storeLower.includes('cafe')) {
      return 'Coffee';
    }
    if (storeLower.includes('petrol') || storeLower.includes('gas') || 
        storeLower.includes('fuel') || storeLower.includes('shell') ||
        storeLower.includes('engen') || storeLower.includes('sasol') ||
        storeLower.includes('bp')) {
      return 'Petrol';
    }
    if (storeLower.includes('grocery') || storeLower.includes('supermarket') ||
        storeLower.includes('pick') || storeLower.includes('checkers') ||
        storeLower.includes('woolworths') || storeLower.includes('spar')) {
      return 'Groceries';
    }
    if (storeLower.includes('restaurant') || storeLower.includes('food') ||
        storeLower.includes('dining') || storeLower.includes('mcdonalds') ||
        storeLower.includes('kfc') || storeLower.includes('nandos')) {
      return 'Food';
    }
    if (storeLower.includes('pharmacy') || storeLower.includes('dischem') ||
        storeLower.includes('clicks') || storeLower.includes('medical')) {
      return 'Pharmacy';
    }
    if (storeLower.includes('online') || storeLower.includes('takealot') ||
        storeLower.includes('take2')) {
      return 'Online Purchase';
    }
    
    return `Purchase at ${store}`;
  }
}

export default new NotificationListener();
