import React, { useState } from 'react';
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
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ActivityStackParamList } from '../../navigation/types';
import { useActivities, useOrders } from '../../hooks/useActivities';
import { Activity, Order } from '../../services';
import { useAuth } from '../../contexts/AuthContext';

type NavigationProp = StackNavigationProp<ActivityStackParamList, 'ActivityScreen'>;

interface OrderSection {
  title: string;
  date: string;
  data: Order[];
  expanded: boolean;
}

const getStatusColor = (status?: string): string => {
  const statusColors: { [key: string]: string } = {
    pending: '#FF5252', // Red for unpaid
    processing: Colors.info.main,
    shipped: '#2196F3', // Blue for shipped/delivered
    delivered: '#2196F3', // Blue for shipped/delivered
    cancelled: Colors.error.main,
    done: '#2196F3', // Blue for completed
    sale: '#2196F3', // Blue for shipped/delivered
    draft: '#FF5252', // Red for unpaid
    waiting_payment: '#FF5252', // Red for unpaid
    payment_confirmed: '#2196F3', // Blue for shipped/delivered
    admin_review: Colors.info.main,
    approved: '#2196F3', // Blue for shipped/delivered
    return_approved: Colors.error.main,
    inspecting: Colors.info.main,
  };
  return statusColors[status || ''] || Colors.text.secondary;
};

const getStatusText = (status?: string): string => {
  const statusTexts: { [key: string]: string } = {
    pending: 'Belum bayar',
    processing: 'Diproses',
    shipped: 'Dikirim',
    delivered: 'Selesai',
    cancelled: 'Dibatalkan',
    done: 'Selesai',
    sale: 'Dikirim',
    draft: 'Belum bayar',
    waiting_payment: 'Belum bayar',
    payment_confirmed: 'Dikirim',
    admin_review: 'Ditinjau Admin',
    approved: 'Dikirim',
    return_approved: 'Pengembalian Disetujui',
    inspecting: 'Pemeriksaan Barang',
  };
  return statusTexts[status || ''] || status || '';
};

const formatDateHeader = (dateString: string): string => {
  const date = new Date(dateString);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

// Helper function to safely get image URI (based on promo page implementation)
const getImageUri = (item: any): string | null => {
  // Check for different image field formats from ODOO API
  const imageData = item?.image_128 || item?.image_url || item?.image;

  if (!imageData) return null;

  // Handle different types of image data from ODOO
  if (typeof imageData === 'string') {
    // Check if it's already a data URL (base64)
    if (imageData.startsWith('data:image')) {
      return imageData;
    }
    // Check if it's a full HTTP URL
    else if (imageData.startsWith('http') || imageData.startsWith('https')) {
      return imageData;
    }
    // If it's base64 string without prefix, add the data URL prefix
    else if (imageData.length > 50) { // Assume base64 if long string
      return `data:image/jpeg;base64,${imageData}`;
    }
  }
  // Handle numeric IDs or other formats by returning null (show placeholder)
  else if (typeof imageData === 'number') {
    // Could construct URL if needed, but for now show placeholder
    return null;
  }
  else if (Array.isArray(imageData) && imageData.length > 0) {
    // ODOO might return [id, name] array - show placeholder for now
    return null;
  }

  return null;
};

export default function ActivityScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'belanja' | 'dokter' | 'salon'>('belanja');
  const [expandedOrders, setExpandedOrders] = useState<{ [key: string]: boolean }>({});
  const [expandedDateSections, setExpandedDateSections] = useState<{ [key: string]: boolean }>({});
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    belanja: true,
    dokter: true,
    salon: true
  });
  
  // Sample data for different service types (fallback when no API data)
  const sampleBelanjaOrders = [
    {
      id: '1',
      date: 'Minggu, 2 Mei 2025',
      items: [
        {
          name: 'Royal Canin Persian Adult',
          quantity: 2,
          price: 352000,
          // Note: In real API, this would be image_128 or image_url from ODOO
          image_128: null // Will show placeholder
        }
      ],
      total: 352000,
      status: 'Belum bayar',
      statusColor: '#FF5252',
      state: 'waiting_payment',
      amount_total: 352000,
      name: 'ORD-001',
      date_order: '2025-05-02T10:00:00Z',
      note: null
    },
    {
      id: '2',
      date: 'Minggu, 2 Mei 2025',
      items: [
        {
          name: 'Royal Canin Persian Adult',
          quantity: 1,
          price: 352000,
          image_128: null
        }
      ],
      total: 352000,
      status: 'Dikirim',
      statusColor: '#2196F3',
      state: 'sale',
      amount_total: 352000,
      name: 'ORD-002',
      date_order: '2025-05-02T10:00:00Z',
      note: null
    },
    {
      id: '3',
      date: 'Sabtu, 1 Mei 2025',
      items: [
        {
          name: 'Pro Plan Adult Dog Food',
          quantity: 1,
          price: 285000,
          image_128: null
        }
      ],
      total: 285000,
      status: 'Dikirim',
      statusColor: '#2196F3',
      state: 'sale',
      amount_total: 285000,
      name: 'ORD-003',
      date_order: '2025-05-01T14:00:00Z',
      note: null
    },
    {
      id: '4',
      date: 'Jumat, 30 April 2025',
      items: [
        {
          name: 'Whiskas Adult Cat Food',
          quantity: 2,
          price: 45000,
          image_128: null
        }
      ],
      total: 90000,
      status: 'Belum bayar',
      statusColor: '#FF5252',
      state: 'waiting_payment',
      amount_total: 90000,
      name: 'ORD-004',
      date_order: '2025-04-30T16:00:00Z',
      note: null
    }
  ];
  
  const sampleDokterOrders = [
    {
      id: '2',
      date: 'Minggu, 2 Mei 2025',
      items: [
        {
          name: 'Konsultasi Dokter Hewan',
          quantity: 1,
          price: 150000,
          image_128: null // Will show placeholder for service
        },
      ],
      total: 150000,
      status: 'Selesai',
      statusColor: Colors.success.main,
      state: 'done',
      amount_total: 150000,
      name: 'DOC-001',
      date_order: '2025-05-02T14:00:00Z',
      note: 'Konsultasi kesehatan rutin'
    }
  ];
  
  const sampleSalonOrders = [
    {
      id: '3',
      date: 'Minggu, 2 Mei 2025',
      items: [
        {
          name: 'Grooming Premium Package',
          quantity: 1,
          price: 250000,
          image_128: null // Will show placeholder for service
        },
      ],
      total: 250000,
      status: 'Dijadwalkan',
      statusColor: Colors.info.main,
      state: 'processing',
      amount_total: 250000,
      name: 'SAL-001',
      date_order: '2025-05-02T16:00:00Z',
      note: 'Jadwal grooming: 15:00'
    }
  ];
  
  // Fetch orders with infinite scroll
  const {
    data: ordersData,
    isLoading: ordersLoading,
    isFetching: ordersFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchOrders
  } = useOrders(5); // Load 5 orders per page for faster initial load

  // Flatten all pages into single array
  const orders = ordersData?.pages.flatMap(page => page) || [];

  // Show orders immediately when available, even while fetching
  const hasOrders = orders && orders.length > 0;
  const showLoadingSpinner = ordersLoading && !hasOrders;


  const isLoading = showLoadingSpinner;
  
  const handleRefresh = () => {
    refetchOrders();
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Loading more orders...</Text>
        </View>
      );
    }

    if (!hasNextPage && orders && orders.length > 0) {
      return (
        <View style={styles.endFooter}>
          <Text style={styles.endText}>No more orders to load</Text>
        </View>
      );
    }

    return null;
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const toggleDateSection = (dateKey: string) => {
    setExpandedDateSections(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  // Group orders by date
  const groupOrdersByDate = (ordersList: Order[]): OrderSection[] => {
    const grouped: { [key: string]: Order[] } = {};

    ordersList.forEach(order => {
      const dateKey = order.date_order.split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(order);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, items]) => {
        const isExpanded = expandedDateSections[date] ?? true; // Default expanded
        return {
          title: formatDateHeader(date),
          date,
          data: isExpanded ? items : [], // Only show data if expanded
          expanded: isExpanded,
        };
      });
  };

  const renderOrderItem = (order: any) => {
    const needsPayment = (order.state === 'draft' ||
                        order.state === 'waiting_payment' ||
                        (order.note && order.note.includes('[WAITING_PAYMENT]'))) &&
                        order.state !== 'cancel' &&
                        order.state !== 'cancelled' &&
                        order.state !== 'sale' &&
                        !order.note?.includes('[PAYMENT_CONFIRMED]');

    const canTrack = order.state === 'sale' ||
                     order.state === 'shipped' ||
                     order.state === 'processing' ||
                     order.note?.includes('[PAYMENT_CONFIRMED]') ||
                     order.statusText === 'Sedang Diproses' ||
                     order.statusText === 'Dikirim';

    // Check if this is an AutoKirim order
    const isAutoKirim = order.note && (
      order.note.includes('[AUTOKIRIM_ORDER]') ||
      order.note.includes('[MIXED_ORDER]')
    );

    const isExpanded = expandedOrders[order.id] || false;

    const toggleOrderExpansion = () => {
      setExpandedOrders(prev => ({
        ...prev,
        [order.id]: !prev[order.id]
      }));
    };

    return (
      <View style={styles.orderCard}>
        <TouchableOpacity
          style={styles.orderContent}
          onPress={toggleOrderExpansion}
        >
          {isExpanded ? (
            // EXPANDED VIEW - Detailed view with individual product rows
            <View style={styles.orderInfo}>
              {/* Individual product rows */}
              <View style={styles.productList}>
                {order.items && order.items.length > 0
                  ? order.items.map((item: any, index: number) => (
                      <View key={index} style={styles.productRow}>
                        <View style={styles.productImageContainer}>
                          {(() => {
                            const imageUri = getImageUri(item);
                            return imageUri ? (
                              <Image
                                source={{
                                  uri: imageUri,
                                  headers: {
                                    'Accept': 'image/*'
                                  }
                                }}
                                style={styles.productRowImage}
                                resizeMode="cover"
                                onError={(error) => {
                                  // Image failed to load - will show placeholder
                                }}
                                onLoad={() => {
                                  // Image loaded successfully
                                }}
                              />
                            ) : (
                              <View style={[styles.productRowImage, styles.imagePlaceholder]}>
                                <MaterialIcons name="shopping-bag" size={16} color={Colors.text.tertiary} />
                              </View>
                            );
                          })()}
                        </View>

                        <View style={styles.productDetails}>
                          <Text style={styles.productRowName} numberOfLines={1}>
                            {item.name}
                          </Text>
                        </View>

                        <View style={styles.productQuantity}>
                          <Text style={styles.quantityText}>
                            x{item.product_uom_qty || 1}
                          </Text>
                        </View>
                      </View>
                    ))
                  : (
                    <View style={styles.productRow}>
                      <View style={styles.productImageContainer}>
                        <View style={[styles.productRowImage, styles.imagePlaceholder]}>
                          <MaterialIcons name="shopping-bag" size={16} color={Colors.text.tertiary} />
                        </View>
                      </View>
                      <View style={styles.productDetails}>
                        <Text style={styles.productRowName}>Produk</Text>
                      </View>
                      <View style={styles.productQuantity}>
                        <Text style={styles.quantityText}>x1</Text>
                      </View>
                    </View>
                  )}
              </View>

              {/* Summary Information */}
              <View style={styles.orderSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Jumlah SKU Produk</Text>
                  <Text style={styles.summaryValue}>{order.items?.length || 0}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total harga</Text>
                  <Text style={styles.summaryValue}>
                    Rp{order.amount_total?.toLocaleString('id-ID') || '0'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Status</Text>
                  <Text style={[styles.summaryValue, { color: getStatusColor(order.state) }]}>
                    {getStatusText(order.state)}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            // COLLAPSED VIEW - Compact single row
            <>
              <View style={styles.collapsedImageContainer}>
                {(() => {
                  const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                  const imageUri = firstItem ? getImageUri(firstItem) : null;
                  return imageUri ? (
                    <Image
                      source={{
                        uri: imageUri,
                        headers: {
                          'Accept': 'image/*'
                        }
                      }}
                      style={styles.collapsedProductImage}
                      resizeMode="cover"
                      onError={(error) => {
                        // Image failed to load - will show placeholder
                      }}
                      onLoad={() => {
                        // Image loaded successfully
                      }}
                    />
                  ) : (
                    <View style={[styles.collapsedProductImage, styles.imagePlaceholder]}>
                      <MaterialIcons name="shopping-bag" size={20} color={Colors.text.tertiary} />
                    </View>
                  );
                })()}
              </View>

              <View style={styles.collapsedOrderInfo}>
                <Text style={styles.collapsedProductName} numberOfLines={1}>
                  {order.items && order.items.length > 0 ? order.items[0].name : 'Produk'}
                  {order.items && order.items.length > 1 && '...'}
                </Text>
              </View>

              <View style={styles.collapsedRightInfo}>
                <Text style={styles.collapsedPrice}>
                  Rp {order.amount_total?.toLocaleString('id-ID') || '0'}
                </Text>
                <Text style={[styles.collapsedStatus, { color: getStatusColor(order.state) }]}>
                  {getStatusText(order.state)}
                </Text>
              </View>
            </>
          )}
        </TouchableOpacity>
        
        {/* Bottom action based on status */}
        {needsPayment && (
          <View style={styles.bottomActionContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                navigation.navigate('Checkout', {
                  orderId: order.id.toString(),
                  orderName: order.name
                });
              }}
            >
              <Text style={styles.actionButtonText}>Selesaikan Pembayaran</Text>
            </TouchableOpacity>
          </View>
        )}

        {canTrack && !needsPayment && (
          <View style={styles.bottomActionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.trackActionButton]}
              onPress={() => {
                navigation.navigate('Profile', {
                  screen: 'OrderTracking',
                  params: { orderId: order.id.toString() }
                });
              }}
            >
              <Text style={[styles.actionButtonText, styles.trackActionButtonText]}>Lacak</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderDateSection = ({ section }: { section: OrderSection }) => {
    const isExpanded = expandedDateSections[section.date] ?? true; // Default expanded

    return (
      <TouchableOpacity
        style={styles.dateSection}
        onPress={() => toggleDateSection(section.date)}
      >
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{section.title}</Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={Colors.primary.main}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderServiceSection = (title: string, key: string, items: Order[]) => {
    const isExpanded = expandedSections[key];
    
    if (items.length === 0) return null;
    
    return (
      <View style={styles.serviceSection}>
        <TouchableOpacity 
          style={styles.serviceSectionHeader}
          onPress={() => toggleSection(key)}
        >
          <Text style={styles.serviceSectionTitle}>{title}</Text>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={Colors.text.primary} 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.serviceSectionContent}>
            {items.map((order) => (
              <View key={order.id}>
                {renderOrderItem(order)}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../../../assets/mascot-sad.png')} 
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Belum ada pesanan</Text>
      <Text style={styles.emptySubtitle}>
        Ayo mulai belanja di PawSmart!
      </Text>
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => {
          // Navigate to Home tab
          navigation.getParent()?.navigate('Home');
        }}
      >
        <Text style={styles.shopButtonText}>Mulai Belanja</Text>
      </TouchableOpacity>
    </View>
  );

  // Filter orders based on selected tab and order type
  const martOrders = orders.filter(order => {
    // Check if it's NOT an AutoKirim order
    const isAutoKirim = order.note && (
      order.note.includes('[AUTOKIRIM_ORDER]') || 
      order.note.includes('[MIXED_ORDER]')
    );
    // Return regular orders for Mart tab
    return !isAutoKirim && order.items && order.items.length > 0;
  });
  
  const autoKirimOrders = orders.filter(order => {
    // Check if it's an AutoKirim order
    const isAutoKirim = order.note && (
      order.note.includes('[AUTOKIRIM_ORDER]') || 
      order.note.includes('[MIXED_ORDER]')
    );
    // Return AutoKirim orders for AutoKirim tab
    return isAutoKirim && order.items && order.items.length > 0;
  });

  // Get current orders based on selected tab
  const getCurrentOrders = () => {
    switch (selectedTab) {
      case 'belanja':
        // Use real orders from API only
        return orders || [];
      case 'dokter':
        // Filter orders for doctor services
        return orders?.filter(order => order.note?.includes('[DOCTOR_SERVICE]')) || [];
      case 'salon':
        // Filter orders for salon services
        return orders?.filter(order => order.note?.includes('[SALON_SERVICE]')) || [];
      default:
        return [];
    }
  };

  const currentOrders = getCurrentOrders();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Order</Text>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialCommunityIcons name="filter-variant" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* 3-in-1 Tabs */}
      <View style={styles.mainTabs}>
        <TouchableOpacity
          style={[styles.mainTab, selectedTab === 'belanja' && styles.mainTabActive]}
          onPress={() => setSelectedTab('belanja')}
        >
          <MaterialIcons name="shopping-bag" size={20} color={selectedTab === 'belanja' ? Colors.primary.main : Colors.text.secondary} />
          <Text style={[styles.mainTabText, selectedTab === 'belanja' && styles.mainTabTextActive]}>
            Belanja
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTab, selectedTab === 'dokter' && styles.mainTabActive]}
          onPress={() => setSelectedTab('dokter')}
        >
          <MaterialIcons name="medical-services" size={20} color={selectedTab === 'dokter' ? Colors.primary.main : Colors.text.secondary} />
          <Text style={[styles.mainTabText, selectedTab === 'dokter' && styles.mainTabTextActive]}>
            Dokter
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTab, selectedTab === 'salon' && styles.mainTabActive]}
          onPress={() => setSelectedTab('salon')}
        >
          <MaterialIcons name="content-cut" size={20} color={selectedTab === 'salon' ? Colors.primary.main : Colors.text.secondary} />
          <Text style={[styles.mainTabText, selectedTab === 'salon' && styles.mainTabTextActive]}>
            Salon
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.sekaliBeliButton}>
          <Text style={styles.sekaliBeliText}>Sekali Beli</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.autoKirimButton}>
          <Text style={styles.autoKirimText}>Auto Kirim</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Memuat pesanan...</Text>
        </View>
      ) : (
        <SectionList
          style={styles.content}
          sections={groupOrdersByDate(currentOrders)}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item: order }) => renderOrderItem(order)}
          renderSectionHeader={renderDateSection}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={ordersFetching && !isFetchingNextPage}
              onRefresh={handleRefresh}
              colors={[Colors.primary.main]}
            />
          }
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={currentOrders.length === 0 ? styles.emptyContainer : styles.ordersContainer}
          ItemSeparatorComponent={() => <View style={styles.orderSeparator} />}
          stickySectionHeadersEnabled={false}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  filterButton: {
    padding: Spacing.xs,
  },
  
  // Main Tabs
  mainTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  mainTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    position: 'relative',
  },
  mainTabActive: {
    // Active tab styles handled by indicator
  },
  mainTabText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
  },
  mainTabTextActive: {
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.semibold,
  },
  mainTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.primary.main,
  },
  
  // Filter Chips
  filterChips: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.main,
    backgroundColor: Colors.background.primary,
    gap: Spacing.xs,
  },
  filterChipActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.light + '10',
  },
  filterChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  filterChipTextActive: {
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  
  // Action Container
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sekaliBeliButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#FF5722', // Orange color like in screenshot
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  sekaliBeliText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
  autoKirimButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.main,
  },
  autoKirimText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
  
  // Content
  content: {
    flex: 1,
  },
  ordersContainer: {
  },

  // Service Sections
  serviceSection: {
    marginBottom: Spacing.xs,
  },
  serviceSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  serviceSectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  serviceSectionContent: {
    paddingVertical: Spacing.sm,
  },
  
  // Date Section
  dateSection: {
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary.main,
  },
  dateText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  dateOrdersList: {
  },
  
  // Order Card
  orderCard: {
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  orderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  imagePlaceholder: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderHeader: {
    marginBottom: Spacing.xs,
  },
  productList: {
    marginBottom: Spacing.xs,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  productImageContainer: {
    marginRight: Spacing.sm,
  },
  productRowImage: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
  },
  productDetails: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  productRowName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  productQuantity: {
    alignItems: 'flex-end',
  },
  // Collapsed View Styles
  collapsedImageContainer: {
    marginRight: Spacing.md,
  },
  collapsedProductImage: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
  },
  collapsedOrderInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  collapsedProductName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  collapsedRightInfo: {
    alignItems: 'flex-end',
  },
  collapsedPrice: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  collapsedStatus: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  // Summary Section Styles
  orderSummary: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  orderNumber: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary.main,
  },
  orderDate: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
  },
  priceAndStatus: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  productName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  quantityText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
  },
  autoKirimBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning.light + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  autoKirimBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.warning.main,
    fontFamily: Typography.fontFamily.medium,
    marginLeft: Spacing.xs,
  },
  moreProducts: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  orderDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  statusContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  orderPrice: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  orderStatus: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'right',
  },
  
  // Expandable Order Details
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
  },
  orderSummary: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  orderSummaryTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  itemQuantity: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  itemPrice: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  totalLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  totalPrice: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  orderStatusDetail: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  
  // Action Buttons
  actionButtonContainer: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  paymentButton: {
    backgroundColor: Colors.warning.main,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    minWidth: 180,
  },
  paymentButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    textAlign: 'center',
  },
  trackingButton: {
    backgroundColor: Colors.primary.main, // Blue color like in screenshot
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    minWidth: 180,
  },
  trackingButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    textAlign: 'center',
  },
  trackButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary.main,
    marginLeft: Spacing.sm,
  },
  trackButtonText: {
    color: Colors.primary.main,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  autoKirimActions: {
    marginTop: Spacing.sm,
  },
  nextDeliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  nextDeliveryText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  autoKirimButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  manageButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.warning.light + '20',
    borderWidth: 1,
    borderColor: Colors.warning.main,
  },
  manageButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.warning.dark,
    fontFamily: Typography.fontFamily.medium,
  },
  detailLink: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.base,
  },
  detailLinkText: {
    color: Colors.primary.main,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },

  // Bottom Action Container
  bottomActionContainer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    alignItems: 'flex-end',
  },
  actionButton: {
    backgroundColor: Colors.warning.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minWidth: 120,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
    textAlign: 'center',
  },
  trackActionButton: {
    backgroundColor: Colors.primary.main,
  },
  trackActionButtonText: {
    color: Colors.text.white,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 3,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  shopButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  shopButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  
  // Loading
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

  // Infinite scroll styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderSeparator: {
    height: Spacing.sm,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  endFooter: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  endText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    fontFamily: Typography.fontFamily.regular,
  },
});