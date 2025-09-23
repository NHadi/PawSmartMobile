import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { HomeStackParamList } from '../../navigation/types';
import paymentGatewayService from '../../services/payment/paymentGatewayService';
import orderService from '../../services/order/orderService';

type PaymentRouteProp = RouteProp<HomeStackParamList, 'QRISPayment'>;
type NavigationProp = StackNavigationProp<HomeStackParamList, 'QRISPayment'>;

export default function QRISPaymentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaymentRouteProp>();
  
  const { paymentData, orderInfo } = route.params || {};
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'success' | 'expired'>('pending');
  const [isQrisCollapsed, setIsQrisCollapsed] = useState(false);
  const [isInstructionCollapsed, setIsInstructionCollapsed] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();
  const statusCheckRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Start countdown timer
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(intervalRef.current);
          handlePaymentExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Check payment status every 5 seconds
    statusCheckRef.current = setInterval(() => {
      checkPaymentStatus();
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const checkPaymentStatus = async () => {
    try {
      if (!paymentData?.id) return;

      // Determine provider and check status accordingly
      const provider = paymentData.provider || 'XENDIT';
      const status = await paymentGatewayService.getPaymentStatus(paymentData.id, provider);

      if (status.isPaid || status.status === 'PAID' || status.status === 'SUCCEEDED') {
        setPaymentStatus('success');
        handlePaymentSuccess();
      } else if (status.status === 'EXPIRED') {
        setPaymentStatus('expired');
        handlePaymentExpired();
      }
    } catch (error) {
      console.log('Payment status check error:', error);
    }
  };

  const handlePaymentSuccess = async () => {
    clearInterval(intervalRef.current);
    clearInterval(statusCheckRef.current);

    // Update order status in Odoo
    if (orderInfo?.orderId) {
      try {
        await orderService.updateOrderStatus(orderInfo.orderId, 'payment_confirmed');
      } catch (error) {
        console.log('Error updating order status:', error);
      }
    }

    // Stay on current screen - don't navigate away
    // User can manually navigate using buttons if needed
  };

  const handlePaymentExpired = () => {
    clearInterval(intervalRef.current);
    clearInterval(statusCheckRef.current);
    
    Alert.alert(
      'Pembayaran Gagal',
      'Waktu pembayaran telah habis. Silakan buat pesanan baru.',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home' as any)
        }
      ]
    );
  };

  const handleCopyQR = () => {
    if (paymentData?.qr_string) {
      Clipboard.setString(paymentData.qr_string);
      Alert.alert('Berhasil', 'QRIS code telah disalin');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Batalkan Pembayaran?',
      'Anda yakin ingin membatalkan pembayaran ini?',
      [
        {
          text: 'Tidak',
          style: 'cancel',
        },
        {
          text: 'Ya, Batalkan',
          style: 'destructive',
          onPress: () => {
            navigation.navigate('Home' as any);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pembayaran</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Info Section */}
        <View style={styles.paymentInfoSection}>
          <View style={styles.paymentRow}>
            <Text style={styles.label}>Total Pembayaran</Text>
            <Text style={styles.amount}>Rp {(paymentData?.amount || orderInfo?.totalAmount || 0).toLocaleString('id-ID')}</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.label}>Bayar Dalam</Text>
            <Text style={styles.timer}>{Math.floor(timeRemaining / 3600)} jam {Math.floor((timeRemaining % 3600) / 60)} menit {timeRemaining % 60} detik</Text>
          </View>

          <View style={styles.expiredDateContainer}>
            <Text style={styles.expiredDate}>Jatuh tempo {new Date(Date.now() + timeRemaining * 1000).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</Text>
          </View>
        </View>

        {/* QRIS Section */}
        <View style={styles.qrisSection}>
          <TouchableOpacity
            style={styles.qrisHeader}
            onPress={() => setIsQrisCollapsed(!isQrisCollapsed)}
          >
            <View style={styles.qrisLabelContainer}>
              <Image
                source={require('../../../assets/icons/payments/qris.png')}
                style={styles.qrisIcon}
                resizeMode="contain"
              />
              <Text style={styles.qrisTitle}>QRIS</Text>
            </View>
            <MaterialIcons
              name={isQrisCollapsed ? "keyboard-arrow-down" : "keyboard-arrow-up"}
              size={24}
              color={Colors.text.secondary}
            />
          </TouchableOpacity>

          {!isQrisCollapsed && (
            <>
              {/* Payment Method Display */}
              <View style={styles.qrCodeContainer}>
                {paymentData?.qr_string ? (
                  // Show QR Code if available
                  <QRCode
                    value={paymentData.qr_string}
                    size={220}
                    backgroundColor="white"
                    color="black"
                  />
                ) : paymentData?.bankDetails ? (
                  // Show Bank Transfer Details for mobile-first approach
                  <View style={styles.bankDetailsContainer}>
                    <Text style={styles.bankDetailsTitle}>Transfer ke Rekening:</Text>

                    <View style={styles.bankDetailRow}>
                      <Text style={styles.bankDetailLabel}>Bank:</Text>
                      <Text style={styles.bankDetailValue}>{paymentData.bankDetails.bankName}</Text>
                    </View>

                    <View style={styles.bankDetailRow}>
                      <Text style={styles.bankDetailLabel}>No. Rekening:</Text>
                      <Text style={styles.bankDetailValue}>{paymentData.bankDetails.accountNumber}</Text>
                    </View>

                    <View style={styles.bankDetailRow}>
                      <Text style={styles.bankDetailLabel}>Atas Nama:</Text>
                      <Text style={styles.bankDetailValue}>{paymentData.bankDetails.accountName}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => {
                        Clipboard.setString(paymentData.bankDetails.accountNumber);
                        Alert.alert('Berhasil', 'Nomor rekening telah disalin');
                      }}
                    >
                      <MaterialIcons name="content-copy" size={16} color={Colors.text.white} />
                      <Text style={styles.copyButtonText}>Salin No. Rekening</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <MaterialIcons name="account-balance" size={100} color={Colors.text.disabled} />
                    <Text style={styles.qrError}>Data pembayaran tidak tersedia</Text>
                  </View>
                )}
              </View>

              <Text style={styles.verificationNote}>
                Proses verifikasi kurang dari 10 menit setelah pembayaran berhasil
              </Text>
            </>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionSection}>
          <TouchableOpacity
            style={styles.instructionHeader}
            onPress={() => setIsInstructionCollapsed(!isInstructionCollapsed)}
          >
            <Text style={styles.instructionTitle}>
              {paymentData?.qr_string ? 'Petunjuk Pembayaran QRIS' : 'Petunjuk Transfer Bank'}
            </Text>
            <MaterialIcons
              name={isInstructionCollapsed ? "keyboard-arrow-down" : "keyboard-arrow-up"}
              size={24}
              color={Colors.text.secondary}
            />
          </TouchableOpacity>

          {!isInstructionCollapsed && (
            <View style={styles.instructionContent}>
              <Text style={styles.instructionText}>
                {paymentData?.qr_string ? (
                  // QRIS Instructions
                  '1. Buka aplikasi mobile banking atau e-wallet yang mendukung QRIS\n' +
                  '2. Pilih menu Scan QR atau QRIS\n' +
                  '3. Scan QR Code di atas\n' +
                  '4. Masukkan PIN aplikasi Anda\n' +
                  '5. Pembayaran berhasil'
                ) : paymentData?.bankDetails ? (
                  // Bank Transfer Instructions
                  '1. Buka aplikasi mobile banking Anda\n' +
                  '2. Pilih menu Transfer ke Bank Lain\n' +
                  '3. Masukkan nomor rekening di atas\n' +
                  '4. Transfer TEPAT sejumlah ' + (paymentData.amount || orderInfo?.totalAmount || 0).toLocaleString('id-ID') + '\n' +
                  '5. Konfirmasi dan masukkan PIN\n' +
                  '6. Pembayaran otomatis terdeteksi'
                ) : (
                  // Default Instructions
                  'Petunjuk pembayaran akan muncul setelah data pembayaran tersedia'
                )}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom OK Button - Always show for testing */}
      <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.okButton}
            onPress={() => {
              // Navigate to new universal success screen when OK is pressed
              navigation.replace('UniversalSuccess', {
                orderId: orderInfo?.orderId,
                orderName: orderInfo?.orderName,
                totalAmount: orderInfo?.totalAmount || 0,
                transactionType: 'QRIS',
                timestamp: new Date().toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }) + ' WIB',
              });
            }}
          >
            <Text style={styles.okButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flexGrow: 1,
  },
  
  // Payment Info Section
  paymentInfoSection: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  amount: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary.main,
  },
  timer: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: '#F39C12',
  },
  expiredDateContainer: {
    alignItems: 'flex-end',
    marginTop: Spacing.xs,
  },
  expiredDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    textAlign: 'right',
  },
  
  // QRIS Section
  qrisSection: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.main,
  },
  qrisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    width: '100%',
    paddingHorizontal: Spacing.xs,
  },
  qrisLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrisIcon: {
    width: 60,
    height: 36,
    marginRight: Spacing.sm,
  },
  qrisTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  qrCodeContainer: {
    backgroundColor: Colors.background.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrError: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },

  // Bank Details Styles
  bankDetailsContainer: {
    width: '100%',
    padding: Spacing.lg,
    backgroundColor: Colors.background.white,
    borderRadius: BorderRadius.sm,
  },
  bankDetailsTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  bankDetailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  bankDetailValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    flex: 2,
    textAlign: 'right',
  },
  copyButton: {
    backgroundColor: Colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  copyButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.white,
    marginLeft: Spacing.xs,
  },
  verificationNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 20,
  },
  
  // Instruction Section
  instructionSection: {
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.main,
  },
  instructionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  instructionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  instructionContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  instructionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  
  // Bottom Section
  bottomSection: {
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  okButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
  },
});