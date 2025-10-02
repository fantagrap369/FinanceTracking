import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AIParser from '../services/AIParser';

const AISettingsScreen = ({ navigation }) => {
  const [apiKey, setApiKey] = useState('');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [testing, setTesting] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      // In a real app, you'd load these from secure storage
      const savedApiKey = ''; // Load from secure storage
      const savedEnabled = false; // Load from settings
      
      setApiKey(savedApiKey);
      setAiEnabled(savedEnabled);
      
      if (savedApiKey) {
        AIParser.setApiKey(savedApiKey);
      }
      
      setStats(AIParser.getStats());
    } catch (error) {
      console.error('Error loading AI settings:', error);
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    try {
      AIParser.setApiKey(apiKey.trim());
      setAiEnabled(true);
      setStats(AIParser.getStats());
      Alert.alert('Success', 'API key saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key first');
      return;
    }

    setTesting(true);
    try {
      await AIParser.testConnection();
      Alert.alert('Success', 'AI connection test successful!');
    } catch (error) {
      Alert.alert('Error', `AI test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleToggleAI = (value) => {
    if (value && !apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key first');
      return;
    }
    
    setAiEnabled(value);
    if (value) {
      AIParser.setApiKey(apiKey.trim());
    } else {
      AIParser.setApiKey('');
    }
    setStats(AIParser.getStats());
  };

  const handleClearApiKey = () => {
    Alert.alert(
      'Clear API Key',
      'Are you sure you want to clear your API key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setApiKey('');
            setAiEnabled(false);
            AIParser.setApiKey('');
            setStats(AIParser.getStats());
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.title}>AI Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* AI Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Parsing Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusInfo}>
              <Icon 
                name={aiEnabled ? "smart-toy" : "smart-toy"} 
                size={24} 
                color={aiEnabled ? "#10b981" : "#6b7280"} 
              />
              <View style={styles.statusText}>
                <Text style={styles.statusTitle}>
                  {aiEnabled ? 'AI Parsing Enabled' : 'AI Parsing Disabled'}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {aiEnabled 
                    ? 'Using AI to parse notifications and SMS' 
                    : 'Using regex patterns for parsing'
                  }
                </Text>
              </View>
            </View>
            <Switch
              value={aiEnabled}
              onValueChange={handleToggleAI}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor={aiEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* API Key Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OpenAI API Configuration</Text>
          <View style={styles.card}>
            <Text style={styles.label}>API Key</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your OpenAI API key..."
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.helpText}>
              Get your API key from{' '}
              <Text style={styles.linkText}>platform.openai.com</Text>
            </Text>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleSaveApiKey}
              >
                <Text style={styles.buttonText}>Save API Key</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleTestConnection}
                disabled={testing}
              >
                <Text style={styles.buttonText}>
                  {testing ? 'Testing...' : 'Test Connection'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {apiKey && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearApiKey}
              >
                <Text style={styles.clearButtonText}>Clear API Key</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* AI Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Parsing Benefits</Text>
          <View style={styles.card}>
            <View style={styles.benefitItem}>
              <Icon name="check-circle" size={20} color="#10b981" />
              <Text style={styles.benefitText}>
                Understands any notification format
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="check-circle" size={20} color="#10b981" />
              <Text style={styles.benefitText}>
                Automatically categorizes expenses
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="check-circle" size={20} color="#10b981" />
              <Text style={styles.benefitText}>
                Generates smart descriptions
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="check-circle" size={20} color="#10b981" />
              <Text style={styles.benefitText}>
                Handles different languages and formats
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="check-circle" size={20} color="#10b981" />
              <Text style={styles.benefitText}>
                Confidence scoring for accuracy
              </Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Statistics</Text>
            <View style={styles.card}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>AI Enabled:</Text>
                <Text style={styles.statValue}>{stats.enabled ? 'Yes' : 'No'}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Model:</Text>
                <Text style={styles.statValue}>{stats.model}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>API Key:</Text>
                <Text style={styles.statValue}>
                  {stats.hasApiKey ? 'Configured' : 'Not Set'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Privacy Notice */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <View style={styles.card}>
            <View style={styles.privacyItem}>
              <Icon name="security" size={20} color="#3b82f6" />
              <Text style={styles.privacyText}>
                Your API key is stored securely on your device
              </Text>
            </View>
            <View style={styles.privacyItem}>
              <Icon name="lock" size={20} color="#3b82f6" />
              <Text style={styles.privacyText}>
                Only notification/SMS text is sent to OpenAI
              </Text>
            </View>
            <View style={styles.privacyItem}>
              <Icon name="delete" size={20} color="#3b82f6" />
              <Text style={styles.privacyText}>
                No personal data is stored by OpenAI
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  linkText: {
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  clearButton: {
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  privacyText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
});

export default AISettingsScreen;
