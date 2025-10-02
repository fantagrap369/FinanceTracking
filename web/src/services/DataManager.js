class DataManager {
  constructor() {
    this.merchants = null;
    this.patterns = null;
    this.lastLoaded = null;
    this.loadInterval = 5 * 60 * 1000; // 5 minutes
  }

  async loadMerchants() {
    try {
      const response = await fetch('http://localhost:3001/api/merchants');
      if (response.ok) {
        const data = await response.json();
        this.merchants = data.merchants;
        this.lastLoaded = new Date();
        return this.merchants;
      }
    } catch (error) {
      console.error('Error loading merchants:', error);
    }
    return this.getDefaultMerchants();
  }

  async loadPatterns() {
    try {
      const response = await fetch('http://localhost:3001/api/categorization-patterns');
      if (response.ok) {
        const data = await response.json();
        this.patterns = data.patterns;
        this.lastLoaded = new Date();
        return this.patterns;
      }
    } catch (error) {
      console.error('Error loading patterns:', error);
    }
    return this.getDefaultPatterns();
  }

  async loadData() {
    const [merchants, patterns] = await Promise.all([
      this.loadMerchants(),
      this.loadPatterns()
    ]);
    return { merchants, patterns };
  }

  getMerchants() {
    if (!this.merchants || this.shouldReload()) {
      this.loadMerchants();
    }
    return this.merchants || this.getDefaultMerchants();
  }

  getPatterns() {
    if (!this.patterns || this.shouldReload()) {
      this.loadPatterns();
    }
    return this.patterns || this.getDefaultPatterns();
  }

  shouldReload() {
    if (!this.lastLoaded) return true;
    return (new Date() - this.lastLoaded) > this.loadInterval;
  }

  getDefaultMerchants() {
    return {
      "Food & Groceries": {
        "Woolworths": "Food",
        "Pick n Pay": "Shopping",
        "Checkers": "Shopping",
        "Spar": "Shopping",
        "Food Lovers": "Food",
        "VINSTRA CAFE/SUPERMARKE": "Food",
        "KINGS MEAT DELI": "Food",
        "BK CASTLE GATE": "Food",
        "Burger King": "Food",
        "UBER EATS": "Food",
        "PnP": "Shopping",
        "TOPS": "Shopping"
      },
      "Transport": {
        "Shell": "Transport",
        "Engen": "Transport",
        "Sasol": "Transport",
        "BP": "Transport",
        "Total": "Transport",
        "Uber": "Transport",
        "Bolt": "Transport"
      },
      "Healthcare": {
        "Dischem": "Healthcare",
        "Clicks": "Healthcare",
        "DISC PREM": "Healthcare",
        "DISCLIFE": "Healthcare",
        "DISC INVT": "Healthcare"
      },
      "Entertainment": {
        "Netflix": "Entertainment",
        "Spotify": "Entertainment",
        "Showmax": "Entertainment",
        "MOREGOLF": "Entertainment",
        "BETWAY": "Entertainment",
        "STEAMGAMES": "Entertainment",
        "Google Golf": "Entertainment",
        "Yoco": "Entertainment",
        "Play With": "Entertainment",
        "Extreme Wargami": "Entertainment"
      },
      "Rent": {
        "PAYPROP": "Rent"
      },
      "Bills & Utilities": {
        "Vodacom": "Bills",
        "MTN": "Bills",
        "Telkom": "Bills",
        "VOXTELECOM": "Bills",
        "Microsoft": "Bills",
        "Google One": "Bills",
        "Google DopaMax": "Bills",
        "VIRGIN ACT": "Bills",
        "BYC DEBIT": "Bills",
        "Eskom": "Bills",
        "City Power": "Bills"
      },
      "Salary": {
        "NETCASH": "Salary",
        "STANSAL": "Salary"
      },
      "Transfers": {
        "FNB APP PAYMENT": "Transfers",
        "ABSA BANK": "Transfers",
        "MOTHER": "Transfers",
        "BLOB": "Transfers",
        "FNB PLOAN": "Transfers",
        "INT-BANKING PMT": "Transfers"
      },
      "Shopping": {
        "Amazon": "Shopping",
        "Takealot": "Shopping",
        "Mr Price": "Shopping",
        "Foschini": "Shopping",
        "SORBET MAN": "Shopping",
        "KAMERS / MAKERS": "Shopping",
        "Total Newlands": "Shopping"
      }
    };
  }

  getDefaultPatterns() {
    return {
      "Food": {
        "keywords": [
          "grocery", "food", "supermarket", "cafe", "restaurant", "dining",
          "burger", "meat", "eats", "vinstra", "kings meat", "bk castle"
        ],
        "description": "Food and dining related transactions"
      },
      "Transport": {
        "keywords": [
          "petrol", "fuel", "gas", "transport", "engen", "shell", "bp", "total"
        ],
        "description": "Transportation and fuel related transactions"
      },
      "Bills": {
        "keywords": [
          "electricity", "water", "bill", "monthly", "fee", "int pymt",
          "byc", "vodacom", "microsoft", "google", "virgin", "voxtelcom"
        ],
        "description": "Bills and utility payments"
      },
      "Rent": {
        "keywords": [
          "rent", "payprop"
        ],
        "description": "Rent and housing payments"
      },
      "Shopping": {
        "keywords": [
          "shopping", "store", "retail", "amazon", "takealot", "sorbet",
          "kamers", "makers", "pnp", "pick n pay", "checkers", "spar",
          "tops", "purc", "woolworths", "food lovers"
        ],
        "description": "Shopping and retail purchases"
      },
      "Entertainment": {
        "keywords": [
          "entertainment", "movie", "streaming", "golf", "betway", "steam",
          "yoco", "play", "wargami"
        ],
        "description": "Entertainment and leisure activities"
      },
      "Salary": {
        "keywords": [
          "salary", "income", "netcash", "stansal", "pay"
        ],
        "description": "Salary and income payments"
      },
      "Transfers": {
        "keywords": [
          "transfer", "eft", "payment", "fnb", "absa", "mother",
          "blob", "ploan"
        ],
        "description": "Bank transfers and payments"
      },
      "Healthcare": {
        "keywords": [
          "dischem", "clicks", "pharmacy", "disc", "health", "medical"
        ],
        "description": "Healthcare and medical expenses"
      }
    };
  }

  // Flatten merchants object for easy lookup
  getFlattenedMerchants() {
    const merchants = this.getMerchants();
    const flattened = {};
    
    for (const category of Object.values(merchants)) {
      Object.assign(flattened, category);
    }
    
    return flattened;
  }
}

// Export singleton instance
export default new DataManager();
