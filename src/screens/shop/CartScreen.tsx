import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { HomeStackParamList } from '../../navigation/types';
import { useCart, CartItem as ContextCartItem } from '../../contexts/CartContext';
import { useProducts } from '../../hooks/useProducts';
import authService from '../../services/auth/authService';

type NavigationProp = StackNavigationProp<HomeStackParamList, 'Cart'>;

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice: number;
  quantity: number;
  image: any;
  weight: string;
  selected: boolean;
  discount?: number;
  seller?: string;
}

interface RecommendedProduct {
  id: string | number;
  name: string;
  price: number;
  originalPrice: number;
  rating: number;
  sold: number;
  image: any;
  discount: number;
  isRecommended?: boolean;
  image_1920?: string;
  qty_available?: number;
}

const FREE_SHIPPING_THRESHOLD = 500000; // Rp 500.000 for free shipping

export default function CartScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { items: contextCartItems, updateQuantity: updateCartQuantity, removeItem: removeCartItem, totalItems, totalPrice, addItem, canAddMore } = useCart();
  
  // Convert context cart items to local format with selection state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: boolean}>({});

  // Sync context items with local state
  useEffect(() => {
    const convertedItems = contextCartItems.map(item => ({
      id: item.id,
      productId: item.id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      quantity: item.quantity,
      image: item.image,
      weight: '500gr', // Default weight
      selected: selectedItems[item.id] ?? true,
      discount: item.discount,
      seller: 'PawSmart',
    }));
    setCartItems(convertedItems);
  }, [contextCartItems, selectedItems]);
  
  // Initialize selected items only when cart items change
  useEffect(() => {
    setSelectedItems(prev => {
      const newSelectedItems = { ...prev };
      let hasChanges = false;
      
      contextCartItems.forEach(item => {
        if (!(item.id in newSelectedItems)) {
          newSelectedItems[item.id] = true;
          hasChanges = true;
        }
      });
      
      // Remove items that are no longer in cart
      Object.keys(newSelectedItems).forEach(id => {
        if (!contextCartItems.some(item => item.id === id)) {
          delete newSelectedItems[id];
          hasChanges = true;
        }
      });
      
      return hasChanges ? newSelectedItems : prev;
    });
  }, [contextCartItems]);

  // Fetch recommended products from Odoo
  const { data: odooProducts, isLoading: productsLoading } = useProducts({ 
    limit: 10,
    sort_by: 'rating' // Get top-rated products as recommendations
  });

  // Fallback static products if Odoo is not available
  const [fallbackProducts] = useState<RecommendedProduct[]>([
    {
      id: '1',
      name: 'Royal Canin Persian Adult (500gr)',
      price: 85000,
      originalPrice: 90000,
      rating: 4.9,
      sold: 123,
      image: require('../../../assets/product-placeholder.jpg'),
      discount: 5,
      isRecommended: true,
    },
    {
      id: '2',
      name: 'Royal Canin Persian Adult (500gr)',
      price: 85000,
      originalPrice: 90000,
      rating: 4.9,
      sold: 123,
      image: require('../../../assets/product-placeholder.jpg'),
      discount: 5,
      isRecommended: true,
    },
    {
      id: '3',
      name: 'Royal Canin Persian Adult (500gr)',
      price: 85000,
      originalPrice: 90000,
      rating: 4.9,
      sold: 123,
      image: require('../../../assets/product-placeholder.jpg'),
      discount: 5,
      isRecommended: true,
    },
    {
      id: '4',
      name: 'Royal Canin Persian Adult (500gr)',
      price: 85000,
      originalPrice: 90000,
      rating: 4.9,
      sold: 123,
      image: require('../../../assets/product-placeholder.jpg'),
      discount: 5,
      isRecommended: true,
    },
  ]);

  // Use Odoo products if available, otherwise use fallback
  // First, deduplicate the source products
  const sourceProducts = odooProducts || fallbackProducts;
  const uniqueSourceProducts = sourceProducts.reduce((acc: any[], product: any) => {
    if (!acc.find(p => p.id.toString() === product.id.toString())) {
      acc.push(product);
    }
    return acc;
  }, []);
  
  // Filter out products that are already in the cart and products with no stock
  // Convert all IDs to strings for consistent comparison
  const cartProductIds = new Set(contextCartItems.map(item => item.id.toString()));
  const recommendedProducts = uniqueSourceProducts.filter(
    product => !cartProductIds.has(product.id.toString()) &&
    (product.qty_available === undefined || product.qty_available > 0)
  );

  const calculateTotal = () => {
    return cartItems
      .filter(item => item.selected)
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getSelectedItemsCount = () => {
    return cartItems.filter(item => item.selected).length;
  };

  const getRemainingForFreeShipping = () => {
    const total = calculateTotal();
    return Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  };

  const updateQuantity = (itemId: string, change: number) => {
    const currentItem = contextCartItems.find(item => item.id === itemId);
    if (currentItem) {
      const newQuantity = Math.max(1, currentItem.quantity + change);
      
      // Get the product's max stock from recommended products
      const product = recommendedProducts.find(p => p.id.toString() === itemId);
      const maxQty = product?.qty_available || currentItem.maxQuantity;
      
      // Check if new quantity exceeds stock
      if (maxQty && newQuantity > maxQty) {
        Alert.alert(
          'Stock Limit',
          `Maximum available quantity is ${maxQty}.`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      updateCartQuantity(itemId, newQuantity, maxQty);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const removeItem = (itemId: string) => {
    Alert.alert(
      'Hapus Produk',
      'Apakah Anda yakin ingin menghapus produk ini dari keranjang?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            removeCartItem(itemId);
            // Also remove from selected items
            setSelectedItems(prev => {
              const newSelected = { ...prev };
              delete newSelected[itemId];
              return newSelected;
            });
          },
        },
      ]
    );
  };

  const handleCheckout = async () => {
    // Check if user is authenticated before navigating to checkout
    const isAuthenticated = await authService.isAuthenticated();
    
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Silakan login terlebih dahulu untuk melanjutkan checkout',
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
    
    // Navigate to checkout if authenticated
    navigation.navigate('Checkout');
  };

  const addToCart = (product: RecommendedProduct) => {
    // Use the cart context to add the item with stock limit
    const added = addItem({
      id: product.id.toString(),
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: product.image_1920 ? 
        { uri: `data:image/jpeg;base64,${product.image_1920}` } : 
        (product.image || require('../../../assets/product-placeholder.jpg')),
      discount: product.discount || 0,
      maxQuantity: product.qty_available,
    });
    
    if (added) {
      // Modal will be shown automatically by CartContext
    } else if (product.qty_available) {
      Alert.alert(
        'Stock Limit Reached',
        `You can only add ${product.qty_available} of this item to cart.`,
        [{ text: 'OK' }]
      );
    }
  };

  const renderEmptyCart = () => (
    <>
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emptyCartSection}>
          <Image 
            source={require('../../../assets/chart maskot.png')} 
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>Keranjang belanjamu masih kosong</Text>
          <Text style={styles.emptySubtitle}>Yuk, telusuri promo menarik</Text>
          <TouchableOpacity 
            style={styles.shopNowButton}
            onPress={() => navigation.navigate('HomeScreen')}
          >
            <Text style={styles.shopNowText}>Belanja Sekarang</Text>
          </TouchableOpacity>
        </View>

        {/* Recommended Products for Empty Cart */}
        {recommendedProducts.length > 0 && (
          <View style={styles.emptyRecommendedSection}>
            <Text style={styles.recommendedTitle}>Mungkin Kamu Suka</Text>
            <View style={styles.emptyRecommendedGrid}>
              {recommendedProducts.slice(0, 4).map((item) => {
                const imageSource = item.image_1920 ? 
                  { uri: `data:image/jpeg;base64,${item.image_1920}` } : 
                  (item.image || require('../../../assets/product-placeholder.jpg'));
                
                return (
                  <TouchableOpacity 
                    key={item.id}
                    style={styles.emptyRecommendedCard}
                    onPress={() => navigation.navigate('ProductDetail', { productId: item.id.toString() })}
                  >
                    {item.discount && item.discount > 0 ? (
                      <View style={styles.emptyDiscountBadge}>
                        <Text style={styles.emptyDiscountText}>Discount {item.discount}%</Text>
                      </View>
                    ) : null}
                    
                    <Image source={imageSource} style={styles.emptyRecommendedImage} resizeMode="cover" />
                    
                    <View style={styles.emptyRecommendedInfo}>
                      <Text style={styles.emptyRecommendedName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <View style={styles.emptyRecommendedRating}>
                        <MaterialIcons name="star" size={12} color="#FFC107" />
                        <Text style={styles.emptyRecommendedRatingText}>{(item.rating || 0).toFixed(1)}</Text>
                        <Text style={styles.emptyRecommendedSoldText}> · {(item.sold || 0)} Sold</Text>
                      </View>
                      <Text style={styles.emptyRecommendedPrice}>
                        Rp{item.price.toLocaleString('id-ID')}/{item.weight || 'pcs'}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={[
                        styles.emptyRecommendedAddButton,
                        item.qty_available === 0 ? styles.recommendedAddButtonDisabled : null
                      ]}
                      onPress={() => item.qty_available > 0 ? addToCart(item) : null}
                      disabled={item.qty_available === 0}
                    >
                      <MaterialIcons 
                        name="add" 
                        size={20} 
                        color={Colors.text.white} 
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );

  const renderCartItem = (item: CartItem) => (
    <View key={item.id} style={styles.cartItem}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => toggleItemSelection(item.id)}
      >
        {item.selected ? (
          <MaterialIcons name="check-box" size={24} color={Colors.primary.main} />
        ) : (
          <MaterialIcons name="check-box-outline-blank" size={24} color={Colors.text.tertiary} />
        )}
      </TouchableOpacity>

      <View style={styles.itemContent}>
        {item.discount && item.discount > 0 ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>Discount {item.discount}%</Text>
          </View>
        ) : null}
        
        <Image source={item.image} style={styles.itemImage} resizeMode="cover" />
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
          {item.seller ? (
            <View style={styles.sellerContainer}>
              <MaterialIcons name="local-shipping" size={14} color={Colors.warning.main} />
              <Text style={styles.sellerText}> {item.seller}</Text>
            </View>
          ) : null}
          
          <View style={styles.priceContainer}>
            {item.originalPrice > item.price ? (
              <Text style={styles.originalPrice}>Rp{item.originalPrice.toLocaleString('id-ID')}</Text>
            ) : null}
            <Text style={styles.itemPrice}>Rp{item.price.toLocaleString('id-ID')}</Text>
          </View>

          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, -1)}
            >
              <MaterialIcons name="remove" size={20} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, 1)}
            >
              <MaterialIcons name="add" size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => removeItem(item.id)}
        >
          <MaterialIcons name="delete-outline" size={20} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecommendedProduct = ({ item }: { item: RecommendedProduct }) => {
    // Get the correct image source
    const imageSource = item.image_1920 ? 
      { uri: `data:image/jpeg;base64,${item.image_1920}` } : 
      (item.image || require('../../../assets/product-placeholder.jpg'));
    
    return (
      <TouchableOpacity 
        style={styles.recommendedCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id.toString() })}
      >
        {item.discount && item.discount > 0 ? (
          <View style={styles.recommendedDiscountBadge}>
            <Text style={styles.recommendedDiscountText}>Discount {item.discount}%</Text>
          </View>
        ) : null}
        <Image source={imageSource} style={styles.recommendedImage} resizeMode="cover" />
        
        {/* Stock indicator */}
        {item.qty_available !== undefined ? (
          <View style={[styles.stockIndicator, item.qty_available > 0 ? styles.inStock : styles.outOfStock]}>
            <Text style={styles.stockIndicatorText}>
              {item.qty_available > 0 ? `Stok: ${item.qty_available}` : 'Habis'}
            </Text>
          </View>
        ) : null}
      
        {item.isRecommended ? (
          <View style={styles.recommendedBadge}>
            <MaterialIcons name="local-fire-department" size={10} color={Colors.text.white} />
            <Text style={styles.recommendedBadgeText}>Rekomendasi</Text>
          </View>
        ) : null}
      
      <View style={styles.recommendedInfo}>
        <Text style={styles.recommendedName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.recommendedRating}>
          <MaterialIcons name="star" size={12} color="#FFC107" />
          <Text style={styles.recommendedRatingText}>{(item.rating || 0).toString()}</Text>
          <Text style={styles.recommendedSoldText}> · {(item.sold || 0).toString()} Sold</Text>
        </View>
        <Text style={styles.recommendedPrice}>Rp{item.price.toLocaleString('id-ID')}</Text>
        {item.originalPrice > item.price ? (
          <Text style={styles.recommendedOriginalPrice}>Rp{item.originalPrice.toLocaleString('id-ID')}</Text>
        ) : null}
      </View>
      
        <TouchableOpacity 
          style={[
            styles.recommendedAddButton, 
            item.qty_available === 0 ? styles.recommendedAddButtonDisabled : null,
            !canAddMore(item.id.toString(), item.qty_available) ? styles.recommendedAddButtonMaxed : null
          ]}
          onPress={() => (item.qty_available > 0 && canAddMore(item.id.toString(), item.qty_available)) ? addToCart(item) : null}
          disabled={item.qty_available === 0 || !canAddMore(item.id.toString(), item.qty_available)}
        >
          <Text style={styles.recommendedAddText}>
            {item.qty_available === 0 ? '✕' : !canAddMore(item.id.toString(), item.qty_available) ? '✓' : '+'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const total = calculateTotal();
  const remainingForFreeShipping = getRemainingForFreeShipping();
  const selectedCount = getSelectedItemsCount();

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Keranjang</Text>
        <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>

      {cartItems.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Cart Items */}
            <View style={styles.cartItems}>
              {cartItems.map(renderCartItem)}
            </View>

            {/* Recommended Products */}
            <View style={styles.recommendedSection}>
              <Text style={styles.recommendedTitle}>Mungkin Kamu Suka</Text>
              <FlatList
                horizontal
                data={recommendedProducts}
                renderItem={renderRecommendedProduct}
                keyExtractor={(item, index) => `recommended-${item.id}-${index}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendedList}
              />
            </View>
          </ScrollView>

          {/* Checkout Summary */}
          <View style={styles.checkoutContainer}>
            <View style={styles.summaryContainer}>
              <Text style={styles.selectedItemsText}>
                Item dipilih ({selectedCount})
              </Text>
              <Text style={styles.totalText}>
                Total : Rp {total.toLocaleString('id-ID')}
              </Text>
            </View>

            {/* Free Shipping Info */}
            <View style={styles.shippingInfo}>
              {remainingForFreeShipping > 0 ? (
                <View style={styles.shippingWarning}>
                  <Image 
                    source={require('../../../assets/icon-belanja.png')} 
                    style={styles.shippingIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.shippingText}>
                    Ayo tambah Rp {remainingForFreeShipping.toLocaleString('id-ID')} lagi untuk mendapatkan gratis ongkir!
                  </Text>
                </View>
              ) : (
                <View style={styles.shippingSuccess}>
                  <Image 
                    source={require('../../../assets/icon-belanja.png')} 
                    style={styles.shippingIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.shippingSuccessText}>
                    Selamat! kamu dapat gratis ongkir
                  </Text>
                </View>
              )}
              
              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar,
                    { 
                      width: `${Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100)}%` 
                    }
                  ]} 
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.checkoutButton,
                selectedCount === 0 ? styles.checkoutButtonDisabled : null
              ]}
              disabled={selectedCount === 0}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  headerSafeArea: {
    backgroundColor: Colors.background.primary,
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
  content: {
    flex: 1,
  },
  
  // Empty Cart Styles
  emptyCartSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 3,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.background.primary,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  shopNowButton: {
    backgroundColor: '#00BCD4',
    paddingHorizontal: Spacing.xl * 3,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    width: '90%',
  },
  shopNowText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    textAlign: 'center',
  },
  
  // Empty Cart Recommended Products
  emptyRecommendedSection: {
    backgroundColor: Colors.background.primary,
    paddingVertical: Spacing.base,
    marginTop: Spacing.md,
  },
  emptyRecommendedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  emptyRecommendedCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    width: '47%',
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  emptyDiscountBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: Colors.error.main,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    zIndex: 2,
  },
  emptyDiscountText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  emptyRecommendedImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
  },
  emptyRecommendedInfo: {
    padding: Spacing.sm,
  },
  emptyRecommendedName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    height: 32,
  },
  emptyRecommendedRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  emptyRecommendedRatingText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginLeft: 2,
  },
  emptyRecommendedSoldText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  emptyRecommendedPrice: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.success.main,
  },
  emptyRecommendedAddButton: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },

  // Cart Items Styles
  cartItems: {
    backgroundColor: Colors.background.primary,
    marginBottom: Spacing.md,
  },
  cartItem: {
    flexDirection: 'row',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  checkbox: {
    marginRight: Spacing.sm,
    marginTop: Spacing.sm,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: Colors.error.main,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    zIndex: 1,
  },
  discountText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
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
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sellerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  priceContainer: {
    marginBottom: Spacing.sm,
  },
  originalPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  itemPrice: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.error.main,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    padding: Spacing.xs,
  },
  quantityText: {
    paddingHorizontal: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  deleteButton: {
    padding: Spacing.sm,
  },

  // Recommended Products Styles
  recommendedSection: {
    backgroundColor: Colors.background.primary,
    paddingVertical: Spacing.base,
    paddingBottom: Spacing.base, // Reset to normal padding
    marginBottom: Spacing.md,
  },
  recommendedTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginLeft: Spacing.base,
    marginBottom: Spacing.md,
  },
  recommendedList: {
    paddingHorizontal: Spacing.base,
  },
  recommendedCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    width: 160,
    elevation: 2,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
  },
  recommendedDiscountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.error.main,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    zIndex: 2,
  },
  recommendedDiscountText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
  recommendedImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
  },
  recommendedBadge: {
    position: 'absolute',
    top: 120,
    left: Spacing.sm,
    backgroundColor: '#FF6B35',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  recommendedBadgeText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    marginLeft: 2,
  },
  recommendedInfo: {
    padding: Spacing.sm,
  },
  recommendedName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  recommendedRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  recommendedRatingText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginLeft: 2,
  },
  recommendedSoldText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  recommendedPrice: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  recommendedOriginalPrice: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  recommendedAddButton: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendedAddButtonDisabled: {
    backgroundColor: Colors.text.tertiary,
    opacity: 0.5,
  },
  recommendedAddButtonMaxed: {
    backgroundColor: Colors.warning.main,
  },
  stockIndicator: {
    position: 'absolute',
    top: 110,
    right: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  inStock: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  outOfStock: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
  },
  stockIndicatorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.white,
    fontFamily: Typography.fontFamily.medium,
  },
  recommendedAddText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
  },

  // Checkout Summary Styles
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  selectedItemsText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  totalText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary.main,
  },
  shippingInfo: {
    marginBottom: Spacing.md,
  },
  shippingWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  shippingSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  shippingIcon: {
    width: 24,
    height: 24,
    marginRight: Spacing.sm,
  },
  shippingText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.warning.dark,
  },
  shippingSuccessText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.success.dark,
    fontFamily: Typography.fontFamily.medium,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.border.light,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary.main,
  },
  checkoutButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: Colors.text.tertiary,
  },
  checkoutButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
});