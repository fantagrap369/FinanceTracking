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
    
    // Extract account information first
    const accountInfo = this.extractAccountInfo(lines);
    
    // Try different parsing strategies
    // Check if this looks like CSV format first
    const hasCSVHeader = lines.some(line => 
      line.toLowerCase().includes('date') && 
      line.toLowerCase().includes('amount') && 
      line.toLowerCase().includes('description')
    );
    
    const strategies = hasCSVHeader ? [
      () => this.parseCSVFormat(lines),
      () => this.parseStandardFormat(lines),
      () => this.parseTableFormat(lines),
      () => this.parseGenericFormat(lines)
    ] : [
      () => this.parseStandardFormat(lines),
      () => this.parseCSVFormat(lines),
      () => this.parseTableFormat(lines),
      () => this.parseGenericFormat(lines)
    ];
    
    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`Trying parsing strategy ${i + 1}/${strategies.length}`);
        const result = strategies[i]();
        if (result.length > 0) {
          console.log(`✅ Strategy ${i + 1} succeeded with ${result.length} transactions`);
          return {
            accountInfo,
            transactions: result.map(tx => this.enhanceTransaction(tx, bankName, accountInfo))
          };
        } else {
          console.log(`❌ Strategy ${i + 1} returned 0 transactions`);
        }
      } catch (error) {
        console.warn(`❌ Strategy ${i + 1} failed:`, error);
        continue;
      }
    }
    
    return { accountInfo, transactions: [] };
  }

  extractAccountInfo(lines) {
    const accountInfo = {
      accountNumber: null,
      accountName: null,
      accountType: null,
      bankName: null,
      balance: null
    };

    for (const line of lines) {
      // Extract account number
      if (line.toLowerCase().includes('account:') && !accountInfo.accountNumber) {
        const accountMatch = line.match(/account:\s*([^,\[\]]+)/i);
        if (accountMatch) {
          accountInfo.accountNumber = accountMatch[1].trim();
        }
      }

      // Extract account name/type
      if (line.toLowerCase().includes('account:') && line.includes('[') && line.includes(']')) {
        const typeMatch = line.match(/\[([^\]]+)\]/);
        if (typeMatch) {
          accountInfo.accountType = typeMatch[1].trim();
        }
      }

      // Extract balance
      if (line.toLowerCase().includes('balance:') && !accountInfo.balance) {
        const balanceMatch = line.match(/balance:\s*([+-]?\d+(?:,\d{3})*(?:\.\d{2})?)/i);
        if (balanceMatch) {
          accountInfo.balance = parseFloat(balanceMatch[1].replace(/,/g, ''));
        }
      }

      // Extract name
      if (line.toLowerCase().includes('name:') && !accountInfo.accountName) {
        const nameMatch = line.match(/name:\s*([^,]+)/i);
        if (nameMatch) {
          accountInfo.accountName = nameMatch[1].trim();
        }
      }

      // Detect bank name from common patterns
      if (!accountInfo.bankName) {
        if (line.includes('FNB') || line.includes('First National Bank')) {
          accountInfo.bankName = 'FNB';
        } else if (line.includes('ABSA')) {
          accountInfo.bankName = 'ABSA';
        } else if (line.includes('Standard Bank')) {
          accountInfo.bankName = 'Standard Bank';
        } else if (line.includes('Nedbank')) {
          accountInfo.bankName = 'Nedbank';
        } else if (line.includes('Capitec')) {
          accountInfo.bankName = 'Capitec';
        }
      }
    }

    return accountInfo;
  }

  parseStandardFormat(lines) {
    const transactions = [];
    // Prioritize YYYY/MM/DD format first, then fallback to other formats
    const datePattern = /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})|(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
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
    
    // Look for CSV header row with "Date, Amount, Balance, Description"
    const headerIndex = lines.findIndex(line => 
      line.toLowerCase().includes('date') && 
      line.toLowerCase().includes('amount') &&
      line.toLowerCase().includes('description')
    );
    
    if (headerIndex === -1) return transactions;
    
    const dataLines = lines.slice(headerIndex + 1).filter(line => line.trim());
    
    for (const line of dataLines) {
      console.log('CSV Line:', line);
      
      // For CSV format, we need to be more careful with splitting
      // The format is: Date, Amount, Balance, Description
      // But description might contain commas, so we need to split more carefully
      
      // Find the first 3 commas to split into: Date, Amount, Balance, Description
      const firstComma = line.indexOf(',');
      const secondComma = line.indexOf(',', firstComma + 1);
      const thirdComma = line.indexOf(',', secondComma + 1);
      
      if (firstComma === -1 || secondComma === -1 || thirdComma === -1) {
        console.log('Skipping line - not enough commas:', line);
        continue;
      }
      
      const dateStr = line.substring(0, firstComma).trim();
      const amountStr = line.substring(firstComma + 1, secondComma).trim();
      const balanceStr = line.substring(secondComma + 1, thirdComma).trim();
      const description = line.substring(thirdComma + 1).trim();
      
      console.log('Split - Date:', dateStr, 'Amount:', amountStr, 'Balance:', balanceStr, 'Description:', description);
      
      const date = this.parseDate(dateStr);
      const amount = this.parseAmount(amountStr);
      
      console.log('Parsed - Date:', date, 'Amount:', amount);
      
      if (date && amount !== null && amount !== 0) {
        if (description) {
          // Only include expenses (negative amounts) or positive amounts for income
          const isExpense = amount < 0;
            
          transactions.push({
            date: date,
            amount: Math.abs(amount),
            description: description,
            store: this.extractStoreName(description),
            category: this.categorizeTransaction(description),
            notes: `Imported from CSV bank statement${isExpense ? '' : ' (Income)'}`,
            isImported: true,
            isIncome: !isExpense,
            originalLine: line
          });
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
      console.log('🔍 Parsing date:', dateStr);
      
      // Handle different date formats
      const formats = [
        /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,  // YYYY/MM/DD (FNB format)
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/,  // MM/DD/YY or DD/MM/YY
      ];
      
      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          let [, part1, part2, part3] = match;
          console.log('📅 Format matched:', format.source, 'Parts:', part1, part2, part3);
          
          if (part3.length === 2) {
            part3 = '20' + part3;
          }
          
          // For YYYY/MM/DD format (FNB), use directly
          if (format.source.includes('\\d{4}.*\\d{1,2}.*\\d{1,2}')) {
            const year = parseInt(part1);
            const month = parseInt(part2) - 1; // JavaScript months are 0-indexed
            const day = parseInt(part3);
            const date = new Date(year, month, day);
            console.log('🗓️ YYYY/MM/DD - Year:', year, 'Month:', month, 'Day:', day, 'Date:', date);
            if (!isNaN(date.getTime()) && date.getFullYear() > 2000 && date.getFullYear() < 2030) {
              const result = date.toISOString().split('T')[0];
              console.log('✅ Date result:', result);
              return result;
            }
            // If this format matched but date is invalid, don't try other interpretations
            continue;
          }
          
          // Try different date interpretations for other formats
          const date1 = new Date(`${part1}/${part2}/${part3}`);
          const date2 = new Date(`${part2}/${part1}/${part3}`);
          const date3 = new Date(`${part3}/${part1}/${part2}`);
          
          console.log('🔄 Fallback dates:', date1, date2, date3);
          
          for (const date of [date1, date2, date3]) {
            if (!isNaN(date.getTime()) && date.getFullYear() > 2000 && date.getFullYear() < 2030) {
              const result = date.toISOString().split('T')[0];
              console.log('✅ Fallback date result:', result);
              return result;
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

  enhanceTransaction(transaction, bankName, accountInfo) {
    // Add bank-specific enhancements
    if (bankName) {
      transaction.bank = bankName;
    }
    
    // Add account information
    if (accountInfo) {
      transaction.accountNumber = accountInfo.accountNumber;
      transaction.accountName = accountInfo.accountName;
      transaction.accountType = accountInfo.accountType;
      transaction.bankName = accountInfo.bankName || bankName;
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
