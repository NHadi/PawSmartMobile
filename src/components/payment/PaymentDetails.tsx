import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Clipboard,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import paymentGatewayService from '../../services/payment/paymentGatewayService';
import orderService from '../../services/order/orderService';

interface PaymentDetailsProps {
  paymentType: 'QRIS' | 'EWALLET' | 'VIRTUAL_ACCOUNT';
  paymentData: any;
  orderInfo: {
    orderId: string | number;
    orderName: string;
    totalAmount: number;
  };
  onPaymentSuccess: () => void;
  expanded?: boolean;
}

export default function PaymentDetails({
  paymentType,
  paymentData,
  orderInfo,
  onPaymentSuccess,
  expanded = false,
}: PaymentDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes
  const [checkingStatus, setCheckingStatus] = useState(false);
  const statusCheckRef = useRef<NodeJS.Timeout>();
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isExpanded && paymentData) {
      // Start countdown timer
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 0) {
            clearInterval(timerRef.current);
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
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    };
  }, [isExpanded, paymentData]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours} jam ${minutes} menit`;
    }
    return `${minutes} menit ${secs} detik`;
  };

  const checkPaymentStatus = async () => {
    try {
      if (!paymentData?.id) return;
      
      // Skip status checking for mock Virtual Account data
      if (paymentType === 'VIRTUAL_ACCOUNT' && paymentData.id?.startsWith('va_')) {
        return;
      }
      
      setCheckingStatus(true);
      const status = await paymentGatewayService.getPaymentStatus(paymentData.id, paymentType);
      
      if (status.status === 'PAID' || status.status === 'SUCCEEDED' || status.status === 'COMPLETED') {
        handlePaymentSuccess();
      } else if (status.status === 'EXPIRED' || status.status === 'FAILED') {
        handlePaymentExpired();
      }
    } catch (error) {
      // Don't show error for VA mock data
      if (!(paymentType === 'VIRTUAL_ACCOUNT' && paymentData.id?.startsWith('va_'))) {
        }
    } finally {
      setCheckingStatus(false);
    }
  };

  const handlePaymentSuccess = async () => {
    clearInterval(timerRef.current);
    clearInterval(statusCheckRef.current);
    
    // Update order status in Odoo
    if (orderInfo?.orderId) {
      try {
        await orderService.updateOrderStatus(orderInfo.orderId, 'payment_confirmed');
      } catch (error) {
        }
    }
    
    Alert.alert('Pembayaran Berhasil', 'Pembayaran Anda telah dikonfirmasi!');
    onPaymentSuccess();
  };

  const handlePaymentExpired = () => {
    clearInterval(timerRef.current);
    clearInterval(statusCheckRef.current);
    
    Alert.alert(
      'Pembayaran Kadaluarsa',
      'Waktu pembayaran telah habis. Silakan coba lagi.',
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Berhasil', `${label} telah disalin`);
  };

  const renderQRISPayment = () => {
    if (!paymentData?.qr_string) {
      return <ActivityIndicator size="large" color={Colors.primary.main} />;
    }

    return (
      <View style={styles.paymentContent}>
        <View style={styles.qrContainer}>
          <QRCode
            value={paymentData.qr_string}
            size={200}
            backgroundColor="white"
            color="black"
          />
        </View>
        
        <Text style={styles.instructionText}>
          Proses verifikasi kurang dari 10 menit setelah pembayaran berhasil
        </Text>
        
        <TouchableOpacity 
          style={styles.copyButton}
          onPress={() => copyToClipboard(paymentData.qr_string, 'Kode QRIS')}
        >
          <MaterialIcons name="content-copy" size={20} color={Colors.primary.main} />
          <Text style={styles.copyButtonText}>Salin Kode QRIS</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderVirtualAccount = () => {
    const vaNumber = paymentData?.account_number || '128 0823 5647 3920';
    const bankName = paymentData?.bank_code || 'Bank Mandiri';

    return (
      <View style={styles.paymentContent}>
        <View style={styles.vaContainer}>
          <Text style={styles.vaLabel}>No. Rek/Virtual Account</Text>
          <Text style={styles.vaNumber}>{vaNumber}</Text>
          
          <TouchableOpacity 
            style={styles.copyButtonSmall}
            onPress={() => copyToClipboard(vaNumber.replace(/\s/g, ''), 'Nomor VA')}
          >
            <Text style={styles.copyButtonText}>Salin</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.instructionText}>
          Proses  ssverifikasi kurang dari 10 menit setelah pembayaran berhasil
        </Text>

        <Text style={styles.vaBank}>
          Bayar pesanan ke Virtual Account di atas sebelum membuat pesanan kembali dengan Virtual Account agar nomor tetap sama.
        </Text>

        <Text style={styles.vaNote}>
          Hanya menerima dari {bankName}
        </Text>
      </View>
    );
  };

  const renderEwalletPayment = () => {
    const phoneNumber = paymentData?.channel_properties?.mobile_number || '+62';
    
    const handleOpenEwallet = () => {
      if (paymentData?.actions?.mobile_deeplink_checkout_url) {
        Linking.openURL(paymentData.actions.mobile_deeplink_checkout_url).catch(() => {
          if (paymentData?.actions?.mobile_web_checkout_url) {
            Linking.openURL(paymentData.actions.mobile_web_checkout_url);
          }
        });
      }
    };

    return (
      <View style={styles.paymentContent}>
        <View style={styles.ewalletContainer}>
          <Text style={styles.ewalletLabel}>No Dana</Text>
          <View style={styles.phoneInputContainer}>
            <Text style={styles.phoneNumber}>{phoneNumber}</Text>
          </View>
          
          <Text style={styles.instructionText}>
            Masukkan nomor HP dulu sebelum melakukan pembayaran ke Dana agar nomor tetap sama.
          </Text>
        </View>

        <TouchableOpacity style={styles.openAppButton} onPress={handleOpenEwallet}>
          <Text style={styles.openAppButtonText}>Petunjuk Pembayaran Dana</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPaymentContent = () => {
    switch (paymentType) {
      case 'QRIS':
        return renderQRISPayment();
      case 'VIRTUAL_ACCOUNT':
        return renderVirtualAccount();
      case 'EWALLET':
        return renderEwalletPayment();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.headerLeft}>
          <View style={styles.headerLine} />
          <Text style={styles.headerTitle}>
            {paymentType === 'QRIS' ? 'QRIS' : 
             paymentType === 'VIRTUAL_ACCOUNT' ? 'Bank Mandiri' : 
             'Dana'}
          </Text>
        </View>
        <MaterialIcons 
          name={isExpanded ? 'expand-less' : 'expand-more'} 
          size={24} 
          color={Colors.text.primary} 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.amountContainer}>
            <View>
              <Text style={styles.amountLabel}>Total Pembayaran</Text>
              <Text style={styles.amountValue}>
                Rp {orderInfo.totalAmount.toLocaleString('id-ID')}
              </Text>
            </View>
            <View>
              <Text style={styles.amountLabel}>Bayar Dalam</Text>
              <Text style={styles.timerValue}>{formatTime(timeRemaining)}</Text>
              <Text style={styles.timerDate}>
                Jatuh tempo {new Date(Date.now() + timeRemaining * 1000).toLocaleDateString('id-ID')}
              </Text>
            </View>
          </View>

          {renderPaymentContent()}

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <TouchableOpacity style={styles.instructionItem}>
              <Text style={styles.instructionItemText}>Petunjuk Transfer mBanking</Text>
              <MaterialIcons name="chevron-right" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
            
            {paymentType === 'VIRTUAL_ACCOUNT' && (
              <>
                <TouchableOpacity style={styles.instructionItem}>
                  <Text style={styles.instructionItemText}>Petunjuk Transfer iBanking</Text>
                  <MaterialIcons name="chevron-right" size={20} color={Colors.text.tertiary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.instructionItem}>
                  <Text style={styles.instructionItemText}>Petunjuk Transfer ATM</Text>
                  <MaterialIcons name="chevron-right" size={20} color={Colors.text.tertiary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLine: {
    width: 3,
    height: 20,
    backgroundColor: Colors.primary.main,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  expandedContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  amountLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary.main,
  },
  timerValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.warning.main,
  },
  timerDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  paymentContent: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  
  // QRIS
  qrContainer: {
    padding: Spacing.lg,
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  
  // Virtual Account
  vaContainer: {
    width: '100%',
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  vaLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  vaNumber: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  vaBank: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  vaNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.info.main,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  
  // E-wallet
  ewalletContainer: {
    width: '100%',
  },
  ewalletLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  phoneInputContainer: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  phoneNumber: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  
  // Common
  instructionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginVertical: Spacing.sm,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary.light + '20',
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  copyButtonSmall: {
    position: 'absolute',
    right: Spacing.md,
    top: '50%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary.light + '20',
    borderRadius: BorderRadius.sm,
  },
  copyButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary.main,
    marginLeft: Spacing.xs,
  },
  openAppButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  openAppButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
    textAlign: 'center',
  },
  
  // Instructions
  instructionsContainer: {
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  instructionItemText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
  },
});