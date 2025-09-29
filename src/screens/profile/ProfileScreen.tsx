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
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
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
      title: 'Informasi',
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
      ],
    },
  ];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#00BCD4" />
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
                <Text style={styles.userName}>{user?.name || user?.username || 'Alan Syahlan'}</Text>
              </View>
              <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
                <MaterialIcons name="edit" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {/* Paw Pattern */}
            <View style={styles.patternOverlay}>
              {[...Array(20)].map((_, i) => (
                <Ionicons
                  key={i}
                  name="paw"
                  size={30}
                  color="rgba(255,255,255,0.1)"
                  style={[
                    styles.patternIcon,
                    {
                      top: Math.random() * 150,
                      left: Math.random() * 400,
                      transform: [{ rotate: `${Math.random() * 360}deg` }],
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
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
                      ]}
                      onPress={item.onPress}
                    >
                      <View style={styles.menuItemLeft}>
                        <MaterialIcons 
                          name={item.icon as any} 
                          size={24} 
                          color={Colors.text.primary}
                        />
                        <Text style={styles.menuLabel}>{item.label}</Text>
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
  header: {
    height: 80,
    backgroundColor: '#FF6900',
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    zIndex: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.text.white,
  },
  avatar: {
    width: 45,
    height: 45,
  },
  userName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
    marginLeft: Spacing.md,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  patternIcon: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  section: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  riwayatCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: Spacing.sm,
  },
  riwayatContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  riwayatItem: {
    alignItems: 'center',
  },
  riwayatIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  riwayatLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
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
  bottomSpacing: {
    height: 80,
  },
});