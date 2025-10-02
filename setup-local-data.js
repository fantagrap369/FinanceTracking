const fs = require('fs-extra');
const path = require('path');

// Create local data directory structure
const dataDir = path.join(__dirname, 'data');
const expensesFile = path.join(dataDir, 'expenses.json');
const descriptionsFile = path.join(dataDir, 'descriptions.json');

async function setupLocalData() {
  try {
    // Create data directory
    await fs.ensureDir(dataDir);
    console.log('✅ Created data directory:', dataDir);

    // Initialize expenses.json
    if (!await fs.pathExists(expensesFile)) {
      const expensesData = {
        expenses: [],
        categories: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'],
        lastUpdated: new Date().toISOString()
      };
      await fs.writeJson(expensesFile, expensesData, { spaces: 2 });
      console.log('✅ Created expenses.json');
    } else {
      console.log('📄 expenses.json already exists');
    }

    // Initialize descriptions.json
    if (!await fs.pathExists(descriptionsFile)) {
      const descriptionsData = {
        descriptions: [],
        lastUpdated: new Date().toISOString()
      };
      await fs.writeJson(descriptionsFile, descriptionsData, { spaces: 2 });
      console.log('✅ Created descriptions.json');
    } else {
      console.log('📄 descriptions.json already exists');
    }

    console.log('\n🎉 Local data setup complete!');
    console.log('\n📁 Data files location:');
    console.log(`   - Expenses: ${expensesFile}`);
    console.log(`   - Descriptions: ${descriptionsFile}`);
    
    console.log('\n🚀 Next steps:');
    console.log('1. Update your PC IP address in android-app/src/services/ExpenseService.js');
    console.log('2. Start the server: npm start');
    console.log('3. Start the web app: cd web && npm start');
    console.log('4. Your phone will sync with this PC when connected to the same WiFi');

  } catch (error) {
    console.error('❌ Error setting up local data:', error);
  }
}

setupLocalData();
