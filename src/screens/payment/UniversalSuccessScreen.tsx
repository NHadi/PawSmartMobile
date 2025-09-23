import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CommonActions, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { RootStackParamList } from '../../navigation/types';
import { useCart } from '../../contexts/CartContext';

type UniversalSuccessRouteProp = RouteProp<RootStackParamList, 'UniversalSuccess'>;
type NavigationProp = StackNavigationProp<RootStackParamList, 'UniversalSuccess'>;

export default function UniversalSuccessScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<UniversalSuccessRouteProp>();
  const { clearCart } = useCart();
  const [isNavigationAllowed, setIsNavigationAllowed] = useState(false);

  // Add navigation state listener to track and prevent removal
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isNavigationAllowed) {
        // Prevent any automatic removal of this screen
        e.preventDefault();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [navigation, isNavigationAllowed]);

  const {
    orderId,
    orderName,
    totalAmount,
    transactionId,
    transactionType = 'Mart',
    timestamp
  } = route.params || {};


  // Clear cart and clean session when arriving at success screen
  useEffect(() => {
    clearCart();
  }, []);

  // Prevent hardware back button from closing the screen
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Prevent back button - user must choose an action
        return true; // Return true to prevent default back action
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        subscription?.remove();
      };
    }, [])
  );

  const formatDate = () => {
    if (timestamp) {
      return timestamp;
    }
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return now.toLocaleDateString('id-ID', options) + ' WIB';
  };

  const handleViewDetail = () => {
    setIsNavigationAllowed(true); // Allow navigation for user action
    if (orderId) {
      // Reset navigation and go to OrderDetail in Home tab
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'Main',
              state: {
                routes: [
                  {
                    name: 'Home',
                    state: {
                      routes: [
                        { name: 'HomeScreen' },
                        { name: 'OrderDetail', params: { orderId: orderId.toString() } }
                      ],
                      index: 1
                    }
                  },
                  { name: 'Promo' },
                  { name: 'Services' },
                  { name: 'Activity' },
                  { name: 'Profile' }
                ],
                index: 0, // Force Home tab to be active
              },
            }
          ],
        })
      );
    }
  };

  const handleCancelOrder = () => {
    setIsNavigationAllowed(true); // Allow navigation for user action
    if (orderId) {
      // Reset navigation and go to CancelOrder in Home tab
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'Main',
              state: {
                routes: [
                  {
                    name: 'Home',
                    state: {
                      routes: [
                        { name: 'HomeScreen' },
                        { name: 'CancelOrder', params: { orderId: orderId.toString() } }
                      ],
                      index: 1
                    }
                  },
                  { name: 'Promo' },
                  { name: 'Services' },
                  { name: 'Activity' },
                  { name: 'Profile' }
                ],
                index: 0, // Force Home tab to be active
              },
            }
          ],
        })
      );
    }
  };

  const handleGoHome = () => {
    setIsNavigationAllowed(true); // Allow navigation for user action
    // Reset navigation and go specifically to Home tab
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Main',
            state: {
              routes: [
                { name: 'Home', state: { routes: [{ name: 'HomeScreen' }], index: 0 } },
                { name: 'Promo' },
                { name: 'Services' },
                { name: 'Activity' },
                { name: 'Profile' }
              ],
              index: 0, // Force Home tab to be active
            },
          }
        ],
      })
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Mascot */}
        <View style={styles.mascotContainer}>
          <View style={styles.mascotBackground}>
            <Image
              source={require('../../../assets/Confirm Maskot.png')}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.successTitle}>Pembayaran Berhasil</Text>
        <Text style={styles.successMessage}>
          Terima kasih atas pembayaran Anda.
        </Text>

        {/* Payment Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.blueIndicator} />
            <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>No. Transaksi</Text>
            <TouchableOpacity style={styles.transactionIdContainer}>
              <MaterialIcons name="content-copy" size={16} color="#2196F3" />
              <Text style={styles.transactionId}>
                {transactionId || orderName || `#PN${orderId}`}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Jenis Transaksi</Text>
            <Text style={styles.detailValue}>{transactionType}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Waktu</Text>
            <Text style={styles.detailValue}>{formatDate()}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Rincian Harga</Text>
            <TouchableOpacity style={styles.priceContainer}>
              <Text style={styles.priceValue}>
                Rp {(totalAmount || 0).toLocaleString('id-ID')}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#2196F3" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleViewDetail}
        >
          <Text style={styles.primaryButtonText}>Lihat Detail</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelOrder}
        >
          <Text style={styles.cancelButtonText}>Cancel Pesanan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleGoHome}
        >
          <Text style={styles.homeButtonText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },

  // Mascot
  mascotContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  mascotBackground: {
    width: 120,
    height: 120,
    backgroundColor: '#4CAF50',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mascotImage: {
    width: 100,
    height: 100,
  },

  // Success Message
  successTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  successMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  // Details Card - Full width without border/shadow
  detailsCard: {
    backgroundColor: Colors.background.primary,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  blueIndicator: {
    width: 4,
    height: 16,
    backgroundColor: '#2196F3',
    marginRight: Spacing.sm,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  transactionIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  transactionId: {
    fontSize: Typography.fontSize.sm,
    color: '#2196F3',
    fontFamily: Typography.fontFamily.semibold,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  priceValue: {
    fontSize: Typography.fontSize.base,
    color: '#2196F3',
    fontFamily: Typography.fontFamily.bold,
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: Colors.error.main,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.error.main,
  },
  homeButton: {
    backgroundColor: 'transparent',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  homeButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
  },
});