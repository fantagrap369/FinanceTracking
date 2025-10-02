import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const OPENAI_API_KEY_STORAGE_KEY = 'openai_api_key';
const AI_ENABLED_STORAGE_KEY = 'ai_parsing_enabled';

class AIParser {
  constructor() {
    this.apiKey = null;
    this.aiEnabled = false;
    this.init();
  }

  async init() {
    this.apiKey = await AsyncStorage.getItem(OPENAI_API_KEY_STORAGE_KEY);
    const enabled = await AsyncStorage.getItem(AI_ENABLED_STORAGE_KEY);
    this.aiEnabled = enabled === 'true';
  }

  // Set OpenAI API key
  async setApiKey(key) {
    this.apiKey = key;
    await AsyncStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, key);
  }

  // Enable/disable AI parsing
  async setAIEnabled(enabled) {
    this.aiEnabled = enabled;
    await AsyncStorage.setItem(AI_ENABLED_STORAGE_KEY, String(enabled));
  }

  // Check if AI is enabled and configured
  async isAIEnabled() {
    return this.aiEnabled && this.apiKey;
  }

  // Test connection to OpenAI
  async testConnection() {
    if (!this.apiKey) {
      throw new Error('OpenAI API Key is not set.');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Say hello' }],
          max_tokens: 5,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      return response.status === 200 && response.data.choices[0].message.content.toLowerCase().includes('hello');
    } catch (error) {
      console.error('OpenAI connection test failed:', error.response?.data || error.message);
      throw new Error(`Failed to connect to OpenAI: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Parse text using OpenAI
  async parseText(text, type = 'general') {
    if (!this.aiEnabled || !this.apiKey) {
      throw new Error('AI parsing is not enabled or API key is missing.');
    }

    const prompt = `
You are an expense parsing assistant. Analyze the following ${type} text and extract expense details.
If it's an expense, provide the amount, store name, a brief description, and a category.
If it's not an expense, set isExpense to false.
The currency is South African Rand (R).

Return a JSON object with the following structure:
{
  "isExpense": boolean,
  "amount": number, // e.g., 45.00
  "store": string, // e.g., "Starbucks"
  "description": string, // e.g., "Coffee", "Groceries", "Petrol"
  "category": string, // e.g., "Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"
  "confidence": number // A score from 0 to 1 indicating confidence in the extraction
}

Examples for South African context:
- "You spent R45.00 at Starbucks" -> {"isExpense": true, "amount": 45.00, "store": "Starbucks", "description": "Coffee", "category": "Food", "confidence": 0.95}
- "Debit: R450.00 at Shell Petrol Station" -> {"isExpense": true, "amount": 450.00, "store": "Shell Petrol Station", "description": "Petrol", "category": "Transport", "confidence": 0.92}
- "Payment of R853.00 to Pick n Pay completed" -> {"isExpense": true, "amount": 853.00, "store": "Pick n Pay", "description": "Groceries", "category": "Food", "confidence": 0.90}
- "Your card ending in 1234 was charged R125.00 at Nando's" -> {"isExpense": true, "amount": 125.00, "store": "Nando's", "description": "Fast Food", "category": "Food", "confidence": 0.93}
- "Eskom bill due R1500.00" -> {"isExpense": true, "amount": 1500.00, "store": "Eskom", "description": "Electricity Bill", "category": "Bills", "confidence": 0.88}
- "Your balance is R1000.00" -> {"isExpense": false, "amount": 0, "store": "", "description": "", "category": "", "confidence": 0.99}

Text to parse: "${text}"
    `;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 200,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 15000, // 15 seconds timeout
        }
      );

      const content = response.data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('Error calling OpenAI API:', error.response?.data || error.message);
      throw new Error(`OpenAI API call failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Parse with fallback to regex if AI fails
  async parseWithFallback(text, type) {
    try {
      const isEnabled = await this.isAIEnabled();
      if (isEnabled) {
        const result = await this.parseText(text, type);
        if (result && result.isExpense && result.confidence > 0.5) {
          return result;
        }
      }
    } catch (error) {
      console.warn('AI parsing failed or not enabled, falling back:', error.message);
    }

    // If AI fails or is not enabled, return a default non-expense result
    return {
      isExpense: false,
      amount: 0,
      store: '',
      description: '',
      category: '',
      confidence: 0
    };
  }

  // Get current settings
  async getSettings() {
    return {
      apiKey: this.apiKey ? '***' + this.apiKey.slice(-4) : null,
      enabled: this.aiEnabled,
      configured: !!(this.apiKey && this.aiEnabled)
    };
  }

  // Clear API key
  async clearApiKey() {
    this.apiKey = null;
    await AsyncStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY);
  }

  // Reset all settings
  async resetSettings() {
    this.apiKey = null;
    this.aiEnabled = false;
    await AsyncStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY);
    await AsyncStorage.removeItem(AI_ENABLED_STORAGE_KEY);
  }

  // Parse notification text specifically
  async parseNotification(text) {
    return await this.parseWithFallback(text, 'notification');
  }

  // Parse SMS text specifically
  async parseSMS(text) {
    return await this.parseWithFallback(text, 'sms');
  }

  // Parse general text
  async parseGeneral(text) {
    return await this.parseWithFallback(text, 'general');
  }

  // Get usage statistics (if available)
  async getUsageStats() {
    // This would require storing usage data locally
    // For now, return basic info
    return {
      enabled: this.aiEnabled,
      configured: !!(this.apiKey),
      lastUsed: new Date().toISOString()
    };
  }

  // Validate API key format
  validateApiKey(key) {
    if (!key || typeof key !== 'string') {
      return false;
    }
    
    // OpenAI API keys typically start with 'sk-' and are 51 characters long
    const openaiPattern = /^sk-[a-zA-Z0-9]{48}$/;
    return openaiPattern.test(key);
  }

  // Show error alert
  showError(message) {
    Alert.alert(
      'AI Parsing Error',
      message,
      [{ text: 'OK' }]
    );
  }

  // Show success alert
  showSuccess(message) {
    Alert.alert(
      'Success',
      message,
      [{ text: 'OK' }]
    );
  }
}

export default new AIParser();