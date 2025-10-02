import { NativeModules, NativeEventEmitter, PermissionsAndroid } from 'react-native';
import ExpenseService from './ExpenseService';
import DescriptionLearner from './DescriptionLearner';
import AIParser from './AIParser';
import FailedParsingManager from './FailedParsingManager';

const { SMSListener: SMSListenerModule } = NativeModules;

class SMSListener {
  constructor() {
    this.eventEmitter = null;
    this.isListening = false;
  }

  async startListening() {
    try {
      // Request SMS permissions
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'SMS Permission',
          message: 'This app needs access to read SMS to detect expense transactions.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('SMS permission granted');
        this.setupSMSListener();
      } else {
        console.log('SMS permission denied');
      }
    } catch (error) {
      console.error('Error requesting SMS permission:', error);
    }
  }

  setupSMSListener() {
    try {
      if (SMSListenerModule) {
        // Use the actual native module
        SMSListenerModule.startListening();
        this.eventEmitter = new NativeEventEmitter(SMSListenerModule);
        this.eventEmitter.addListener('SMSReceived', this.handleSMSReceived.bind(this));
        console.log('SMS listener started (native)');
      } else {
        // Fallback to simulation if native module not available
        console.log('SMS listener started (simulated)');
        this.simulateSMSProcessing();
      }
      this.isListening = true;
    } catch (error) {
      console.error('Error setting up SMS listener:', error);
      // Fallback to simulation
      this.simulateSMSProcessing();
    }
  }

  stopListening() {
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners();
      this.eventEmitter = null;
    }
    if (SMSListenerModule) {
      SMSListenerModule.stopListening();
    }
    this.isListening = false;
    console.log('SMS listener stopped');
  }

  handleSMSReceived(sms) {
    console.log('SMS received:', sms);
    this.processSMS(sms);
  }

  // Simulate processing SMS messages for expense detection
  simulateSMSProcessing() {
    // This is a simulation - in reality, this would be triggered by actual SMS messages
    const sampleSMS = [
      {
        body: 'Your card ending in 1234 was charged R45.00 at Starbucks on 15/12/2023',
        sender: 'BANK-ALERT',
        timestamp: Date.now()
      },
      {
        body: 'Transaction Alert: R450.00 debit at Shell Petrol Station. Available balance: R12,345.67',
        sender: 'BANK-ALERT',
        timestamp: Date.now() + 1000
      },
      {
        body: 'Payment of R853.00 to Pick n Pay completed. Reference: TXN123456789',
        sender: 'BANK-ALERT',
        timestamp: Date.now() + 2000
      }
    ];

    // Process each sample SMS
    sampleSMS.forEach((sms, index) => {
      setTimeout(() => {
        this.processSMS(sms);
      }, (index + 1) * 3000); // Process every 3 seconds
    });
  }

  async processSMS(sms) {
    try {
      const expenseData = await this.parseSMSForExpense(sms);
      
      if (expenseData) {
        console.log('Detected expense from SMS:', expenseData);
        
        // Add the expense to the database
        ExpenseService.addExpense({
          ...expenseData,
          source: 'sms'
        }).catch(error => {
          console.error('Error adding expense from SMS:', error);
        });
      }
    } catch (error) {
      console.error('Error processing SMS:', error);
    }
  }

  async parseSMSForExpense(sms) {
    const { body, sender } = sms;

    try {
      // Try AI parsing first (with fallback to regex)
      const parseResult = await AIParser.parseWithFallback(body, 'sms');

      if (parseResult.isExpense && parseResult.confidence > 0.5) {
        // Use the learning system to get description and category
        const description = await DescriptionLearner.getDescription(parseResult.store, parseResult.amount);
        const category = await this.categorizeStore(parseResult.store);

        return {
          description,
          amount: parseResult.amount,
          store: parseResult.store,
          category,
          notes: `Auto-detected from SMS (AI confidence: ${Math.round(parseResult.confidence * 100)}%): "${body.substring(0, 100)}..."`,
          aiParsed: true
        };
      }
    } catch (error) {
      console.error('AI parsing failed, using fallback:', error);
    }

    // Try regex parsing as fallback
    const regexResult = await this.parseWithRegex(sms);
    if (regexResult) {
      return regexResult;
    }

    // If both AI and regex fail, store for manual processing
    console.log('Both AI and regex parsing failed, storing for manual processing');
    await FailedParsingManager.addFailedAttempt(body, 'sms');
    
    return null; // Indicate parsing failed
  }

  // Fallback regex parsing method
  async parseWithRegex(sms) {
    const { body, sender } = sms;
    
    // Common patterns for expense SMS messages (South African Rand)
    const patterns = [
      // Pattern: "Your card ending in XXXX was charged R X.XX at Store"
      /your card ending in \d+\s+was charged\s*R?\s*(\d+\.?\d*)\s+at\s+(.+?)(?:\s+on|\s+at|\s+ref|\s*$)/i,
      
      // Pattern: "Transaction Alert: R X.XX debit at Store"
      /transaction alert:\s*R?\s*(\d+\.?\d*)\s+debit\s+at\s+(.+?)(?:\s+available|\s+ref|\s*$)/i,
      
      // Pattern: "Payment of R X.XX to Store completed"
      /payment of\s*R?\s*(\d+\.?\d*)\s+to\s+(.+?)\s+completed/i,
      
      // Pattern: "Debit: R X.XX at Store"
      /debit:\s*R?\s*(\d+\.?\d*)\s+at\s+(.+?)(?:\s+available|\s+ref|\s*$)/i,
      
      // Pattern: "Purchase: R X.XX at Store"
      /purchase:\s*R?\s*(\d+\.?\d*)\s+at\s+(.+?)(?:\s+available|\s+ref|\s*$)/i,
      
      // Pattern: "Spent R X.XX at Store"
      /spent\s*R?\s*(\d+\.?\d*)\s+at\s+(.+?)(?:\s+available|\s+ref|\s*$)/i,
    ];

    for (const pattern of patterns) {
      const match = body.match(pattern);
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
            notes: `Auto-detected from SMS (regex): "${body.substring(0, 100)}..."`,
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

export default new SMSListener();
