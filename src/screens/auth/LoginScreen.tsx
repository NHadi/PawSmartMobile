import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackScreenProps } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Typography, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { useAuth } from '../../contexts/AuthContext';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function LoginScreen({ navigation }: AuthStackScreenProps<'Login'>) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login: authLogin, loginWithSocial } = useAuth();
  // Rename to avoid conflict with loginWithSocial
  const login = { login: authLogin, loginWithSocial };

  const handleLogin = async () => {
    if (!username) {
      Alert.alert('Error', 'Masukkan username');
      return;
    }
    
    if (!password) {
      Alert.alert('Error', 'Masukkan password');
      return;
    }
    
    setIsLoggingIn(true);
    try {
      await authLogin(username, password);
      // Navigation will happen automatically when auth state changes
    } catch (error: any) {
      Alert.alert('Login Gagal', error.message || 'Username atau password salah');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoggingIn(true);
      await login.loginWithSocial('google');
      // Navigation will happen automatically when auth state changes
    } catch (error: any) {
      if (error.message !== 'LOGIN_CANCELLED') {
        Alert.alert('Login Gagal', error.message || 'Gagal masuk dengan Google');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setIsLoggingIn(true);
      await login.loginWithSocial('facebook');
      // Navigation will happen automatically when auth state changes
    } catch (error: any) {
      if (error.message !== 'LOGIN_CANCELLED') {
        Alert.alert('Login Gagal', error.message || 'Gagal masuk dengan Facebook');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      // Check if Apple Authentication is available on device
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Tidak Tersedia', 'Apple Sign In tidak tersedia di perangkat ini');
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Handle successful Apple sign in
      if (credential) {
        console.log('Apple Sign In Success:', credential);
        await loginWithSocial('apple', credential);
        // Navigation will happen automatically when auth state changes
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled Apple Sign In
        return;
      }
      console.error('Apple Sign In Error:', error);
      Alert.alert('Error', 'Gagal masuk dengan Apple ID. Silakan coba lagi.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Login</Text>
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/splash-icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#1C49C2" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor="#CCCCCC"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#1C49C2" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#CCCCCC"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#999999"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotButton}
              >
                <Text style={styles.forgotText}>Lupa?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Belum punya akun? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Daftar</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtons}>
              {/* Google */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleSignIn}
                disabled={isLoggingIn}
              >
                <Image
                  source={require('../../../assets/google.png')}
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {/* Facebook */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleFacebookSignIn}
                disabled={isLoggingIn}
              >
                <Image
                  source={require('../../../assets/facebook.png')}
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {/* Apple - Show on all platforms for consistency */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleAppleSignIn}
                disabled={isLoggingIn}
              >
                <Image
                  source={require('../../../assets/apple.png')}
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Typography.fontFamily.semibold,
    color: '#000000',
    marginLeft: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  logo: {
    width: 140,
    height: 140,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    marginBottom: 24,
    paddingBottom: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    paddingVertical: 8,
    fontFamily: Typography.fontFamily.regular,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  forgotButton: {
    marginLeft: 8,
    paddingHorizontal: 4,
  },
  forgotText: {
    fontSize: 13,
    color: '#1976D2',
    fontFamily: Typography.fontFamily.medium,
  },
  loginButton: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Typography.fontFamily.semibold,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  registerText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: Typography.fontFamily.regular,
  },
  registerLink: {
    fontSize: 14,
    color: '#1976D2',
    fontFamily: Typography.fontFamily.semibold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    fontSize: 13,
    color: '#999999',
    marginHorizontal: 16,
    fontFamily: Typography.fontFamily.regular,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingBottom: 32,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
});