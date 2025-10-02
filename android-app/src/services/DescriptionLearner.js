import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculate } from 'js-levenshtein';

const DESCRIPTION_STORAGE_KEY = 'learned_descriptions';
const SIMILARITY_THRESHOLD = 0.7; // 70% similarity

class DescriptionLearner {
  constructor() {
    this.descriptions = new Map(); // Map<normalizedStoreName, {description, category, amount, count, lastUsed, originalStore, isManual}>
    this.init();
  }

  async init() {
    await this.loadDescriptions();
  }

  // Load descriptions from AsyncStorage
  async loadDescriptions() {
    try {
      const stored = await AsyncStorage.getItem(DESCRIPTION_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.descriptions = new Map(data);
        console.log(`Loaded ${this.descriptions.size} learned descriptions`);
      }
    } catch (error) {
      console.error('Error loading descriptions:', error);
    }
  }

  // Save descriptions to AsyncStorage
  async saveDescriptions() {
    try {
      const data = Array.from(this.descriptions.entries());
      await AsyncStorage.setItem(DESCRIPTION_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving descriptions:', error);
    }
  }

  // Find similar store using Levenshtein distance
  findSimilarStore(storeName) {
    const normalizedInput = storeName.toLowerCase().trim();
    
    for (const [normalizedStore, data] of this.descriptions) {
      const similarity = this.calculateSimilarity(normalizedInput, normalizedStore);
      if (similarity >= SIMILARITY_THRESHOLD) {
        return {
          store: data.originalStore,
          description: data.description,
          category: data.category,
          similarity: similarity,
          count: data.count,
          lastUsed: data.lastUsed
        };
      }
    }
    return null;
  }

  // Calculate similarity between two strings
  calculateSimilarity(str1, str2) {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    
    const distance = calculate(str1, str2);
    return 1 - (distance / maxLength);
  }

  // Get description for a store (learns if new)
  async getDescription(storeName, amount = 0) {
    const similarData = this.findSimilarStore(storeName);
    
    if (similarData) {
      // Update usage count and last used
      const normalizedStore = storeName.toLowerCase().trim();
      const existingData = this.descriptions.get(normalizedStore);
      if (existingData) {
        existingData.count += 1;
        existingData.lastUsed = new Date().toISOString();
        existingData.amount = amount; // Update with latest amount
        await this.saveDescriptions();
      }
      return similarData.description;
    }

    // Generate default description for new store
    const defaultDescription = this.generateDefaultDescription(storeName);
    const defaultCategory = this.generateDefaultCategory(storeName);
    
    // Learn this new store
    await this.learnDescription(storeName, defaultDescription, defaultCategory, amount);
    
    return defaultDescription;
  }

  // Learn a new description
  async learnDescription(storeName, description, category, amount = 0) {
    const normalizedStore = storeName.toLowerCase().trim();
    
    if (this.descriptions.has(normalizedStore)) {
      // Update existing
      const existing = this.descriptions.get(normalizedStore);
      existing.description = description;
      existing.category = category;
      existing.amount = amount;
      existing.count += 1;
      existing.lastUsed = new Date().toISOString();
    } else {
      // Create new
      this.descriptions.set(normalizedStore, {
        description,
        category,
        amount,
        count: 1,
        lastUsed: new Date().toISOString(),
        originalStore: storeName,
        isManual: false
      });
    }
    
    await this.saveDescriptions();
    console.log(`Learned description for "${storeName}": "${description}" in "${category}"`);
  }

  // Update existing description
  async updateDescription(storeName, newDescription, newCategory) {
    const normalizedStore = storeName.toLowerCase().trim();
    
    if (this.descriptions.has(normalizedStore)) {
      const data = this.descriptions.get(normalizedStore);
      data.description = newDescription;
      data.category = newCategory;
      data.lastUsed = new Date().toISOString();
      
      await this.saveDescriptions();
      console.log(`Updated description for "${storeName}"`);
      return true;
    }
    
    return false;
  }

  // Delete description
  async deleteDescription(storeName) {
    const normalizedStore = storeName.toLowerCase().trim();
    
    if (this.descriptions.has(normalizedStore)) {
      this.descriptions.delete(normalizedStore);
      await this.saveDescriptions();
      console.log(`Deleted description for "${storeName}"`);
      return true;
    }
    
    return false;
  }

  // Get all descriptions
  getAllDescriptions() {
    const result = [];
    for (const [normalizedStore, data] of this.descriptions) {
      result.push({
        store: data.originalStore,
        normalizedStore,
        description: data.description,
        category: data.category,
        amount: data.amount,
        count: data.count,
        lastUsed: data.lastUsed,
        isManual: data.isManual
      });
    }
    return result.sort((a, b) => b.count - a.count); // Sort by usage count
  }

  // Get available categories
  getAvailableCategories() {
    const categories = new Set();
    const defaultCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];
    defaultCategories.forEach(cat => categories.add(cat));
    
    for (const [store, data] of this.descriptions) {
      categories.add(data.category);
    }
    
    return Array.from(categories).sort();
  }

  // Create manual store
  async createManualStore(storeName, description, category) {
    const normalizedStore = storeName.toLowerCase().trim();
    
    if (this.descriptions.has(normalizedStore)) {
      throw new Error('Store already exists');
    }
    
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

  // Create custom category
  async createCustomCategory(categoryName) {
    const normalizedCategory = categoryName.trim();
    if (!normalizedCategory) {
      throw new Error('Category name cannot be empty');
    }
    
    const existingCategories = this.getAvailableCategories();
    if (existingCategories.includes(normalizedCategory)) {
      throw new Error('Category already exists');
    }
    
    console.log(`Custom category "${normalizedCategory}" is now available`);
    return true;
  }

  // Generate default description based on store name
  generateDefaultDescription(storeName) {
    const name = storeName.toLowerCase();
    
    // Food related
    if (name.includes('pick') || name.includes('shoprite') || name.includes('checkers') || 
        name.includes('woolworths') || name.includes('spar') || name.includes('food')) {
      return 'Groceries';
    }
    
    // Fast food
    if (name.includes('kfc') || name.includes('mcdonalds') || name.includes('nando') || 
        name.includes('spur') || name.includes('wimpy') || name.includes('burger')) {
      return 'Fast Food';
    }
    
    // Coffee
    if (name.includes('starbucks') || name.includes('coffee') || name.includes('cafe')) {
      return 'Coffee';
    }
    
    // Transport
    if (name.includes('shell') || name.includes('engen') || name.includes('bp') || 
        name.includes('petrol') || name.includes('fuel') || name.includes('uber') || 
        name.includes('bolt') || name.includes('taxi')) {
      return 'Transport';
    }
    
    // Shopping
    if (name.includes('clothing') || name.includes('fashion') || name.includes('store') || 
        name.includes('shop') || name.includes('retail')) {
      return 'Shopping';
    }
    
    // Bills
    if (name.includes('eskom') || name.includes('municipality') || name.includes('water') || 
        name.includes('electricity') || name.includes('bill') || name.includes('payment')) {
      return 'Bills';
    }
    
    // Entertainment
    if (name.includes('movie') || name.includes('cinema') || name.includes('netflix') || 
        name.includes('spotify') || name.includes('entertainment')) {
      return 'Entertainment';
    }
    
    // Default
    return 'Purchase';
  }

  // Generate default category based on store name
  generateDefaultCategory(storeName) {
    const name = storeName.toLowerCase();
    
    // Food related
    if (name.includes('pick') || name.includes('shoprite') || name.includes('checkers') || 
        name.includes('woolworths') || name.includes('spar') || name.includes('food') ||
        name.includes('kfc') || name.includes('mcdonalds') || name.includes('nando') || 
        name.includes('spur') || name.includes('wimpy') || name.includes('burger') ||
        name.includes('starbucks') || name.includes('coffee') || name.includes('cafe')) {
      return 'Food';
    }
    
    // Transport
    if (name.includes('shell') || name.includes('engen') || name.includes('bp') || 
        name.includes('petrol') || name.includes('fuel') || name.includes('uber') || 
        name.includes('bolt') || name.includes('taxi')) {
      return 'Transport';
    }
    
    // Shopping
    if (name.includes('clothing') || name.includes('fashion') || name.includes('store') || 
        name.includes('shop') || name.includes('retail')) {
      return 'Shopping';
    }
    
    // Bills
    if (name.includes('eskom') || name.includes('municipality') || name.includes('water') || 
        name.includes('electricity') || name.includes('bill') || name.includes('payment')) {
      return 'Bills';
    }
    
    // Entertainment
    if (name.includes('movie') || name.includes('cinema') || name.includes('netflix') || 
        name.includes('spotify') || name.includes('entertainment')) {
      return 'Entertainment';
    }
    
    // Default
    return 'Other';
  }

  // Get statistics
  getStats() {
    const total = this.descriptions.size;
    const manual = Array.from(this.descriptions.values()).filter(d => d.isManual).length;
    const auto = total - manual;
    
    const categories = {};
    for (const [store, data] of this.descriptions) {
      categories[data.category] = (categories[data.category] || 0) + 1;
    }
    
    return {
      total,
      manual,
      auto,
      categories,
      mostUsed: this.getAllDescriptions().slice(0, 5)
    };
  }

  // Clear all descriptions
  async clearAllDescriptions() {
    this.descriptions.clear();
    await this.saveDescriptions();
    console.log('All descriptions cleared');
    return true;
  }
}

export default new DescriptionLearner();