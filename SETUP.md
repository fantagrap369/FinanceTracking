# 🚀 Setup Guide

This guide will walk you through setting up the Personal Finance Tracker on your system.

## Prerequisites

### Required Software
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)

### For Android Development
- **Android Studio** - [Download here](https://developer.android.com/studio)
- **Java Development Kit (JDK) 11** - Usually included with Android Studio
- **Android SDK** - Installed through Android Studio

### For Web Development
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd personal-finance-tracker
```

### 2. Install Dependencies

#### Backend Dependencies
```bash
# From the root directory
npm install
```

#### Web Frontend Dependencies
```bash
cd web
npm install
cd ..
```

#### Android App Dependencies
```bash
cd android-app
npm install
cd ..
```

### 3. Start the Backend Server

```bash
# From the root directory
npm start
```

You should see:
```
Server running on http://localhost:3000
Data file: /path/to/server/data/expenses.json
```

### 4. Start the Web Frontend

```bash
# From the web directory
cd web
npm start
```

The web app will automatically open in your browser at `http://localhost:3001`

### 5. Set Up Android Development Environment

#### Install React Native CLI
```bash
npm install -g react-native-cli
```

#### Android Studio Setup
1. Open Android Studio
2. Go to **Tools > SDK Manager**
3. Install the latest Android SDK
4. Go to **Tools > AVD Manager**
5. Create a new Virtual Device (recommended: Pixel 6 with API 33)

#### Configure Android Environment
Add these to your system environment variables:

**Windows:**
```bash
ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
```

**macOS/Linux:**
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 6. Run the Android App

#### Using Android Emulator
```bash
cd android-app
npx react-native run-android
```

#### Using Physical Device
1. Enable **Developer Options** on your Android device
2. Enable **USB Debugging**
3. Connect device via USB
4. Run: `npx react-native run-android`

## Configuration

### Android App Configuration

#### Update Server URL
If running on a physical device, update the server URL in `android-app/src/services/ExpenseService.js`:

```javascript
// Change this line:
const API_BASE = 'http://10.0.2.2:3000'; // Android emulator

// To your computer's IP address:
const API_BASE = 'http://192.168.1.100:3000'; // Replace with your IP
```

#### Find Your Computer's IP Address
- **Windows**: Run `ipconfig` in Command Prompt
- **macOS/Linux**: Run `ifconfig` in Terminal
- Look for your local network IP (usually starts with 192.168.x.x)

### Backend Configuration

#### Change Port (if needed)
Edit `server/index.js`:
```javascript
const PORT = process.env.PORT || 3000; // Change 3000 to your preferred port
```

#### Data Storage Location
The app stores data in `server/data/expenses.json`. You can change this in `server/index.js`:
```javascript
const DATA_FILE = path.join(__dirname, 'data', 'expenses.json');
```

## Testing the Setup

### 1. Test Backend
Visit `http://localhost:3000/api/expenses` in your browser. You should see an empty array `[]`.

### 2. Test Web App
1. Open `http://localhost:3001`
2. Try adding an expense
3. Check that it appears in the expenses list

### 3. Test Android App
1. Launch the app on your device/emulator
2. Grant permissions when prompted
3. Try adding an expense manually
4. Check that it syncs with the web app

## Troubleshooting

### Common Issues

#### "Metro bundler not found"
```bash
cd android-app
npx react-native start
# In another terminal:
npx react-native run-android
```

#### "Android SDK not found"
1. Open Android Studio
2. Go to **File > Project Structure > SDK Location**
3. Copy the Android SDK location
4. Set `ANDROID_HOME` environment variable

#### "Permission denied" on Android
1. Go to **Settings > Apps > Finance Tracker**
2. Tap **Permissions**
3. Enable **SMS** and **Notifications**

#### "Network request failed" on Android
1. Check that your computer and phone are on the same WiFi network
2. Update the API_BASE URL with your computer's IP address
3. Make sure the backend server is running

#### "Port already in use"
```bash
# Find what's using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or use a different port
```

### Development Tips

#### Hot Reloading
- **Web**: Changes automatically reload
- **Android**: Shake device and tap "Reload" or press `R` twice

#### Debugging
- **Web**: Use browser developer tools
- **Android**: Use React Native debugger or Chrome DevTools

#### Logs
- **Backend**: Check terminal where server is running
- **Android**: Run `npx react-native log-android`
- **Web**: Check browser console

## Production Deployment

### Backend Deployment
1. Choose a hosting service (Heroku, DigitalOcean, AWS, etc.)
2. Set up environment variables
3. Deploy the `server` directory

### Web App Deployment
1. Build the web app: `cd web && npm run build`
2. Deploy the `web/dist` directory to a web server

### Android App Distribution
1. Generate a signed APK
2. Upload to Google Play Store or distribute directly

## Next Steps

1. **Customize Categories**: Edit the categories in the code
2. **Add Parsing Rules**: Modify notification/SMS parsing patterns
3. **Style Customization**: Update colors and themes
4. **Database Integration**: Replace JSON storage with a real database
5. **Additional Features**: Add budgets, reports, exports, etc.

## Getting Help

If you encounter issues:
1. Check this troubleshooting guide
2. Review the main README.md
3. Check the code comments
4. Open an issue on GitHub

---

**Happy tracking! 📊💰**
