import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import standaloneAuthService from '../../services/auth/standaloneAuthService';
import * as AppleAuthentication from 'expo-apple-authentication';

type NavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { register, registerWithSocial } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nama lengkap harus diisi';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor telepon harus diisi';
    } else if (!/^[0-9]{10,13}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Format nomor telepon tidak valid';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username harus diisi';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username minimal 3 karakter';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password harus diisi';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password harus diisi';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      // First check if phone number is already registered
      const phoneNumber = formData.phone.trim();
      const isPhoneRegistered = await standaloneAuthService.checkPhoneNumberRegistered(phoneNumber);
      
      if (isPhoneRegistered) {
        Alert.alert(
          'Nomor Sudah Terdaftar',
          'Nomor WhatsApp ini sudah terdaftar. Silakan gunakan nomor lain atau login dengan akun yang sudah ada.',
          [
            { text: 'Login', onPress: () => navigation.navigate('Login') },
            { text: 'OK', style: 'cancel' }
          ]
        );
        setIsLoading(false);
        return;
      }
      
      // Check if username is already taken
      const isUsernameAvailable = await standaloneAuthService.checkUsernameAvailability(formData.username.trim());
      
      if (!isUsernameAvailable) {
        Alert.alert(
          'Username Tidak Tersedia',
          'Username sudah digunakan. Silakan pilih username lain.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }
      
      // Check if email is already registered (if provided)
      if (formData.email.trim() && !formData.email.includes('@petnexus.com')) {
        const isEmailAvailable = await standaloneAuthService.checkEmailAvailability(formData.email.trim());
        
        if (!isEmailAvailable) {
          Alert.alert(
            'Email Sudah Terdaftar',
            'Email ini sudah terdaftar. Silakan gunakan email lain atau login dengan akun yang sudah ada.',
            [
              { text: 'Login', onPress: () => navigation.navigate('Login') },
              { text: 'OK', style: 'cancel' }
            ]
          );
          setIsLoading(false);
          return;
        }
      }
      
      // All validations passed, proceed to OTP verification
      const registrationData = {
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email.trim() || `${formData.username.trim()}@petnexus.com`,
        name: formData.name.trim(),
        phone: phoneNumber,
      };
      
      // Navigate to OTP screen for phone verification
      navigation.navigate('OTP', {
        phoneNumber: phoneNumber,
        registrationData: registrationData,
      });
    } catch (error: any) {
      Alert.alert(
        'Registrasi Gagal',
        error.message || 'Terjadi kesalahan saat membuat akun'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await registerWithSocial('google');
      // Navigation will happen automatically when auth state changes
    } catch (error: any) {
      if (error.message !== 'LOGIN_CANCELLED') {
        Alert.alert('Registrasi Gagal', error.message || 'Gagal daftar dengan Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setIsLoading(true);
      await registerWithSocial('facebook');
      // Navigation will happen automatically when auth state changes
    } catch (error: any) {
      if (error.message !== 'LOGIN_CANCELLED') {
        Alert.alert('Registrasi Gagal', error.message || 'Gagal daftar dengan Facebook');
      }
    } finally {
      setIsLoading(false);
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
        await registerWithSocial('apple', credential);
        // Navigation will happen automatically when auth state changes
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled Apple Sign In
        return;
      }
      console.error('Apple Sign In Error:', error);
      Alert.alert('Error', 'Gagal daftar dengan Apple ID. Silakan coba lagi.');
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
            <Text style={styles.backButtonText}>Daftar</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Image
              source={require('../../../assets/splash-icon.png')}
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
              {/* Nama */}
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#1C49C2" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nama"
                  placeholderTextColor="#CCCCCC"
                  value={formData.name}
                  onChangeText={(text) => {
                    setFormData({ ...formData, name: text });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  autoCapitalize="words"
                />
              </View>
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

              {/* Username */}
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#1C49C2" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#CCCCCC"
                  value={formData.username}
                  onChangeText={async (text) => {
                    setFormData({ ...formData, username: text });
                    if (errors.username) setErrors({ ...errors, username: '' });
                  }}
                  autoCapitalize="none"
                />
              </View>
              {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}

              {/* No WhatsApp */}
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#1C49C2" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="No WhatsApp"
                  placeholderTextColor="#CCCCCC"
                  value={formData.phone}
                  onChangeText={(text) => {
                    setFormData({ ...formData, phone: text });
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

              {/* Password */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#1C49C2" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#CCCCCC"
                  value={formData.password}
                  onChangeText={(text) => {
                    setFormData({ ...formData, password: text });
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
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
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

              {/* Konfirmasi Password */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#1C49C2" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Konfirmasi Password"
                  placeholderTextColor="#CCCCCC"
                  value={formData.confirmPassword}
                  onChangeText={(text) => {
                    setFormData({ ...formData, confirmPassword: text });
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#999999"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.registerButton, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.registerButtonText}>Daftar</Text>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Sudah punya akun? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Icons */}
              <View style={styles.socialButtons}>
                {/* Google Sign In */}
                <TouchableOpacity
                  style={[styles.socialIconButton, isLoading && styles.buttonDisabled]}
                  onPress={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <Image
                    source={require('../../../assets/google.png')}
                    style={styles.socialIconImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                {/* Facebook Sign In */}
                <TouchableOpacity
                  style={[styles.socialIconButton, isLoading && styles.buttonDisabled]}
                  onPress={handleFacebookSignIn}
                  disabled={isLoading}
                >
                  <Image
                    source={require('../../../assets/facebook.png')}
                    style={styles.socialIconImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                {/* Apple Sign In */}
                <TouchableOpacity
                  style={[styles.socialIconButton, isLoading && styles.buttonDisabled]}
                  onPress={handleAppleSignIn}
                  disabled={isLoading}
                >
                  <Image
                    source={require('../../../assets/apple.png')}
                    style={styles.socialIconImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C49C2',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
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
    marginTop: 10,
  },
  title: {
    fontSize: 32,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  mascot: {
    width: 140,
    height: 140,
    marginBottom: -60,
    zIndex: 1,
  },
  formContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '26%',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flex: 1,
    paddingTop: 20,
    paddingBottom: 16,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    marginBottom: 16,
    paddingBottom: 8,
    paddingHorizontal: 24,
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
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: -16,
    marginBottom: 12,
    marginLeft: 56,
  },
  registerButton: {
    backgroundColor: '#1C49C2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    marginHorizontal: 24,
    elevation: 2,
    shadowColor: '#1C49C2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    opacity: 0.7,
    elevation: 0,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Typography.fontFamily.semibold,
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#666666',
  },
  loginLink: {
    fontSize: 14,
    color: '#1C49C2',
    fontFamily: Typography.fontFamily.semibold,
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: '#999999',
    fontFamily: Typography.fontFamily.regular,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingBottom: 16,
  },
  socialIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  socialIconImage: {
    width: 24,
    height: 24,
  },
});