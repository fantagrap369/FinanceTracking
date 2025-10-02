// Bank Statement Parser Service
// Handles parsing of various bank statement formats

import DataManager from './DataManager';

class BankStatementParser {
  constructor() {
    this.southAfricanBanks = [
      'ABSA', 'FNB', 'Standard Bank', 'Nedbank', 'Capitec', 'Investec',
      'TymeBank', 'Discovery Bank', 'Bank Zero', 'African Bank'
    ];
    
    // Initialize data manager
    this.dataManager = DataManager;
    
    // Legacy merchants object for backward compatibility
    this.commonMerchants = {
      // Food & Groceries
      'Woolworths': 'Food',
      'Pick n Pay': 'Shopping', 
      'Checkers': 'Shopping',
      'Spar': 'Shopping',
      'Food Lovers': 'Food',
      'VINSTRA CAFE/SUPERMARKE': 'Food',
      'KINGS MEAT DELI': 'Food',
      'BK CASTLE GATE': 'Food',
      'Burger King': 'Food',
      'UBER EATS': 'Food',
      'PnP': 'Shopping',
      'TOPS': 'Shopping',
      
      // Transport
      'Shell': 'Transport',
      'Engen': 'Transport',
      'Sasol': 'Transport',
      'BP': 'Transport',
      'Total': 'Transport',
      'Uber': 'Transport',
      'Bolt': 'Transport',
      
      // Healthcare
      'Dischem': 'Healthcare',
      'Clicks': 'Healthcare',
      'DISC PREM': 'Healthcare',
      'DISCLIFE': 'Healthcare',
      'DISC INVT': 'Healthcare',
      
      // Entertainment
      'Netflix': 'Entertainment',
      'Spotify': 'Entertainment',
      'Showmax': 'Entertainment',
      'MOREGOLF': 'Entertainment',
      'BETWAY': 'Entertainment',
      'STEAMGAMES': 'Entertainment',
      'Google Golf': 'Entertainment',
      'Yoco': 'Entertainment',
      'Play With': 'Entertainment',
      'Extreme Wargami': 'Entertainment',
      
      // Rent
      'PAYPROP': 'Rent',
      
      // Bills & Utilities
      'Vodacom': 'Bills',
      'MTN': 'Bills',
      'Telkom': 'Bills',
      'VOXTELECOM': 'Bills',
      'Microsoft': 'Bills',
      'Google One': 'Bills',
      'Google DopaMax': 'Bills',
      'VIRGIN ACT': 'Bills',
      'BYC DEBIT': 'Bills',
      'Eskom': 'Bills',
      
      // Salary
      'NETCASH': 'Salary',
      'STANSAL': 'Salary',
      
      // Transfers
      'FNB APP PAYMENT': 'Transfers',
      'ABSA BANK': 'Transfers',
      'MOTHER': 'Transfers',
      'BLOB': 'Transfers',
      'FNB PLOAN': 'Transfers',
      'INT-BANKING PMT': 'Transfers',
      
      // Shopping
      'Amazon': 'Shopping',
      'Takealot': 'Shopping',
      'Mr Price': 'Shopping',
      'Foschini': 'Shopping',
      'SORBET MAN': 'Shopping',
      'KAMERS / MAKERS': 'Shopping',
      'Total Newlands': 'Shopping',
      'City Power': 'Bills'
    };
  }

  parseBankStatement(text, bankName = null) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
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
      balance: null,
      availableBalance: null
    };

    console.log('🔍 Extracting account info from lines:', lines.slice(0, 10));

    for (const line of lines) {
      // Extract account number
      if (line.toLowerCase().includes('account:') && !accountInfo.accountNumber) {
        console.log('🔍 Processing account line:', line);
        // Try different patterns to extract account number
        const patterns = [
          /account:\s*,\s*([^,\[\]]+)/i,  // Account:, 448008******8000
          /account:\s*([^,\[\]]+)/i,      // Account: 448008******8000
          /account:\s*,\s*([^,]+)/i,      // Account:, 448008******8000, [Type]
          /account:\s*,\s*([^\s,]+)/i,    // Account:, 448008******8000
          /account:\s*,\s*([0-9*]+)/i     // Account:, 448008******8000 (numbers and asterisks)
        ];
        
        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match && match[1].trim()) {
            accountInfo.accountNumber = match[1].trim();
            console.log('✅ Extracted account number:', accountInfo.accountNumber);
            break;
          }
        }
        
        if (!accountInfo.accountNumber) {
          console.log('❌ Failed to extract account number from line:', line);
        }
      }

      // Extract account name/type
      if (line.toLowerCase().includes('account:') && line.includes('[') && line.includes(']')) {
        const typeMatch = line.match(/\[([^\]]+)\]/);
      if (typeMatch) {
        accountInfo.accountType = typeMatch[1].trim();
        console.log('✅ Extracted account type:', accountInfo.accountType);
      }
      }

      // Extract balance (current balance and available balance)
      if (line.toLowerCase().includes('balance:') && !accountInfo.balance) {
        console.log('🔍 Processing balance line:', line);
        // Match: Balance:, -36920.22, 21843
        const balanceMatch = line.match(/balance:\s*,\s*([+-]?\d+(?:,\d{3})*(?:\.\d{2})?)\s*,\s*([+-]?\d+(?:,\d{3})*(?:\.\d{2})?)/i);
        if (balanceMatch) {
          accountInfo.balance = parseFloat(balanceMatch[1].replace(/,/g, ''));
          accountInfo.availableBalance = parseFloat(balanceMatch[2].replace(/,/g, ''));
          console.log('✅ Extracted balance:', accountInfo.balance, 'Available:', accountInfo.availableBalance);
        } else {
          // Fallback to single balance if format is different
          const singleBalanceMatch = line.match(/balance:\s*([+-]?\d+(?:,\d{3})*(?:\.\d{2})?)/i);
          if (singleBalanceMatch) {
            accountInfo.balance = parseFloat(singleBalanceMatch[1].replace(/,/g, ''));
            console.log('✅ Extracted single balance:', accountInfo.balance);
          }
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
    
    console.log('📋 Final account info:', accountInfo);
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
      const balance = this.parseAmount(balanceStr);
      
      console.log('Parsed - Date:', date, 'Amount:', amount, 'Balance:', balance);
      
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
            originalLine: line,
            balance: balance // Include the balance from CSV
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
          // Only add '20' prefix if we're NOT in YYYY/MM/DD format
          if (part3.length === 2 && part1.length !== 4) {
            part3 = '20' + part3;
          }
          
          // For YYYY/MM/DD format (FNB), use directly - check if first part is 4 digits
          if (part1.length === 4) {
            const year = parseInt(part1);
            const month = parseInt(part2) - 1; // JavaScript months are 0-indexed
            const day = parseInt(part3);
            const date = new Date(year, month, day);
            console.log(`🗓️ YYYY/MM/DD: ${part1}/${part2}/${part3} → ${year}/${month+1}/${day} → ${date.toISOString().split('T')[0]}`);
            if (!isNaN(date.getTime()) && date.getFullYear() > 2000 && date.getFullYear() < 2030) {
              const result = date.toISOString().split('T')[0];
              console.log('✅ SUCCESS:', result);
              return result;
            } else {
              console.log('❌ FAILED: Year out of range:', date.getFullYear());
            }
            // If this format matched but date is invalid, don't try other interpretations
            continue;
          }
          
          // Try different date interpretations for other formats
          const date1 = new Date(`${part1}/${part2}/${part3}`);
          const date2 = new Date(`${part2}/${part1}/${part3}`);
          const date3 = new Date(`${part3}/${part1}/${part2}`);
          
          for (const date of [date1, date2, date3]) {
            if (!isNaN(date.getTime()) && date.getFullYear() > 2000 && date.getFullYear() < 2030) {
              const result = date.toISOString().split('T')[0];
              console.log(`✅ FALLBACK: ${result}`);
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
    const lowerDesc = description.toLowerCase();
    
    // Try to find known merchants first (case-insensitive)
    for (const merchant of Object.keys(this.commonMerchants)) {
      if (lowerDesc.includes(merchant.toLowerCase())) {
        return merchant;
      }
    }
    
    // Additional case-insensitive patterns for common stores
    const storePatterns = [
      { pattern: /pnp\s+exp/i, name: 'Pick n Pay' },
      { pattern: /pick\s+n\s+pay/i, name: 'Pick n Pay' },
      { pattern: /tops\s+menlyn/i, name: 'TOPS' },
      { pattern: /checkers\s+sixty60/i, name: 'Checkers' },
      { pattern: /woolworths/i, name: 'Woolworths' },
      { pattern: /engen\s+castle/i, name: 'Engen' },
      { pattern: /shell/i, name: 'Shell' },
      { pattern: /bp\s+hazelwood/i, name: 'BP' },
      { pattern: /dischem/i, name: 'Dischem' },
      { pattern: /amazon/i, name: 'Amazon' },
      { pattern: /takealot/i, name: 'Takealot' },
      { pattern: /uber\s+eats/i, name: 'Uber Eats' },
      { pattern: /vodacom/i, name: 'Vodacom' },
      { pattern: /microsoft/i, name: 'Microsoft' },
      { pattern: /google/i, name: 'Google' },
      { pattern: /netflix/i, name: 'Netflix' },
      { pattern: /spotify/i, name: 'Spotify' },
      { pattern: /yoco/i, name: 'Yoco' },
      { pattern: /betway/i, name: 'Betway' },
      { pattern: /steamgames/i, name: 'Steam' },
      { pattern: /moregolf/i, name: 'MoreGolf' },
      { pattern: /virgin\s+act/i, name: 'Virgin Active' },
      { pattern: /payprop/i, name: 'PayProp' },
      { pattern: /blob/i, name: 'BLOB' },
      { pattern: /fnb/i, name: 'FNB' },
      { pattern: /absa/i, name: 'ABSA' }
    ];
    
    for (const { pattern, name } of storePatterns) {
      if (pattern.test(description)) {
        return name;
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
    
    // Get merchants from DataManager (with fallback to legacy)
    const merchants = this.dataManager.getFlattenedMerchants() || this.commonMerchants;
    
    // Check against known merchants
    for (const [merchant, category] of Object.entries(merchants)) {
      if (desc.includes(merchant.toLowerCase())) {
        return category;
      }
    }
    
    // Get patterns from DataManager (with fallback to legacy)
    const patterns = this.dataManager.getPatterns() || this.getLegacyPatterns();
    
    // Pattern-based categorization (all case-insensitive)
    for (const [category, patternData] of Object.entries(patterns)) {
      if (patternData.keywords && patternData.keywords.some(keyword => desc.includes(keyword))) {
        return category;
      }
    }
    
    return 'Other';
  }

  // Legacy patterns for backward compatibility
  getLegacyPatterns() {
    return {
      "Food": {
        "keywords": [
          "grocery", "food", "supermarket", "cafe", "restaurant", "dining",
          "burger", "meat", "eats", "vinstra", "kings meat", "bk castle"
        ]
      },
      "Transport": {
        "keywords": [
          "petrol", "fuel", "gas", "transport", "engen", "shell", "bp", "total"
        ]
      },
      "Bills": {
        "keywords": [
          "electricity", "water", "bill", "monthly", "fee", "int pymt",
          "byc", "vodacom", "microsoft", "google", "virgin", "voxtelcom"
        ]
      },
      "Rent": {
        "keywords": [
          "rent", "payprop"
        ]
      },
      "Shopping": {
        "keywords": [
          "shopping", "store", "retail", "amazon", "takealot", "sorbet",
          "kamers", "makers", "pnp", "pick n pay", "checkers", "spar",
          "tops", "purc", "woolworths", "food lovers"
        ]
      },
      "Entertainment": {
        "keywords": [
          "entertainment", "movie", "streaming", "golf", "betway", "steam",
          "yoco", "play", "wargami"
        ]
      },
      "Salary": {
        "keywords": [
          "salary", "income", "netcash", "stansal", "pay"
        ]
      },
      "Transfers": {
        "keywords": [
          "transfer", "eft", "payment", "fnb", "absa", "mother",
          "blob", "ploan"
        ]
      },
      "Healthcare": {
        "keywords": [
          "dischem", "clicks", "pharmacy", "disc", "health", "medical"
        ]
      }
    };
  }

  enhanceTransaction(transaction, bankName, accountInfo) {
    // Add bank-specific enhancements
    if (bankName) {
      transaction.bank = bankName;
    }
    
    // Add account information
    if (accountInfo) {
      transaction.accountNumber = accountInfo.accountNumber;
      // Create a descriptive account name
      const accountNumber = accountInfo.accountNumber || 'Unknown';
      const accountType = accountInfo.accountType || 'Account';
      transaction.account = `${accountNumber} (${accountType})`;
      transaction.accountName = accountInfo.accountName || accountNumber; // Use account number as name if no name found
      transaction.accountType = accountInfo.accountType;
      transaction.bankName = accountInfo.bankName || bankName;
      transaction.currentBalance = accountInfo.balance;
      transaction.availableBalance = accountInfo.availableBalance;
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
