# 🏠 Local PC Data Source Setup

Your personal finance tracker now uses your **local PC as the primary data source** with your phone acting as a temporary storage that syncs when connected.

## 🏗️ **Architecture Overview**

```
📱 Phone (Android App)
    ↕️ Sync when connected
💻 PC (Primary Data Source)
    ├── 📄 data/expenses.json
    ├── 📄 data/descriptions.json
    └── 🌐 Web Interface (localhost:3001)
```

## 🚀 **Quick Setup**

### 1. **Initial Setup**
```bash
# Run the setup script to create data files
npm run setup

# Install all dependencies
npm run install-all
```

### 2. **Find Your PC's IP Address**
You need to update the phone app with your PC's IP address:

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter.

**macOS/Linux:**
```bash
ifconfig | grep "inet "
```
Look for your local network IP (usually 192.168.x.x).

### 3. **Update Phone Configuration**
Edit `android-app/src/services/ExpenseService.js`:
```javascript
// Change this line to your actual PC IP
const PC_IP = '192.168.1.100'; // Replace with your PC's IP
```

### 4. **Start the System**
```bash
# Terminal 1: Start the PC server
npm start

# Terminal 2: Start the web interface
cd web
npm start
```

## 📁 **Data Storage Structure**

Your data is stored locally on your PC in the `data/` folder:

```
data/
├── expenses.json          # All your expense data
└── descriptions.json      # Learned store descriptions
```

### **expenses.json** format:
```json
{
  "expenses": [
    {
      "id": "1234567890",
      "description": "Coffee",
      "amount": 45.00,
      "store": "Starbucks",
      "category": "Food",
      "source": "notification",
      "createdAt": "2023-12-15T10:30:00.000Z",
      "notes": "Auto-detected from notification"
    }
  ],
  "categories": ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"],
  "lastUpdated": "2023-12-15T10:30:00.000Z"
}
```

### **descriptions.json** format:
```json
{
  "descriptions": [
    {
      "store": "starbucks",
      "description": "Coffee",
      "category": "Food",
      "count": 5,
      "lastUsed": "2023-12-15T10:30:00.000Z",
      "originalStore": "Starbucks"
    }
  ],
  "lastUpdated": "2023-12-15T10:30:00.000Z"
}
```

## 🔄 **How Syncing Works**

### **Phone → PC Sync**
1. **When PC is available**: Phone immediately syncs new expenses to PC
2. **When PC is offline**: Phone stores expenses locally with `needsSync: true` flag
3. **When PC comes back online**: Phone automatically syncs all pending expenses

### **PC → Phone Sync**
1. **When phone starts**: Phone fetches latest data from PC
2. **When phone reconnects**: Phone updates local data with PC data
3. **Conflict resolution**: PC data takes precedence

## 🌐 **Web Interface**

- **URL**: `http://localhost:3001`
- **Data Source**: Reads directly from local JSON files
- **Real-time**: Updates when you refresh the page
- **Offline**: Works as long as your PC is running

## 📱 **Phone App Features**

### **Automatic Detection**
- Reads notifications and SMS for expense detection
- Learns store descriptions over time
- Stores data locally when PC is unavailable

### **Sync Status**
- Shows last sync time in settings
- Indicates PC connection status
- Manual sync option available

### **Offline Mode**
- Works completely offline
- Stores all data locally
- Syncs when PC becomes available

## 🔧 **Configuration**

### **PC Server Settings**
- **Port**: 3000 (configurable in `server/index.js`)
- **Data Directory**: `./data/` (relative to project root)
- **CORS**: Enabled for local network access

### **Phone App Settings**
- **PC IP**: Update in `ExpenseService.js`
- **Sync Interval**: Automatic on app start and when adding expenses
- **Timeout**: 5 seconds for PC connection attempts

## 🛠️ **Troubleshooting**

### **Phone Can't Connect to PC**
1. **Check IP Address**: Make sure phone and PC are on same WiFi
2. **Check Firewall**: Allow port 3000 through Windows Firewall
3. **Check PC Server**: Ensure `npm start` is running
4. **Test Connection**: Visit `http://YOUR_PC_IP:3000/api/health` in phone browser

### **Data Not Syncing**
1. **Check Network**: Ensure both devices on same WiFi
2. **Check Server Logs**: Look for errors in terminal running `npm start`
3. **Manual Sync**: Use "Sync with PC" button in phone settings
4. **Check Data Files**: Verify JSON files exist in `data/` folder

### **Web App Not Loading Data**
1. **Check Server**: Ensure `npm start` is running
2. **Check Data Files**: Verify `data/expenses.json` exists and has data
3. **Check Browser Console**: Look for JavaScript errors
4. **Clear Cache**: Hard refresh browser (Ctrl+F5)

## 🔒 **Security & Privacy**

- **Local Only**: All data stays on your local network
- **No Cloud**: No external services or cloud storage
- **Encrypted WiFi**: Use WPA2/WPA3 secured WiFi network
- **Firewall**: PC server only accessible on local network

## 📊 **Data Management**

### **Backup Your Data**
```bash
# Copy data folder to backup location
cp -r data/ backup-$(date +%Y%m%d)/
```

### **Reset Data**
```bash
# Clear all data (be careful!)
rm data/expenses.json data/descriptions.json
npm run setup
```

### **Export Data**
- **Web Interface**: Use browser's "Save Page As" to export
- **JSON Files**: Direct access to `data/` folder
- **Phone**: Data automatically syncs to PC

## 🎯 **Benefits of This Setup**

1. **Privacy**: All data stays on your local network
2. **Control**: You own and control all your data
3. **Offline**: Works without internet connection
4. **Fast**: Local network is much faster than cloud
5. **Reliable**: No dependency on external services
6. **Customizable**: Easy to modify and extend

## 🚀 **Next Steps**

1. **Run Setup**: `npm run setup-full`
2. **Find PC IP**: Get your local network IP address
3. **Update Phone**: Change IP in `ExpenseService.js`
4. **Start System**: Run `npm start` and `cd web && npm start`
5. **Test Sync**: Add an expense on phone, check web interface

Your personal finance tracker is now completely local and private! 🎉
