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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { AuthStackParamList } from '../../navigation/types';
import authService from '../../services/auth/authService';
import apiClient from '../../services/api/apiClient';

type NavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotUsernameScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [foundUsername, setFoundUsername] = useState<string | null>(null);

  const handleFindUsername = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Masukkan email Anda');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Format email tidak valid');
      return;
    }

    setIsLoading(true);
    try {
      // Authenticate as admin to search for user
      await apiClient.authenticateAdmin();
      
      // Search for user by email
      const users = await apiClient.odooExecute(
        'res.users',
        'search_read',
        [],
        {
          domain: [['email', '=', email.toLowerCase().trim()]],
          fields: ['id', 'login', 'name', 'email'],
          limit: 1
        }
      );

      if (users && users.length > 0) {
        const username = users[0].login;
        setFoundUsername(username);
        
        Alert.alert(
          'Username Ditemukan!',
          `Username Anda adalah: ${username}`,
          [
            {
              text: 'Login',
              onPress: () => navigation.navigate('Login')
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert(
          'Email Tidak Ditemukan',
          'Email ini tidak terdaftar. Silakan periksa kembali atau daftar akun baru.',
          [
            {
              text: 'Daftar',
              onPress: () => navigation.navigate('Register')
            },
            {
              text: 'Coba Lagi',
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        'Gagal mencari username. Silakan coba lagi.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.header}>
            <Text style={styles.title}>Lupa Username</Text>
            <Image
              source={require('../../../assets/mascot-sad.png')}
              style={styles.mascot}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>
              Masukkan email yang terdaftar untuk menemukan username Anda
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={Colors.text.tertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {foundUsername && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success.main} />
                <View style={styles.successContent}>
                  <Text style={styles.successTitle}>Username ditemukan!</Text>
                  <Text style={styles.successUsername}>{foundUsername}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.buttonDisabled]}
              onPress={handleFindUsername}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.text.white} />
              ) : (
                <Text style={styles.submitButtonText}>Cari Username</Text>
              )}
            </TouchableOpacity>

            <View style={styles.linksContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Kembali ke Login</Text>
              </TouchableOpacity>
              <Text style={styles.separator}>•</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.link}>Daftar Akun Baru</Text>
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
    backgroundColor: Colors.background.tertiary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    marginTop: Spacing.md,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  mascot: {
    width: 150,
    height: 150,
    marginBottom: Spacing.lg,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  form: {
    flex: 1,
    paddingBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  inputIcon: {
    marginLeft: Spacing.md,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success.light + '20',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.success.main,
  },
  successContent: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  successTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  successUsername: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  submitButton: {
    height: 50,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  separator: {
    marginHorizontal: Spacing.md,
    color: Colors.text.tertiary,
  },
});