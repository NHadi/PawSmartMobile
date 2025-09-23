import React, { useState, useEffect } from 'react';
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
import { HomeStackParamList, PromoStackParamList } from '../../navigation/types';
import { useCart } from '../../contexts/CartContext';
import orderService, { CreateOrderData } from '../../services/order/orderService';
import paymentSimulator from '../../services/payment/paymentSimulator';
import authService from '../../services/auth/authService';
import PaymentMethodModal from '../../components/modals/PaymentMethodModal';
import PaymentDetails from '../../components/payment/PaymentDetails';
import paymentGatewayService from '../../services/payment/paymentGatewayService';
import { useLoading } from '../../hooks/useLoading';
import { Address } from './AddressListScreen';
import odooAddressService from '../../services/address/odooAddressService';
import AutoKirimModal from '../../components/modals/AutoKirimModal';

const autoKirimIcon = require('../../../assets/icons/order/auto_kirim.png');

// Support navigation from both Home and Promo stacks
type NavigationProp = StackNavigationProp<HomeStackParamList, 'Checkout'> | StackNavigationProp<PromoStackParamList, 'Checkout'>;
type CheckoutRouteProp = RouteProp<HomeStackParamList, 'Checkout'> | RouteProp<PromoStackParamList, 'Checkout'>;

interface ShippingAddress {
  id: string;
  name: string;
  phone: string;
  address: string;
  area: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  quantity: number;
  image: any;
  weight: string;
  discount?: number;
  seller?: string;
  purchaseType?: 'autokirim' | 'sekali';
  autoKirimConfig?: {
    period: number;
    unit: 'minggu' | 'bulan';
    startDate: Date;
    duration?: number;
  };
}

interface ShippingOption {
  id: string;
  name: string;
  service: string;
  price: number;
  estimatedDays: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  name: string;
  icon: any;
}

interface Voucher {
  id: string;
  type: string;
  title: string;
  description: string;
  discount: number;
  minPurchase: number;
  expiryDate: string;
}

export default function CheckoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CheckoutRouteProp>();
  const { items: contextCartItems, totalPrice, totalItems, clearCart } = useCart();
  const { showLoading, hideLoading } = useLoading();
  
  const [user, setUser] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [orderId, setOrderId] = useState<string | number | null>(null);
  const [orderName, setOrderName] = useState<string>('');
  
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Convert context cart items to local format with purchase options
  useEffect(() => {
    const items: CartItem[] = contextCartItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      quantity: item.quantity,
      image: item.image,
      weight: '500gr', // Default weight
      discount: item.discount,
      seller: 'PawSmart',
      purchaseType: 'sekali' as const, // Default to one-time purchase
    }));
    setCartItemsWithOptions(items);
  }, [contextCartItems]);

  const [selectedShipping, setSelectedShipping] = useState<ShippingOption>({
    id: '1',
    name: 'Regular',
    service: 'JNE Regular',
    price: 12000,
    estimatedDays: '2-3 hari',
  });

  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const [selectedVouchers, setSelectedVouchers] = useState<Voucher[]>([]);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [showAutoKirimModal, setShowAutoKirimModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [cartItemsWithOptions, setCartItemsWithOptions] = useState<CartItem[]>([]);

  const calculateSubtotal = () => {
    // Calculate based on purchase type and auto-kirim configurations
    let total = 0;
    cartItemsWithOptions.forEach(item => {
      if (item.purchaseType === 'autokirim' && item.autoKirimConfig) {
        // For auto-kirim, calculate based on period
        total += item.price * item.quantity;
      } else {
        // Regular one-time purchase
        total += item.price * item.quantity;
      }
    });
    return total;
  };

  const handlePurchaseTypeChange = (itemId: string, type: 'autokirim' | 'sekali') => {
    if (type === 'autokirim') {
      setEditingItemId(itemId);
      setShowAutoKirimModal(true);
    } else {
      setCartItemsWithOptions(prev => prev.map(item => 
        item.id === itemId ? { ...item, purchaseType: type, autoKirimConfig: undefined } : item
      ));
    }
  };

  const handleAutoKirimConfig = (config: any) => {
    if (editingItemId) {
      setCartItemsWithOptions(prev => prev.map(item => 
        item.id === editingItemId ? { 
          ...item, 
          purchaseType: 'autokirim' as const, 
          autoKirimConfig: config 
        } : item
      ));
    }
    setShowAutoKirimModal(false);
    setEditingItemId(null);
  };

  // Get user data and addresses on mount
  useEffect(() => {
    const fetchUserAndAddresses = async () => {
      // Check if user is authenticated
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        Alert.alert(
          'Login Required',
          'Silakan login terlebih dahulu untuk melanjutkan checkout',
          [
            {
              text: 'Login',
              onPress: () => {
                // Navigate to login screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' as any }],
                });
              }
            },
            {
              text: 'Batal',
              onPress: () => navigation.goBack(),
              style: 'cancel'
            }
          ]
        );
        return;
      }
      
      const userData = await authService.getCurrentUser();
      setUser(userData);
      
      // Load addresses from Odoo
      try {
        const odooAddresses = await odooAddressService.getUserAddresses();
        if (odooAddresses.length > 0) {
          // Find default address or use first one
          const defaultAddr = odooAddresses.find(addr => addr.is_default_shipping) || odooAddresses[0];
          
          // Convert to our Address format
          const convertedAddress: Address = {
            id: defaultAddr.id.toString(),
            label: defaultAddr.type || 'Rumah',
            name: defaultAddr.name,
            phone: defaultAddr.phone || defaultAddr.mobile || '',
            fullAddress: defaultAddr.street || '',
            detail: defaultAddr.street2 || '',
            postalCode: defaultAddr.zip || '',
            isDefault: defaultAddr.is_default_shipping || false,
            latitude: defaultAddr.partner_latitude,
            longitude: defaultAddr.partner_longitude,
            province: defaultAddr.state_id ? defaultAddr.state_id[1] : '',
            city: defaultAddr.city || '',
            district: '',
            subDistrict: '',
          };
          
          setSelectedAddress(convertedAddress);
        }
      } catch (error) {
        }
    };
    fetchUserAndAddresses();
  }, []);

  // Handle existing order from activity screen and address/voucher/shipping selection
  useEffect(() => {
    const params = route.params as any;
    if (params?.selectedAddress) {
      setSelectedAddress(params.selectedAddress);
    }
    if (params?.selectedVouchers) {
      setSelectedVouchers(params.selectedVouchers);
    }
    if (params?.selectedShipping) {
      setSelectedShipping(params.selectedShipping);
    }
    // Preserve payment method if it was already selected
    if (params?.selectedPayment) {
      setSelectedPayment(params.selectedPayment);
    }
    if (params?.orderId && params?.orderName) {
      // Continuing with existing order
      setOrderId(params.orderId);
      setOrderName(params.orderName);
      
      // Show payment modal automatically
      setTimeout(() => {
        setShowPaymentModal(true);
      }, 1000);
    }
  }, [route.params]);

  // Redirect to order history if empty (but not when continuing existing order)
  useEffect(() => {
    const params = route.params as any;
    const hasExistingOrder = params?.orderId && params?.orderName;

    // Get ROOT navigation state to check if we're in a payment flow
    // CheckoutScreen is in a nested navigator, so we need to access the root navigator
    let rootNavigator = navigation;
    while (rootNavigator.getParent()) {
      rootNavigator = rootNavigator.getParent()!;
    }

    const rootNavigationState = rootNavigator.getState();
    const rootRoutes = rootNavigationState?.routes || [];

    // Check all nested routes recursively from root
    const getAllRoutes = (routes: any[]): string[] => {
      let allRoutes: string[] = [];
      routes.forEach(route => {
        allRoutes.push(route.name);
        if (route.state?.routes) {
          allRoutes = allRoutes.concat(getAllRoutes(route.state.routes));
        }
      });
      return allRoutes;
    };

    const allRouteNames = getAllRoutes(rootRoutes);
    const hasPaymentScreens = allRouteNames.some(routeName =>
      ['QRISPayment', 'EwalletPayment', 'VirtualAccountPayment', 'UniversalSuccess'].includes(routeName)
    );

    if (totalItems === 0 && !hasExistingOrder && !hasPaymentScreens) {
      // Silently redirect to my orders page without popup using nested navigation
      navigation.navigate('Activity' as any, {
        screen: 'MyOrders',
        params: { orderId: undefined }
      });
    }
  }, [totalItems, navigation, route.params]);

  const calculateProductDiscount = () => {
    const discount = cartItemsWithOptions.reduce((total, item) => {
      if (item.discount) {
        // Ensure discount is always positive (amount saved)
        const discountAmount = Math.max(0, (item.originalPrice - item.price) * item.quantity);
        return total + discountAmount;
      }
      return total;
    }, 0);
    return discount;
  };

  const calculateVoucherDiscount = () => {
    const discount = selectedVouchers.reduce((total, voucher) => total + voucher.discount, 0);
    return discount;
  };

  const calculateShippingDiscount = () => {
    // Check if free shipping voucher is applied
    const hasFreeShipping = selectedVouchers.some(v => v.type === 'free_shipping');
    return hasFreeShipping ? selectedShipping.price : 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = selectedShipping.price;
    const insurance = hasInsurance ? 2500 : 0;
    const adminFee = 0;
    const productDiscount = calculateProductDiscount();
    const voucherDiscount = calculateVoucherDiscount();
    const shippingDiscount = calculateShippingDiscount();


    // Calculate the total
    const total = subtotal + shipping + insurance + adminFee - productDiscount - voucherDiscount - shippingDiscount;


    // Ensure the total is never negative and meets minimum payment requirements
    // Xendit requires minimum 1000 IDR for QRIS payments
    const minimumAmount = 1000;

    // Ensure the total is at least the minimum (keep exact decimal values)
    const finalTotal = Math.max(minimumAmount, total);

    return finalTotal;
  };

  const handleSelectAddress = async () => {
    // Check if user is authenticated before navigating
    const isAuthenticated = await authService.isAuthenticated();
    
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Silakan login terlebih dahulu untuk mengelola alamat',
        [
          {
            text: 'Login',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as any }],
              });
            }
          },
          {
            text: 'Batal',
            style: 'cancel'
          }
        ]
      );
      return;
    }
    
    // Navigate to address list
    // Navigate to AddressList in Home tab
    navigation.navigate('Home', {
      screen: 'AddressList',
      params: { 
        isSelecting: true,
        selectedPayment, // Preserve payment selection
      }
    } as any);
  };

  const handleSelectShipping = () => {
    navigation.navigate('ShippingOptions', {
      selectedShipping,
      selectedPayment, // Preserve payment selection
    } as any);
  };

  const handleSelectVoucher = () => {
    navigation.navigate('VoucherSelection', {
      selectedVouchers: selectedVouchers.map(v => v.id),
      totalAmount: calculateSubtotal(),
      selectedPayment, // Preserve payment selection
    } as any);
  };

  const handleSelectPayment = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelected = async (method: any) => {
    setSelectedPayment(method);
    // Just set the selected payment method, don't create order yet
  };

  const createPayment = async (method: any, orderIdParam?: string | number, orderNameParam?: string) => {
    try {
      showLoading(`Memproses ${method.name}...`);
      
      const currentOrderId = orderIdParam || orderId;
      const currentOrderName = orderNameParam || orderName;
      
      // Validate required fields before creating payment
      const customerName = selectedAddress?.name || user?.name || '';
      const customerPhone = selectedAddress?.phone || user?.phone || '';
      const customerEmail = user?.email || '';

      // Validate required fields
      if (!currentOrderId) {
        throw new Error('Order ID tidak valid');
      }
      if (!customerName.trim()) {
        throw new Error('Nama pelanggan diperlukan');
      }
      if (method.type === 'EWALLET' && !customerPhone.trim()) {
        Alert.alert(
          'Nomor Telepon Diperlukan',
          'Nomor telepon diperlukan untuk pembayaran e-wallet. Silakan lengkapi profil Anda terlebih dahulu.',
          [{ text: 'OK' }]
        );
        hideLoading();
        return;
      }

      const paymentRequest = {
        orderId: currentOrderId,
        amount: calculateTotal(),
        paymentMethod: method.type,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        description: `Payment for order ${currentOrderName}`,
        items: contextCartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
      };

      // Create unified payment request for multi-gateway service
      const unifiedPaymentRequest = {
        orderId: paymentRequest.orderId.toString(),
        amount: paymentRequest.amount,
        paymentMethod: paymentRequest.paymentMethod as any,
        customerName: paymentRequest.customerName,
        customerEmail: paymentRequest.customerEmail,
        customerPhone: paymentRequest.customerPhone,
        description: paymentRequest.description,
        items: paymentRequest.items,
      };

      // Use multi-gateway service to create payment with automatic provider selection
      const paymentOptions = {
        channelCode: method.channelCode,
        bankCode: method.bankCode,
      };

      const paymentResponse = await paymentGatewayService.createPayment(
        unifiedPaymentRequest,
        undefined, // Let service choose configured provider
        paymentOptions
      );
      
      // Save payment info to order
      if (paymentResponse && paymentResponse.paymentId && currentOrderId) {
        await orderService.updateOrderPaymentInfo(
          currentOrderId,
          paymentResponse.paymentId,
          method.type,
          paymentResponse.status || 'PENDING'
        );
      }
      
      setPaymentData(paymentResponse);
      hideLoading();
      
      // Navigate to appropriate payment screen based on payment type
      if (paymentResponse) {
        const orderInfo = {
          orderId: currentOrderId?.toString(),
          orderName: currentOrderName,
          totalAmount: calculateTotal(),
        };

        switch (method.type) {
          case 'QRIS':
            navigation.navigate('QRISPayment', {
              paymentData: {
                id: paymentResponse.paymentId,
                qr_string: paymentResponse.qrString,
                amount: paymentResponse.amount,
                expires_at: paymentResponse.expiresAt,
                status: paymentResponse.status,
                provider: paymentResponse.provider,
              },
              orderInfo: orderInfo,
            } as any);
            break;

          case 'EWALLET':
            navigation.navigate('EwalletPayment', {
              paymentData: {
                id: paymentResponse.paymentId,
                actions: {
                  mobile_web_checkout_url: paymentResponse.paymentUrl,
                },
                charge_amount: paymentResponse.amount,
                status: paymentResponse.status,
                provider: paymentResponse.provider,
                selectedChannelCode: method.channelCode,
                selectedMethod: method,
                // Include the full Xendit response for debugging
                ...paymentResponse.paymentData,
              },
              orderInfo: orderInfo,
              paymentMethod: method,
            } as any);
            break;

          case 'VIRTUAL_ACCOUNT':
            navigation.navigate('VirtualAccountPayment', {
              paymentData: {
                id: paymentResponse.paymentId,
                account_number: paymentResponse.accountNumber,
                bank_code: paymentResponse.bankCode,
                expected_amount: paymentResponse.amount,
                expiration_date: paymentResponse.expiresAt,
                status: paymentResponse.status,
                provider: paymentResponse.provider,
              },
              orderInfo: orderInfo,
            } as any);
            break;
        }
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


  const handleCheckout = async () => {
    // Check if payment method is selected
    if (!selectedPayment) {
      Alert.alert(
        'Metode Pembayaran',
        'Silakan pilih metode pembayaran terlebih dahulu',
        [{ text: 'OK' }]
      );
      return;
    }

    // Create order and navigate to payment screen
    try {
      showLoading('Membuat pesanan...');
      
      // Get current user
      if (!user) {
        hideLoading();
        Alert.alert('Error', 'Silakan login untuk melakukan pemesanan');
        return;
      }

      // Create new order
      const order = await createNewOrder();
      
      // Store order info
      setOrderId(order.id);
      setOrderName(order.name);
      
      hideLoading();
      
      // Now create payment with the selected method
      await createPayment(selectedPayment, order.id, order.name);
    } catch (error) {
      hideLoading();
      Alert.alert('Error', 'Gagal membuat pesanan. Silakan coba lagi.');
    }
  };

  const createNewOrder = async () => {
    // Prepare order lines from cart items with subscription details
    const orderLines = cartItemsWithOptions.map(item => ({
      product_id: parseInt(item.id),
      product_uom_qty: item.quantity,
      price_unit: item.price,
    }));

    // Determine if this is an AutoKirim order
    const autoKirimItems = cartItemsWithOptions.filter(item => item.purchaseType === 'autokirim');
    const hasAutoKirim = autoKirimItems.length > 0;
    const isFullAutoKirim = autoKirimItems.length === cartItemsWithOptions.length;
    
    // Prepare AutoKirim details for the order note
    let autoKirimNote = '';
    let orderTypePrefix = '';
    
    if (hasAutoKirim) {
      // Add order type identifier at the beginning of the note
      if (isFullAutoKirim) {
        orderTypePrefix = '[AUTOKIRIM_ORDER]';
      } else {
        orderTypePrefix = '[MIXED_ORDER]'; // Has both AutoKirim and regular items
      }
      
      autoKirimNote = '\n\n=== AutoKirim Details ===\n';
      autoKirimItems.forEach(item => {
        if (item.autoKirimConfig) {
          autoKirimNote += `${item.name}:\n`;
          autoKirimNote += `- Periode: Setiap ${item.autoKirimConfig.period} ${item.autoKirimConfig.unit}\n`;
          autoKirimNote += `- Mulai: ${item.autoKirimConfig.startDate.toLocaleDateString('id-ID')}\n`;
          if (item.autoKirimConfig.duration) {
            autoKirimNote += `- Durasi: ${item.autoKirimConfig.duration} ${item.autoKirimConfig.durationUnit}\n`;
          } else {
            autoKirimNote += `- Durasi: Tidak terbatas\n`;
          }
        }
      });
    } else {
      orderTypePrefix = '[REGULAR_ORDER]';
    }

    // Prepare voucher details for the order note
    let voucherNote = '';
    if (selectedVouchers.length > 0) {
      voucherNote = '\n\n=== Voucher Applied ===\n';
      selectedVouchers.forEach(voucher => {
        voucherNote += `- ${voucher.title}: -Rp${voucher.discount.toLocaleString('id-ID')}\n`;
      });
    }
    
    // Create order in Odoo with order type identifier, voucher and shipping details
    const orderData: CreateOrderData = {
      partner_id: user.partner_id,
      order_line: orderLines,
      note: `${orderTypePrefix}\nShipping: ${selectedShipping.name} (${selectedShipping.service})\nShipping Cost: Rp${selectedShipping.price.toLocaleString('id-ID')}\nEstimated: ${selectedShipping.estimatedDays}\nAddress: ${selectedAddress?.fullAddress || ''}, ${selectedAddress?.city || ''}${autoKirimNote}${voucherNote}`,
      payment_method_id: 1, // Default payment method ID
      delivery_method_id: parseInt(selectedShipping.id) || 1,
    };

    const order = await orderService.createOrder(orderData);
    
    // Set order status to waiting_payment
    await orderService.updateOrderStatus(order.id, 'waiting_payment');
    
    return order;
  };


  const renderSection = (title: string, onPress?: () => void, children?: React.ReactNode, showEditButton: boolean = true, customEditText?: string) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {showEditButton && onPress && (
          <TouchableOpacity onPress={onPress}>
            <Text style={styles.editButton}>{customEditText || 'Ganti'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );

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

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Customer Details */}
        {renderSection('Detail Pelanggan', undefined, 
          <View style={styles.addressContent}>
            <Text style={styles.addressName}>Nama</Text>
            <Text style={styles.addressValue}>{user?.name || 'Wahyu Muhtiyantoro'}</Text>
            
            <Text style={styles.addressName}>No. Handphone</Text>
            <Text style={styles.addressValue}>{user?.phone || '+62 8123456890'}</Text>
            
            <View style={styles.addressSection}>
              <View style={styles.addressSectionHeader}>
                <Text style={styles.addressName}>Alamat</Text>
                <TouchableOpacity onPress={handleSelectAddress}>
                  <Text style={styles.editButton}>Ganti</Text>
                </TouchableOpacity>
              </View>
              {selectedAddress ? (
                <Text style={styles.addressValue}>
                  {selectedAddress.fullAddress}{'\n'}
                  {selectedAddress.district} - {selectedAddress.city} {selectedAddress.postalCode}
                </Text>
              ) : (
                <TouchableOpacity 
                  style={styles.addAddressButton}
                  onPress={handleSelectAddress}
                >
                  <MaterialIcons name="add-location" size={20} color={Colors.primary.main} />
                  <Text style={styles.addAddressText}>Tambah Alamat Pengiriman</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        , false)}


        {/* Mart Items */}
        {renderSection('Mart Items', undefined, (
          <View style={styles.itemsContent}>
{cartItemsWithOptions.map((item) => (
              <React.Fragment key={item.id}>
                <View style={styles.itemCard}>
                  <Image source={item.image} style={styles.itemImage} resizeMode="cover" />
                  <View style={styles.itemDetails}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                    </View>
                    <View style={styles.purchaseOptionsContainer}>
                      <TouchableOpacity
                        style={[
                          styles.purchaseOption,
                          item.purchaseType === 'autokirim' && styles.purchaseOptionSelected
                        ]}
                        onPress={() => handlePurchaseTypeChange(item.id, 'autokirim')}
                      >
                        <View style={styles.radioButton}>
                          {item.purchaseType === 'autokirim' && <View style={styles.radioButtonSelected} />}
                        </View>
                        <Image source={autoKirimIcon} style={styles.autoKirimIcon} resizeMode="contain" />
                        <Text style={[
                          styles.purchaseOptionText,
                          item.purchaseType === 'autokirim' && styles.purchaseOptionTextSelected
                        ]}>
                          AutoKirim
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.purchaseOption,
                          item.purchaseType === 'sekali' && styles.purchaseOptionSelected
                        ]}
                        onPress={() => handlePurchaseTypeChange(item.id, 'sekali')}
                      >
                        <View style={styles.radioButton}>
                          {item.purchaseType === 'sekali' && <View style={styles.radioButtonSelected} />}
                        </View>
                        <Text style={[
                          styles.purchaseOptionText,
                          item.purchaseType === 'sekali' && styles.purchaseOptionTextSelected
                        ]}>
                          Sekali beli
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {item.purchaseType === 'autokirim' && (
                  <View style={styles.individualAutoKirimOptions}>
                    <View style={styles.autoKirimOptionRow}>
                      <Text style={styles.autoKirimOptionLabel}>Periode pengantaran</Text>
                      <TouchableOpacity style={styles.autoKirimOptionDropdown}>
                        <Text style={styles.autoKirimOptionValue}>2 minggu</Text>
                        <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.text.secondary} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.autoKirimOptionRow}>
                      <Text style={styles.autoKirimOptionLabel}>Lama berlangganan</Text>
                      <TouchableOpacity style={styles.autoKirimOptionDropdown}>
                        <Text style={styles.autoKirimOptionValue}>14 Desember 2025</Text>
                        <MaterialIcons name="calendar-today" size={14} color={Colors.text.secondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </React.Fragment>
            ))}
            
            <View style={styles.itemsSummary}>
              <Text style={styles.summaryLabel}>Jumlah SKU Produk</Text>
              <Text style={styles.summaryValue}>{cartItemsWithOptions.length}</Text>
            </View>
            
            <View style={styles.itemsSummary}>
              <Text style={styles.summaryLabel}>Total Item</Text>
              <Text style={styles.summaryValue}>{totalItems}</Text>
            </View>

            
            {/* Insurance Option */}
            <TouchableOpacity 
              style={styles.insuranceContainer}
              onPress={() => setHasInsurance(!hasInsurance)}
            >
              {hasInsurance ? (
                <MaterialIcons name="check-box" size={20} color={Colors.primary.main} />
              ) : (
                <MaterialIcons name="check-box-outline-blank" size={20} color={Colors.text.tertiary} />
              )}
              <View style={styles.insuranceContent}>
                <Text style={styles.insuranceTitle}>Asuransi Pemesanan</Text>
                <Text style={styles.insuranceDesc}>
                  Melindungi produk mu selama perjalanan dari kecelakaan.
                  <Text style={styles.insuranceLink}> Pelajari</Text>
                </Text>
              </View>
              <Text style={styles.insurancePrice}>Rp2.500</Text>
            </TouchableOpacity>
          </View>
        ), false)}

        {/* Shipping Options */}
        {renderSection('Opsi Pengiriman', handleSelectShipping, (
          <View style={styles.shippingContent}>
            <View style={styles.shippingOption}>
              <Text style={styles.shippingName}>{selectedShipping.name}</Text>
              <Text style={styles.shippingPrice}>Rp{selectedShipping.price.toLocaleString('id-ID')}</Text>
            </View>
            <Text style={styles.shippingService}>{selectedShipping.service}</Text>
          </View>
        ))}

        {/* Voucher */}
        {renderSection('Voucher', undefined, (
          <TouchableOpacity style={styles.voucherContent} onPress={handleSelectVoucher}>
            <View style={styles.voucherContentLeft}>
              <MaterialIcons name="local-offer" size={20} color={Colors.error.main} />
              <Text style={styles.voucherText}>
                {selectedVouchers.length > 0 
                  ? `${selectedVouchers.length} voucher terpilih`
                  : 'Pilih Voucher'}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        ), true, undefined)}

        {/* Payment Method */}
        {renderSection('Metode Pembayaran', handleSelectPayment, (
          <TouchableOpacity 
            style={styles.paymentContent}
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
              </View>
            ) : (
              <View style={styles.paymentMethodEmpty}>
                <MaterialIcons name="account-balance-wallet" size={24} color={Colors.primary.main} />
                <Text style={styles.paymentEmptyText}>Pilih Metode Pembayaran</Text>
              </View>
            )}
          </TouchableOpacity>
        ), true, 'Ganti')}

        {/* Payment Summary */}
        {renderSection('Rincian Pembayaran', undefined, (
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Harga Produk</Text>
              <Text style={styles.summaryValue}>Rp{Math.round(calculateSubtotal()).toLocaleString('id-ID')}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Asuransi Pengiriman</Text>
              <Text style={styles.summaryValue}>
                {hasInsurance ? 'Rp2.500' : '-'}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total ongkos kirim</Text>
              <Text style={styles.summaryValue}>Rp{Math.round(selectedShipping.price).toLocaleString('id-ID')}</Text>
            </View>
            
            {calculateProductDiscount() > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Diskon Produk</Text>
                <Text style={styles.discountValue}>-Rp{Math.round(calculateProductDiscount()).toLocaleString('id-ID')}</Text>
              </View>
            )}
            
            {calculateVoucherDiscount() > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Diskon Voucher</Text>
                <Text style={styles.discountValue}>-Rp{Math.round(calculateVoucherDiscount()).toLocaleString('id-ID')}</Text>
              </View>
            )}
            
            {calculateShippingDiscount() > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Diskon Ongkos Kirim</Text>
                <Text style={styles.discountValue}>-Rp{Math.round(calculateShippingDiscount()).toLocaleString('id-ID')}</Text>
              </View>
            )}
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Biaya Admin</Text>
              <Text style={styles.summaryValue}>-</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <View style={styles.totalValueContainer}>
                <Text style={styles.totalValue}>Rp{Math.round(calculateTotal()).toLocaleString('id-ID')}</Text>
                {Math.round(calculateTotal()) === 1000 && (
                  <Text style={styles.minimumNote}>(Minimal pembayaran)</Text>
                )}
              </View>
            </View>
          </View>
        ), false)}
      </ScrollView>

      {/* Bottom Checkout Button */}
      <View style={styles.bottomContainer}>
        <View style={styles.bottomContent}>
          <Text style={styles.bottomTotal}>Rp {Math.round(calculateTotal()).toLocaleString('id-ID')}</Text>
          <TouchableOpacity 
            style={[
              styles.checkoutButton,
              !selectedPayment && styles.checkoutButtonDisabled
            ]} 
            onPress={handleCheckout}
            disabled={!selectedPayment}
          >
            <Text style={[
              styles.checkoutButtonText,
              !selectedPayment && { opacity: 0.7 }
            ]}>
              Bayar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Method Modal */}
      <PaymentMethodModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelect={handlePaymentMethodSelected}
      />

      {/* AutoKirim Configuration Modal */}
      <AutoKirimModal
        visible={showAutoKirimModal}
        onClose={() => {
          setShowAutoKirimModal(false);
          setEditingItemId(null);
        }}
        onConfirm={handleAutoKirimConfig}
        productName={cartItemsWithOptions.find(item => item.id === editingItemId)?.name || ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollView: {
    flex: 1,
    paddingBottom: Spacing.xl,
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
  
  // Section Styles
  section: {
    backgroundColor: Colors.background.primary,
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
    backgroundColor: Colors.primary.main,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  editButton: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },

  // Address Styles
  addressContent: {
    paddingHorizontal: Spacing.base,
  },
  addressName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
  addressValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },

  // Items Styles
  itemsContent: {
    paddingHorizontal: Spacing.base,
  },
  itemCard: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTags: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  tagPrimary: {
    backgroundColor: '#E3F2FD',
  },
  tagText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.warning.dark,
  },
  tagTextPrimary: {
    color: Colors.primary.main,
  },
  itemQuantity: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  itemsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },

  // Insurance Styles
  insuranceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  insuranceContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  insuranceTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  insuranceDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  insuranceLink: {
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  insurancePrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },

  // Shipping Styles
  shippingContent: {
    paddingHorizontal: Spacing.base,
  },
  shippingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  shippingName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  shippingPrice: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  shippingService: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },

  // Voucher Styles
  voucherContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  voucherContentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  voucherText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },

  // Payment Styles
  paymentContent: {
    paddingHorizontal: Spacing.base,
  },
  paymentMethodSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary.main,
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
    borderColor: Colors.primary.main,
    borderStyle: 'dashed',
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
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
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.semibold,
  },
  paymentAccount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  paymentEmptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
    marginLeft: Spacing.sm,
  },

  // Summary Styles
  summaryContent: {
    paddingHorizontal: Spacing.base,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  discountValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.warning.main,
    fontFamily: Typography.fontFamily.medium,
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
  totalValueContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  minimumNote: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Bottom Container
  bottomContainer: {
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  bottomContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomTotal: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  checkoutButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl * 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  checkoutButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  checkoutButtonDisabled: {
    backgroundColor: Colors.border.light,
    opacity: 0.8,
  },
  paymentEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
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
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary.light + '10',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary.main,
    borderStyle: 'dashed',
    marginTop: Spacing.xs,
  },
  addAddressText: {
    color: Colors.primary.main,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    marginLeft: Spacing.sm,
  },
  purchaseTypeContainer: {
    flexDirection: 'row',
    marginVertical: Spacing.sm,
    alignItems: 'center',
  },
  purchaseTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.primary,
  },
  purchaseTypeButtonActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.light + '10',
  },
  purchaseTypeContent: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  purchaseTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  purchaseTypeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
  },
  purchaseTypeTextActive: {
    color: Colors.primary.main,
  },
  autoKirimDetails: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  autoKirimSection: {
    paddingHorizontal: Spacing.base,
  },
  autoKirimItem: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.warning.light + '10',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.warning.light,
  },
  autoKirimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  autoKirimProductName: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  autoKirimDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  autoKirimLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  autoKirimValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  voucherContentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  autoKirimIcon: {
    width: 48,
    height: 48,
    marginRight: Spacing.xs,
  },
  autoKirimIconLarge: {
    width: 24,
    height: 24,
  },
  purchaseOptionsContainer: {
    flexDirection: 'row',
    marginVertical: Spacing.sm,
    gap: Spacing.lg,
  },
  purchaseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  purchaseOptionSelected: {
    backgroundColor: Colors.primary.light + '15',
  },
  purchaseOptionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
  },
  purchaseOptionTextSelected: {
    color: Colors.primary.main,
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  radioButtonSelected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary.main,
  },
  autoKirimSubOptions: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.lg,
  },
  autoKirimSubText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  globalAutoKirimOptions: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  globalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  globalOptionLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  globalOptionDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    minWidth: 120,
  },
  globalOptionValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
    flex: 1,
  },
  individualAutoKirimOptions: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.base,
  },
  autoKirimOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  autoKirimOptionLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  autoKirimOptionDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    minWidth: 140,
  },
  autoKirimOptionValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
});