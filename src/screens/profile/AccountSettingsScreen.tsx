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
      icon: 'lock-closed',
      title: 'Ganti Password',
      description: 'Ganti kata sandi lama Anda.',
      onPress: handleChangePassword,
    },
    {
      id: '2',
      icon: 'exit-outline',
      title: 'Keluar',
      description: 'Kamu harus login terlebih dahulu jika ingin kembali lagi',
      onPress: handleLogout,
    },
    {
      id: '3',
      icon: 'trash-outline',
      title: 'Hapus akun',
      description: 'Akun anda dihapus secara permanen.',
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
        {/* Title with Blue Line */}
        <View style={styles.sectionTitleContainer}>
          <View style={styles.blueLine} />
          <Text style={styles.sectionTitle}>Pengaturan Akun</Text>
        </View>

        {/* Settings List */}
        <View style={styles.settingsList}>
          {settingItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.settingItem,
                index !== settingItems.length - 1 && styles.itemBorder,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[
                styles.settingIconContainer,
                item.id === '2' && styles.logoutIconContainer,
                item.id === '3' && styles.deleteIconContainer,
              ]}>
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={
                    item.id === '2' ? '#E53935' :
                    item.id === '3' ? '#E53935' :
                    Colors.text.primary
                  }
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>
                  {item.title}
                </Text>
                <Text style={styles.settingDescription}>
                  {item.description}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.text.tertiary}
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

  // Section Title with Blue Line
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  blueLine: {
    width: 4,
    height: 20,
    backgroundColor: '#1C49C2',
    marginRight: Spacing.sm,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },

  // Settings List
  settingsList: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  logoutIconContainer: {
    backgroundColor: '#FFEBEE',
  },
  deleteIconContainer: {
    backgroundColor: '#FFEBEE',
  },
  settingContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  settingTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    lineHeight: 18,
    fontFamily: Typography.fontFamily.regular,
  },
  bottomSpacing: {
    height: 100,
  },
});