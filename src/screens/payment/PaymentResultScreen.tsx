import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { RootStackParamList } from '../../navigation/types';
import { useCart } from '../../contexts/CartContext';

type PaymentResultRouteProp = RouteProp<RootStackParamList, 'PaymentResult'>;
type NavigationProp = StackNavigationProp<RootStackParamList, 'PaymentResult'>;

export default function PaymentResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaymentResultRouteProp>();
  const { clearCart } = useCart();
  
  // Extract data from route params
  const routeParams = route.params || {};
  console.log('PaymentResult route params:', JSON.stringify(routeParams, null, 2));

  const success = routeParams.status === 'success' || routeParams.success || true;
  const paymentDetails = routeParams.paymentDetails || {};
  console.log('PaymentResult paymentDetails:', JSON.stringify(paymentDetails, null, 2));

  const orderId = paymentDetails.orderId || routeParams.orderId || '47';
  const orderName = paymentDetails.orderName || routeParams.orderName || 'S00047';
  const amount = paymentDetails.amount || routeParams.amount || 52500;
  const transactionId = paymentDetails.transactionId || routeParams.transactionId || '123456644';
  const transactionType = paymentDetails.transactionType || 'Mart';
  const timestamp = paymentDetails.timestamp || new Date().toISOString();

  console.log('PaymentResult extracted data:', { success, orderId, orderName, amount, transactionId });

  // Clear cart when payment is successful
  useEffect(() => {
    if (success) {
      clearCart();
    }
  }, [success]);

  // Prevent back button - user must use buttons to navigate
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Prevent going back - user must use action buttons
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handleViewOrder = () => {
    // Navigate to order detail or order history
    if (orderId) {
      navigation.navigate('OrderDetail', { orderId: orderId.toString() });
    } else {
      // If no orderId, navigate to home screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' as any }],
      });
    }
  };

  const handleContinueShopping = () => {
    navigation.navigate('Home' as any, { screen: 'HomeScreen' });
  };

  const handleRetry = () => {
    navigation.goBack();
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
        <View style={styles.content}>
          {/* Mascot Image */}
          <View style={styles.mascotContainer}>
            {success ? (
              <View style={styles.mascotWrapper}>
                <View style={styles.mascotBackground}>
                  <Image
                    source={require('../../../assets/Confirm Maskot.png')}
                    style={styles.mascotImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.mascotWrapper}>
                <View style={styles.mascotBackground}>
                  <Text style={styles.mascotEmoji}>😿</Text>
                  <View style={styles.mascotBadge}>
                    <Ionicons name="close-circle" size={24} color={Colors.error.main} />
                  </View>
                </View>
                <Text style={styles.mascotName}>PawSmart</Text>
              </View>
            )}
          </View>

          {/* Result Title */}
          <Text style={styles.resultTitle}>
            {success ? 'Pembayaran Berhasil' : 'Pembayaran Gagal'}
          </Text>

          {/* Result Message */}
          <Text style={styles.resultMessage}>
            {success
              ? 'Terima kasih atas pembayaran Anda.'
              : 'Maaf, transaksi Anda tidak berhasil. Silakan coba lagi atau hubungi layanan pelanggan.'
            }
          </Text>

          {/* Payment Details Card */}
          {success && (
            <View style={styles.detailsCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.blueIndicator} />
                <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>No. Transaksi</Text>
                <View style={styles.copyContainer}>
                  <MaterialIcons name="content-copy" size={16} color="#2196F3" />
                  <Text style={[styles.transactionId, { marginLeft: 4 }]}>{transactionId || '123456644'}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Jenis Transaksi</Text>
                <Text style={styles.detailValue}>{transactionType}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Waktu</Text>
                <Text style={styles.detailValue}>
                  {new Date(timestamp).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })} pukul {new Date(timestamp).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} WIB
                </Text>
              </View>

              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>Rincian Harga</Text>
                <Text style={styles.priceValue}>Rp {amount.toLocaleString('id-ID')}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomSection}>
        {success ? (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={handleViewOrder}>
              <Text style={styles.primaryButtonText}>Lihat Detail</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelOrderButton} onPress={() => navigation.navigate('Home' as any)}>
              <Text style={styles.cancelOrderText}>Cancel Pesanan</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
            <Text style={styles.primaryButtonText}>Kembali</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    alignItems: 'center',
    paddingBottom: Spacing.xl,
    minHeight: '100%',
  },
  mascotContainer: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  mascotWrapper: {
    alignItems: 'center',
  },
  mascotBackground: {
    width: 180,
    height: 180,
    backgroundColor: '#4CAF50',
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mascotEmoji: {
    fontSize: 80,
  },
  mascotBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 2,
  },
  mascotName: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
  },
  mascotImage: {
    width: 160,
    height: 160,
  },
  mascotPlaceholder: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    color: '#4CAF50',
  },
  resultMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: Colors.background.white,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
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
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
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
  },
  copyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyButton: {
    marginLeft: Spacing.xs,
  },
  transactionId: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    marginRight: Spacing.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  priceValue: {
    fontSize: Typography.fontSize.base,
    color: '#2196F3',
    fontFamily: Typography.fontFamily.bold,
  },
  bottomSection: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background.primary,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
    textAlign: 'center',
  },
  cancelOrderButton: {
    borderWidth: 1,
    borderColor: Colors.error.main,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelOrderText: {
    fontSize: Typography.fontSize.base,
    color: Colors.error.main,
    fontFamily: Typography.fontFamily.semibold,
  },
});