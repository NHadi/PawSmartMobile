import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { useAuth } from '../../contexts/AuthContext';

interface SettingItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
}

export default function AccountSettingsScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword' as any);
  };

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar dari akun ini?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Keluar',
          onPress: async () => {
            try {
              await logout();
              // Navigation will be handled by AuthContext
            } catch (error) {
              Alert.alert('Error', 'Gagal keluar. Silakan coba lagi.');
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hapus Akun',
      'Apakah Anda yakin ingin menghapus akun ini secara permanen? Tindakan ini tidak dapat dibatalkan.',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus Akun',
          onPress: () => {
            Alert.alert('Coming Soon', 'Fitur hapus akun akan segera tersedia');
          },
          style: 'destructive',
        },
      ],
    );
  };

  const settingItems: SettingItem[] = [
    {
      id: '1',
      icon: 'lock-outline',
      title: 'Ganti Password',
      description: 'Ganti kata sandi lama Anda, lalu buat kata sandi baru untuk keamanan akun yang lebih baik.',
      onPress: handleChangePassword,
    },
    {
      id: '2',
      icon: 'logout',
      title: 'Keluar',
      description: 'Apakah Anda yakin? Kamu harus login terlebih dahulu jika ingin kembali lagi.',
      onPress: handleLogout,
    },
    {
      id: '3',
      icon: 'delete-outline',
      title: 'Hapus Akun',
      description: 'Akun Anda akan dihapus secara permanen.',
      onPress: handleDeleteAccount,
    },
  ];

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
        <Text style={styles.headerTitle}>Pengaturan Akun</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.sectionTitle}>Pengaturan Akun</Text>

        {/* Settings List */}
        <View style={styles.settingsList}>
          {settingItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.settingItem,
                index === settingItems.length - 1 && styles.lastItem,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.settingIconContainer}>
                <MaterialIcons 
                  name={item.icon as any} 
                  size={24} 
                  color={item.id === '3' ? Colors.error.main : Colors.text.primary}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={[
                  styles.settingTitle,
                  item.id === '3' && styles.deleteTitle
                ]}>
                  {item.title}
                </Text>
                <Text style={styles.settingDescription}>
                  {item.description}
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={Colors.text.tertiary}
                style={styles.chevron}
              />
            </TouchableOpacity>
          ))}
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
    backgroundColor: Colors.background.secondary,
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
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  settingsList: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  settingTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  deleteTitle: {
    color: Colors.error.main,
  },
  settingDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  chevron: {
    marginLeft: Spacing.sm,
  },
  bottomSpacing: {
    height: 100,
  },
});