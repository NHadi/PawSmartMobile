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
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { HomeStackParamList } from '../../navigation/types';

// const autoKirimIcon = require('../../../assets/icons/order/auto_kirim.png');

type NavigationProp = StackNavigationProp<HomeStackParamList, 'OrderSummary'>;

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  orderType: 'autokirim' | 'sekali_beli';
  deliveryPeriod?: string;
  subscriptionDuration?: string;
}

export default function OrderSummaryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const [expandedSections, setExpandedSections] = useState({
    customer: true,
    items: true,
    shipping: false,
    voucher: false,
    payment: false,
    summary: true,
  });

  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: '1',
      name: 'Royal Canin Persian Adult',
      quantity: 2,
      price: 241250,
      image: 'https://via.placeholder.com/60',
      orderType: 'autokirim',
      deliveryPeriod: '2 minggu',
      subscriptionDuration: '14 Desember 2025',
    },
    {
      id: '2',
      name: 'Royal Canin Persian Adult',
      quantity: 1,
      price: 241250,
      image: 'https://via.placeholder.com/60',
      orderType: 'autokirim',
    },
    {
      id: '3',
      name: 'Royal Canin Persian Adult',
      quantity: 1,
      price: 241250,
      image: 'https://via.placeholder.com/60',
      orderType: 'sekali_beli',
    },
  ]);

  const [globalDeliveryPeriod, setGlobalDeliveryPeriod] = useState('2 minggu');
  const [globalSubscriptionDuration, setGlobalSubscriptionDuration] = useState('14 Desember 2025');

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateOrderType = (itemId: string, orderType: 'autokirim' | 'sekali_beli') => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, orderType } : item
      )
    );
  };

  const formatCurrency = (amount: number) => {
    return `Rp${amount.toLocaleString('id-ID')}`;
  };

  const renderCartItem = (item: CartItem, index: number) => (
    <View key={item.id} style={styles.cartItemContainer}>
      <View style={styles.productItem}>
        <Image source={{ uri: item.image }} style={styles.productImage} />
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productQuantity}>x{item.quantity}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {/* Order Type Selection */}
      <View style={styles.orderTypeContainer}>
        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => updateOrderType(item.id, 'autokirim')}
        >
          <View style={styles.radioButton}>
            {item.orderType === 'autokirim' && <View style={styles.radioButtonSelected} />}
          </View>
          <View style={styles.iconContainer}>
            <MaterialIcons name="inventory" size={14} color={Colors.primary.main} />
            <MaterialIcons name="autorenew" size={10} color={Colors.success.main} style={styles.overlayIcon} />
          </View>
          <Text style={styles.radioText}>AutoKirim</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => updateOrderType(item.id, 'sekali_beli')}
        >
          <View style={styles.radioButton}>
            {item.orderType === 'sekali_beli' && <View style={styles.radioButtonSelected} />}
          </View>
          <Text style={styles.radioText}>Sekali beli</Text>
        </TouchableOpacity>
      </View>

      {index < cartItems.length - 1 && <View style={styles.itemSeparator} />}
    </View>
  );

  const handleBayar = () => {
    // Navigate to payment process
    navigation.navigate('PaymentMethodSelection', {
      orderId: 'ORD-001',
      orderName: 'Mart Order',
      totalAmount: 482500,
      customerInfo: {
        name: 'Wahyu Muhtiyantoro',
        phone: '+62 81234567890',
        email: 'wahyu@example.com',
        items: [
          {
            name: 'Royal Canin Persian Adult',
            quantity: 2,
            price: 240000,
          }
        ]
      }
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rincian Pemesanan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Customer Details Section */}
        <TouchableOpacity 
          style={styles.section}
          onPress={() => toggleSection('customer')}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Detail Pelanggan</Text>
            <Ionicons 
              name={expandedSections.customer ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={Colors.text.tertiary} 
            />
          </View>
        </TouchableOpacity>
        
        {expandedSections.customer && (
          <View style={styles.sectionContent}>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Nama</Text>
              <Text style={styles.value}>Wahyu Muhtiyantoro</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>No. Handphone</Text>
              <Text style={styles.value}>+62 81234567890</Text>
            </View>
            <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
              <Text style={styles.label}>Alamat</Text>
              <View style={styles.addressContainer}>
                <Text style={styles.addressText}>
                  Jl. Tebet timur dalam XI no 48{'\n'}
                  Kel. Tebet Timur Kec. Tebet Jakarta Selatan -{'\n'}
                  Jakarta 0000
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddressList', { isSelecting: true })}>
                  <Text style={styles.linkText}>Ganti</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Mart Items Section */}
        <TouchableOpacity 
          style={styles.section}
          onPress={() => toggleSection('items')}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mart Items</Text>
            <Ionicons 
              name={expandedSections.items ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={Colors.text.tertiary} 
            />
          </View>
        </TouchableOpacity>

        {expandedSections.items && (
          <View style={styles.sectionContent}>
            {cartItems.map((item, index) => renderCartItem(item, index))}

            {/* Grouped Options for AutoKirim items */}
            {cartItems.some(item => item.orderType === 'autokirim') && (
              <View style={styles.globalOptionsContainer}>
                <View style={styles.optionGroup}>
                  <Text style={styles.optionLabel}>Periode pengantaran</Text>
                  <TouchableOpacity style={styles.dropdownButton}>
                    <Text style={styles.dropdownText}>{globalDeliveryPeriod}</Text>
                    <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.text.secondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.optionGroup}>
                  <Text style={styles.optionLabel}>Lama berlangganan</Text>
                  <TouchableOpacity style={styles.calendarButton}>
                    <Text style={styles.dropdownText}>{globalSubscriptionDuration}</Text>
                    <MaterialIcons name="calendar-today" size={16} color={Colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.label}>Jumlah SKU Produk</Text>
              <Text style={styles.value}>{cartItems.length}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Asuransi Pemesanan</Text>
              <View style={styles.insuranceContainer}>
                <View style={styles.insuranceHeader}>
                  <View style={styles.checkboxContainer}>
                    <View style={styles.checkbox} />
                  </View>
                  <Text style={styles.value}>Rp2.500</Text>
                </View>
                <Text style={styles.insuranceNote}>
                  Melindungi produk pengiriman dari kerusakan.{' '}
                  <Text style={styles.linkText}>Pelajari</Text>
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Shipping Options Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Opsi Pengiriman</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ShippingOptions')}>
              <Text style={styles.linkText}>Ganti</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.shippingInfo}>
            <Text style={styles.shippingTitle}>Regular</Text>
            <Text style={styles.shippingSubtitle}>JNE Regular</Text>
            <Text style={styles.shippingPrice}>Rp12.000</Text>
          </View>
        </View>

        {/* Voucher Section */}
        <TouchableOpacity 
          style={styles.section}
          onPress={() => navigation.navigate('VoucherSelection')}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Voucher</Text>
            <View style={styles.voucherRight}>
              <MaterialIcons name="local-offer" size={16} color={Colors.error.main} />
              <Text style={styles.voucherText}>Pilih Voucher</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
          </View>
          <TouchableOpacity 
            style={styles.paymentMethod}
            onPress={() => navigation.navigate('PaymentMethod')}
          >
            <View style={styles.paymentLeft}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/40' }}
                style={styles.paymentLogo}
              />
              <Text style={styles.paymentText}>Virtual Account Mandiri</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('PaymentMethod')}>
              <Text style={styles.linkText}>Ganti</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Payment Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Harga Produk</Text>
              <Text style={styles.summaryValue}>{formatCurrency(480000)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Asuransi Pengiriman</Text>
              <Text style={styles.summaryValue}>-</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total ongkos kirim</Text>
              <Text style={styles.summaryValue}>{formatCurrency(12000)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Diskon Produk</Text>
              <Text style={[styles.summaryValue, styles.discountText]}>-{formatCurrency(2500)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Diskon Voucher</Text>
              <Text style={[styles.summaryValue, styles.discountText]}>-{formatCurrency(2500)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Diskon Ongkos Kirim</Text>
              <Text style={[styles.summaryValue, styles.discountText]}>-{formatCurrency(2500)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Biaya Admin</Text>
              <Text style={styles.summaryValue}>{formatCurrency(2500)}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(482500)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomTotal}>
          <Text style={styles.bottomTotalValue}>{formatCurrency(482500)}</Text>
        </View>
        <TouchableOpacity style={styles.payButton} onPress={handleBayar}>
          <Text style={styles.payButtonText}>Bayar</Text>
        </TouchableOpacity>
      </View>
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
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    backgroundColor: Colors.background.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  sectionContent: {
    marginTop: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  value: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    flex: 2,
    textAlign: 'right',
  },
  addressContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  addressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    textAlign: 'right',
    marginBottom: Spacing.xs,
  },
  linkText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background.secondary,
  },
  productDetails: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  productName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  productOptions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  optionBadge: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  optionText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  selectedOption: {
    backgroundColor: Colors.primary.light,
  },
  selectedOptionText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary.main,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  quantityText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  insuranceContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  insuranceNote: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  shippingInfo: {
    marginTop: Spacing.sm,
  },
  shippingTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  shippingSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  shippingPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  voucherRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  voucherText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  paymentMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  paymentLogo: {
    width: 40,
    height: 24,
    resizeMode: 'contain',
  },
  paymentText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  summaryContent: {
    marginTop: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  discountText: {
    color: Colors.error.main,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.md,
  },
  totalLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomTotal: {
    flex: 1,
  },
  bottomTotalValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  payButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl * 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  payButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  // New styles for AutoKirim functionality
  cartItemContainer: {
    marginBottom: Spacing.lg,
  },
  productQuantity: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  orderTypeContainer: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary.main,
  },
  autoKirimIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconText: {
    fontSize: 16,
  },
  overlayIcon: {
    position: 'absolute',
    top: 8,
    right: -2,
  },
  radioText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.md,
  },
  globalOptionsContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  optionGroup: {
    marginBottom: Spacing.md,
  },
  optionLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  dropdownText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  insuranceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  checkboxContainer: {
    marginRight: Spacing.sm,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    backgroundColor: Colors.background.primary,
  },
});