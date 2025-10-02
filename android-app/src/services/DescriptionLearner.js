import AsyncStorage from '@react-native-async-storage/async-storage';

const DESCRIPTIONS_KEY = 'learned_descriptions';
const SIMILARITY_THRESHOLD = 0.7; // How similar store names need to be to match

class DescriptionLearner {
  constructor() {
    this.descriptions = new Map();
    this.loadDescriptions();
  }

  async loadDescriptions() {
    try {
      const stored = await AsyncStorage.getItem(DESCRIPTIONS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.descriptions = new Map(data);
      }
    } catch (error) {
      console.error('Error loading descriptions:', error);
    }
  }

  async saveDescriptions() {
    try {
      const data = Array.from(this.descriptions.entries());
      await AsyncStorage.setItem(DESCRIPTIONS_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving descriptions:', error);
    }
  }

  // Calculate similarity between two strings (0-1, where 1 is identical)
  calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1.0;
    
    // Check if one contains the other
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    // Simple Levenshtein distance-based similarity
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Find the most similar store name in our learned descriptions
  findSimilarStore(storeName) {
    let bestMatch = null;
    let bestSimilarity = 0;

    for (const [learnedStore, data] of this.descriptions) {
      const similarity = this.calculateSimilarity(storeName, learnedStore);
      if (similarity > bestSimilarity && similarity >= SIMILARITY_THRESHOLD) {
        bestMatch = learnedStore;
        bestSimilarity = similarity;
      }
    }

    return bestMatch ? this.descriptions.get(bestMatch) : null;
  }

  // Learn a new description for a store
  async learnDescription(storeName, description, category, amount) {
    const normalizedStore = storeName.toLowerCase().trim();
    
    // Store the description with metadata
    this.descriptions.set(normalizedStore, {
      description,
      category,
      amount: amount || 0,
      count: 1,
      lastUsed: new Date().toISOString(),
      originalStore: storeName, // Keep original casing
      isManual: false // Track if this was manually created
    });

    await this.saveDescriptions();
    console.log(`Learned description for "${storeName}": "${description}"`);
  }

  // Manually create a store entry
  async createManualStore(storeName, description, category) {
    const normalizedStore = storeName.toLowerCase().trim();
    
    // Check if store already exists
    if (this.descriptions.has(normalizedStore)) {
      throw new Error('Store already exists');
    }
    
    // Create manual entry
    this.descriptions.set(normalizedStore, {
      description,
      category,
      amount: 0,
      count: 0,
      lastUsed: new Date().toISOString(),
      originalStore: storeName,
      isManual: true // Mark as manually created
    });

    await this.saveDescriptions();
    console.log(`Manually created store "${storeName}": "${description}" in "${category}"`);
    return true;
  }

  // Update existing description (if user corrects it)
  async updateDescription(storeName, newDescription, newCategory) {
    const normalizedStore = storeName.toLowerCase().trim();
    
    if (this.descriptions.has(normalizedStore)) {
      const data = this.descriptions.get(normalizedStore);
      data.description = newDescription;
      data.category = newCategory;
      data.count += 1;
      data.lastUsed = new Date().toISOString();
      
      this.descriptions.set(normalizedStore, data);
      await this.saveDescriptions();
      console.log(`Updated description for "${storeName}": "${newDescription}"`);
    }
  }

  // Get description for a store (either learned or generate default)
  async getDescription(storeName, amount) {
    if (!storeName) return 'Unknown Purchase';

    // First, try to find a similar store we've learned about
    const similarData = this.findSimilarStore(storeName);
    if (similarData) {
      // Update usage count
      similarData.count += 1;
      similarData.lastUsed = new Date().toISOString();
      await this.saveDescriptions();
      return similarData.description;
    }

    // If no similar store found, generate a default description
    const defaultDescription = this.generateDefaultDescription(storeName, amount);
    
    // Learn this new description for future use
    await this.learnDescription(storeName, defaultDescription, 'Other', amount);
    
    return defaultDescription;
  }

  // Generate a default description based on store name and amount
  generateDefaultDescription(storeName, amount) {
    const storeLower = storeName.toLowerCase();
    
    // Common patterns for South African stores
    if (storeLower.includes('coffee') || storeLower.includes('cafe')) {
      return 'Coffee';
    }
    if (storeLower.includes('petrol') || storeLower.includes('fuel') || 
        storeLower.includes('shell') || storeLower.includes('engen') ||
        storeLower.includes('sasol') || storeLower.includes('bp')) {
      return 'Petrol';
    }
    if (storeLower.includes('grocery') || storeLower.includes('supermarket') ||
        storeLower.includes('pick') || storeLower.includes('checkers') ||
        storeLower.includes('woolworths') || storeLower.includes('spar')) {
      return 'Groceries';
    }
    if (storeLower.includes('restaurant') || storeLower.includes('food') ||
        storeLower.includes('mcdonalds') || storeLower.includes('kfc') ||
        storeLower.includes('nandos')) {
      return 'Food';
    }
    if (storeLower.includes('pharmacy') || storeLower.includes('dischem') ||
        storeLower.includes('clicks')) {
      return 'Pharmacy';
    }
    if (storeLower.includes('online') || storeLower.includes('takealot') ||
        storeLower.includes('take2')) {
      return 'Online Purchase';
    }
    
    // If amount gives us a clue
    if (amount < 50) return 'Small Purchase';
    if (amount < 200) return 'Medium Purchase';
    if (amount < 500) return 'Large Purchase';
    
    return `Purchase at ${storeName}`;
  }

  // Get all learned descriptions for management
  getAllDescriptions() {
    return Array.from(this.descriptions.entries()).map(([store, data]) => ({
      store: data.originalStore,
      description: data.description,
      category: data.category,
      count: data.count,
      lastUsed: data.lastUsed
    }));
  }

  // Delete a learned description
  async deleteDescription(storeName) {
    const normalizedStore = storeName.toLowerCase().trim();
    if (this.descriptions.has(normalizedStore)) {
      this.descriptions.delete(normalizedStore);
      await this.saveDescriptions();
      console.log(`Deleted description for "${storeName}"`);
    }
  }

  // Get all available categories
  getAvailableCategories() {
    const categories = new Set();
    
    // Add default categories
    const defaultCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];
    defaultCategories.forEach(cat => categories.add(cat));
    
    // Add categories from learned stores
    for (const [store, data] of this.descriptions) {
      categories.add(data.category);
    }
    
    return Array.from(categories).sort();
  }

  // Create a custom category
  async createCustomCategory(categoryName) {
    const normalizedCategory = categoryName.trim();
    
    if (!normalizedCategory) {
      throw new Error('Category name cannot be empty');
    }
    
    // Check if category already exists
    const existingCategories = this.getAvailableCategories();
    if (existingCategories.includes(normalizedCategory)) {
      throw new Error('Category already exists');
    }
    
    // Category will be available for use in future store creations
    console.log(`Custom category "${normalizedCategory}" is now available`);
    return true;
  }

  // Get statistics about learned descriptions
  getStats() {
    const total = this.descriptions.size;
    const categories = {};
    let totalCount = 0;
    let manualStores = 0;

    for (const [store, data] of this.descriptions) {
      categories[data.category] = (categories[data.category] || 0) + 1;
      totalCount += data.count;
      if (data.isManual) {
        manualStores++;
      }
    }

    return {
      totalStores: total,
      totalTransactions: totalCount,
      manualStores,
      learnedStores: total - manualStores,
      categories,
      averageTransactionsPerStore: total > 0 ? (totalCount / total).toFixed(1) : 0
    };
  }
}

export default new DescriptionLearner();
