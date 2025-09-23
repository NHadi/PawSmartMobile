const { withAndroidManifest, withPlugins } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to force Android networking permissions and configurations
 * This ensures APK builds have proper network access capabilities
 */

function withAndroidNetworkPermissions(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Ensure uses-permission elements exist
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    const permissions = androidManifest.manifest['uses-permission'];

    // Required network permissions for APK builds
    const networkPermissions = [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.ACCESS_WIFI_STATE',
      'android.permission.CHANGE_NETWORK_STATE',
      'android.permission.WAKE_LOCK'
    ];

    // Add missing permissions
    networkPermissions.forEach(permission => {
      const exists = permissions.some(perm =>
        perm.$['android:name'] === permission
      );

      if (!exists) {
        permissions.push({
          $: {
            'android:name': permission
          }
        });
        console.log(`✅ Added Android permission: ${permission}`);
      }
    });

    // Ensure application element exists
    if (!androidManifest.manifest.application) {
      androidManifest.manifest.application = [{}];
    }

    const application = androidManifest.manifest.application[0];

    // Force usesCleartextTraffic and networkSecurityConfig
    application.$['android:usesCleartextTraffic'] = 'true';
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    // Add backup configuration
    application.$['android:allowBackup'] = 'false';
    application.$['android:hardwareAccelerated'] = 'true';

    console.log('🔧 Applied Android network configuration for APK builds');

    return config;
  });
}

function withNetworkSecurityConfig(config) {
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      [
        '@expo/config-plugins',
        {
          android: {
            networkSecurityConfig: {
              domain: [
                {
                  includeSubdomains: false,
                  name: '103.67.244.254'
                },
                {
                  includeSubdomains: true,
                  name: 'localhost'
                },
                {
                  includeSubdomains: true,
                  name: '10.0.0.0/8'
                },
                {
                  includeSubdomains: true,
                  name: '192.168.0.0/16'
                },
                {
                  includeSubdomains: true,
                  name: '172.16.0.0/12'
                }
              ],
              cleartextTrafficPermitted: true
            }
          }
        }
      ]
    ]
  };
}

function withCopyNetworkSecurityConfig(config) {
  return withAndroidManifest(config, async (config) => {
    // Ensure the network security config file exists in the APK
    const projectRoot = config._internal?.projectRoot || process.cwd();
    const sourceFile = path.join(projectRoot, 'network_security_config.xml');
    const targetDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
    const targetFile = path.join(targetDir, 'network_security_config.xml');

    try {
      // Create target directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log('📁 Created Android res/xml directory');
      }

      // Copy network security config if source exists
      if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, targetFile);
        console.log('📋 Copied network_security_config.xml to Android resources');
      } else {
        console.warn('⚠️ network_security_config.xml not found in project root');
      }
    } catch (error) {
      console.error('❌ Failed to copy network security config:', error.message);
    }

    return config;
  });
}

// Export the main plugin
module.exports = function withAndroidNetworkConfig(config) {
  return withPlugins(config, [
    withAndroidNetworkPermissions,
    withNetworkSecurityConfig,
    withCopyNetworkSecurityConfig,
  ]);
};

// Export individual plugins for selective use
module.exports.withAndroidNetworkPermissions = withAndroidNetworkPermissions;
module.exports.withNetworkSecurityConfig = withNetworkSecurityConfig;
module.exports.withCopyNetworkSecurityConfig = withCopyNetworkSecurityConfig;