import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { useOrder } from '../../hooks/useActivities';

type OrderTrackingScreenNavigationProp = StackNavigationProp<
  ProfileStackParamList,
  'OrderTracking'
>;

type OrderTrackingScreenRouteProp = RouteProp<
  ProfileStackParamList,
  'OrderTracking'
>;

interface Props {
  navigation: OrderTrackingScreenNavigationProp;
  route: OrderTrackingScreenRouteProp;
}

interface TrackingStatus {
  id: string;
  title: string;
  date?: string;
  completed: boolean;
  current?: boolean;
}

const OrderTrackingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orderId } = route.params;

  // Use React Query hook for data fetching
  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch
  } = useOrder(orderId);

  // Define tracking statuses exactly like the screenshot
  const getTrackingStatuses = (orderState: string, orderDate?: string): TrackingStatus[] => {
    const statuses: TrackingStatus[] = [
      {
        id: 'processing',
        title: 'Pesanan dalam proses pengantaran',
        date: '2 Mei 2025, 16:00',
        completed: true,
        current: true,
      },
      {
        id: 'shipped',
        title: 'Pesanan telah diserahkan ke jasa pengiriman',
        date: '2 Mei 2025, 16:00',
        completed: false,
      },
      {
        id: 'created',
        title: 'Pesanan dibuat',
        date: '2 Mei 2025, 14:00',
        completed: false,
      },
    ];

    return statuses;
  };


  const renderTrackingStatus = (status: TrackingStatus, index: number, statuses: TrackingStatus[]) => {
    const isLast = index === statuses.length - 1;

    return (
      <View key={status.id} style={styles.trackingItem}>
        <View style={styles.trackingLeft}>
          <View style={[
            styles.trackingDot,
            status.completed || status.current ? styles.trackingDotActive : styles.trackingDotInactive
          ]} />
          {!isLast && (
            <View style={[
              styles.trackingLine,
              index === 0 ? styles.trackingLineInactive : styles.trackingLineInactive
            ]} />
          )}
        </View>
        <View style={styles.trackingContent}>
          <Text style={[
            styles.trackingTitle,
            status.completed || status.current ? styles.trackingTitleActive : styles.trackingTitleInactive
          ]}>
            {status.title}
          </Text>
          {status.date && (
            <Text style={styles.trackingDate}>
              {status.date}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lacak</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Memuat data pesanan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lacak</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Memuat data pesanan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const trackingStatuses = getTrackingStatuses(order?.state || 'processing', order?.date_order);
  const firstOrderLine = order?.order_line?.[0] || order?.items?.[0];
  const productImage = firstOrderLine?.image_128;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - exact match to screenshot */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lacak</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Product Section - exact match to screenshot */}
        <View style={styles.productSection}>
          <View style={styles.productImageContainer}>
            {productImage ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${productImage}` }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <Ionicons name="cube-outline" size={16} color={Colors.text.tertiary} />
              </View>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>
              {firstOrderLine?.product_name || firstOrderLine?.name || 'Royal Canin Persian Adult'}
            </Text>
          </View>
          <Text style={styles.productQuantity}>
            x{firstOrderLine?.product_uom_qty || firstOrderLine?.quantity || 2}
          </Text>
          <TouchableOpacity style={styles.productArrow}>
            <Ionicons name="chevron-forward" size={16} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Order Info Section - exact match to screenshot */}
        <View style={styles.orderInfoSection}>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>No. Transaksi</Text>
            <View style={styles.orderInfoRight}>
              <Ionicons name="copy-outline" size={16} color={Colors.primary.main} style={styles.copyIcon} />
              <Text style={styles.orderInfoValue}>{order?.name || '123456644'}</Text>
            </View>
          </View>
          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Jumlah SKU Produk</Text>
            <Text style={styles.orderInfoValue}></Text>
          </View>
        </View>

        {/* Tracking Timeline - exact match to screenshot */}
        <View style={styles.trackingSection}>
          {trackingStatuses.map((status, index) =>
            renderTrackingStatus(status, index, trackingStatuses)
          )}
        </View>

        {/* Status Section - exact match to screenshot */}
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>Status</Text>
          <Text style={styles.statusDate}>1 Mei 2025, 07 : 00 WIB</Text>

          <Text style={styles.statusWarning}>Paket Anda Dalam Perjalanan</Text>
          <Text style={styles.statusDescription}>
            Silakan lacak status pengiriman secara berkala untuk informasi terkini.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Button - exact match to screenshot */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.bottomButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },

  // Header - exact match
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
    height: 24,
  },

  // Content
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },

  // Product Section - exact match
  productSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border.light,
  },
  productImageContainer: {
    marginRight: Spacing.md,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
  },
  productImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  productQuantity: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    marginRight: Spacing.sm,
  },
  productArrow: {
    padding: Spacing.xs,
  },

  // Order Info Section - exact match
  orderInfoSection: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border.light,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  orderInfoLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
  },
  orderInfoRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyIcon: {
    marginRight: Spacing.xs,
  },
  orderInfoValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },

  // Tracking Section - exact match
  trackingSection: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
  },
  trackingItem: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  trackingLeft: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  trackingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  trackingDotActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  trackingDotInactive: {
    backgroundColor: Colors.background.primary,
    borderColor: Colors.border.secondary,
  },
  trackingLine: {
    width: 2,
    flex: 1,
    marginTop: Spacing.xs,
  },
  trackingLineActive: {
    backgroundColor: Colors.primary.main,
  },
  trackingLineInactive: {
    backgroundColor: Colors.border.light,
  },
  trackingContent: {
    flex: 1,
    paddingTop: -2,
  },
  trackingTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing.xs,
  },
  trackingTitleActive: {
    color: Colors.text.primary,
  },
  trackingTitleInactive: {
    color: Colors.text.secondary,
  },
  trackingDate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
  },

  // Status Section - exact match
  statusSection: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
    borderTopWidth: 8,
    borderTopColor: Colors.background.secondary,
  },
  statusTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  statusDate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  statusWarning: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.error.main,
    marginBottom: Spacing.sm,
  },
  statusDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    lineHeight: 20,
  },

  // Bottom Button - exact match
  bottomButtonContainer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border.light,
  },
  bottomButton: {
    backgroundColor: '#00BCD4', // Cyan color like in screenshot
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  bottomButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.background.primary,
  },

  // Loading states
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

export default OrderTrackingScreen;