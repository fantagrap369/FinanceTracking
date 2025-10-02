import axios from 'axios';

class AIParser {
  constructor() {
    this.apiKey = null; // Will be set by user
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    this.model = 'gpt-3.5-turbo';
    this.enabled = false;
  }

  // Configure AI parser with API key
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    this.enabled = !!apiKey;
  }

  // Check if AI parsing is available
  isAvailable() {
    return this.enabled && this.apiKey;
  }

  // Parse notification/SMS using AI
  async parseWithAI(text, source = 'notification') {
    if (!this.isAvailable()) {
      throw new Error('AI parsing not configured');
    }

    try {
      const prompt = this.createPrompt(text, source);
      
      const response = await axios.post(this.apiUrl, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at parsing financial transaction messages. Extract expense information and return ONLY valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content.trim();
      const parsedData = JSON.parse(aiResponse);
      
      // Validate the response
      if (this.validateAIParseResult(parsedData)) {
        return parsedData;
      } else {
        throw new Error('AI returned invalid data structure');
      }

    } catch (error) {
      console.error('AI parsing error:', error);
      throw new Error(`AI parsing failed: ${error.message}`);
    }
  }

  // Create a detailed prompt for AI parsing
  createPrompt(text, source) {
    return `
Parse this ${source} message and extract expense information. Return ONLY a JSON object with this exact structure:

{
  "isExpense": boolean,
  "amount": number (or null if not an expense),
  "store": string (or null if not an expense),
  "description": string (or null if not an expense),
  "category": string (one of: Food, Transport, Shopping, Bills, Entertainment, Other, or null if not an expense),
  "confidence": number (0-1, how confident you are this is an expense)
}

Rules:
- Only return true for "isExpense" if this is clearly a spending transaction
- Amount should be in South African Rand (R) - convert if needed
- Store name should be clean and readable
- Description should be concise (1-3 words)
- Category should match the store type
- Confidence should reflect how certain you are

Message to parse: "${text}"

Return only the JSON object, no other text.`;
  }

  // Validate AI parse result
  validateAIParseResult(data) {
    if (!data || typeof data !== 'object') return false;
    
    const requiredFields = ['isExpense', 'amount', 'store', 'description', 'category', 'confidence'];
    for (const field of requiredFields) {
      if (!(field in data)) return false;
    }

    if (typeof data.isExpense !== 'boolean') return false;
    if (data.isExpense && (typeof data.amount !== 'number' || data.amount <= 0)) return false;
    if (data.isExpense && typeof data.store !== 'string') return false;
    if (data.isExpense && typeof data.description !== 'string') return false;
    if (data.isExpense && typeof data.category !== 'string') return false;
    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) return false;

    return true;
  }

  // Parse with fallback to regex patterns
  async parseWithFallback(text, source = 'notification') {
    try {
      // Try AI parsing first
      if (this.isAvailable()) {
        const aiResult = await this.parseWithAI(text, source);
        if (aiResult.isExpense && aiResult.confidence > 0.7) {
          console.log('AI parsing successful:', aiResult);
          return aiResult;
        }
      }
    } catch (error) {
      console.log('AI parsing failed, falling back to regex:', error.message);
    }

    // Fallback to regex patterns
    return this.parseWithRegex(text, source);
  }

  // Fallback regex parsing (existing logic)
  parseWithRegex(text, source = 'notification') {
    const patterns = [
      // South African Rand patterns
      /spent\s*R?\s*(\d+\.?\d*)\s+at\s+(.+)/i,
      /debit:\s*R?\s*(\d+\.?\d*)\s+at\s+(.+)/i,
      /payment of\s*R?\s*(\d+\.?\d*)\s+to\s+(.+)/i,
      /transaction:\s*R?\s*(\d+\.?\d*)\s+at\s+(.+)/i,
      /card ending in \d+\s+charged\s*R?\s*(\d+\.?\d*)\s+at\s+(.+)/i,
      /you spent\s*R?\s*(\d+\.?\d*)\s+at\s+(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        const store = match[2].trim();
        
        if (!isNaN(amount) && amount > 0) {
          return {
            isExpense: true,
            amount: amount,
            store: store,
            description: this.generateDefaultDescription(store),
            category: this.generateDefaultCategory(store),
            confidence: 0.8 // High confidence for regex matches
          };
        }
      }
    }

    return {
      isExpense: false,
      amount: null,
      store: null,
      description: null,
      category: null,
      confidence: 0
    };
  }

  // Generate default description
  generateDefaultDescription(store) {
    const storeLower = store.toLowerCase();
    
    if (storeLower.includes('coffee') || storeLower.includes('cafe')) return 'Coffee';
    if (storeLower.includes('petrol') || storeLower.includes('gas') || 
        storeLower.includes('shell') || storeLower.includes('engen')) return 'Petrol';
    if (storeLower.includes('grocery') || storeLower.includes('supermarket') ||
        storeLower.includes('pick') || storeLower.includes('checkers')) return 'Groceries';
    if (storeLower.includes('restaurant') || storeLower.includes('food') ||
        storeLower.includes('mcdonalds') || storeLower.includes('kfc')) return 'Food';
    if (storeLower.includes('pharmacy') || storeLower.includes('dischem')) return 'Pharmacy';
    if (storeLower.includes('online') || storeLower.includes('takealot')) return 'Online Purchase';
    
    return `Purchase at ${store}`;
  }

  // Generate default category
  generateDefaultCategory(store) {
    const storeLower = store.toLowerCase();
    
    if (storeLower.includes('coffee') || storeLower.includes('cafe') ||
        storeLower.includes('restaurant') || storeLower.includes('food') ||
        storeLower.includes('grocery') || storeLower.includes('supermarket')) {
      return 'Food';
    }
    
    if (storeLower.includes('petrol') || storeLower.includes('gas') || 
        storeLower.includes('shell') || storeLower.includes('engen') ||
        storeLower.includes('sasol') || storeLower.includes('bp')) {
      return 'Transport';
    }
    
    if (storeLower.includes('pharmacy') || storeLower.includes('dischem') ||
        storeLower.includes('clicks') || storeLower.includes('shopping')) {
      return 'Shopping';
    }
    
    if (storeLower.includes('entertainment') || storeLower.includes('movie') ||
        storeLower.includes('netflix') || storeLower.includes('spotify')) {
      return 'Entertainment';
    }
    
    if (storeLower.includes('electric') || storeLower.includes('water') || 
        storeLower.includes('internet') || storeLower.includes('bill') ||
        storeLower.includes('eskom')) {
      return 'Bills';
    }
    
    return 'Other';
  }

  // Test AI connection
  async testConnection() {
    if (!this.isAvailable()) {
      throw new Error('AI not configured');
    }

    try {
      const testResult = await this.parseWithAI('Test message: R50.00 at Starbucks', 'test');
      return testResult;
    } catch (error) {
      throw new Error(`AI test failed: ${error.message}`);
    }
  }

  // Get parsing statistics
  getStats() {
    return {
      enabled: this.enabled,
      model: this.model,
      hasApiKey: !!this.apiKey
    };
  }
}

export default new AIParser();
