import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { HomeStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<HomeStackParamList, 'PaymentMethod'>;

interface PaymentOption {
  id: string;
  category: string;
  name: string;
  displayName: string;
  icon?: any;
  logo?: string;
}

const paymentOptions: PaymentOption[] = [
  // Instant Payment
  {
    id: 'qris',
    category: 'instant',
    name: 'QRIS',
    displayName: 'QRIS',
    icon: require('../../../assets/icons/payments/qris.png'),
  },
  {
    id: 'ovo',
    category: 'ewallet',
    name: 'OVO',
    displayName: 'OVO',
    icon: require('../../../assets/icons/payments/ovo.png'),
  },
  {
    id: 'gopay',
    category: 'ewallet',
    name: 'Gopay',
    displayName: 'Gopay',
    icon: require('../../../assets/icons/payments/gopay.png'),
  },
  {
    id: 'shopeepay',
    category: 'ewallet',
    name: 'ShopeePay',
    displayName: 'Shopee Pay',
    icon: require('../../../assets/icons/payments/shopepay.png'),
  },
  {
    id: 'linkaja',
    category: 'ewallet',
    name: 'LinkAja',
    displayName: 'Link Aja',
    icon: require('../../../assets/icons/payments/linkaja.png'),
  },
  {
    id: 'dana',
    category: 'ewallet',
    name: 'Dana',
    displayName: 'Dana',
    icon: require('../../../assets/icons/payments/dana.png'),
  },
  // Virtual Account
  {
    id: 'bsi',
    category: 'virtual_account',
    name: 'BSI VA',
    displayName: 'BSI VA',
    icon: require('../../../assets/icons/payments/bsi.png'),
  },
  {
    id: 'bri',
    category: 'virtual_account',
    name: 'BRI VA',
    displayName: 'BRI VA',
    icon: require('../../../assets/icons/payments/bri.png'),
  },
  {
    id: 'bni',
    category: 'virtual_account',
    name: 'BNI VA',
    displayName: 'BNI VA',
    icon: require('../../../assets/icons/payments/bni.png'),
  },
  {
    id: 'mandiri',
    category: 'virtual_account',
    name: 'Mandiri VA',
    displayName: 'Mandiri VA',
    icon: require('../../../assets/icons/payments/mandiri.png'),
  },
  {
    id: 'bca',
    category: 'virtual_account',
    name: 'BCA VA',
    displayName: 'BCA VA',
    icon: require('../../../assets/icons/payments/bca.png'),
  },
];

export default function PaymentMethodScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedPayment, setSelectedPayment] = useState<string>('');

  const handleSelectPayment = (paymentId: string) => {
    setSelectedPayment(paymentId);
    // Navigate back with selected payment
    setTimeout(() => {
      navigation.goBack();
    }, 200);
  };

  const renderPaymentIcon = (icon: any) => {
    return (
      <View style={styles.paymentIconContainer}>
        <Image source={icon} style={styles.paymentIcon} resizeMode="contain" />
      </View>
    );
  };

  const renderPaymentOption = (payment: PaymentOption) => (
    <TouchableOpacity
      key={payment.id}
      style={styles.paymentOption}
      onPress={() => handleSelectPayment(payment.id)}
    >
      {renderPaymentIcon(payment.icon)}
      <Text style={styles.paymentName}>{payment.displayName}</Text>
      <MaterialIcons
        name="chevron-right"
        size={24}
        color={Colors.text.tertiary}
      />
    </TouchableOpacity>
  );

  const instantPayments = paymentOptions.filter(p => p.category === 'instant' || p.category === 'ewallet');
  const virtualAccounts = paymentOptions.filter(p => p.category === 'virtual_account');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pilih Metode Pembayaran</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Instant Payment Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionTitle}>Pembayaran Instan</Text>
          </View>
          
          <View style={styles.paymentList}>
            {instantPayments.map(renderPaymentOption)}
          </View>
        </View>

        {/* Virtual Account Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionTitle}>Virtual Account</Text>
          </View>
          
          <View style={styles.paymentList}>
            {virtualAccounts.map(renderPaymentOption)}
          </View>
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
  section: {
    backgroundColor: Colors.background.primary,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.base,
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
  paymentList: {
    paddingHorizontal: Spacing.base,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  paymentIconContainer: {
    width: 60,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    backgroundColor: Colors.background.secondary,
  },
  paymentIcon: {
    width: 50,
    height: 30,
  },
  paymentName: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
});