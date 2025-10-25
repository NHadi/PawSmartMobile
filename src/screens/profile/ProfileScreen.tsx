import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ProfileStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar?',
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

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const riwayatItems = [
    {
      icon: 'shopping-bag',
      label: 'Belanja',
      onPress: () => navigation.navigate('OrderHistory'),
    },
    {
      icon: 'stethoscope',
      label: 'Dokter',
      onPress: () => {},
      IconComponent: MaterialCommunityIcons,
    },
    {
      icon: 'content-cut',
      label: 'Salon',
      onPress: () => {},
    },
    {
      icon: 'hotel',
      label: 'Hotel',
      onPress: () => {},
    },
    {
      icon: 'person',
      label: 'Pengasuh',
      onPress: () => {},
    },
  ];

  const menuSections = [
    {
      id: 'general',
      title: 'Umum',
      items: [
        { 
          icon: 'pets',
          label: 'Peliharaan Saya',
          onPress: () => navigation.navigate('MyPets'),
        },
        { 
          icon: 'location-on',
          label: 'Alamat Saya',
          onPress: () => navigation.navigate('MyAddress'),
        },
      ],
    },
    {
      id: 'settings',
      title: 'Pengaturan',
      items: [
        { 
          icon: 'lock-outline',
          label: 'Pengaturan Akun',
          onPress: () => navigation.navigate('AccountSettings'),
        },
      ],
    },
    {
      id: 'info',
      title: 'Lainnya',
      items: [
        {
          icon: 'help-outline',
          label: 'FAQ',
          onPress: () => navigation.navigate('FAQ'),
        },
        {
          icon: 'description',
          label: 'Syarat & Ketentuan',
          onPress: () => navigation.navigate('TermsConditions'),
        },
        {
          icon: 'logout',
          label: 'Keluar dari Akun',
          onPress: handleLogout,
          isLogout: true,
        },
      ],
    },
  ];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1C49C2" />
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.profileInfo}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={require('../../../assets/mascot-happy.png')}
                    style={styles.avatar}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.userInfoContainer}>
                  <Text style={styles.userName}>{user?.firstName || user?.name || user?.username || 'Alan Syahlan'}</Text>
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>Premium</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
                <MaterialIcons name="edit" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Premium+ Banner */}
            <TouchableOpacity style={styles.premiumBanner}>
              <View style={styles.premiumBannerContent}>
                <View style={styles.premiumIconContainer}>
                  <MaterialIcons name="workspace-premium" size={24} color="#1C49C2" />
                </View>
                <View style={styles.premiumTextContainer}>
                  <Text style={styles.premiumBannerTitle}>Premium +</Text>
                  <Text style={styles.premiumBannerSubtitle}>Dapatkan Extra Diskon</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={Colors.text.tertiary} />
            </TouchableOpacity>

            {/* Riwayat Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Riwayat</Text>
              <View style={styles.riwayatCard}>
                <View style={styles.riwayatContainer}>
                  {riwayatItems.map((item, index) => {
                    const IconComp = item.IconComponent || MaterialIcons;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.riwayatItem}
                        onPress={item.onPress}
                      >
                        <View style={styles.riwayatIconContainer}>
                          <IconComp 
                            name={item.icon as any} 
                            size={24} 
                            color={Colors.text.secondary}
                          />
                        </View>
                        <Text style={styles.riwayatLabel}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Menu Sections */}
            {menuSections.map((section) => (
              <View key={section.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.menuCard}>
                  {section.items.map((item, itemIndex) => (
                    <TouchableOpacity
                      key={itemIndex}
                      style={[
                        styles.menuItem,
                        itemIndex !== section.items.length - 1 && styles.menuItemBorder,
                        item.isLogout && styles.logoutMenuItem,
                      ]}
                      onPress={item.onPress}
                    >
                      <View style={styles.menuItemLeft}>
                        <MaterialIcons
                          name={item.icon as any}
                          size={24}
                          color={item.isLogout ? '#E53935' : Colors.text.primary}
                        />
                        <Text style={[
                          styles.menuLabel,
                          item.isLogout && styles.logoutLabel,
                        ]}>{item.label}</Text>
                      </View>
                      <MaterialIcons
                        name="chevron-right"
                        size={24}
                        color={Colors.text.tertiary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header Section
  header: {
    backgroundColor: '#1C49C2',
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.text.white,
  },
  avatar: {
    width: 40,
    height: 40,
  },
  userInfoContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
    marginBottom: 2,
  },
  premiumBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  premiumText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.white,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Premium+ Banner
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E3F2FD',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  premiumBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumBannerTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  premiumBannerSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
  },

  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: '#1C49C2',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  riwayatCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  riwayatContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  riwayatItem: {
    alignItems: 'center',
    width: '20%',
  },
  riwayatIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  riwayatLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 56,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginLeft: Spacing.md,
  },
  logoutMenuItem: {
    backgroundColor: '#FFEBEE',
  },
  logoutLabel: {
    color: '#E53935',
  },
  bottomSpacing: {
    height: 80,
  },
});