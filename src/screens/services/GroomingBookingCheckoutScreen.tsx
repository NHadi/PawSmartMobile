import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import standaloneAddressService from '../../services/address/standaloneAddressService';
import PaymentMethodModal from '../../components/modals/PaymentMethodModal';
import { Address } from '../shop/AddressListScreen';

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'GroomingBookingCheckout'>;

const THEME = {
  primary: Colors.primary.main,
  background: Colors.background.primary,
  backgroundSecondary: Colors.background.secondary,
  textPrimary: Colors.text.primary,
  textSecondary: Colors.text.secondary,
  textTertiary: Colors.text.tertiary,
  border: Colors.border.light,
  white: '#FFFFFF',
};

export default function GroomingBookingCheckoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { user } = useAuth();

  const [isCustomerExpanded, setIsCustomerExpanded] = useState(true);
  const [isSalonExpanded, setIsSalonExpanded] = useState(true);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Get route params
  const params = route.params as {
    groomingId: string;
    salonName: string;
    date: string;
    timeSlot: string;
    petId?: string;
    serviceType: 'walkIn' | 'homeService';
  };

  const bookingData = {
    salonName: params?.salonName || 'Pets Corner',
    salonImage: require('../../../assets/product-placeholder.jpg'),
    date: params?.date || 'Sabtu, 10 May',
    timeSlot: params?.timeSlot || '11.00',
    serviceType: params?.serviceType || 'walkIn',
  };

  const pricing = {
    salonFee: 90000,
    insurance: 2500,
    voucherDiscount: 0,
    appFee: 2500,
  };

  // Load default address
  useEffect(() => {
    const loadAddress = async () => {
      try {
        const addresses = await standaloneAddressService.getAddresses();
        if (addresses.length > 0) {
          const defaultAddr = addresses.find(addr => addr.is_default) || addresses[0];
          const convertedAddress: Address = {
            id: defaultAddr.id.toString(),
            label: defaultAddr.label || 'Rumah',
            name: defaultAddr.recipient_name,
            phone: defaultAddr.phone || '',
            fullAddress: defaultAddr.address_line1,
            detail: defaultAddr.address_line2 || '',
            postalCode: defaultAddr.postal_code,
            isDefault: defaultAddr.is_default,
            latitude: defaultAddr.latitude,
            longitude: defaultAddr.longitude,
            province: defaultAddr.state,
            city: defaultAddr.city,
            district: defaultAddr.district,
            subDistrict: defaultAddr.subdistrict,
          };
          setSelectedAddress(convertedAddress);
        }
      } catch (error) {
        console.error('Failed to load addresses:', error);
      }
    };
    loadAddress();
  }, []);

  const calculateTotal = () => {
    const total = pricing.salonFee +
                  (hasInsurance ? pricing.insurance : 0) +
                  pricing.appFee -
                  pricing.voucherDiscount;
    return total;
  };

  const handleSelectAddress = () => {
    (navigation as any).navigate('Home', {
      screen: 'AddressList',
      params: {
        isSelecting: true,
        returnTo: 'GroomingBookingCheckout',
      }
    });
  };

  const handleSelectPayment = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelected = (method: any) => {
    setSelectedPayment(method);
  };

  const handlePayment = () => {
    // Navigate to payment flow
  };

  const renderSection = (
    title: string,
    children: React.ReactNode,
    isExpanded?: boolean,
    onToggle?: () => void,
    showExpandIcon: boolean = false
  ) => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={onToggle}
        activeOpacity={showExpandIcon ? 0.7 : 1}
        disabled={!showExpandIcon}
      >
        <View style={styles.sectionTitleContainer}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {showExpandIcon && (
          <MaterialIcons
            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={24}
            color={THEME.textSecondary}
          />
        )}
      </TouchableOpacity>
      {(!showExpandIcon || isExpanded) && children}
    </View>
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.white} />
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="chevron-left" size={28} color={THEME.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rincian Pemesanan</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Customer Details */}
          {renderSection(
            'Detail Pelanggan',
            <View style={styles.sectionContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nama</Text>
                <Text style={styles.detailValue}>
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.name || user?.firstName || 'Nama Pelanggan'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>No. Handphone</Text>
                <Text style={styles.detailValue}>
                  {selectedAddress?.phone || user?.phone || '-'}
                </Text>
              </View>

              {/* Address Section */}
              <View style={styles.addressSection}>
                <View style={styles.addressSectionHeader}>
                  <Text style={styles.detailLabel}>Alamat</Text>
                  <TouchableOpacity onPress={handleSelectAddress}>
                    <Text style={styles.changeButton}>Ganti {'>'}</Text>
                  </TouchableOpacity>
                </View>
                {selectedAddress ? (
                  <View>
                    <Text style={styles.detailValue}>
                      {selectedAddress.fullAddress}
                    </Text>
                    {selectedAddress.detail && selectedAddress.detail.trim() !== '' && (
                      <Text style={styles.detailValue}>
                        {selectedAddress.detail}
                      </Text>
                    )}
                    <Text style={styles.detailValue}>
                      {selectedAddress.city && (
                        <>
                          {selectedAddress.district && `${selectedAddress.district}, `}{selectedAddress.city}
                        </>
                      )}
                      {selectedAddress.postalCode && ` ${selectedAddress.postalCode}`}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addAddressButton}
                    onPress={handleSelectAddress}
                  >
                    <MaterialIcons name="add-location" size={20} color={THEME.primary} />
                    <Text style={styles.addAddressText}>Tambah Alamat</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>,
            isCustomerExpanded,
            () => setIsCustomerExpanded(!isCustomerExpanded),
            true
          )}

          {/* Salon - Walk in / Home Service */}
          {renderSection(
            `Salon - ${bookingData.serviceType === 'walkIn' ? 'Walk in' : 'Home Service'}`,
            <View style={styles.sectionContent}>
              {/* Salon Info Card */}
              <View style={styles.salonCard}>
                <Image
                  source={bookingData.salonImage}
                  style={styles.salonImage}
                />
                <Text style={styles.salonCardName}>{bookingData.salonName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Salon</Text>
                <Text style={styles.detailValue}>{bookingData.salonName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tanggal</Text>
                <Text style={styles.detailValue}>{bookingData.date}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Waktu</Text>
                <Text style={styles.detailValue}>{bookingData.timeSlot}</Text>
              </View>
            </View>,
            isSalonExpanded,
            () => setIsSalonExpanded(!isSalonExpanded),
            true
          )}

          {/* Insurance */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.insuranceRow}
              onPress={() => setHasInsurance(!hasInsurance)}
            >
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionLine} />
                <Text style={styles.sectionTitle}>Asuransi Pemesanan</Text>
              </View>
              <View style={styles.insuranceRight}>
                <Text style={styles.insurancePrice}>Rp 2.500</Text>
                <MaterialIcons
                  name={hasInsurance ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={hasInsurance ? THEME.primary : THEME.textSecondary}
                />
              </View>
            </TouchableOpacity>
            <View style={styles.insuranceNote}>
              <Text style={styles.insuranceNoteText}>
                Melindungi hewan mu selama perjalanan dari kecelakaan.{' '}
                <Text style={styles.learnMore}>Pelajari</Text>
              </Text>
            </View>
          </View>

          {/* Payment Method */}
          {renderSection(
            'Metode Pembayaran',
            <View style={styles.paymentContent}>
              <TouchableOpacity
                style={styles.paymentMethodContainer}
                onPress={handleSelectPayment}
              >
                {selectedPayment ? (
                  <View style={styles.paymentMethodSelected}>
                    <View style={styles.paymentMethodIcon}>
                      <Image
                        source={selectedPayment.icon}
                        style={styles.paymentLogo}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentName}>{selectedPayment.name}</Text>
                      {selectedPayment.accountNumber && (
                        <Text style={styles.paymentAccount}>{selectedPayment.accountNumber}</Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={handleSelectPayment}>
                      <Text style={styles.changeButton}>Ganti {'>'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.paymentMethodEmpty}>
                    <MaterialIcons name="account-balance-wallet" size={24} color={THEME.primary} />
                    <Text style={styles.paymentEmptyText}>Pilih Metode Pembayaran</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Voucher */}
          {renderSection(
            'Voucher',
            <TouchableOpacity style={styles.voucherContent}>
              <View style={styles.voucherLeft}>
                <MaterialIcons name="local-offer" size={20} color={Colors.error.main} />
                <Text style={styles.voucherText}>Pilih Voucher</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={THEME.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Payment Summary */}
          {renderSection(
            'Rincian Pembayaran',
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Biaya Salon</Text>
                <Text style={styles.summaryValue}>
                  Rp {pricing.salonFee.toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Asuransi Pemesanan</Text>
                <Text style={styles.summaryValue}>
                  {hasInsurance ? `Rp ${pricing.insurance.toLocaleString('id-ID')}` : '-'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Diskon Voucher</Text>
                <Text style={styles.summaryValue}>-</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Biaya Aplikasi</Text>
                <Text style={styles.summaryValue}>
                  Rp {pricing.appFee.toLocaleString('id-ID')}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  Rp {calculateTotal().toLocaleString('id-ID')}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Payment Bar */}
        <View style={styles.bottomContainer}>
          <Text style={styles.bottomPrice}>
            Rp {calculateTotal().toLocaleString('id-ID')}
          </Text>
          <TouchableOpacity
            style={[
              styles.payButton,
              !selectedPayment && styles.payButtonDisabled
            ]}
            onPress={handlePayment}
            disabled={!selectedPayment}
          >
            <Text style={styles.payButtonText}>Bayar</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method Modal */}
        <PaymentMethodModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSelect={handlePaymentMethodSelected}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: THEME.white,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    backgroundColor: THEME.white,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionLine: {
    width: 3,
    height: 20,
    backgroundColor: THEME.primary,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
  },
  sectionContent: {
    paddingHorizontal: Spacing.base,
  },
  detailRow: {
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textTertiary,
    marginBottom: Spacing.xs,
  },
  detailValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textPrimary,
    lineHeight: 22,
  },
  addressSection: {
    marginTop: Spacing.sm,
  },
  addressSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  changeButton: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.primary,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary.light + '10',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.primary,
    borderStyle: 'dashed',
    marginTop: Spacing.xs,
  },
  addAddressText: {
    color: THEME.primary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    marginLeft: Spacing.sm,
  },
  salonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  salonImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  salonCardName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
  },
  insuranceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  insuranceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  insurancePrice: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.textPrimary,
  },
  insuranceNote: {
    paddingHorizontal: Spacing.base,
    paddingLeft: Spacing.base + 11,
    marginTop: Spacing.xs,
  },
  insuranceNoteText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    lineHeight: 18,
  },
  learnMore: {
    color: THEME.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  paymentContent: {
    paddingHorizontal: Spacing.base,
  },
  paymentMethodContainer: {
    width: '100%',
  },
  paymentMethodSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: THEME.primary,
  },
  paymentMethodEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary.light + '10',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: THEME.primary,
    borderStyle: 'dashed',
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.white,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  paymentLogo: {
    width: 32,
    height: 32,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: Typography.fontSize.base,
    color: THEME.textPrimary,
    fontFamily: Typography.fontFamily.semibold,
  },
  paymentAccount: {
    fontSize: Typography.fontSize.sm,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  paymentEmptyText: {
    fontSize: Typography.fontSize.base,
    color: THEME.primary,
    fontFamily: Typography.fontFamily.medium,
    marginLeft: Spacing.sm,
  },
  voucherContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  voucherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voucherText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textPrimary,
    marginLeft: Spacing.sm,
  },
  summaryContent: {
    paddingHorizontal: Spacing.base,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
  summaryValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.primary,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.white,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  bottomPrice: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.textPrimary,
  },
  payButton: {
    backgroundColor: THEME.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl * 1.5,
    paddingVertical: Spacing.md,
  },
  payButtonDisabled: {
    backgroundColor: THEME.border,
    opacity: 0.8,
  },
  payButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.white,
  },
});
