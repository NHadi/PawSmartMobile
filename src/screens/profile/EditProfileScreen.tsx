import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { useAuth } from '../../contexts/AuthContext';
import authService, { User } from '../../services/auth/authService';
import standaloneAuthService from '../../services/auth/standaloneAuthService';
import { useEffect } from 'react';
import config from '../../config/environment';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useAuth();

  const [name, setName] = useState(() => {
    // Combine firstName and lastName for the full name display
    console.log('Initial user data for name:', user); // Debug log
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`.trim();
    }
    return user?.firstName || user?.name || '';
  });
  const [username, setUsername] = useState(() => {
    console.log('Initial user data for username:', user?.username); // Debug log
    return user?.username || '';
  });
  const [phone, setPhone] = useState(() => {
    console.log('Initial user data for phone:', user?.phone); // Debug log
    return user?.phone || '';
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch fresh user data from /auth/me endpoint when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('=== Starting user data fetch ==='); // Debug log
        console.log('Current user from context:', user); // Debug log
        console.log('Current state values:', { name, username, phone }); // Debug log

        let userData;

        if (config.USE_STANDALONE_API === 'true') {
          console.log('Using standalone API'); // Debug log
          // Use standalone API (configured)
          userData = await standaloneAuthService.getCurrentUser();
        } else {
          console.log('Using Odoo API'); // Debug log
          // Use Odoo API
          userData = await authService.getCurrentUser();
        }

        console.log('=== API Response ==='); // Debug log
        console.log('Fetched user data:', userData); // Debug log

        if (userData) {
          console.log('=== Processing User Data ==='); // Debug log

          // Update form fields with fresh data from API
          // "Nama lengkap" field - use firstName or combine firstName + lastName
          const fullName = userData.firstName && userData.lastName
            ? `${userData.firstName} ${userData.lastName}`.trim()
            : userData.firstName || userData.name || '';
          console.log('1. Setting name to:', fullName); // Debug log
          setName(fullName);

          // "username" field
          console.log('2. Setting username to:', userData.username); // Debug log
          setUsername(userData.username || '');

          // "phone" field
          console.log('3. Setting phone to:', userData.phone); // Debug log
          setPhone(userData.phone || '');

          // Update the user context with fresh data
          setUser(userData);
          console.log('=== User data processing complete ==='); // Debug log
        } else {
          console.log('No user data received from API - Using fallback data');
          // Fallback data for testing
          const fallbackData = {
            firstName: 'Muksin Alfatah',
            username: 'muksin',
            phone: '083893393117'
          };
          setName(fallbackData.firstName);
          setUsername(fallbackData.username);
          setPhone(fallbackData.phone);
        }
      } catch (error) {
        console.log('=== Error in fetchUserData ==='); // Debug log
        console.log('Failed to fetch fresh user data, using cached data:', error);
      }
    };

    fetchUserData();
  }, []); // Remove dependencies to run only once

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Nama tidak boleh kosong');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Error', 'Username tidak boleh kosong');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'Nomor telepon tidak boleh kosong');
      return;
    }

    setIsLoading(true);
    try {
      // Format phone number properly
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('0') && !formattedPhone.startsWith('62')) {
        formattedPhone = '0' + formattedPhone;
      }

      // Split full name into firstName and lastName for API
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      let updatedUser;

      if (config.USE_STANDALONE_API === 'true') {
        // TODO: Implement standalone API update profile endpoint
        // For now, just update local state
        updatedUser = {
          ...user!,
          firstName,
          lastName,
          phone: formattedPhone,
        } as User;
      } else {
        // Use Odoo API
        updatedUser = await authService.updateProfile(user!.id, {
          name: name.trim(),
          phone: formattedPhone,
        });
      }

      // Note: Username (login) cannot be updated in Odoo after creation
      // If username is different, show a message
      if (username.trim() !== user?.username) {
        Alert.alert(
          'Informasi',
          'Username tidak dapat diubah setelah registrasi. Perubahan lainnya telah disimpan.',
          [
            {
              text: 'OK',
              onPress: () => {
                setUser(updatedUser);
                navigation.goBack();
              },
            },
          ],
        );
      } else {
        // Update local state with the response from server
        setUser(updatedUser);
        
        Alert.alert(
          'Berhasil',
          'Profile berhasil diperbarui',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert(
        'Error', 
        error.message || 'Gagal memperbarui profile. Silakan coba lagi.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeAvatar = () => {
    Alert.alert('Coming Soon', 'Fitur ganti foto profile akan segera tersedia');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Blue Bordered Card */}
        <View style={styles.formCard}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleChangeAvatar}
            >
              <Image
                source={require('../../../assets/mascot-happy.png')}
                style={styles.avatar}
                resizeMode="contain"
              />
              <View style={styles.editIconContainer}>
                <MaterialIcons name="camera-alt" size={18} color={Colors.text.white} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nama Lengkap"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>

            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor={Colors.text.tertiary}
                autoCapitalize="none"
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nomor WhatsApp</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(text) => {
                  // Only allow numbers
                  const cleanedText = text.replace(/[^0-9]/g, '');
                  setPhone(cleanedText);
                }}
                placeholder="08123456789"
                placeholderTextColor={Colors.text.tertiary}
                keyboardType="phone-pad"
                maxLength={13}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.text.white} />
            ) : (
              <Text style={styles.saveButtonText}>Simpan</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
  },

  // Form Card
  formCard: {
    backgroundColor: Colors.background.primary,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },

  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.background.primary,
  },

  form: {
    marginTop: Spacing.md,
  },

  inputGroup: {
    marginBottom: Spacing.lg,
  },

  label: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },

  input: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: Spacing.sm,
    fontFamily: Typography.fontFamily.regular,
  },

  saveButton: {
    backgroundColor: '#1565C0',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginTop: Spacing.lg,
    height: 50,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  bottomSpacing: {
    height: 100,
  },
});