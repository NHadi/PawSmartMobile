import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { RootStackParamList } from '../../navigation/types';
import paymentGatewayService from '../../services/payment/paymentGatewayService';
import orderService from '../../services/order/orderService';

type PaymentRouteProp = RouteProp<RootStackParamList, 'EwalletPayment'>;
type NavigationProp = StackNavigationProp<RootStackParamList, 'EwalletPayment'>;

export default function EwalletPaymentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaymentRouteProp>();

  const { paymentData, orderInfo, paymentMethod } = route.params || {};
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'success' | 'expired'>('pending');
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutes
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const statusCheckRef = useRef<NodeJS.Timeout>();

  // Get payment method info from paymentMethod or paymentData
  const getPaymentMethodInfo = () => {
    // Try multiple sources for channel code
    let channelCode =
      paymentMethod?.channelCode ||
      paymentData?.selectedChannelCode ||
      paymentData?.channel_code ||
      paymentData?.channelCode ||
      paymentData?.paymentData?.channel_code ||
      paymentData?.paymentData?.channelCode ||
      paymentData?.channel?.code ||
      paymentData?.payment_method?.channel_code;

    // If still no channel code, try to get from paymentMethod id
    if (!channelCode && paymentMethod?.id) {
      const methodId = paymentMethod.id.toLowerCase();
      switch (methodId) {
        case 'dana':
          channelCode = 'ID_DANA';
          break;
        case 'ovo':
          channelCode = 'ID_OVO';
          break;
        case 'shopeepay':
          channelCode = 'ID_SHOPEEPAY';
          break;
        case 'linkaja':
          channelCode = 'ID_LINKAJA';
          break;
        case 'gopay':
          channelCode = 'ID_GOJEK';
          break;
        default:
          channelCode = 'ID_DANA';
      }
    }

    // If we still don't have a channel code, try to detect from paymentData structure
    if (!channelCode && paymentData) {
      // Check if there are any OVO-related properties in the payment data
      const paymentStr = JSON.stringify(paymentData).toLowerCase();
      if (paymentStr.includes('ovo') || paymentStr.includes('id_ovo')) {
        channelCode = 'ID_OVO';
      } else if (paymentStr.includes('dana') || paymentStr.includes('id_dana')) {
        channelCode = 'ID_DANA';
      } else if (paymentStr.includes('shopee') || paymentStr.includes('id_shopee')) {
        channelCode = 'ID_SHOPEEPAY';
      } else if (paymentStr.includes('linkaja') || paymentStr.includes('id_linkaja')) {
        channelCode = 'ID_LINKAJA';
      } else if (paymentStr.includes('gopay') || paymentStr.includes('id_gojek') || paymentStr.includes('gojek')) {
        channelCode = 'ID_GOJEK';
      }
    }

    // Default to DANA if no channel code found
    channelCode = channelCode || 'ID_DANA';

    switch (channelCode) {
      case 'ID_DANA':
        return {
          name: 'DANA',
          inputLabel: 'No DANA',
          icon: require('../../../assets/icons/payments/dana.png')
        };
      case 'ID_OVO':
        return {
          name: 'OVO',
          inputLabel: 'No OVO',
          icon: require('../../../assets/icons/payments/ovo.png')
        };
      case 'ID_SHOPEEPAY':
        return {
          name: 'ShopeePay',
          inputLabel: 'No ShopeePay',
          icon: require('../../../assets/icons/payments/shopepay.png')
        };
      case 'ID_LINKAJA':
        return {
          name: 'LinkAja',
          inputLabel: 'No LinkAja',
          icon: require('../../../assets/icons/payments/linkaja.png')
        };
      case 'ID_GOJEK':
        return {
          name: 'GoPay',
          inputLabel: 'No GoPay',
          icon: require('../../../assets/icons/payments/gopay.png')
        };
      default:
        return {
          name: 'DANA',
          inputLabel: 'No DANA',
          icon: require('../../../assets/icons/payments/dana.png')
        };
    }
  };

  const methodInfo = getPaymentMethodInfo();



  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

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

      // Determine provider from payment data or use XENDIT as default for e-wallets
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
      }
    }

    // Navigate to universal success screen
    navigation.replace('UniversalSuccess', {
      orderId: orderInfo?.orderId,
      orderName: orderInfo?.orderName,
      totalAmount: orderInfo?.totalAmount || 0,
      transactionType: 'E-Wallet',
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
    clearInterval(intervalRef.current);
    clearInterval(statusCheckRef.current);

    Alert.alert(
      'Pembayaran Gagal',
      'Waktu pembayaran telah habis. Silakan buat pesanan baru.',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Main' as any, {
            screen: 'Home',
            params: { screen: 'HomeScreen' }
          })
        }
      ]
    );
  };

  const startStatusChecking = () => {
    // Check payment status every 5 seconds
    statusCheckRef.current = setInterval(() => {
      checkPaymentStatus();
    }, 5000);
  };

  const handlePaymentInitiation = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', `Masukkan nomor ${methodInfo.name} terlebih dahulu`);
      return;
    }

    setPaymentStatus('checking');

    try {
      // In a real app, you would:
      // 1. Send the phone number to your backend
      // 2. Create a DANA payment request via payment gateway
      // 3. Get payment URL or handle deep linking

      // Check if redirect is required or if it's direct mobile payment
      const hasPaymentUrl = paymentData?.actions?.mobile_web_checkout_url;
      const isRedirectRequired = paymentData?.is_redirect_required !== false;

      if (hasPaymentUrl) {
        // Web-based payment (redirect required)
        const paymentUrl = paymentData.actions.mobile_web_checkout_url;

        Alert.alert(
          'Membuka Pembayaran',
          `Anda akan diarahkan ke aplikasi ${methodInfo.name} untuk menyelesaikan pembayaran.`,
          [
            {
              text: 'Batal',
              style: 'cancel'
            },
            {
              text: 'Lanjutkan',
              onPress: () => {
                // TODO: Open payment URL in browser/app
                setPaymentStatus('checking');
                startStatusChecking();
              }
            }
          ]
        );
      } else if (!isRedirectRequired) {
        // Direct mobile payment (like OVO) - no redirect needed
        Alert.alert(
          'Pembayaran Dimulai',
          `Pembayaran ${methodInfo.name} telah dibuat. Silakan buka aplikasi ${methodInfo.name} untuk menyelesaikan pembayaran.\n\nHalaman ini akan otomatis ter-update saat pembayaran berhasil.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setPaymentStatus('checking');
                startStatusChecking();
              }
            }
          ]
        );
      } else {
        // No URL and redirect required - error
        Alert.alert(
          'Error',
          'Metode pembayaran tidak tersedia saat ini. Silakan coba lagi atau pilih metode pembayaran lain.',
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      setPaymentStatus('pending');
      Alert.alert('Error', 'Gagal memulai pembayaran. Silakan coba lagi.');
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
        {/* Payment Amount Section */}
        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Pembayaran</Text>
            <Text style={styles.amountValue}>
              Rp {(orderInfo?.totalAmount || 0).toLocaleString('id-ID')}
            </Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.paymentDeadlineLabel}>Bayar Dalam</Text>
            <Text style={styles.timeCountdown}>
              {Math.floor(timeRemaining / 3600)} jam {Math.floor((timeRemaining % 3600) / 60)} menit {timeRemaining % 60} detik
            </Text>
          </View>
          <Text style={styles.expiryDate}>
            Jatuh tempo {new Date(Date.now() + timeRemaining * 1000).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>

        {/* E-Wallet Section */}
        <View style={styles.ewalletSection}>
          <TouchableOpacity style={styles.ewalletHeader} onPress={toggleCollapse}>
            <View style={styles.ewalletIconContainer}>
              <Image source={methodInfo.icon} style={styles.ewalletIconImage} resizeMode="contain" />
              <Text style={styles.ewalletText}>{methodInfo.name}</Text>
            </View>
            <Ionicons
              name={isCollapsed ? "chevron-down" : "chevron-up"}
              size={20}
              color="#1E88E5"
            />
          </TouchableOpacity>

          {!isCollapsed && (
            <View style={styles.phoneInputSection}>
              <Text style={styles.inputLabel}>{methodInfo.inputLabel}</Text>
              <TextInput
                style={styles.phoneInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+62"
                keyboardType="phone-pad"
                maxLength={15}
              />
              <Text style={styles.inputHelpText}>
                Masukkan nomor HP {methodInfo.name} sebelum melakukan pembayaran ke {methodInfo.name} agar nomor tetap sama
              </Text>
            </View>
          )}
        </View>

        {/* Petunjuk Pembayaran Section */}
        {!isCollapsed && (
          <TouchableOpacity style={styles.paymentGuideButton}>
            <Text style={styles.paymentGuideText}>
              Petunjuk Pembayaran {methodInfo.name}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#1E88E5" />
          </TouchableOpacity>
        )}

        {/* OK Button */}
        <TouchableOpacity
          style={[
            styles.okButton,
            ((!phoneNumber && !isCollapsed) || paymentStatus === 'checking') && styles.okButtonDisabled
          ]}
          onPress={handlePaymentInitiation}
          disabled={(!phoneNumber && !isCollapsed) || paymentStatus === 'checking'}
        >
          <Text style={styles.okButtonText}>
            {paymentStatus === 'checking' ? 'Memproses...' : 'OK'}
          </Text>
        </TouchableOpacity>

        {/* Loading indicator */}
        {paymentStatus === 'checking' && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.main} />
            <Text style={styles.loadingText}>Processing payment...</Text>
          </View>
        )}   

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
    paddingBottom: Spacing.xl,
  },

  // Payment Amount Section
  amountSection: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.base,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  amountLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  amountValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: '#1E88E5',
  },
  paymentDeadlineLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  timeCountdown: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: '#FF9800',
  },
  expiryDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },

  // E-Wallet Section
  ewalletSection: {
    backgroundColor: Colors.background.primary,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.md,
    paddingVertical: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: '#1E88E5',
    paddingLeft: Spacing.base,
    paddingRight: Spacing.base,
  },
  ewalletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  ewalletIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ewalletIconImage: {
    width: 24,
    height: 24,
    marginRight: Spacing.sm,
  },
  ewalletText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },

  // Phone Input Section
  phoneInputSection: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#00BCD4',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.background.primary,
  },
  inputHelpText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    lineHeight: 16,
  },

  // Payment Guide Button
  paymentGuideButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.background.primary,
    marginHorizontal: Spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: '#1E88E5',
    marginBottom: Spacing.md,
  },
  paymentGuideText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: '#1E88E5',
  },

  // OK Button
  okButton: {
    backgroundColor: '#00BCD4',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginHorizontal: Spacing.base,
    marginTop: 'auto',
    marginBottom: Spacing.lg,
  },
  okButtonDisabled: {
    backgroundColor: Colors.border.light,
  },
  okButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
  },

  // Loading Section
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },

  
});