/**
 * APK Network Inspector
 *
 * Comprehensive network debugging tool for APK builds.
 * Helps identify and troubleshoot networking issues in compiled APK files.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Share
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import apkNetworkClient from '../services/api/apkNetworkClient';
import apiClient from '../services/api/apiClient';
import config from '../config/environment';

interface NetworkTest {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  result?: any;
  error?: string;
  duration?: number;
}

interface APKNetworkInspectorProps {
  visible: boolean;
  onClose: () => void;
}

export default function APKNetworkInspector({ visible, onClose }: APKNetworkInspectorProps) {
  const [tests, setTests] = useState<NetworkTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>({});

  const initialTests: NetworkTest[] = [
    { name: 'Device Network State', status: 'pending' },
    { name: 'Internet Connectivity', status: 'pending' },
    { name: 'DNS Resolution', status: 'pending' },
    { name: 'HTTP Cleartext Support', status: 'pending' },
    { name: 'HTTPS Connectivity', status: 'pending' },
    { name: 'Odoo Server Accessibility', status: 'pending' },
    { name: 'APK Network Client', status: 'pending' },
    { name: 'Axios Client Comparison', status: 'pending' },
  ];

  useEffect(() => {
    if (visible) {
      setTests(initialTests);
      collectSystemInfo();
    }
  }, [visible]);

  const collectSystemInfo = () => {
    setSystemInfo({
      isAPK: config.IS_EAS_BUILD,
      isProduction: config.IS_PRODUCTION,
      odooURL: config.ODOO.BASE_URL,
      debug: config.DEBUG,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent || 'React Native',
    });
  };

  const updateTest = (index: number, updates: Partial<NetworkTest>) => {
    setTests(prev => prev.map((test, i) =>
      i === index ? { ...test, ...updates } : test
    ));
  };

  const runAllTests = async () => {
    setIsRunning(true);

    for (let i = 0; i < tests.length; i++) {
      updateTest(i, { status: 'running' });

      const startTime = Date.now();

      try {
        let result;

        switch (tests[i].name) {
          case 'Device Network State':
            result = await testNetworkState();
            break;
          case 'Internet Connectivity':
            result = await testInternetConnectivity();
            break;
          case 'DNS Resolution':
            result = await testDNSResolution();
            break;
          case 'HTTP Cleartext Support':
            result = await testHTTPCleartext();
            break;
          case 'HTTPS Connectivity':
            result = await testHTTPSConnectivity();
            break;
          case 'Odoo Server Accessibility':
            result = await testOdooServer();
            break;
          case 'APK Network Client':
            result = await testAPKNetworkClient();
            break;
          case 'Axios Client Comparison':
            result = await testAxiosClient();
            break;
        }

        const duration = Date.now() - startTime;
        updateTest(i, {
          status: 'success',
          result,
          duration
        });

      } catch (error: any) {
        const duration = Date.now() - startTime;
        updateTest(i, {
          status: 'failed',
          error: error.message,
          duration
        });
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  // Individual test functions
  const testNetworkState = async () => {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
      details: state.details
    };
  };

  const testInternetConnectivity = async () => {
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      timeout: 5000
    });
    return {
      status: response.status,
      statusText: response.statusText,
      canReachInternet: response.ok
    };
  };

  const testDNSResolution = async () => {
    const testDomains = ['google.com', '103.67.244.254', 'api.fonnte.com'];
    const results = [];

    for (const domain of testDomains) {
      try {
        const response = await fetch(`https://${domain}`, {
          method: 'HEAD',
          timeout: 3000
        });
        results.push({ domain, resolved: true, status: response.status });
      } catch (error: any) {
        results.push({ domain, resolved: false, error: error.message });
      }
    }

    return results;
  };

  const testHTTPCleartext = async () => {
    try {
      const response = await fetch('http://httpbin.org/get', {
        method: 'GET',
        timeout: 5000
      });
      return {
        supported: response.ok,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error: any) {
      return {
        supported: false,
        error: error.message,
        blocked: error.message.includes('cleartext') || error.message.includes('CLEARTEXT')
      };
    }
  };

  const testHTTPSConnectivity = async () => {
    try {
      const response = await fetch('https://api.fonnte.com', {
        method: 'GET',
        timeout: 5000
      });
      return {
        supported: true,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error: any) {
      return {
        supported: false,
        error: error.message
      };
    }
  };

  const testOdooServer = async () => {
    try {
      const result = await apkNetworkClient.testOdooConnection();
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  const testAPKNetworkClient = async () => {
    try {
      const capabilities = await apkNetworkClient.detectNetworkCapabilities();
      return capabilities;
    } catch (error: any) {
      return {
        error: error.message,
        canConnect: false
      };
    }
  };

  const testAxiosClient = async () => {
    try {
      const result = await apiClient.testConnection();
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      systemInfo,
      tests: tests.map(test => ({
        name: test.name,
        status: test.status,
        duration: test.duration,
        result: test.result,
        error: test.error
      }))
    };

    return JSON.stringify(report, null, 2);
  };

  const shareReport = async () => {
    try {
      const report = generateReport();
      await Share.share({
        message: `APK Network Inspector Report\n\n${report}`,
        title: 'APK Network Debug Report'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share report');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'failed': return '#F44336';
      case 'running': return '#FF9800';
      default: return '#757575';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🔍 APK Network Inspector</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.systemInfo}>
          <Text style={styles.systemInfoText}>
            📱 APK Build: {systemInfo.isAPK ? 'Yes' : 'No'} |
            🏭 Production: {systemInfo.isProduction ? 'Yes' : 'No'} |
            🔧 Debug: {systemInfo.debug ? 'On' : 'Off'}
          </Text>
          <Text style={styles.systemInfoText}>
            🌐 Odoo URL: {systemInfo.odooURL}
          </Text>
        </View>

        <ScrollView style={styles.testList}>
          {tests.map((test, index) => (
            <View key={index} style={styles.testItem}>
              <View style={styles.testHeader}>
                <Text style={styles.testIcon}>{getStatusIcon(test.status)}</Text>
                <Text style={styles.testName}>{test.name}</Text>
                {test.duration && (
                  <Text style={styles.testDuration}>{test.duration}ms</Text>
                )}
              </View>

              {test.status === 'running' && (
                <ActivityIndicator size="small" color="#FF9800" />
              )}

              {test.result && (
                <Text style={styles.testResult}>
                  {typeof test.result === 'string' ? test.result : JSON.stringify(test.result, null, 2)}
                </Text>
              )}

              {test.error && (
                <Text style={styles.testError}>{test.error}</Text>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.runButton]}
            onPress={runAllTests}
            disabled={isRunning}
          >
            <Text style={styles.buttonText}>
              {isRunning ? '🔄 Running Tests...' : '🚀 Run All Tests'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.shareButton]}
            onPress={shareReport}
          >
            <Text style={styles.buttonText}>📋 Share Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    padding: 5,
  },
  systemInfo: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  systemInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  testList: {
    flex: 1,
    padding: 10,
  },
  testItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e0e0e0',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  testIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  testName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  testDuration: {
    fontSize: 12,
    color: '#666',
  },
  testResult: {
    fontSize: 12,
    color: '#4CAF50',
    backgroundColor: '#f1f8e9',
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  testError: {
    fontSize: 12,
    color: '#F44336',
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  actions: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  runButton: {
    backgroundColor: '#4CAF50',
  },
  shareButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});