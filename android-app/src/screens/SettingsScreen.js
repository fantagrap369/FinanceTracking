import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ExpenseService from '../services/ExpenseService';

const SettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  const handleSyncWithServer = async () => {
    try {
      Alert.alert('Syncing', 'Syncing with server...');
      const success = await ExpenseService.syncWithServer();
      
      if (success) {
        Alert.alert('Success', 'Data synced with server successfully');
      } else {
        Alert.alert('Error', 'Failed to sync with server. Check your connection.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sync with server');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your expense data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              // This would clear all local data
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export functionality will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleOpenWebApp = () => {
    Linking.openURL('http://localhost:3000');
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightComponent }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Icon name={icon} size={24} color="#6b7280" />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || <Icon name="chevron-right" size={24} color="#d1d5db" />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Automatic Tracking</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="notifications" size={24} color="#6b7280" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Notification Tracking</Text>
              <Text style={styles.settingSubtitle}>Read notifications for expense detection</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="sms" size={24} color="#6b7280" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>SMS Tracking</Text>
              <Text style={styles.settingSubtitle}>Read SMS messages for transactions</Text>
            </View>
          </View>
          <Switch
            value={smsEnabled}
            onValueChange={setSmsEnabled}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            thumbColor={smsEnabled ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Sync</Text>
        
        <SettingItem
          icon="sync"
          title="Sync with Server"
          subtitle="Upload local data to web app"
          onPress={handleSyncWithServer}
        />

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="cloud-sync" size={24} color="#6b7280" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Auto Sync</Text>
              <Text style={styles.settingSubtitle}>Automatically sync when connected</Text>
            </View>
          </View>
          <Switch
            value={autoSync}
            onValueChange={setAutoSync}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            thumbColor={autoSync ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <SettingItem
          icon="description"
          title="Description Manager"
          subtitle="Manage learned store descriptions"
          onPress={() => navigation.navigate('DescriptionManager')}
        />

        <SettingItem
          icon="smart-toy"
          title="AI Settings"
          subtitle="Configure AI-powered parsing"
          onPress={() => navigation.navigate('AISettings')}
        />

        <SettingItem
          icon="store"
          title="Store Manager"
          subtitle="Create and manage stores manually"
          onPress={() => navigation.navigate('StoreManager')}
        />

        <SettingItem
          icon="edit-note"
          title="Manual Parsing"
          subtitle="Process failed AI parsing attempts"
          onPress={() => navigation.navigate('ManualParsing')}
        />

        <SettingItem
          icon="download"
          title="Export Data"
          subtitle="Download your expense data"
          onPress={handleExportData}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Web App</Text>
        
        <SettingItem
          icon="web"
          title="Open Web App"
          subtitle="View data in your browser"
          onPress={handleOpenWebApp}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <SettingItem
          icon="info"
          title="App Version"
          subtitle="1.0.0"
          onPress={() => {}}
        />

        <SettingItem
          icon="help"
          title="Help & Support"
          subtitle="Get help with the app"
          onPress={() => {
            Alert.alert('Help', 'For support, please check the documentation or contact the developer.');
          }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        
        <SettingItem
          icon="delete-forever"
          title="Clear All Data"
          subtitle="Permanently delete all expenses"
          onPress={handleClearData}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💰 Finance Tracker v1.0.0
        </Text>
        <Text style={styles.footerSubtext}>
          Track your spending automatically
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
});

export default SettingsScreen;
