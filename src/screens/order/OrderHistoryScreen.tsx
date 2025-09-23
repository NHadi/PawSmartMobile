import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ProfileStackParamList, HomeStackParamList } from '../../navigation/types';
import orderService, { Order as OdooOrder, OrderStatus as OdooOrderStatus } from '../../services/order/orderService';
import { useAuth } from '../../contexts/AuthContext';

type NavigationProp = StackNavigationProp<ProfileStackParamList, 'OrderHistory'> | StackNavigationProp<HomeStackParamList, 'MyOrders'>;
type OrderHistoryRouteProp = RouteProp<HomeStackParamList, 'MyOrders'>;

type OrderStatus = OdooOrderStatus;

// No more mock data - we'll use real Odoo data

export default function OrderHistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OrderHistoryRouteProp>();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [orders, setOrders] = useState<OdooOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(route.params?.orderId);

  // Load orders from Odoo
  const loadOrders = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Get orders from Odoo
      const filter: any = {};
      if (user?.partner_id) {
        filter.partner_id = user.partner_id;
      }

      // Filter based on selected tab
      if (selectedTab === 'completed') {
        filter.state = 'done';
      } else if (selectedTab === 'cancelled') {
        filter.state = 'cancel';
      }

      const odooOrders = await orderService.getOrders(filter);
      setOrders(odooOrders);

      // If we have a selected order ID from navigation, scroll to it
      if (selectedOrderId && odooOrders.length > 0) {
        const orderIndex = odooOrders.findIndex(o => o.id.toString() === selectedOrderId);
        if (orderIndex >= 0) {
          // Scroll to the order
          setTimeout(() => {
            // You could implement scrolling to specific order here
          }, 500);
        }
      }
    } catch (error) {
      } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load orders when screen focuses or tab changes
  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [selectedTab, user?.partner_id])
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString('id-ID', options);
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'draft':
      case 'pending':
      case 'waiting_payment':
        return Colors.warning.main;
      case 'sent':
      case 'processing':
      case 'admin_review':
      case 'inspecting':
        return Colors.primary.main;
      case 'sale':
      case 'shipped':
      case 'payment_confirmed':
        return Colors.primary.main;
      case 'done':
      case 'delivered':
      case 'approved':
        return Colors.success.main;
      case 'cancel':
      case 'cancelled':
      case 'return_approved':
        return Colors.error.main;
      default:
        return Colors.text.secondary;
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'draft':
      case 'pending':
      case 'waiting_payment':
        return 'access-time';
      case 'sent':
      case 'processing':
      case 'inspecting':
        return 'inventory';
      case 'admin_review':
        return 'rate-review';
      case 'sale':
      case 'shipped':
      case 'payment_confirmed':
        return 'local-shipping';
      case 'done':
      case 'delivered':
      case 'approved':
        return 'check-circle';
      case 'cancel':
      case 'cancelled':
      case 'return_approved':
        return 'cancel';
      default:
        return 'info';
    }
  };

  const getStatusText = (status: OrderStatus): string => {
    const statusTexts: { [key: string]: string } = {
      'draft': 'Draft',
      'pending': 'Menunggu',
      'waiting_payment': 'Menunggu Pembayaran',
      'payment_confirmed': 'Pembayaran Dikonfirmasi',
      'admin_review': 'Sedang ditinjau oleh admin',
      'sent': 'Penawaran Terkirim',
      'processing': 'Diproses',
      'inspecting': 'Menunggu Pemeriksaan Barang',
      'sale': 'Pesanan Dikonfirmasi',
      'shipped': 'Dikirim',
      'done': 'Selesai',
      'delivered': 'Diterima',
      'approved': 'Disetujui',
      'cancel': 'Dibatalkan',
      'cancelled': 'Dibatalkan',
      'return_approved': 'Pengembalian disetujui',
    };
    return statusTexts[status] || status;
  };

  const filteredOrders = orders.filter(order => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'completed') return order.state === 'done' || order.state === 'delivered';
    if (selectedTab === 'cancelled') return order.state === 'cancel' || order.state === 'cancelled';
    return true;
  });

  const renderOrder = ({ item }: { item: OdooOrder }) => {
    // Get first item for display
    const firstItem = item.items?.[0] || item.order_line?.[0];
    const itemImage = firstItem?.image || require('../../../assets/product-placeholder.jpg');
    const itemName = firstItem?.name || firstItem?.product_name || 'Product';
    const itemQuantity = firstItem?.quantity || firstItem?.product_uom_qty || 1;
    
    return (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail' as any, { orderId: item.id.toString() })}
    >
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <View style={styles.productSection}>
            <Image source={itemImage} style={styles.productImage} resizeMode="cover" />
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{itemName}</Text>
              <Text style={styles.productQuantity}>x{itemQuantity}</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={Colors.text.tertiary} />
        </View>

        {/* Transaction Info */}
        <View style={styles.transactionInfo}>
          <View style={styles.transactionRow}>
            <Text style={styles.transactionLabel}>No. Transaksi</Text>
            <View style={styles.transactionIdContainer}>
              <MaterialIcons name="content-copy" size={14} color={Colors.primary.main} />
              <Text style={styles.transactionId}> {item.name || item.transactionId || `#${item.id}`}</Text>
            </View>
          </View>
          <View style={styles.transactionRow}>
            <Text style={styles.transactionLabel}>Jumlah SKU Produk</Text>
            <Text style={styles.transactionValue}>{item.totalItems || item.order_line?.length || 0}</Text>
          </View>
        </View>
      </View>

      {/* Order Status and Tracking */}
      <View style={styles.orderStatus}>
        <View style={styles.statusHeader}>
          <View style={styles.statusLine} />
          <Text style={styles.statusTitle}>Status</Text>
        </View>
        
        <View style={styles.statusContent}>
          <View style={styles.statusInfo}>
            <MaterialIcons 
              name={getStatusIcon(item.state)} 
              size={16} 
              color={getStatusColor(item.state)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(item.state) }]}>
              {' '}{getStatusText(item.state)}
            </Text>
          </View>
          <Text style={styles.statusDate}>{formatDate(item.date_order)}, {formatTime(item.date_order)}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {(item.state === 'done' || item.state === 'delivered') && (
            <>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Lihat bukti pengiriman</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Kembali</Text>
              </TouchableOpacity>
            </>
          )}
          {(item.state === 'sale' || item.state === 'processing' || item.state === 'shipped') && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => navigation.navigate('OrderTracking' as any, { orderId: item.id.toString() })}
            >
              <Text style={styles.primaryButtonText}>Lacak</Text>
            </TouchableOpacity>
          )}
          {(item.state === 'draft' || item.state === 'sent' || item.state === 'pending') && (
            <>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('OrderDetail' as any, { orderId: item.id.toString() })}
              >
                <Text style={styles.actionButtonText}>Lihat Detail</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => navigation.navigate('CancelOrder' as any, { orderId: item.id.toString() })}
              >
                <Text style={styles.cancelButtonText}>Cancel Order</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Order Total */}
      <View style={styles.orderFooter}>
        <Text style={styles.totalLabel}>Total Pembayaran</Text>
        <Text style={styles.totalAmount}>Rp{(item.amount_total || 0).toLocaleString('id-ID')}</Text>
      </View>
    </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../../../assets/mascot-sad.png')} 
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Belum ada riwayat pesanan</Text>
      <Text style={styles.emptySubtitle}>
        {selectedTab === 'completed' 
          ? 'Anda belum memiliki pesanan yang selesai' 
          : selectedTab === 'cancelled'
          ? 'Anda belum memiliki pesanan yang dibatalkan'
          : 'Mulai berbelanja sekarang untuk melihat riwayat pesanan'
        }
      </Text>
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => navigation.navigate('Home' as any)}
      >
        <Text style={styles.shopButtonText}>Mulai Belanja</Text>
      </TouchableOpacity>
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

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
            Semua
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'completed' && styles.tabActive]}
          onPress={() => setSelectedTab('completed')}
        >
          <Text style={[styles.tabText, selectedTab === 'completed' && styles.tabTextActive]}>
            Selesai
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'cancelled' && styles.tabActive]}
          onPress={() => setSelectedTab('cancelled')}
        >
          <Text style={[styles.tabText, selectedTab === 'cancelled' && styles.tabTextActive]}>
            Dibatalkan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Memuat pesanan...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ordersList}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadOrders(true)}
              colors={[Colors.primary.main]}
            />
          }
        />
      )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary.main,
  },
  tabText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
  },
  tabTextActive: {
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.semibold,
  },
  ordersList: {
    padding: Spacing.base,
  },
  orderCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  orderHeader: {
    padding: Spacing.base,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  productSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  productDetails: {
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
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  transactionLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
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
  transactionValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  orderStatus: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusLine: {
    width: 3,
    height: 20,
    backgroundColor: Colors.primary.main,
    marginRight: Spacing.sm,
  },
  statusTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  statusDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.white,
    fontFamily: Typography.fontFamily.medium,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.error.main,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error.main,
    fontFamily: Typography.fontFamily.medium,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  totalLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  totalAmount: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  shopButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl * 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  shopButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
});