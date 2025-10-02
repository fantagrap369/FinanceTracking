// Bank Statement Parser Service
// Handles parsing of various bank statement formats

class BankStatementParser {
  constructor() {
    this.southAfricanBanks = [
      'ABSA', 'FNB', 'Standard Bank', 'Nedbank', 'Capitec', 'Investec',
      'TymeBank', 'Discovery Bank', 'Bank Zero', 'African Bank'
    ];
    
    this.commonMerchants = {
      'Woolworths': 'Groceries',
      'Pick n Pay': 'Groceries', 
      'Checkers': 'Groceries',
      'Spar': 'Groceries',
      'Food Lovers': 'Groceries',
      'Shell': 'Transport',
      'Engen': 'Transport',
      'Sasol': 'Transport',
      'BP': 'Transport',
      'Total': 'Transport',
      'Uber': 'Transport',
      'Bolt': 'Transport',
      'Netflix': 'Entertainment',
      'Spotify': 'Entertainment',
      'Showmax': 'Entertainment',
      'Amazon': 'Shopping',
      'Takealot': 'Shopping',
      'Mr Price': 'Shopping',
      'Foschini': 'Shopping',
      'Eskom': 'Bills',
      'City Power': 'Bills',
      'Vodacom': 'Bills',
      'MTN': 'Bills',
      'Telkom': 'Bills'
    };
  }

  parseBankStatement(text, bankName = null) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const transactions = [];
    
    // Try different parsing strategies
    const strategies = [
      () => this.parseStandardFormat(lines),
      () => this.parseCSVFormat(lines),
      () => this.parseTableFormat(lines),
      () => this.parseGenericFormat(lines)
    ];
    
    for (const strategy of strategies) {
      try {
        const result = strategy();
        if (result.length > 0) {
          return result.map(tx => this.enhanceTransaction(tx, bankName));
        }
      } catch (error) {
        console.warn('Parsing strategy failed:', error);
        continue;
      }
    }
    
    return [];
  }

  parseStandardFormat(lines) {
    const transactions = [];
    const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
    const amountPattern = /([+-]?R?\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const dateMatch = line.match(datePattern);
      const amountMatch = line.match(amountPattern);
      
      if (dateMatch && amountMatch) {
        const date = this.parseDate(dateMatch[1]);
        const amount = this.parseAmount(amountMatch[1]);
        
        if (date && amount !== null && amount !== 0) {
          const description = this.extractDescription(line, dateMatch[0], amountMatch[0]);
          
          if (description && description.length > 3) {
            transactions.push({
              date: date,
              amount: Math.abs(amount),
              description: description,
              store: this.extractStoreName(description),
              category: this.categorizeTransaction(description),
              notes: `Imported from bank statement`,
              isImported: true,
              originalLine: line
            });
          }
        }
      }
    }
    
    return transactions;
  }

  parseCSVFormat(lines) {
    const transactions = [];
    
    // Look for CSV header row
    const headerIndex = lines.findIndex(line => 
      line.toLowerCase().includes('date') && 
      line.toLowerCase().includes('amount')
    );
    
    if (headerIndex === -1) return transactions;
    
    const dataLines = lines.slice(headerIndex + 1);
    
    for (const line of dataLines) {
      const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
      
      if (columns.length >= 2) {
        const date = this.parseDate(columns[0]);
        const amount = this.parseAmount(columns[1]);
        
        if (date && amount !== null && amount !== 0) {
          const description = columns.slice(2).join(' ').trim();
          
          if (description) {
            transactions.push({
              date: date,
              amount: Math.abs(amount),
              description: description,
              store: this.extractStoreName(description),
              category: this.categorizeTransaction(description),
              notes: `Imported from CSV bank statement`,
              isImported: true,
              originalLine: line
            });
          }
        }
      }
    }
    
    return transactions;
  }

  parseTableFormat(lines) {
    const transactions = [];
    
    // Look for table-like data with consistent spacing
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if line looks like a transaction row
      if (this.looksLikeTransactionRow(line)) {
        const parts = line.split(/\s{2,}/); // Split on multiple spaces
        
        if (parts.length >= 3) {
          const date = this.parseDate(parts[0]);
          const amount = this.parseAmount(parts[parts.length - 1]);
          
          if (date && amount !== null && amount !== 0) {
            const description = parts.slice(1, -1).join(' ').trim();
            
            if (description) {
              transactions.push({
                date: date,
                amount: Math.abs(amount),
                description: description,
                store: this.extractStoreName(description),
                category: this.categorizeTransaction(description),
                notes: `Imported from table format bank statement`,
                isImported: true,
                originalLine: line
              });
            }
          }
        }
      }
    }
    
    return transactions;
  }

  parseGenericFormat(lines) {
    const transactions = [];
    
    // More flexible parsing for various formats
    for (const line of lines) {
      const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
      const amountPattern = /([+-]?R?\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/;
      
      const dateMatch = line.match(datePattern);
      const amountMatch = line.match(amountPattern);
      
      if (dateMatch && amountMatch) {
        const date = this.parseDate(dateMatch[1]);
        const amount = this.parseAmount(amountMatch[1]);
        
        if (date && amount !== null && amount !== 0) {
          const description = this.extractDescription(line, dateMatch[0], amountMatch[0]);
          
          if (description && description.length > 3) {
            transactions.push({
              date: date,
              amount: Math.abs(amount),
              description: description,
              store: this.extractStoreName(description),
              category: this.categorizeTransaction(description),
              notes: `Imported from bank statement`,
              isImported: true,
              originalLine: line
            });
          }
        }
      }
    }
    
    return transactions;
  }

  looksLikeTransactionRow(line) {
    // Check if line looks like a transaction row
    const hasDate = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(line);
    const hasAmount = /[+-]?R?\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/.test(line);
    const hasDescription = line.length > 20;
    
    return hasDate && hasAmount && hasDescription;
  }

  parseDate(dateStr) {
    try {
      // Handle different date formats
      const formats = [
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/,  // MM/DD/YY or DD/MM/YY
        /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,  // YYYY/MM/DD
      ];
      
      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          let [, part1, part2, part3] = match;
          
          if (part3.length === 2) {
            part3 = '20' + part3;
          }
          
          // Try different date interpretations
          const date1 = new Date(`${part1}/${part2}/${part3}`);
          const date2 = new Date(`${part2}/${part1}/${part3}`);
          const date3 = new Date(`${part3}/${part1}/${part2}`);
          
          for (const date of [date1, date2, date3]) {
            if (!isNaN(date.getTime()) && date.getFullYear() > 2000 && date.getFullYear() < 2030) {
              return date.toISOString().split('T')[0];
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  parseAmount(amountStr) {
    try {
      // Remove currency symbols and clean up
      let cleanAmount = amountStr
        .replace(/R/g, '')
        .replace(/,/g, '')
        .replace(/\s/g, '')
        .trim();
      
      const amount = parseFloat(cleanAmount);
      return isNaN(amount) ? null : amount;
    } catch (error) {
      return null;
    }
  }

  extractDescription(line, dateStr, amountStr) {
    return line
      .replace(dateStr, '')
      .replace(amountStr, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractStoreName(description) {
    // Try to find known merchants first
    for (const merchant of Object.keys(this.commonMerchants)) {
      if (description.toLowerCase().includes(merchant.toLowerCase())) {
        return merchant;
      }
    }
    
    // Extract first few words as store name
    const words = description.split(' ');
    if (words.length >= 2) {
      return words.slice(0, 2).join(' ');
    }
    return words[0] || 'Unknown Store';
  }

  categorizeTransaction(description) {
    const desc = description.toLowerCase();
    
    // Check against known merchants
    for (const [merchant, category] of Object.entries(this.commonMerchants)) {
      if (desc.includes(merchant.toLowerCase())) {
        return category;
      }
    }
    
    // Pattern-based categorization
    if (desc.includes('grocery') || desc.includes('food') || desc.includes('supermarket')) {
      return 'Food';
    }
    if (desc.includes('petrol') || desc.includes('fuel') || desc.includes('gas') || desc.includes('transport')) {
      return 'Transport';
    }
    if (desc.includes('electricity') || desc.includes('water') || desc.includes('rent') || desc.includes('bill')) {
      return 'Bills';
    }
    if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('dining')) {
      return 'Food';
    }
    if (desc.includes('shopping') || desc.includes('store') || desc.includes('retail')) {
      return 'Shopping';
    }
    if (desc.includes('entertainment') || desc.includes('movie') || desc.includes('streaming')) {
      return 'Entertainment';
    }
    
    return 'Other';
  }

  enhanceTransaction(transaction, bankName) {
    // Add bank-specific enhancements
    if (bankName) {
      transaction.bank = bankName;
    }
    
    // Add unique ID
    transaction.id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Clean up description
    transaction.description = transaction.description
      .replace(/\s+/g, ' ')
      .trim();
    
    return transaction;
  }
}

export default new BankStatementParser();
