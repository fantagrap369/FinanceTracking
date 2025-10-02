import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import DashboardScreen from './src/screens/DashboardScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DescriptionManagerScreen from './src/screens/DescriptionManagerScreen';
import AISettingsScreen from './src/screens/AISettingsScreen';
import StoreManagerScreen from './src/screens/StoreManagerScreen';
import ManualParsingScreen from './src/screens/ManualParsingScreen';

// Import notification listener
import NotificationListener from './src/services/NotificationListener';
import SMSListener from './src/services/SMSListener';
import FailedParsingManager from './src/services/FailedParsingManager';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Settings Stack Navigator
function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SettingsMain" 
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DescriptionManager" 
        component={DescriptionManagerScreen}
        options={{ 
          title: 'Description Manager',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#1f2937',
        }}
      />
      <Stack.Screen 
        name="AISettings" 
        component={AISettingsScreen}
        options={{ 
          title: 'AI Settings',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#1f2937',
        }}
      />
      <Stack.Screen 
        name="StoreManager" 
        component={StoreManagerScreen}
        options={{ 
          title: 'Store Manager',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#1f2937',
        }}
      />
      <Stack.Screen 
        name="ManualParsing" 
        component={ManualParsingScreen}
        options={{ 
          title: 'Manual Parsing',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#1f2937',
        }}
      />
    </Stack.Navigator>
  );
}

const App = () => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [failedAttemptsCount, setFailedAttemptsCount] = useState(0);

  useEffect(() => {
    requestPermissions();
    loadFailedAttemptsCount();
  }, []);

  const loadFailedAttemptsCount = async () => {
    try {
      const failedAttempts = FailedParsingManager.getAllFailedAttempts();
      setFailedAttemptsCount(failedAttempts.length);
    } catch (error) {
      console.error('Error loading failed attempts count:', error);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          PermissionsAndroid.PERMISSIONS.READ_NOTIFICATIONS,
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        ]);

        const allGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );

        if (allGranted) {
          setPermissionsGranted(true);
          // Start listening for notifications and SMS
          NotificationListener.startListening();
          SMSListener.startListening();
        } else {
          Alert.alert(
            'Permissions Required',
            'This app needs permission to read notifications and SMS to track your expenses automatically.',
            [{ text: 'OK' }]
          );
        }
      } catch (err) {
        console.warn('Permission request error:', err);
      }
    } else {
      setPermissionsGranted(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Dashboard') {
                iconName = 'dashboard';
              } else if (route.name === 'Expenses') {
                iconName = 'receipt';
              } else if (route.name === 'Add') {
                iconName = 'add-circle';
              } else if (route.name === 'Settings') {
                iconName = 'settings';
              }

              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#3b82f6',
            tabBarInactiveTintColor: 'gray',
            headerStyle: {
              backgroundColor: '#ffffff',
              elevation: 2,
              shadowOpacity: 0.1,
            },
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          })}
        >
          <Tab.Screen 
            name="Dashboard" 
            component={DashboardScreen}
            options={{ title: '💰 Finance Tracker' }}
          />
          <Tab.Screen 
            name="Expenses" 
            component={ExpensesScreen}
            options={{ title: 'Expenses' }}
          />
          <Tab.Screen 
            name="Add" 
            component={AddExpenseScreen}
            options={{ title: 'Add Expense' }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsStack}
            options={{ 
              title: 'Settings',
              tabBarBadge: failedAttemptsCount > 0 ? failedAttemptsCount : undefined,
              tabBarBadgeStyle: { backgroundColor: '#ef4444', color: 'white' }
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      
      {!permissionsGranted && (
        <View style={styles.permissionBanner}>
          <Text style={styles.permissionText}>
            ⚠️ Permissions needed for automatic expense tracking
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  permissionBanner: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f59e0b',
  },
  permissionText: {
    color: '#92400e',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default App;
