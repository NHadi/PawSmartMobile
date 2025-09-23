import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'QRIS' | 'EWALLET' | 'VIRTUAL_ACCOUNT';
  icon: any;
  iconType?: 'MaterialIcons' | 'Ionicons';
  iconColor?: string;
  logo?: any;
  channelCode?: string;
  bankCode?: string;
}

interface PaymentMethodModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (method: PaymentMethod) => void;
}

const paymentMethods = {
  instant: [
    {
      id: 'qris',
      name: 'QRIS',
      type: 'QRIS' as const,
      icon: require('../../../assets/icons/payments/qris.png'),
    },
  ],
  ewallet: [
    {
      id: 'ovo',
      name: 'OVO',
      type: 'EWALLET' as const,
      icon: require('../../../assets/icons/payments/ovo.png'),
      channelCode: 'ID_OVO',
    },
    {
      id: 'gopay',
      name: 'Gopay',
      type: 'EWALLET' as const,
      icon: require('../../../assets/icons/payments/gopay.png'),
      channelCode: 'ID_GOPAY',
    },
    {
      id: 'shopeepay',
      name: 'Shopee Pay',
      type: 'EWALLET' as const,
      icon: require('../../../assets/icons/payments/shopepay.png'),
      channelCode: 'ID_SHOPEEPAY',
    },
    {
      id: 'linkaja',
      name: 'Link Aja',
      type: 'EWALLET' as const,
      icon: require('../../../assets/icons/payments/linkaja.png'),
      channelCode: 'ID_LINKAJA',
    },
    {
      id: 'dana',
      name: 'Dana',
      type: 'EWALLET' as const,
      icon: require('../../../assets/icons/payments/dana.png'),
      channelCode: 'ID_DANA',
    },
  ],
  virtualAccount: [
    {
      id: 'bsi',
      name: 'BSI VA',
      type: 'VIRTUAL_ACCOUNT' as const,
      icon: require('../../../assets/icons/payments/bsi.png'),
      bankCode: 'BSI',
    },
    {
      id: 'bri',
      name: 'BRI VA',
      type: 'VIRTUAL_ACCOUNT' as const,
      icon: require('../../../assets/icons/payments/bri.png'),
      bankCode: 'BRI',
    },
    {
      id: 'bni',
      name: 'BNI VA',
      type: 'VIRTUAL_ACCOUNT' as const,
      icon: require('../../../assets/icons/payments/bni.png'),
      bankCode: 'BNI',
    },
    {
      id: 'mandiri',
      name: 'Mandiri VA',
      type: 'VIRTUAL_ACCOUNT' as const,
      icon: require('../../../assets/icons/payments/mandiri.png'),
      bankCode: 'MANDIRI',
    },
    {
      id: 'bca',
      name: 'BCA VA',
      type: 'VIRTUAL_ACCOUNT' as const,
      icon: require('../../../assets/icons/payments/bca.png'),
      bankCode: 'BCA',
    },
  ],
};

export default function PaymentMethodModal({
  visible,
  onClose,
  onSelect,
}: PaymentMethodModalProps) {
  const handleSelect = (method: PaymentMethod) => {
    onSelect(method);
    onClose();
  };

  const renderPaymentOption = (method: PaymentMethod) => (
    <TouchableOpacity
      key={method.id}
      style={styles.paymentOption}
      onPress={() => handleSelect(method)}
    >
      <View style={styles.paymentLogo}>
        <Image source={method.icon} style={styles.logoImage} resizeMode="contain" />
      </View>
      <Text style={styles.paymentName}>{method.name}</Text>
      <MaterialIcons name="chevron-right" size={24} color={Colors.text.tertiary} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Pilih Metode Pembayaran</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Instant Payment */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pembayaran Instan</Text>
              {paymentMethods.instant.map(renderPaymentOption)}
            </View>

            {/* E-Wallet */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pembayaran Instan</Text>
              {paymentMethods.ewallet.map(renderPaymentOption)}
            </View>

            {/* Virtual Account */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Virtual Account</Text>
              {paymentMethods.virtualAccount.map(renderPaymentOption)}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  section: {
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  paymentLogo: {
    width: 48,
    height: 48,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  iconText: {
    fontSize: 24,
  },
  paymentName: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
});