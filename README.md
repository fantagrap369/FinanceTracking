# 💰 Personal Finance Tracker

A comprehensive personal finance tracking system with Android app and web interface that automatically detects spending from notifications and SMS messages.

## Features

### 🤖 Automatic Expense Detection
- **Notification Monitoring**: Reads bank and payment app notifications to detect transactions
- **SMS Analysis**: Monitors SMS messages for transaction confirmations
- **Smart Parsing**: Automatically extracts amount, merchant, and categorizes expenses
- **Manual Entry**: Add expenses manually when automatic detection isn't available

### 📱 Android App
- **Dashboard**: Overview of spending with charts and summaries
- **Expense Management**: View, add, edit, and delete expenses
- **Real-time Tracking**: Automatic detection of spending from notifications/SMS
- **Offline Support**: Works without internet connection, syncs when available
- **Categories**: Organize expenses by Food, Transport, Shopping, Bills, etc.

### 🌐 Web Interface
- **Data Visualization**: Interactive charts and graphs
- **Advanced Filtering**: Sort by store, category, date, amount
- **Detailed Analysis**: Monthly trends, category breakdowns
- **Responsive Design**: Works on desktop, tablet, and mobile browsers

## Tech Stack

### Backend
- **Node.js** with Express.js
- **JSON file storage** (easily upgradeable to database)
- **RESTful API** for data management

### Web Frontend
- **React.js** with modern hooks
- **React Router** for navigation
- **Recharts** for data visualization
- **Responsive CSS** with modern design

### Android App
- **React Native** for cross-platform mobile development
- **React Navigation** for screen navigation
- **AsyncStorage** for local data persistence
- **Notification/SMS listeners** for automatic expense detection

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Android Studio (for Android development)
- React Native CLI

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd personal-finance-tracker

# Install backend dependencies
npm install

# Install web frontend dependencies
cd web
npm install
cd ..

# Install Android app dependencies
cd android-app
npm install
cd ..
```

### 2. Start the Backend Server

```bash
# From the root directory
npm start
```

The server will start on `http://localhost:3000`

### 3. Start the Web Frontend

```bash
# From the web directory
cd web
npm start
```

The web app will open at `http://localhost:3001`

### 4. Run the Android App

```bash
# From the android-app directory
cd android-app

# For Android
npx react-native run-android

# For iOS (if on macOS)
npx react-native run-ios
```

## Configuration

### Android Permissions
The Android app requires the following permissions:
- `READ_SMS` - To read SMS messages for transaction detection
- `RECEIVE_SMS` - To receive SMS broadcasts
- `READ_NOTIFICATIONS` - To read notification content
- `POST_NOTIFICATIONS` - To show app notifications

### API Configuration
The Android app connects to the backend server. Update the API_BASE URL in `android-app/src/services/ExpenseService.js`:
- For Android emulator: `http://10.0.2.2:3000`
- For physical device: `http://YOUR_COMPUTER_IP:3000`

## Usage

### Adding Expenses

#### Automatic Detection
1. Grant notification and SMS permissions when prompted
2. The app will automatically detect spending from:
   - Bank notification alerts
   - Payment app notifications
   - SMS transaction confirmations

#### Manual Entry
1. Open the Android app
2. Tap the "Add" tab
3. Fill in expense details
4. Use quick-add buttons for common expenses

### Viewing Data

#### Android App
- **Dashboard**: Overview with charts and recent expenses
- **Expenses**: Full list with search and filtering
- **Settings**: Configure automatic tracking and sync

#### Web Interface
- **Dashboard**: Detailed analytics and visualizations
- **Expenses**: Advanced filtering and sorting options
- **Add Expense**: Manual entry with full form

## Data Storage

### Local Storage (Android)
- Uses AsyncStorage for offline data persistence
- Automatically syncs with server when available
- Data remains accessible without internet connection

### Server Storage
- JSON file-based storage (easily upgradeable to database)
- RESTful API for data management
- Real-time synchronization between devices

## Customization

### Adding New Categories
Update the categories array in:
- `server/index.js` (backend)
- `web/src/context/ExpenseContext.js` (web)
- `android-app/src/screens/AddExpenseScreen.js` (Android)

### Modifying Parsing Rules
Update the regex patterns in:
- `android-app/src/services/NotificationListener.js`
- `android-app/src/services/SMSListener.js`

### Styling
- Web: Modify `web/src/index.css` and component styles
- Android: Update styles in individual screen files

## Security Considerations

- **Local Data**: All data is stored locally on your device
- **No Cloud Storage**: Data doesn't leave your local network
- **Permissions**: Only requests necessary permissions for functionality
- **Offline First**: Works without internet connection

## Troubleshooting

### Android App Issues
- **Permission Denied**: Go to Settings > Apps > Finance Tracker > Permissions
- **Server Connection**: Check that backend is running and IP address is correct
- **Build Errors**: Ensure Android Studio and React Native CLI are properly installed

### Web App Issues
- **API Errors**: Check that backend server is running on port 3000
- **Build Issues**: Clear node_modules and reinstall dependencies

### Backend Issues
- **Port Conflicts**: Change PORT in `server/index.js` if 3000 is occupied
- **File Permissions**: Ensure write permissions for data directory

## Future Enhancements

- [ ] Database integration (PostgreSQL, MongoDB)
- [ ] User authentication and multi-user support
- [ ] Budget tracking and alerts
- [ ] Receipt photo capture and OCR
- [ ] Export to CSV/PDF
- [ ] Dark mode theme
- [ ] Widget support for Android
- [ ] iOS app version

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the code comments
3. Open an issue on GitHub

---

**Note**: This app is designed for personal use and requires appropriate permissions to read notifications and SMS. Always review what data the app accesses and ensure you're comfortable with the privacy implications.
