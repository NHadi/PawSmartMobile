import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { HomeStackParamList } from '../../navigation/types';
import orderService from '../../services/order/orderService';

type NavigationProp = StackNavigationProp<HomeStackParamList, 'PaymentResult'>;
type PaymentResultRouteProp = RouteProp<HomeStackParamList, 'PaymentResult'>;

interface PaymentDetails {
  transactionId: string;
  transactionType: string;
  timestamp: string;
  amount: number;
  orderId?: string;
  orderName?: string;
  subtotal?: number;
  shippingCost?: number;
  adminFee?: number;
  discount?: number;
}

export default function PaymentResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaymentResultRouteProp>();
  
  // Default to success if no params are provided (for testing)
  const { status = 'success', paymentDetails: rawPaymentDetails } = route.params || { status: 'success' };
  
  // Provide defaults for paymentDetails if not provided
  const paymentDetails: PaymentDetails = rawPaymentDetails || {
    transactionId: `TRX${Date.now().toString().slice(-8)}`,
    transactionType: 'Mart',
    timestamp: new Date().toISOString(),
    amount: 0,
  };
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Debug log to check what we're receiving
  console.log('PaymentResult params:', { status, paymentDetails });

  // Get mascot image based on status
  const getMascotImage = () => {
    if (status === 'failed') {
      return require('../../../assets/mascot-sad.png');
    }
    return require('../../../assets/mascot-happy.png');
  };

  // Get title based on status
  const getTitle = () => {
    if (status === 'failed') {
      return 'Pembayaran Gagal';
    }
    return 'Pembayaran Berhasil';
  };

  // Get subtitle based on status
  const getSubtitle = () => {
    if (status === 'failed') {
      return 'Maaf, transaksi Anda tidak berhasil. Silakan coba lagi atau hubungi layanan pelanggan.';
    }
    return 'Terima kasih atas pembayaran Anda.';
  };

  // Get title color based on status
  const getTitleColor = () => {
    if (status === 'failed') {
      return '#FF5252';
    }
    return '#4CAF50';
  };

  const handleViewDetails = () => {
    // Navigate to order details using nested navigation
    if (paymentDetails?.orderId) {
      navigation.navigate('Activity' as any, {
        screen: 'MyOrders',
        params: { orderId: paymentDetails.orderId }
      });
    }
  };

  const handleCancelOrder = async () => {
    if (!paymentDetails?.orderId) {
      Alert.alert('Error', 'Order ID not found');
      return;
    }

    setIsLoading(true);
    try {
      // Cancel the order
      await orderService.updateOrderStatus(paymentDetails.orderId, 'cancelled');
      
      Alert.alert(
        'Pesanan Dibatalkan',
        'Pesanan Anda telah berhasil dibatalkan.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowCancelModal(false);
              navigation.navigate('Home' as any, { screen: 'HomeScreen' });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Gagal membatalkan pesanan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (status === 'failed') {
      navigation.goBack();
    } else {
      // Navigate to Home tab
      navigation.navigate('Home' as any, { screen: 'HomeScreen' });
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    // In React Native, you would use Clipboard API
    Alert.alert('Berhasil', `${label} telah disalin`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    };
    return date.toLocaleDateString('id-ID', options);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Mascot and Status */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.mascotContainer, 
            { backgroundColor: status === 'failed' ? '#FF5252' : '#4CAF50' }
          ]}>
            <Image 
              source={getMascotImage()} 
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.statusTitle, { color: getTitleColor() }]}>
            {getTitle()}
          </Text>
          <Text style={styles.statusSubtitle}>
            {getSubtitle()}
          </Text>
        </View>

        {/* Payment Details Section */}
        <View style={styles.detailsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
          </View>

          <View style={styles.detailsContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>No. Transaksi</Text>
              <TouchableOpacity style={styles.copyButton} onPress={() => copyToClipboard(paymentDetails.transactionId, 'No. Transaksi')}>
                <MaterialIcons name="content-copy" size={16} color={Colors.primary.main} />
                <Text style={styles.transactionId}>
                  {paymentDetails.transactionId}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Jenis Transaksi</Text>
              <Text style={styles.detailValue}>
                {paymentDetails.transactionType}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Waktu</Text>
              <Text style={styles.detailValue}>
                {paymentDetails?.timestamp ? 
                  formatDate(paymentDetails.timestamp) : 
                  new Date().toLocaleDateString('id-ID')}
              </Text>
            </View>

            <View style={[styles.detailRow, styles.priceRow]}>
              <Text style={styles.detailLabel}>Rincian Harga</Text>
              <TouchableOpacity 
                style={styles.priceToggle}
                onPress={() => setShowPriceDetails(!showPriceDetails)}
              >
                <Text style={styles.priceAmount}>
                  {formatCurrency(paymentDetails?.amount || 0)}
                </Text>
                <MaterialIcons 
                  name={showPriceDetails ? "expand-less" : "expand-more"} 
                  size={24} 
                  color={Colors.text.primary} 
                />
              </TouchableOpacity>
            </View>

            {showPriceDetails && paymentDetails && (
              <View style={styles.priceDetails}>
                {paymentDetails.subtotal !== undefined && (
                  <View style={styles.priceDetailRow}>
                    <Text style={styles.priceDetailLabel}>Subtotal</Text>
                    <Text style={styles.priceDetailValue}>
                      {formatCurrency(paymentDetails.subtotal)}
                    </Text>
                  </View>
                )}
                {paymentDetails.shippingCost !== undefined && (
                  <View style={styles.priceDetailRow}>
                    <Text style={styles.priceDetailLabel}>Ongkos Kirim</Text>
                    <Text style={styles.priceDetailValue}>
                      {formatCurrency(paymentDetails.shippingCost)}
                    </Text>
                  </View>
                )}
                {paymentDetails.adminFee !== undefined && (
                  <View style={styles.priceDetailRow}>
                    <Text style={styles.priceDetailLabel}>Biaya Admin</Text>
                    <Text style={styles.priceDetailValue}>
                      {formatCurrency(paymentDetails.adminFee)}
                    </Text>
                  </View>
                )}
                {paymentDetails.discount !== undefined && paymentDetails.discount > 0 && (
                  <View style={styles.priceDetailRow}>
                    <Text style={styles.priceDetailLabel}>Diskon</Text>
                    <Text style={[styles.priceDetailValue, styles.discountText]}>
                      -{formatCurrency(paymentDetails.discount)}
                    </Text>
                  </View>
                )}
                <View style={styles.divider} />
                <View style={styles.priceDetailRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(paymentDetails.amount)}
                  </Text>
                </View>
              </View>
            )}

          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {status === 'success' ? (
            <>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleViewDetails}
              >
                <Text style={styles.primaryButtonText}>Lihat Detail</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => setShowCancelModal(true)}
              >
                <Text style={styles.secondaryButtonText}>Cancel Order</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleBack}
            >
              <Text style={styles.primaryButtonText}>Kembali</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Pesanan?</Text>
            <Text style={styles.modalMessage}>
              Apa kamu yakin untuk melakukan cancel pesanan ini?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => setShowCancelModal(false)}
                disabled={isLoading}
              >
                <Text style={styles.modalButtonSecondaryText}>Tidak</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleCancelOrder}
                disabled={isLoading}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {isLoading ? 'Processing...' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    paddingBottom: Spacing.xl * 2,
  },
  statusContainer: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  mascotContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  mascotImage: {
    width: 140,
    height: 140,
  },
  statusTitle: {
    fontSize: 26,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.xl * 2,
    marginTop: Spacing.xs,
  },
  detailsSection: {
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  sectionLine: {
    width: 3,
    height: 20,
    backgroundColor: Colors.primary.main,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  detailsContent: {
    paddingHorizontal: Spacing.base,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'right',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  transactionId: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  priceRow: {
    borderBottomWidth: 0,
  },
  priceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  priceAmount: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.bold,
  },
  priceDetails: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  priceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  priceDetailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  priceDetailValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  discountText: {
    color: Colors.warning.main,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.xl * 2,
  },
  primaryButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  primaryButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  secondaryButton: {
    backgroundColor: Colors.background.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error.main,
  },
  secondaryButtonText: {
    color: Colors.error.main,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary.main,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  modalMessage: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  modalButtonSecondaryText: {
    color: Colors.primary.main,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    backgroundColor: Colors.error.main,
  },
  modalButtonPrimaryText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
});