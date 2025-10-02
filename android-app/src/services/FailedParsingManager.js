import AsyncStorage from '@react-native-async-storage/async-storage';

const FAILED_PARSING_STORAGE_KEY = 'failed_parsing_attempts';

class FailedParsingManager {
  constructor() {
    this.failedAttempts = [];
    this.init();
  }

  async init() {
    await this.loadFailedAttempts();
  }

  // Load failed parsing attempts from storage
  async loadFailedAttempts() {
    try {
      const stored = await AsyncStorage.getItem(FAILED_PARSING_STORAGE_KEY);
      if (stored) {
        this.failedAttempts = JSON.parse(stored);
        console.log(`Loaded ${this.failedAttempts.length} failed parsing attempts`);
      }
    } catch (error) {
      console.error('Error loading failed parsing attempts:', error);
      this.failedAttempts = [];
    }
  }

  // Save failed parsing attempts to storage
  async saveFailedAttempts() {
    try {
      await AsyncStorage.setItem(FAILED_PARSING_STORAGE_KEY, JSON.stringify(this.failedAttempts));
    } catch (error) {
      console.error('Error saving failed parsing attempts:', error);
    }
  }

  // Add a failed parsing attempt
  async addFailedAttempt(originalText, source, timestamp = null) {
    const failedAttempt = {
      id: Date.now().toString(),
      originalText,
      source, // 'notification' or 'sms'
      timestamp: timestamp || new Date().toISOString(),
      processed: false,
      createdAt: new Date().toISOString()
    };

    this.failedAttempts.unshift(failedAttempt); // Add to beginning
    await this.saveFailedAttempts();
    
    console.log(`Added failed parsing attempt: ${source} - "${originalText.substring(0, 50)}..."`);
    return failedAttempt;
  }

  // Get all failed attempts
  getAllFailedAttempts() {
    return this.failedAttempts.filter(attempt => !attempt.processed);
  }

  // Get failed attempts by source
  getFailedAttemptsBySource(source) {
    return this.failedAttempts.filter(attempt => 
      attempt.source === source && !attempt.processed
    );
  }

  // Mark attempt as processed
  async markAsProcessed(id) {
    const attempt = this.failedAttempts.find(a => a.id === id);
    if (attempt) {
      attempt.processed = true;
      attempt.processedAt = new Date().toISOString();
      await this.saveFailedAttempts();
      console.log(`Marked failed attempt ${id} as processed`);
      return true;
    }
    return false;
  }

  // Remove processed attempts older than 30 days
  async cleanupOldAttempts() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const initialCount = this.failedAttempts.length;
    this.failedAttempts = this.failedAttempts.filter(attempt => {
      const attemptDate = new Date(attempt.createdAt);
      return !attempt.processed || attemptDate > thirtyDaysAgo;
    });

    const removedCount = initialCount - this.failedAttempts.length;
    if (removedCount > 0) {
      await this.saveFailedAttempts();
      console.log(`Cleaned up ${removedCount} old failed parsing attempts`);
    }

    return removedCount;
  }

  // Get statistics
  getStats() {
    const total = this.failedAttempts.length;
    const unprocessed = this.failedAttempts.filter(a => !a.processed).length;
    const processed = total - unprocessed;
    
    const bySource = {
      notification: this.failedAttempts.filter(a => a.source === 'notification').length,
      sms: this.failedAttempts.filter(a => a.source === 'sms').length
    };

    return {
      total,
      unprocessed,
      processed,
      bySource
    };
  }

  // Clear all failed attempts
  async clearAllFailedAttempts() {
    this.failedAttempts = [];
    await this.saveFailedAttempts();
    console.log('Cleared all failed parsing attempts');
    return true;
  }

  // Get recent failed attempts (last 7 days)
  getRecentFailedAttempts() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.failedAttempts.filter(attempt => {
      const attemptDate = new Date(attempt.createdAt);
      return !attempt.processed && attemptDate > sevenDaysAgo;
    });
  }

  // Search failed attempts
  searchFailedAttempts(query) {
    const searchTerm = query.toLowerCase();
    return this.failedAttempts.filter(attempt => 
      !attempt.processed && 
      (attempt.originalText.toLowerCase().includes(searchTerm) ||
       attempt.source.toLowerCase().includes(searchTerm))
    );
  }

  // Get failed attempt by ID
  getFailedAttemptById(id) {
    return this.failedAttempts.find(attempt => attempt.id === id);
  }

  // Update failed attempt
  async updateFailedAttempt(id, updates) {
    const attempt = this.failedAttempts.find(a => a.id === id);
    if (attempt) {
      Object.assign(attempt, updates);
      await this.saveFailedAttempts();
      return true;
    }
    return false;
  }

  // Process failed attempt with manual data
  async processFailedAttempt(id, expenseData) {
    try {
      // Mark as processed
      await this.markAsProcessed(id);
      
      // Add to failed attempts with processed data
      const attempt = this.getFailedAttemptById(id);
      if (attempt) {
        attempt.processedData = expenseData;
        await this.saveFailedAttempts();
      }
      
      return true;
    } catch (error) {
      console.error('Error processing failed attempt:', error);
      return false;
    }
  }
}

export default new FailedParsingManager();
