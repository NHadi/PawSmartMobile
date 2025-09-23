import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { RootStackParamList } from '../../navigation/types';
import paymentSimulator from '../../services/payment/paymentSimulator';
import paymentGatewayService from '../../services/payment/paymentGatewayService';
import orderService from '../../services/order/orderService';

type PaymentRouteProp = RouteProp<RootStackParamList, 'VirtualAccountPayment'>;
type NavigationProp = StackNavigationProp<RootStackParamList, 'VirtualAccountPayment'>;

// Helper function to get bank name from code
const getBankName = (code: string) => {
  const banks: { [key: string]: string } = {
    'MANDIRI': 'Bank Mandiri',
    'BCA': 'Bank BCA',
    'BNI': 'Bank BNI',
    'BRI': 'Bank BRI',
    'BSI': 'Bank Syariah Indonesia',
  };
  return banks[code] || code;
};

export default function VirtualAccountPaymentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaymentRouteProp>();

  const { paymentData, orderInfo } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(24 * 60 * 60); // 24 hours in seconds
  const [expandedSections, setExpandedSections] = useState<string[]>(['transfer']);
  const [hasNavigated, setHasNavigated] = useState(false); // Prevent multiple navigation calls
  const intervalRef = useRef<NodeJS.Timeout>();
  const statusCheckRef = useRef<NodeJS.Timeout>();

  // Extract order details from the navigation params
  const orderId = orderInfo?.orderId || '40';
  const orderName = orderInfo?.orderName || 'S00040';
  const vaNumber = paymentData?.account_number || paymentData?.external_id || '128 0823 5647 3920';
  const amount = paymentData?.expected_amount || orderInfo?.totalAmount || 482500;
  const bankCode = paymentData?.bank_code || 'MANDIRI';
  const bankName = getBankName(bankCode);

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

    // Add navigation listener to track navigation events
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Track navigation events if needed
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (statusCheckRef.current) clearInterval(statusCheckRef.current);
      unsubscribe();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours} jam ${minutes} menit ${secs} detik`;
  };

  const formatDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return tomorrow.toLocaleDateString('id-ID', options).replace(',', ',');
  };

  const checkPaymentStatus = async () => {
    try {
      if (!paymentData?.id) {
        return;
      }

      // Determine provider from payment data or use FLIP as default for virtual accounts
      const provider = paymentData.provider || 'FLIP';

      const status = await paymentGatewayService.getPaymentStatus(paymentData.id, provider);

      if (status.status === 'PAID' || status.status === 'SUCCEEDED') {
        handlePaymentSuccess();
      } else if (status.status === 'EXPIRED') {
        handlePaymentExpired();
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const handlePaymentSuccess = async () => {
    if (hasNavigated) {
      return;
    }
    setHasNavigated(true);

    clearInterval(intervalRef.current);
    clearInterval(statusCheckRef.current);

    // Update order status in Odoo
    if (orderInfo?.orderId) {
      try {
        await orderService.updateOrderStatus(orderInfo.orderId, 'payment_confirmed');
      } catch (error) {
        // Silent error
      }
    }

    navigation.navigate('UniversalSuccess', {
      orderId: orderInfo?.orderId,
      orderName: orderInfo?.orderName,
      totalAmount: orderInfo?.totalAmount || 0,
      transactionType: 'Virtual Account',
      timestamp: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB',
    });
  };

  const handlePaymentExpired = () => {
    if (hasNavigated) {
      return;
    }
    setHasNavigated(true);

    clearInterval(intervalRef.current);
    clearInterval(statusCheckRef.current);

    // Navigate back to previous screen or show error
    navigation.goBack();
  };

  const handleCopyVA = () => {
    const cleanVA = vaNumber.replace(/\s/g, '');
    Clipboard.setString(cleanVA);
    Alert.alert('Berhasil', 'Nomor Virtual Account telah disalin');
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleCompletePayment = async () => {
    setLoading(true);
    try {
      const result = await paymentSimulator.simulateVirtualAccountPayment(orderId);
      
      if (result.success) {
        await handlePaymentSuccess();
      } else {
        // Show error message and stay on current screen
        Alert.alert('Payment Failed', 'Please try again or contact support.');
      }
    } catch (error) {
      // Show error message and stay on current screen
      Alert.alert('Payment Failed', 'Please try again or contact support.');
    } finally {
      setLoading(false);
    }
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Info Section */}
        <View style={styles.paymentInfoSection}>
          <Text style={styles.label}>Total Pembayaran</Text>
          <Text style={styles.amount}>Rp {amount.toLocaleString('id-ID')}</Text>
          
          <Text style={styles.label}>Bayar Dalam</Text>
          <Text style={styles.timer}>{formatTime(timeRemaining)}</Text>
          
          <Text style={styles.expiredDate}>Jatuh tempo {formatDate()}</Text>
        </View>

        {/* Bank Info Section */}
        <View style={styles.bankSection}>
          <View style={styles.bankHeader}>
            <MaterialIcons name="account-balance" size={20} color={Colors.primary.main} />
            <Text style={styles.bankName}>{bankName}</Text>
            <View style={styles.expandIcon} />
          </View>
          
          <View style={styles.vaNumberContainer}>
            <Text style={styles.vaNumber}>{vaNumber}</Text>
            <TouchableOpacity onPress={handleCopyVA} style={styles.copyButton}>
              <Text style={styles.copyText}>Salin</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.verificationNote}>
            Proses verifikasi kurang dari 10 menit setelah pembayaran berhasil
          </Text>
          
          <Text style={styles.instructionNote}>
            Bayar pesanan ke Virtual Account di atas sebelum membuat pesanan kembali dengan Virtual Account agar nomor tetap sama.
          </Text>
          
          <Text style={styles.onlyAccept}>
            Hanya menerima dari {bankName}
          </Text>
        </View>

        {/* Transfer Instructions */}
        <TouchableOpacity 
          style={styles.instructionSection}
          onPress={() => toggleSection('mbanking')}
        >
          <View style={styles.instructionHeader}>
            <Text style={styles.instructionTitle}>Petunjuk Transfer mBanking</Text>
            <Ionicons 
              name={expandedSections.includes('mbanking') ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={Colors.text.secondary} 
            />
          </View>
        </TouchableOpacity>
        
        {expandedSections.includes('mbanking') && (
          <View style={styles.instructionContent}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Masuk ke menu Mobile Banking {bankName}. Kemudian, pilih Pembayaran >
              </Text>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Bayar pesanan ke Virtual Account di atas sebelum membuat pesanan kembali dengan Virtual Account agar nomor tetap sama.
              </Text>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Bayar pesanan ke Virtual Account di atas sebelum membuat pesanan kembali dengan Virtual Account agar nomor tetap sama.
              </Text>
            </View>
          </View>
        )}

        {/* iBanking Instructions */}
        <TouchableOpacity 
          style={styles.instructionSection}
          onPress={() => toggleSection('ibanking')}
        >
          <View style={styles.instructionHeader}>
            <Text style={styles.instructionTitle}>Petunjuk Transfer iBanking</Text>
            <Ionicons 
              name={expandedSections.includes('ibanking') ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={Colors.text.secondary} 
            />
          </View>
        </TouchableOpacity>

        {/* ATM Instructions */}
        <TouchableOpacity 
          style={styles.instructionSection}
          onPress={() => toggleSection('atm')}
        >
          <View style={styles.instructionHeader}>
            <Text style={styles.instructionTitle}>Petunjuk Transfer ATM</Text>
            <Ionicons 
              name={expandedSections.includes('atm') ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={Colors.text.secondary} 
            />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom OK Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={styles.okButton}
          onPress={() => {
            if (hasNavigated) {
              return;
            }
            setHasNavigated(true);

            // Clear intervals before navigation to prevent conflicts
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = undefined;
            }
            if (statusCheckRef.current) {
              clearInterval(statusCheckRef.current);
              statusCheckRef.current = undefined;
            }

            // Navigate to universal success screen when OK is pressed
            navigation.navigate('UniversalSuccess', {
              orderId: orderInfo?.orderId,
              orderName: orderInfo?.orderName,
              totalAmount: orderInfo?.totalAmount || 0,
              transactionType: 'Virtual Account',
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
    paddingBottom: 100,
  },
  
  // Payment Info Section
  paymentInfoSection: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  amount: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary.main,
    marginBottom: Spacing.md,
  },
  timer: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.warning.main,
    marginBottom: Spacing.xs,
  },
  expiredDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  
  // Bank Section
  bankSection: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.base,
    borderBottomWidth: 8,
    borderBottomColor: Colors.background.secondary,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  bankName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  expandIcon: {
    marginLeft: 'auto',
  },
  vaNumberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  vaNumber: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    letterSpacing: 1,
  },
  copyButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  copyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.semibold,
  },
  verificationNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  instructionNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  onlyAccept: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  
  // Instruction Sections
  instructionSection: {
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
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
    backgroundColor: Colors.background.secondary,
  },
  step: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  stepNumberText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
  },
  stepText: {
    flex: 1,
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