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
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../assets/background.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        {/* Header Section */}
        <View style={styles.headerSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Masuk</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Image
              source={require('../../../assets/Register Maskot.png')}
              style={styles.mascot}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Form Card */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.formContainer}
        >
          <View style={styles.formCard}>
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              bounces={false}
              contentContainerStyle={styles.formScrollContent}
            >
              {/* Username Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={24} color="#16A6D9" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Username"
                    placeholderTextColor="#999999"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={24} color="#16A6D9" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="#999999"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#999999"
                    />
                  </TouchableOpacity>
                  <View style={styles.separator} />
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ForgotPassword')}
                    style={styles.forgotPasswordButton}
                  >
                    <Text style={styles.forgotPasswordText}>Lupa?</Text>
                  </TouchableOpacity>
                </View>
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
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialButtons}>
                {/* Google Sign In */}
                <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn}>
                  <Image 
                    source={require('../../../assets/google.png')} 
                    style={styles.socialIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.socialButtonText}>Sign in with Google</Text>
                </TouchableOpacity>

                {/* Facebook Sign In */}
                <TouchableOpacity style={styles.socialButton} onPress={handleFacebookSignIn}>
                  <Image 
                    source={require('../../../assets/facebook.png')} 
                    style={styles.socialIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.socialButtonText}>Sign in with Facebook</Text>
                </TouchableOpacity>

                {/* Apple Sign In - Only show on iOS */}
                {Platform.OS === 'ios' && (
                  <TouchableOpacity style={styles.socialButton} onPress={handleAppleSignIn}>
                    <Image 
                      source={require('../../../assets/apple.png')} 
                      style={styles.socialIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.socialButtonText}>Sign in with Apple</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16A6D9',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF6900',
  },
  headerSection: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    zIndex: 5,
  },
  backButton: {
    marginBottom: 10,
    marginLeft: 20,
	flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    marginLeft: 8,
    fontFamily: Typography.fontFamily.semibold,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  mascot: {
    width: 235,
    height: 235,
    marginBottom: -100,
    zIndex: 1,
  },
  formContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '36%',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flex: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 10,
  },
  formScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
    fontSize: 15,
    color: '#333333',
  },
  inputIcon: {
    marginLeft: 12,
  },
  eyeButton: {
    padding: 12,
  },
  separator: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  forgotPasswordButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 5,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#16A6D9',
    fontFamily: Typography.fontFamily.medium,
  },
  loginButton: {
    backgroundColor: '#16A6D9',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#16A6D9',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Typography.fontFamily.semibold,
    letterSpacing: 0.5,
  },
  loginButtonDisabled: {
    opacity: 0.7,
    elevation: 0,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  registerText: {
    fontSize: 14,
    color: '#666666',
  },
  registerLink: {
    fontSize: 14,
    color: '#16A6D9',
    fontFamily: Typography.fontFamily.semibold,
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  socialButtons: {
    gap: 10,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: Typography.fontFamily.medium,
  },
});