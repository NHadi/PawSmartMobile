import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import serverPaymentService from '../../services/payment/serverPaymentService';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'OrderDetail'>;

interface PaymentActionsProps {
  orderId?: string;
  userId?: string;
  amount?: number;
  paymentData?: any;
  orderInfo?: any;
  onCheckStatus: () => Promise<void>;
  onPaymentSuccess?: () => void;
  loading?: boolean;
  setLoading: (loading: boolean) => void;
}

export default function PaymentActions({
  orderId,
  userId,
  amount,
  paymentData,
  orderInfo,
  onCheckStatus,
  onPaymentSuccess,
  loading = false,
  setLoading,
}: PaymentActionsProps) {
  const navigation = useNavigation<NavigationProp>();

  const handleBayar = async () => {
    setLoading(true);
    try {
      console.log('[PaymentActions] Bayar button pressed');
      console.log('[PaymentActions] Payment data:', paymentData);
      console.log('[PaymentActions] Order info:', orderInfo);

      // Extract payment parameters with fallbacks
      const extractedOrderId = orderId || orderInfo?.orderId || paymentData?.orderId || '17';
      const extractedUserId = userId || orderInfo?.userId || '14';
      const extractedAmount = amount ||
        paymentData?.amount ||
        paymentData?.expected_amount ||
        orderInfo?.totalAmount ||
        52000;

      // Determine payment method based on payment data
      let paymentMethod = 'bca_va'; // Default for Virtual Account
      let paymentChannel = 'virtual_account';
      let paymentProvider = paymentData?.provider || 'Xendit';

      // Check payment type and adjust parameters accordingly
      if (paymentData?.paymentMethod === 'QRIS' || paymentData?.qr_string) {
        paymentMethod = 'qris';
        paymentChannel = 'qris';
      } else if (paymentData?.paymentMethod === 'EWALLET' || paymentData?.paymentUrl) {
        paymentMethod = 'ewallet';
        paymentChannel = 'ewallet';
      } else if (paymentData?.bank_code) {
        paymentMethod = paymentData.bank_code.toLowerCase() + '_va';
        paymentChannel = 'virtual_account';
      }

      const externalId = paymentData?.external_id || `pay_test_${extractedOrderId}`;

      console.log('[PaymentActions] Creating payment with params:', {
        order_id: parseInt(extractedOrderId),
        user_id: parseInt(extractedUserId),
        payment_method: paymentMethod,
        payment_provider: paymentProvider,
        payment_channel: paymentChannel,
        amount: extractedAmount,
        external_id: externalId,
        notes: `Payment for order ${extractedOrderId}`
      });

      // Call server payment API
      const paymentResponse = await serverPaymentService.createPayment({
        order_id: parseInt(extractedOrderId),
        user_id: parseInt(extractedUserId),
        payment_method: paymentMethod,
        payment_provider: paymentProvider,
        payment_channel: paymentChannel,
        amount: extractedAmount,
        external_id: externalId,
        notes: `Payment for order ${extractedOrderId}`
      });

      console.log('[PaymentActions] Payment response:', paymentResponse);

      if (paymentResponse.success) {
        const finalOrderId = extractedOrderId;

        Alert.alert(
          'Pembayaran Berhasil Dibuat',
          'Silakan lakukan pembayaran menggunakan metode yang tersedia.',
          [
            {
              text: 'Lihat Detail Pesanan',
              onPress: () => {
                // Navigate to success screen first, then user can choose detail or home
                navigation.navigate('UniversalSuccess', {
                  orderId: finalOrderId,
                  orderName: orderInfo?.orderName || `SO${finalOrderId}`,
                  totalAmount: extractedAmount,
                  transactionType: 'Payment',
                  timestamp: new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) + ' WIB',
                });
                // Check payment status and refresh
                onCheckStatus();
                if (onPaymentSuccess) {
                  onPaymentSuccess();
                }
              }
            },
            {
              text: 'OK',
              onPress: () => {
                // Check payment status and refresh
                onCheckStatus();
                if (onPaymentSuccess) {
                  onPaymentSuccess();
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Gagal', paymentResponse.error || 'Terjadi kesalahan saat membuat pembayaran.');
      }
    } catch (error: any) {
      console.error('[PaymentActions] Bayar error:', error);
      Alert.alert('Gagal', 'Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    await onCheckStatus();
    setLoading(false);
  };

  const handleDetail = () => {
    const finalOrderId = orderId || orderInfo?.orderId || paymentData?.orderId || '17';
    if (finalOrderId) {
      navigation.navigate('OrderDetail', { orderId: finalOrderId.toString() });
    }
  };

  return (
    <View style={styles.container}>
      {/* Bayar Button */}
      <TouchableOpacity
        style={styles.bayarButton}
        onPress={handleBayar}
        disabled={loading}
      >
        <MaterialIcons name="payment" size={20} color={Colors.text.white} />
        <Text style={styles.bayarButtonText}>Bayar</Text>
      </TouchableOpacity>

      {/* Detail Button */}
      <TouchableOpacity
        style={styles.detailButton}
        onPress={handleDetail}
        disabled={loading}
      >
        <MaterialIcons name="description" size={20} color={Colors.primary.main} />
        <Text style={styles.detailButtonText}>Detail</Text>
      </TouchableOpacity>

      {/* Manual Check Status Button */}
      <TouchableOpacity
        style={styles.checkStatusButton}
        onPress={handleCheckStatus}
        disabled={loading}
      >
        <MaterialIcons name="refresh" size={20} color={Colors.primary.main} />
        <Text style={styles.checkStatusButtonText}>
          {loading ? 'Memeriksa...' : 'Cek Status Pembayaran'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  bayarButton: {
    backgroundColor: Colors.success.main || '#10B981', // Green color for payment
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.success.main || '#10B981',
  },
  bayarButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
  },
  detailButton: {
    backgroundColor: Colors.background.secondary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  detailButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary.main,
  },
  checkStatusButton: {
    backgroundColor: Colors.background.secondary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  checkStatusButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary.main,
  },
});