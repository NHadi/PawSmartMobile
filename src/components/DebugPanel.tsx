import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import fonnteWhatsApp from '../services/whatsapp/fonnteWhatsApp';
import apiClient from '../services/api/apiClient';
import config from '../config/environment';

const DebugPanel: React.FC = () => {
  const [testing, setTesting] = useState(false);

  const testNetworkConnectivity = async () => {
    setTesting(true);
    const results = [];

    try {
      // Test HTTP connectivity
      try {
        const httpTest = await fetch('http://httpbin.org/get', { timeout: 5000 });
        results.push(`✅ HTTP Test: ${httpTest.status}`);
      } catch (error) {
        results.push(`❌ HTTP Test: ${error.message}`);
      }

      // Test Odoo server
      try {
        const odooTest = await fetch('http://103.67.244.254:8069', { timeout: 10000 });
        results.push(`✅ Odoo Server: ${odooTest.status}`);
      } catch (error) {
        results.push(`❌ Odoo Server: ${error.message}`);
      }

      // Test Fonnte API
      try {
        const fonnteTest = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': config.WHATSAPP.FONNTE_TOKEN || 'test-token'
          },
          body: JSON.stringify({
            target: '081234567890',
            message: 'connectivity test',
            countryCode: '62'
          }),
          timeout: 10000,
        });
        results.push(`✅ Fonnte API: ${fonnteTest.status} ${fonnteTest.statusText}`);
      } catch (error) {
        results.push(`❌ Fonnte API: ${error.message}`);
      }

      Alert.alert(
        'Network Test Results',
        results.join('\n\n'),
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Test Error', `Failed to run tests: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const testWhatsAppOTP = async () => {
    try {
      setTesting(true);
      const result = await fonnteWhatsApp.sendOTP('+6281234567890', '123456');
      Alert.alert(
        'WhatsApp Test Result',
        result ? 'OTP sent successfully!' : 'Failed to send OTP',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('WhatsApp Test Error', error.message);
    } finally {
      setTesting(false);
    }
  };

  const testOdooAPI = async () => {
    try {
      setTesting(true);

      // Test basic Odoo authentication
      const authResult = await apiClient.authenticateAdmin();

      if (authResult && authResult.uid) {
        // Test a simple Odoo API call
        const testResult = await apiClient.odooExecute('res.users', 'search_read', [[['id', '=', authResult.uid]]], {
          fields: ['name', 'login'],
          limit: 1
        });

        Alert.alert(
          'Odoo API Test Result',
          `✅ Authentication successful!\n\nUID: ${authResult.uid}\nDatabase: ${authResult.database}\nUser: ${testResult?.[0]?.name || 'Unknown'}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Odoo API Test Result',
          '❌ Authentication failed - no UID returned',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Odoo API Test Error',
        `❌ Test failed:\n\n${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setTesting(false);
    }
  };

  // Only show in debug mode
  if (config.DEBUG !== 'true' && !__DEV__) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Panel</Text>

      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={testNetworkConnectivity}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Test Network'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={testWhatsAppOTP}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Test WhatsApp'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={testOdooAPI}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Test Odoo API'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.info}>
        Debug Mode: {config.DEBUG}
        {'\n'}Fonnte Token: {config.WHATSAPP.FONNTE_TOKEN ? 'OK' : 'Missing'}
        {'\n'}Odoo URL: {config.ODOO.URL}
        {'\n'}Odoo User: {config.ODOO.USERNAME ? 'OK' : 'Missing'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 8,
    zIndex: 9999,
  },
  title: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  info: {
    color: '#ccc',
    fontSize: 10,
    marginTop: 5,
  },
});

export default DebugPanel;