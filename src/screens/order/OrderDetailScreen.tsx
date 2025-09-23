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
import { RouteProp } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ProfileStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<ProfileStackParamList, 'OrderDetail'>;
type RouteProps = RouteProp<ProfileStackParamList, 'OrderDetail'>;

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: any;
  orderType?: 'autokirim' | 'sekali_beli';
  deliveryPeriod?: string;
  subscriptionDuration?: string;
}

interface TimelineItem {
  status: string;
  description: string;
  date: string;
  isCompleted: boolean;
}

interface OrderDetail {
  id: string;
  transactionId: string;
  items: OrderItem[];
  status: OrderStatus;
  statusText: string;
  date: string;
  time: string;
  timeline: TimelineItem[];
  shipping: {
    method: string;
    cost: number;
    address: string;
    recipientName: string;
    recipientPhone: string;
  };
  payment: {
    method: string;
    subtotal: number;
    shippingCost: number;
    discount: number;
    total: number;
  };
}

const mockOrderDetail: OrderDetail = {
  id: '1',
  transactionId: '123456644',
  status: 'delivered',
  statusText: 'Selesai',
  date: '2 Mei 2025',
  time: '20:00',
  items: [
    {
      id: '1',
      name: 'Royal Canin Persian Adult',
      quantity: 2,
      price: 241250,
      image: require('../../../assets/product-placeholder.jpg'),
      orderType: 'autokirim',
      deliveryPeriod: '2 minggu',
      subscriptionDuration: '14 Desember 2025',
    },
    {
      id: '2',
      name: 'Royal Canin Persian Adult',
      quantity: 1,
      price: 241250,
      image: require('../../../assets/product-placeholder.jpg'),
      orderType: 'autokirim',
    },
    {
      id: '3',
      name: 'Royal Canin Persian Adult',
      quantity: 1,
      price: 241250,
      image: require('../../../assets/product-placeholder.jpg'),
      orderType: 'sekali_beli',
    },
  ],
  timeline: [
    {
      status: 'Pesanan dibuat',
      description: '',
      date: '2 Mei 2025, 14:00',
      isCompleted: true,
    },
    {
      status: 'Pesanan telah diserahkan ke jasa pengiriman',
      description: '',
      date: '2 Mei 2025, 16:00',
      isCompleted: true,
    },
    {
      status: 'Pesanan dalam proses pengantaran',
      description: '',
      date: '2 Mei 2025, 16:00',
      isCompleted: true,
    },
    {
      status: 'Pesanan telah tiba di alamat tujuan',
      description: 'Lihat bukti pengiriman',
      date: '2 Mei 2025, 20:00',
      isCompleted: true,
    },
  ],
  shipping: {
    method: 'Regular',
    cost: 0,
    address: 'Jl. Sudirman No. 123, Jakarta Selatan, DKI Jakarta 12345',
    recipientName: 'John Doe',
    recipientPhone: '+62 812 3456 7890',
  },
  payment: {
    method: 'Mart',
    subtotal: 482500,
    shippingCost: 0,
    discount: 0,
    total: 482500,
  },
};

export default function OrderDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { orderId } = route.params;

  const [orderItems, setOrderItems] = useState(mockOrderDetail.items);

  // In a real app, you would fetch order details based on orderId
  const order = { ...mockOrderDetail, items: orderItems };

  const updateOrderType = (itemId: string, orderType: 'autokirim' | 'sekali_beli') => {
    setOrderItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, orderType } : item
      )
    );
  };

  const updateDeliveryPeriod = (itemId: string, period: string) => {
    setOrderItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, deliveryPeriod: period } : item
      )
    );
  };

  const updateSubscriptionDuration = (itemId: string, duration: string) => {
    setOrderItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, subscriptionDuration: duration } : item
      )
    );
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return Colors.warning.main;
      case 'processing':
        return Colors.primary.main;
      case 'shipped':
        return Colors.primary.main;
      case 'delivered':
        return Colors.success.main;
      case 'cancelled':
        return Colors.error.main;
      default:
        return Colors.text.secondary;
    }
  };

  const renderOrderItem = (item: OrderItem, index: number) => (
    <View key={item.id} style={styles.orderItemContainer}>
      <View style={styles.productHeader}>
        <Image source={item.image} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productQuantity}>x{item.quantity}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={Colors.text.tertiary} />
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
          <Image source={require('../../../assets/icons/order/auto_kirim.png')} style={styles.autoKirimIcon} />
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

      {/* AutoKirim Options */}
      {item.orderType === 'autokirim' && (
        <View style={styles.autoKirimOptions}>
          {/* Periode pengantaran */}
          <View style={styles.optionGroup}>
            <Text style={styles.optionLabel}>Periode pengantaran</Text>
            <TouchableOpacity style={styles.dropdownButton}>
              <Text style={styles.dropdownText}>{item.deliveryPeriod || '2 minggu'}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Lama berlangganan */}
          <View style={styles.optionGroup}>
            <Text style={styles.optionLabel}>Lama berlangganan</Text>
            <TouchableOpacity style={styles.dropdownButton}>
              <Text style={styles.dropdownText}>{item.subscriptionDuration || '14 Desember 2025'}</Text>
              <MaterialIcons name="calendar-today" size={16} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {index < order.items.length - 1 && <View style={styles.itemSeparator} />}
    </View>
  );

  const renderTimeline = () => (
    <View style={styles.timelineContainer}>
      {order.timeline.map((item, index) => (
        <View key={index} style={styles.timelineItem}>
          <View style={styles.timelineDot}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: item.isCompleted
                    ? Colors.primary.main
                    : Colors.border.light,
                },
              ]}
            />
            {index < order.timeline.length - 1 && (
              <View
                style={[
                  styles.timelineLine,
                  {
                    backgroundColor: item.isCompleted
                      ? Colors.primary.main
                      : Colors.border.light,
                  },
                ]}
              />
            )}
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineStatus}>{item.status}</Text>
            <Text style={styles.timelineDate}>{item.date}</Text>
            {item.description && (
              <TouchableOpacity style={styles.proofButton}>
                <Text style={styles.proofButtonText}>{item.description}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Pesanan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Detail Pelanggan Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionTitle}>Detail Pelanggan</Text>
            <MaterialIcons name="keyboard-arrow-up" size={20} color={Colors.text.secondary} />
          </View>
          <View style={styles.customerInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama</Text>
              <Text style={styles.infoValue}>Afzah Fariski</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>No. Handphone</Text>
              <Text style={styles.infoValue}>+62 81234567890</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Alamat</Text>
              <TouchableOpacity>
                <Text style={[styles.infoValue, { color: Colors.primary.main }]}>Ganti</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.addressText}>
              Pilih alamat untuk mulai belanja
            </Text>
          </View>
        </View>

        {/* Mart Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionTitle}>Mart Items</Text>
            <MaterialIcons name="keyboard-arrow-up" size={20} color={Colors.text.secondary} />
          </View>

          {order.items.map((item, index) => renderOrderItem(item, index))}

          {/* Additional Info */}
          <View style={styles.additionalInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Periode pengantaran</Text>
              <TouchableOpacity style={styles.dropdownButton}>
                <Text style={styles.dropdownText}>2 minggu</Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lama berlangganan</Text>
              <TouchableOpacity style={styles.calendarButton}>
                <Text style={styles.dropdownText}>14 Desember 2025</Text>
                <MaterialIcons name="calendar-today" size={16} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Jumlah SKU Produk</Text>
              <Text style={styles.infoValue}>{order.items.length}</Text>
            </View>

            {/* Insurance Option */}
            <View style={styles.insuranceContainer}>
              <View style={styles.insuranceHeader}>
                <View style={styles.checkboxContainer}>
                  <View style={styles.checkbox} />
                </View>
                <Text style={styles.insuranceText}>Asuransi Pemesanan</Text>
                <Text style={styles.insurancePrice}>Rp2.500</Text>
              </View>
              <Text style={styles.insuranceDescription}>
                Melindungi produk pengiriman dari kerusakan.{' '}
                <Text style={styles.linkText}>Pelajari</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Timeline Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionTitle}>Status</Text>
          </View>
          <View style={styles.currentStatus}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.statusText}
            </Text>
            <Text style={styles.statusDescription}>
              Paket telah diterima oleh penerima
            </Text>
            <Text style={styles.statusDate}>{order.date}, {order.time}</Text>
          </View>
          {renderTimeline()}
        </View>

        {/* Shipping Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionTitle}>Info Pengiriman</Text>
          </View>
          <View style={styles.shippingInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kurir</Text>
              <Text style={styles.infoValue}>{order.shipping.method}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Alamat</Text>
              <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]}>
                {order.shipping.address}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Penerima</Text>
              <Text style={styles.infoValue}>{order.shipping.recipientName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>No. Telepon</Text>
              <Text style={styles.infoValue}>{order.shipping.recipientPhone}</Text>
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
          </View>
          <View style={styles.paymentInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>No. Transaksi</Text>
              <View style={styles.transactionIdContainer}>
                <MaterialIcons name="content-copy" size={14} color={Colors.primary.main} />
                <Text style={styles.transactionId}> {order.transactionId}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Jenis Transaksi</Text>
              <Text style={styles.infoValue}>{order.payment.method}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Waktu</Text>
              <Text style={styles.infoValue}>{order.date}, {order.time}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Subtotal Produk</Text>
              <Text style={styles.infoValue}>Rp{order.payment.subtotal.toLocaleString('id-ID')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Subtotal Pengiriman</Text>
              <Text style={styles.infoValue}>
                {order.payment.shippingCost === 0 ? 'Gratis' : `Rp${order.payment.shippingCost.toLocaleString('id-ID')}`}
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.totalLabel}>Rincian Harga</Text>
              <Text style={styles.totalValue}>Rp{order.payment.total.toLocaleString('id-ID')}</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        {order.status === 'delivered' && (
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.backButton}>
              <Text style={styles.backButtonText}>Kembali</Text>
            </TouchableOpacity>
          </View>
        )}
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
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.background.primary,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  productQuantity: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  transactionInfo: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  infoValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  transactionIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionId: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  currentStatus: {
    marginBottom: Spacing.lg,
  },
  statusText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    marginBottom: Spacing.xs,
  },
  statusDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  statusDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  timelineContainer: {
    paddingLeft: Spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: Spacing.base,
  },
  timelineDot: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: Spacing.xs,
  },
  timelineContent: {
    flex: 1,
    paddingTop: -2,
  },
  timelineStatus: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing.xs,
  },
  timelineDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  proofButton: {
    alignSelf: 'flex-start',
  },
  proofButtonText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary.main,
    textDecorationLine: 'underline',
  },
  shippingInfo: {
    gap: Spacing.sm,
  },
  paymentInfo: {
    gap: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.semibold,
  },
  totalValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  actionSection: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  backButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.white,
    fontFamily: Typography.fontFamily.semibold,
  },
  // New styles for auto kirim functionality
  orderItemContainer: {
    marginBottom: Spacing.base,
  },
  orderTypeContainer: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
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
    width: 16,
    height: 16,
  },
  radioText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  autoKirimOptions: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  optionGroup: {
    marginBottom: Spacing.sm,
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
  itemSeparator: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.md,
  },
  customerInfo: {
    gap: Spacing.sm,
  },
  addressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  additionalInfo: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  insuranceContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.sm,
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
  insuranceText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  insurancePrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.semibold,
  },
  insuranceDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  linkText: {
    color: Colors.primary.main,
    textDecorationLine: 'underline',
  },
});