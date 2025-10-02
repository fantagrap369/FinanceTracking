# 📋 **Finance Tracker - TODO List**

## 🚀 **High Priority (Core Functionality)**

### **1. Android Core Services** 
- [ ] **ExpenseService.js** - Data management, PC sync, offline storage
- [ ] **DescriptionLearner.js** - Dynamic learning system for descriptions/categories
- [ ] **AIParser.js** - AI-powered parsing with regex fallback

### **2. Android Screens**
- [ ] **DashboardScreen.js** - Main dashboard with charts and summaries
- [ ] **ExpensesScreen.js** - Expense list with filtering and search
- [ ] **AddExpenseScreen.js** - Manual expense entry form

### **3. Android Dependencies**
- [ ] **react-native-chart-kit** - For dashboard charts
- [ ] **date-fns** - Date formatting and manipulation
- [ ] **js-levenshtein** - Similarity matching for descriptions

## 🌐 **Web App Components**

### **4. Web Components**
- [ ] **Header.js** - Navigation header with routing
- [ ] **Dashboard.js** - Web dashboard with data visualization
- [ ] **Expenses.js** - Web expense list with advanced filtering
- [ ] **AddExpense.js** - Web expense entry form

### **5. Web Services**
- [ ] **LocalDataService.js** - Direct JSON file operations
- [ ] **ExpenseContext.js** - React context for state management

### **6. Web Dependencies**
- [ ] **react-router-dom** - Client-side routing
- [ ] **lucide-react** - Modern icons
- [ ] **date-fns** - Date utilities

## ⚙️ **Backend & Setup**

### **7. Backend Setup**
- [ ] **setup-local-data.js** - Initialize local JSON files and data structure

### **8. Integration**
- [ ] **StoreManagerScreen** - Integrate into Android navigation
- [ ] **Settings Navigation** - Connect all settings screens

## 🧪 **Testing & Quality**

### **9. Testing**
- [ ] **Android App Testing** - Test all screens and services
- [ ] **Web App Testing** - Test all components and data flow
- [ ] **End-to-End Testing** - Phone-to-PC sync and data consistency

### **10. Documentation**
- [ ] **README.md** - Project overview and setup instructions
- [ ] **Setup Guides** - Detailed installation and configuration

## 📊 **Current Status:**
- ✅ **Project Structure** - Created and organized
- ✅ **GitHub Repository** - Connected and pushed
- ✅ **App.js** - Main Android entry point
- ✅ **Settings Screens** - DescriptionManager, AISettings
- ❌ **Core Services** - Need to be implemented
- ❌ **Main Screens** - Need to be implemented
- ❌ **Web Components** - Need to be implemented

## 🎯 **Recommended Order:**
1. **Android Core Services** (foundation)
2. **Android Screens** (user interface)
3. **Web Components** (web interface)
4. **Dependencies** (package.json updates)
5. **Testing & Integration** (make everything work together)

## 🔧 **Technical Details:**

### **Android App Features:**
- 📱 **Notification Reading** - Automatic expense detection from bank notifications
- 📱 **SMS Parsing** - Backup expense detection from SMS messages
- 🤖 **AI-Powered Parsing** - OpenAI GPT integration for intelligent text parsing
- 🧠 **Dynamic Learning** - Learns descriptions and categories from user input
- 📊 **Charts & Analytics** - Visual spending analysis
- 🔄 **PC Sync** - Syncs with local PC data storage
- 📱 **Offline Support** - Works without internet connection

### **Web App Features:**
- 💻 **Data Visualization** - Charts, graphs, and spending analysis
- 🔍 **Advanced Filtering** - Filter by store, category, date range
- 📊 **Monthly Summaries** - Spending breakdowns and trends
- 🏪 **Store Management** - View and manage learned stores
- 📈 **Analytics Dashboard** - Comprehensive spending insights

### **Backend Features:**
- 💾 **Local JSON Storage** - PC as primary data source
- 🔄 **REST API** - Phone-to-PC synchronization
- 🏠 **Local Server** - Express.js server for data sync
- 📁 **Data Management** - Automatic file creation and management

## 🚨 **Critical Dependencies:**
- **React Native** - Mobile app framework
- **React** - Web app framework
- **Express.js** - Backend server
- **AsyncStorage** - Mobile data persistence
- **OpenAI API** - AI parsing (optional)
- **Chart Libraries** - Data visualization

## 📝 **Notes:**
- All data is stored locally on PC as JSON files
- Phone app syncs with PC when connected
- AI parsing is optional with regex fallback
- South African Rand (ZAR) currency support
- Dynamic learning system for descriptions and categories
