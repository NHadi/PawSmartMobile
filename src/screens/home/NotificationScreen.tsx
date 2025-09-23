import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { HomeStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<HomeStackParamList, 'NotificationScreen'>;

interface Notification {
  id: string;
  type: 'doctor' | 'mart' | 'general' | 'promo';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  icon?: string;
}

// Sample notifications - in real app, this would come from an API
const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'doctor',
    title: 'Dokter akan segera tiba',
    message: 'Dokter sudah dekat! Siap-siap ya, sebentar lagi sampai.',
    timestamp: '1 jam lalu',
    isRead: false,
  },
  {
    id: '2',
    type: 'mart',
    title: 'Pesanan siap dikirim',
    message: 'Pesanan kamu sudah dikemas dan siap dikirim hari ini.',
    timestamp: '2 jam lalu',
    isRead: false,
  },
  {
    id: '3',
    type: 'promo',
    title: 'Diskon spesial untuk kamu!',
    message: 'Dapatkan diskon hingga 50% untuk makanan kucing premium.',
    timestamp: '1 hari lalu',
    isRead: true,
  },
];

export default function NotificationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Simulate loading notifications
    // In real app, you would fetch from API
    setNotifications(sampleNotifications);
    const unread = sampleNotifications.filter(n => !n.isRead).length;
    setUnreadCount(unread);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'doctor':
        return require('../../../assets/icons/Property 1=doctor.png');
      case 'mart':
        return require('../../../assets/icons/Property 1=mart.png');
      default:
        return require('../../../assets/icons/Property 1=doctor.png'); // Default icon
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Handle notification action based on type
    switch (notification.type) {
      case 'doctor':
        // Navigate to doctor service or booking
        break;
      case 'mart':
        // Navigate to orders or products
        break;
      case 'promo':
        // Navigate to promo tab - this will switch to the Promo tab
        // Using the parent navigator to switch tabs
        const parentNav = navigation.getParent();
        if (parentNav) {
          parentNav.navigate('Promo');
        }
        break;
      default:
        break;
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const renderNotification = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationCard,
        !notification.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(notification)}
    >
      <View style={styles.notificationIcon}>
        <Image 
          source={getNotificationIcon(notification.type)}
          style={styles.iconImage}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          {!notification.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.notificationTime}>{notification.timestamp}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <ScrollView 
      style={styles.content}
      contentContainerStyle={styles.emptyContainer}
      showsVerticalScrollIndicator={false}
    >
      <Image 
        source={require('../../../assets/Zero Notification Maskot.png')} 
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Belum ada notifikasi</Text>
      <Text style={styles.emptySubtitle}>
        Semua notifikasi akan muncul di sini
      </Text>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifikasi</Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>

      {notifications.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <View style={styles.actionContainer}>
              <TouchableOpacity onPress={markAllAsRead}>
                <Text style={styles.markAllReadText}>
                  Tandai semua dibaca ({unreadCount})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Today's notifications */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Hari ini</Text>
            {notifications.map(renderNotification)}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  headerSafeArea: {
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
  },
  actionContainer: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    alignItems: 'flex-end',
  },
  markAllReadText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.secondary,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  unreadNotification: {
    backgroundColor: '#F8FBFF', // Light blue background for unread
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  notificationTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary.main,
    marginLeft: Spacing.sm,
  },
  notificationMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  notificationTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});