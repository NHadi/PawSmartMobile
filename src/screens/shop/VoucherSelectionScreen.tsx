import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { HomeStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<HomeStackParamList, 'VoucherSelection'>;
type RoutePropType = RouteProp<HomeStackParamList, 'VoucherSelection'>;

interface Voucher {
  id: string;
  type: 'free_shipping' | 'discount' | 'cashback';
  title: string;
  subtitle?: string;
  description: string;
  minPurchase: number;
  discount: number;
  maxDiscount?: number;
  expiryDate: string;
  quantity: number;
  termsUrl?: string;
}

const vouchers: Voucher[] = [
  // Free Shipping Vouchers
  {
    id: '1',
    type: 'free_shipping',
    title: 'Gratis Ongkir',
    description: 'Min. belanja Rp100.000',
    minPurchase: 100000,
    discount: 12000,
    expiryDate: '15.06.2025',
    quantity: 3,
    termsUrl: 'S&K',
  },
  // Discount Vouchers
  {
    id: '2',
    type: 'discount',
    title: 'Diskon 20% s.d. Rp30.000',
    description: 'Min. belanja Rp65.000',
    minPurchase: 65000,
    discount: 30000,
    maxDiscount: 30000,
    expiryDate: '15.06.2025',
    quantity: 1,
    termsUrl: 'S&K',
  },
  {
    id: '3',
    type: 'discount',
    title: 'Diskon 20% s.d. Rp30.000',
    description: 'Min. belanja Rp65.000',
    minPurchase: 65000,
    discount: 30000,
    maxDiscount: 30000,
    expiryDate: '15.06.2025',
    quantity: 1,
    termsUrl: 'S&K',
  },
];

export default function VoucherSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVouchers, setSelectedVouchers] = useState<string[]>(route.params?.selectedVouchers || []);
  const [showVoucherDetail, setShowVoucherDetail] = useState<Voucher | null>(null);
  const totalAmount = route.params?.totalAmount || 0;

  const toggleVoucher = (voucherId: string) => {
    setSelectedVouchers(prev => {
      if (prev.includes(voucherId)) {
        return prev.filter(id => id !== voucherId);
      }
      return [...prev, voucherId];
    });
  };

  const handleApplyVouchers = () => {
    // Get selected voucher objects
    const selectedVoucherObjects = vouchers.filter(v => selectedVouchers.includes(v.id));
    
    // Navigate back with selected vouchers and preserve payment method
    navigation.navigate('Checkout', {
      selectedVouchers: selectedVoucherObjects,
      selectedPayment: route.params?.selectedPayment, // Preserve payment selection
    } as any);
  };

  const getVoucherColor = (type: string) => {
    switch (type) {
      case 'free_shipping':
        return '#00BCD4';
      case 'discount':
        return '#FF6B35';
      case 'cashback':
        return '#4CAF50';
      default:
        return Colors.primary.main;
    }
  };

  const getVoucherIcon = (type: string) => {
    switch (type) {
      case 'free_shipping':
        return 'local-shipping';
      case 'discount':
        return 'local-offer';
      case 'cashback':
        return 'account-balance-wallet';
      default:
        return 'local-offer';
    }
  };

  const renderVoucher = (voucher: Voucher) => {
    const isSelected = selectedVouchers.includes(voucher.id);
    const voucherColor = getVoucherColor(voucher.type);
    const voucherIcon = getVoucherIcon(voucher.type);

    return (
      <TouchableOpacity
        key={voucher.id}
        style={styles.voucherCard}
        onPress={() => setShowVoucherDetail(voucher)}
      >
        <View style={styles.voucherLeft}>
          <View style={[styles.voucherLeftPattern, { backgroundColor: voucherColor }]}>
            <MaterialIcons name={voucherIcon} size={32} color={Colors.text.white} />
            <Text style={styles.voucherBrand}>
              {voucher.type === 'free_shipping' ? 'GRATIS\nONGKIR' : 'PET SHOP'}
            </Text>
          </View>
        </View>
        
        <View style={styles.voucherContent}>
          <View style={styles.voucherHeader}>
            <View style={styles.voucherInfo}>
              <Text style={styles.voucherTitle}>{voucher.title}</Text>
              <Text style={styles.voucherDescription}>{voucher.description}</Text>
              <Text style={styles.voucherExpiry}>
                Hingga {voucher.expiryDate} 
                {voucher.termsUrl && (
                  <Text style={styles.voucherTerms}> {voucher.termsUrl}</Text>
                )}
              </Text>
            </View>
            {voucher.quantity > 1 && (
              <Text style={styles.voucherQuantity}>x{voucher.quantity}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.voucherSelect}
          onPress={() => toggleVoucher(voucher.id)}
        >
          {isSelected ? (
            <MaterialIcons name="check-circle" size={24} color={Colors.primary.main} />
          ) : (
            <MaterialIcons name="add-circle-outline" size={24} color={Colors.primary.main} />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const freeShippingVouchers = vouchers.filter(v => v.type === 'free_shipping');
  const discountVouchers = vouchers.filter(v => v.type === 'discount');

  const getSelectedVouchersText = () => {
    if (selectedVouchers.length === 0) return '';
    
    const selectedItems = vouchers.filter(v => selectedVouchers.includes(v.id));
    const totalDiscount = selectedItems.reduce((sum, v) => sum + v.discount, 0);
    const hasFreeShipping = selectedItems.some(v => v.type === 'free_shipping');
    
    const parts = [];
    if (totalDiscount > 0) {
      parts.push(`Diskon -Rp${totalDiscount.toLocaleString('id-ID')}`);
    }
    if (hasFreeShipping) {
      parts.push('Gratis Ongkir');
    }
    
    return parts.join(', ');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={Colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari Voucher"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.text.tertiary}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Free Shipping Vouchers */}
        {freeShippingVouchers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>Voucher Gratis Ongkir</Text>
            </View>
            {freeShippingVouchers.map(renderVoucher)}
          </View>
        )}

        {/* Discount Vouchers */}
        {discountVouchers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>Voucher Diskon</Text>
            </View>
            {discountVouchers.map(renderVoucher)}
          </View>
        )}
      </ScrollView>

      {/* Bottom Summary */}
      <View style={styles.bottomContainer}>
        <View style={styles.bottomSummary}>
          <Text style={styles.selectedText}>
            Voucher dipilih ({selectedVouchers.length})
          </Text>
          {getSelectedVouchersText() !== '' && (
            <Text style={styles.discountText}>{getSelectedVouchersText()}</Text>
          )}
        </View>
        <TouchableOpacity 
          style={[
            styles.applyButton,
            selectedVouchers.length === 0 && styles.applyButtonDisabled
          ]}
          onPress={handleApplyVouchers}
          disabled={selectedVouchers.length === 0}
        >
          <Text style={styles.applyButtonText}>Pakai</Text>
        </TouchableOpacity>
      </View>

      {/* Voucher Detail Modal */}
      <Modal
        visible={showVoucherDetail !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVoucherDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowVoucherDetail(null)}>
                <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Syarat & Ketentuan</Text>
              <View style={{ width: 24 }} />
            </View>

            {showVoucherDetail && (
              <ScrollView style={styles.modalBody}>
                {/* Voucher Card */}
                <View style={[styles.voucherCard, styles.modalVoucherCard]}>
                  <View style={styles.voucherLeft}>
                    <View style={[
                      styles.voucherLeftPattern, 
                      { backgroundColor: getVoucherColor(showVoucherDetail.type) }
                    ]}>
                      <MaterialIcons 
                        name={getVoucherIcon(showVoucherDetail.type)} 
                        size={32} 
                        color={Colors.text.white} 
                      />
                      <Text style={styles.voucherBrand}>
                        {showVoucherDetail.type === 'free_shipping' ? 'GRATIS\nONGKIR' : 'PET SHOP'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.voucherContent}>
                    <Text style={styles.voucherTitle}>{showVoucherDetail.title}</Text>
                    <Text style={styles.voucherDescription}>{showVoucherDetail.description}</Text>
                    <Text style={styles.voucherExpiry}>Hingga {showVoucherDetail.expiryDate}</Text>
                  </View>
                </View>

                {/* Terms and Conditions */}
                <View style={styles.termsSection}>
                  <Text style={styles.termsSectionTitle}>Masa Berlaku</Text>
                  <Text style={styles.termsText}>
                    7 Jun 2025 00:00 - 15 Juni 2025 23:59
                  </Text>
                </View>

                <View style={styles.termsSection}>
                  <Text style={styles.termsSectionTitle}>Promosi</Text>
                  <Text style={styles.termsText}>
                    Diskon 20% s.d. Rp30.000 Min. belanja Rp65.000
                  </Text>
                </View>

                <View style={styles.termsSection}>
                  <Text style={styles.termsSectionTitle}>Produk</Text>
                  <Text style={styles.termsText}>• Berlaku untuk semua produk makanan hewan, tanpa terkecuali.</Text>
                  <Text style={styles.termsText}>• Berlaku untuk semua produk makanan hewan, tanpa terkecuali.</Text>
                  <Text style={styles.termsText}>• Berlaku untuk semua produk makanan hewan, tanpa terkecuali.</Text>
                  <Text style={styles.termsText}>• Berlaku untuk semua produk makanan hewan, tanpa terkecuali.</Text>
                </View>

                <View style={styles.termsSection}>
                  <Text style={styles.termsSectionTitle}>Metode Pembayaran</Text>
                  <Text style={styles.termsText}>• QRIS</Text>
                  <Text style={styles.termsText}>• DANA</Text>
                  <Text style={styles.termsText}>• Bank Transfer</Text>
                </View>

                <View style={styles.termsSection}>
                  <Text style={styles.termsSectionTitle}>Jasa Kirim</Text>
                  <Text style={styles.termsText}>• Instant</Text>
                  <Text style={styles.termsText}>• Same Day</Text>
                  <Text style={styles.termsText}>• JNE</Text>
                </View>
              </ScrollView>
            )}

            {/* Bottom Action */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.useVoucherButton}
                onPress={() => {
                  if (showVoucherDetail) {
                    toggleVoucher(showVoucherDetail.id);
                    setShowVoucherDetail(null);
                  }
                }}
              >
                <Text style={styles.useVoucherButtonText}>OK</Text>
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
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    marginLeft: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
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
  voucherCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
    elevation: 2,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  voucherLeft: {
    width: 100,
  },
  voucherLeftPattern: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    position: 'relative',
  },
  voucherBrand: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  voucherContent: {
    flex: 1,
    padding: Spacing.md,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  voucherInfo: {
    flex: 1,
  },
  voucherTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  voucherDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  voucherExpiry: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  voucherTerms: {
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  voucherQuantity: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.semibold,
    marginLeft: Spacing.sm,
  },
  voucherSelect: {
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  bottomContainer: {
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  bottomSummary: {
    marginBottom: Spacing.md,
  },
  selectedText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  discountText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.warning.main,
    fontFamily: Typography.fontFamily.medium,
  },
  applyButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: Colors.text.tertiary,
  },
  applyButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  modalVoucherCard: {
    marginHorizontal: 0,
    marginBottom: Spacing.lg,
  },
  termsSection: {
    marginBottom: Spacing.lg,
  },
  termsSectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  termsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  modalFooter: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  useVoucherButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  useVoucherButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
});