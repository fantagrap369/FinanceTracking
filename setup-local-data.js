#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

// Configuration
const DATA_DIR = path.join(__dirname, 'data');
const EXPENSES_FILE = path.join(DATA_DIR, 'expenses.json');
const DESCRIPTIONS_FILE = path.join(DATA_DIR, 'descriptions.json');

// Sample data for initial setup
const sampleExpenses = [
  {
    id: '1',
    description: 'Coffee',
    amount: 45.00,
    store: 'Starbucks',
    category: 'Food',
    notes: 'Morning coffee',
    date: new Date().toISOString()
  },
  {
    id: '2',
    description: 'Groceries',
    amount: 350.00,
    store: 'Pick n Pay',
    category: 'Food',
    notes: 'Weekly shopping',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    description: 'Petrol',
    amount: 450.00,
    store: 'Shell',
    category: 'Transport',
    notes: 'Fuel for car',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const sampleDescriptions = {
  'starbucks': {
    description: 'Coffee',
    category: 'Food',
    amount: 45.00,
    count: 1,
    lastUsed: new Date().toISOString(),
    originalStore: 'Starbucks',
    isManual: false
  },
  'pick n pay': {
    description: 'Groceries',
    category: 'Food',
    amount: 350.00,
    count: 1,
    lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    originalStore: 'Pick n Pay',
    isManual: false
  },
  'shell': {
    description: 'Petrol',
    category: 'Transport',
    amount: 450.00,
    count: 1,
    lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    originalStore: 'Shell',
    isManual: false
  }
};

async function setupLocalData() {
  try {
    console.log('🚀 Setting up local data files...\n');

    // Create data directory if it doesn't exist
    await fs.ensureDir(DATA_DIR);
    console.log('✅ Created data directory:', DATA_DIR);

    // Check if files already exist
    const expensesExists = await fs.pathExists(EXPENSES_FILE);
    const descriptionsExists = await fs.pathExists(DESCRIPTIONS_FILE);

    // Create expenses.json
    if (!expensesExists) {
      await fs.writeJson(EXPENSES_FILE, sampleExpenses, { spaces: 2 });
      console.log('✅ Created expenses.json with sample data');
    } else {
      console.log('ℹ️  expenses.json already exists, skipping...');
    }

    // Create descriptions.json
    if (!descriptionsExists) {
      await fs.writeJson(DESCRIPTIONS_FILE, sampleDescriptions, { spaces: 2 });
      console.log('✅ Created descriptions.json with sample data');
    } else {
      console.log('ℹ️  descriptions.json already exists, skipping...');
    }

    // Verify files were created
    const expensesData = await fs.readJson(EXPENSES_FILE);
    const descriptionsData = await fs.readJson(DESCRIPTIONS_FILE);

    console.log('\n📊 Data Summary:');
    console.log(`   • Expenses: ${expensesData.length} records`);
    console.log(`   • Descriptions: ${Object.keys(descriptionsData).length} learned stores`);
    
    console.log('\n🎉 Local data setup completed successfully!');
    console.log('\n📁 Files created:');
    console.log(`   • ${EXPENSES_FILE}`);
    console.log(`   • ${DESCRIPTIONS_FILE}`);
    
    console.log('\n🔧 Next steps:');
    console.log('   1. Start the Express server: npm start');
    console.log('   2. Start the web app: cd web && npm start');
    console.log('   3. Configure your Android app with the PC IP address');
    
    console.log('\n💡 Tips:');
    console.log('   • The data files are stored locally on your PC');
    console.log('   • The Android app will sync with these files via the Express server');
    console.log('   • You can manually edit the JSON files if needed');
    console.log('   • The web app reads directly from these files');

  } catch (error) {
    console.error('❌ Error setting up local data:', error);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupLocalData();
}

module.exports = { setupLocalData, DATA_DIR, EXPENSES_FILE, DESCRIPTIONS_FILE };