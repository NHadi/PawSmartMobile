import React, { useState } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { HomeStackParamList } from '../../navigation/types';
import paymentGatewayService from '../../services/payment/paymentGatewayService';
import { useLoading } from '../../hooks/useLoading';

type PaymentMethodRouteProp = RouteProp<HomeStackParamList, 'PaymentMethodSelection'>;
type NavigationProp = StackNavigationProp<HomeStackParamList, 'PaymentMethodSelection'>;

interface PaymentMethod {
  id: string;
  name: string;
  type: 'QRIS' | 'EWALLET' | 'VIRTUAL_ACCOUNT';
  icon: any;
  description: string;
  fee?: string;
  channelCode?: string;
  bankCode?: string;
  isPopular?: boolean;
}

const paymentMethods: PaymentMethod[] = [
  // QRIS
  {
    id: 'qris',
    name: 'QRIS',
    type: 'QRIS',
    icon: require('../../../assets/icons/payments/qris.png'),
    description: 'Bayar dengan QRIS (GoPay, OVO, Dana, dll)',
    fee: '0.7%',
    isPopular: true,
  },

  // E-Wallets
  {
    id: 'dana',
    name: 'DANA',
    type: 'EWALLET',
    icon: require('../../../assets/icons/payments/dana.png'),
    description: 'Bayar dengan DANA',
    fee: '2%',
    channelCode: 'ID_DANA',
    isPopular: true,
  },
  {
    id: 'ovo',
    name: 'OVO',
    type: 'EWALLET',
    icon: require('../../../assets/icons/payments/ovo.png'),
    description: 'Bayar dengan OVO',
    fee: '2%',
    channelCode: 'ID_OVO',
    isPopular: true,
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    type: 'EWALLET',
    icon: require('../../../assets/icons/payments/shopepay.png'),
    description: 'Bayar dengan ShopeePay',
    fee: '2%',
    channelCode: 'ID_SHOPEEPAY',
  },
  {
    id: 'linkaja',
    name: 'LinkAja',
    type: 'EWALLET',
    icon: require('../../../assets/icons/payments/linkaja.png'),
    description: 'Bayar dengan LinkAja',
    fee: '2%',
    channelCode: 'ID_LINKAJA',
  },
  {
    id: 'gopay',
    name: 'GoPay',
    type: 'EWALLET',
    icon: require('../../../assets/icons/payments/gopay.png'),
    description: 'Bayar dengan GoPay',
    fee: '2%',
    channelCode: 'ID_GOJEK',
  },

  // Virtual Accounts
  {
    id: 'bca',
    name: 'BCA Virtual Account',
    type: 'VIRTUAL_ACCOUNT',
    icon: require('../../../assets/icons/payments/bca.png'),
    description: 'Transfer Bank BCA',
    fee: 'Rp 4.000',
    bankCode: 'BCA',
    isPopular: true,
  },
  {
    id: 'bni',
    name: 'BNI Virtual Account',
    type: 'VIRTUAL_ACCOUNT',
    icon: require('../../../assets/icons/payments/bni.png'),
    description: 'Transfer Bank BNI',
    fee: 'Rp 4.000',
    bankCode: 'BNI',
  },
  {
    id: 'bri',
    name: 'BRI Virtual Account',
    type: 'VIRTUAL_ACCOUNT',
    icon: require('../../../assets/icons/payments/bri.png'),
    description: 'Transfer Bank BRI',
    fee: 'Rp 4.000',
    bankCode: 'BRI',
  },
  {
    id: 'mandiri',
    name: 'Mandiri Virtual Account',
    type: 'VIRTUAL_ACCOUNT',
    icon: require('../../../assets/icons/payments/mandiri.png'),
    description: 'Transfer Bank Mandiri',
    fee: 'Rp 4.000',
    bankCode: 'MANDIRI',
  },
  {
    id: 'bsi',
    name: 'BSI Virtual Account',
    type: 'VIRTUAL_ACCOUNT',
    icon: require('../../../assets/icons/payments/bsi.png'),
    description: 'Transfer Bank Syariah Indonesia',
    fee: 'Rp 4.000',
    bankCode: 'BSI',
  },
];

export default function PaymentMethodSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaymentMethodRouteProp>();
  const { showLoading, hideLoading } = useLoading();
  
  const { orderId, orderName, totalAmount, customerInfo } = route.params || {};
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const handleSelectPayment = async (method: PaymentMethod) => {
    setSelectedMethod(method);
    
    try {
      showLoading(`Memproses ${method.name}...`);
      
      const paymentRequest = {
        orderId: orderId || '',
        amount: totalAmount || 0,
        paymentMethod: method.type,
        customerName: customerInfo?.name || 'Customer',
        customerEmail: customerInfo?.email,
        customerPhone: customerInfo?.phone,
        description: `Payment for order ${orderName}`,
        items: customerInfo?.items,
      };

      let paymentResponse;
      
      switch (method.type) {
        case 'QRIS':
          paymentResponse = await paymentGatewayService.createQRISPayment(paymentRequest);
          hideLoading();
          navigation.navigate('XenditQRISPayment', {
            paymentData: paymentResponse,
            orderInfo: { orderId, orderName, totalAmount },
          });
          break;
          
        case 'EWALLET':
          if (method.channelCode) {
            paymentResponse = await paymentGatewayService.createEwalletPayment(
              paymentRequest,
              method.channelCode as any
            );
            hideLoading();

            // Debug what we're sending
            console.log('NavigationDebug - Sending to EwalletPayment:', {
              methodName: method.name,
              methodChannelCode: method.channelCode,
              methodId: method.id
            });

            navigation.navigate('EwalletPayment', {
              paymentData: {
                ...paymentResponse,
                selectedChannelCode: method.channelCode,
                selectedMethod: method
              },
              orderInfo: { orderId, orderName, totalAmount },
              paymentMethod: method,
            });
          }
          break;
          
        case 'VIRTUAL_ACCOUNT':
          if (method.bankCode) {
            paymentResponse = await paymentGatewayService.createVirtualAccount(
              paymentRequest,
              method.bankCode as any
            );
            hideLoading();
            navigation.navigate('XenditVAPayment', {
              paymentData: paymentResponse,
              orderInfo: { orderId, orderName, totalAmount },
            });
          }
          break;
      }
    } catch (error: any) {
      hideLoading();
      Alert.alert(
        'Payment Error',
        error.message || 'Failed to process payment. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const calculateTotal = () => {
    if (!selectedMethod || !totalAmount) return totalAmount;
    
    const fee = paymentGatewayService.calculateFee(totalAmount, selectedMethod.type);
    // Ensure the total is an integer (no decimals for IDR)
    return Math.round(totalAmount + fee);
  };

  const popularMethods = paymentMethods.filter(m => m.isPopular);
  const otherMethods = paymentMethods.filter(m => !m.isPopular);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pilih Metode Pembayaran</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Pembayaran</Text>
          <Text style={styles.summaryAmount}>
            Rp {totalAmount?.toLocaleString('id-ID')}
          </Text>
          <Text style={styles.orderNumber}>Order: {orderName}</Text>
        </View>

        {/* Popular Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metode Populer</Text>
          {popularMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod?.id === method.id && styles.methodCardSelected,
              ]}
              onPress={() => handleSelectPayment(method)}
            >
              <View style={styles.methodIcon}>
                <Image source={method.icon} style={styles.methodIconImage} resizeMode="contain" />
              </View>
              
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodDescription}>{method.description}</Text>
                {method.fee && (
                  <Text style={styles.methodFee}>Biaya: {method.fee}</Text>
                )}
              </View>
              
              {method.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Populer</Text>
                </View>
              )}
              
              <MaterialIcons 
                name="chevron-right" 
                size={24} 
                color={Colors.text.tertiary} 
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Other Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metode Lainnya</Text>
          {otherMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod?.id === method.id && styles.methodCardSelected,
              ]}
              onPress={() => handleSelectPayment(method)}
            >
              <View style={styles.methodIcon}>
                <Image source={method.icon} style={styles.methodIconImage} resizeMode="contain" />
              </View>
              
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodDescription}>{method.description}</Text>
                {method.fee && (
                  <Text style={styles.methodFee}>Biaya: {method.fee}</Text>
                )}
              </View>
              
              <MaterialIcons 
                name="chevron-right" 
                size={24} 
                color={Colors.text.tertiary} 
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Fee Information */}
        <View style={styles.feeInfo}>
          <MaterialIcons name="info-outline" size={20} color={Colors.info.main} />
          <Text style={styles.feeInfoText}>
            Biaya transaksi akan ditambahkan ke total pembayaran Anda
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
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
    paddingBottom: Spacing.xl,
  },
  
  // Summary Card
  summaryCard: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  summaryAmount: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary.main,
    marginBottom: Spacing.xs,
  },
  orderNumber: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  
  // Sections
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  
  // Method Card
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  methodCardSelected: {
    backgroundColor: Colors.primary.light + '20',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary.main,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  methodIconImage: {
    width: 32,
    height: 32,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  methodFee: {
    fontSize: Typography.fontSize.xs,
    color: Colors.warning.main,
  },
  
  // Popular Badge
  popularBadge: {
    backgroundColor: Colors.success.light,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  popularText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.success.dark,
  },
  
  // Fee Info
  feeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.info.light + '20',
    padding: Spacing.md,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  feeInfoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.info.dark,
    marginLeft: Spacing.sm,
    lineHeight: 20,
  },
});