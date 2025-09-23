import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/colors';
import productService from '../../services/product/productService';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { HomeStackParamList, PromoStackParamList } from '../../navigation/types';
import { useProduct, useProducts } from '../../hooks/useProducts';
import { useCart } from '../../contexts/CartContext';
import { ActivityIndicator } from 'react-native';
import { queryClient } from '../../config/queryClient';

const { width } = Dimensions.get('window');

// Support navigation from both Home and Promo stacks
type NavigationProp = StackNavigationProp<HomeStackParamList, 'ProductDetail'> | StackNavigationProp<PromoStackParamList, 'ProductDetail'>;
type RoutePropType = RouteProp<HomeStackParamList, 'ProductDetail'> | RouteProp<PromoStackParamList, 'ProductDetail'>;

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

interface RelatedProduct {
  id: string | number;
  name: string;
  price: number;
  originalPrice: number;
  rating: number;
  sold: number;
  discount: number;
  image: any;
  image_1920?: string;
  qty_available?: number;
}

const mockReviews: Review[] = [
  {
    id: '1',
    userName: 'Samuel Ramadhan',
    rating: 4,
    comment: 'This is the first time I\'ve used this service. The work was very powerful!',
    date: '2 Mei 2025',
  },
  {
    id: '2',
    userName: 'Samuel Ramadhan',
    rating: 4,
    comment: 'This is the first time I\'ve used this service. The work was very powerful!',
    date: '2 Mei 2025',
  },
  {
    id: '3',
    userName: 'Samuel Ramadhan',
    rating: 4,
    comment: 'This is the first time I\'ve used this service. The work was very powerful!',
    date: '2 Mei 2025',
  },
];

// Fallback related products if Odoo data is not available
const fallbackRelatedProducts: RelatedProduct[] = [
  {
    id: '1',
    name: 'Royal Canin persian Adult (500gr)',
    price: 85000,
    originalPrice: 90000,
    rating: 4.9,
    sold: 123,
    discount: 5,
    image: require('../../../assets/product-placeholder.jpg'),
  },
  {
    id: '2',
    name: 'Royal Canin persian Adult (500gr)',
    price: 85000,
    originalPrice: 90000,
    rating: 4.9,
    sold: 123,
    discount: 5,
    image: require('../../../assets/product-placeholder.jpg'),
  },
];

// Optimized Product Image Component with caching
const OptimizedImage = memo(({ 
  uri, 
  style, 
  imageId,
  fallback 
}: { 
  uri: string | any; 
  style: any; 
  imageId: string;
  fallback?: any;
}) => {
  const [imageSource, setImageSource] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadImage = async () => {
      try {
        // If uri is not a string (e.g., require() image), use it directly
        if (uri && typeof uri !== 'string') {
          setImageSource(uri);
          setIsLoading(false);
          return;
        }
        
        // Check cache first for string URIs
        if (uri && typeof uri === 'string') {
          const cacheKey = `detail_img_${imageId}`;
          const cachedUri = await AsyncStorage.getItem(cacheKey);
          if (cachedUri && cachedUri !== 'undefined') {
            setImageSource({ uri: cachedUri });
            setIsLoading(false);
            return;
          }
          
          // Load and cache new image
          setImageSource({ uri });
          await AsyncStorage.setItem(cacheKey, uri);
        } else {
          // Use fallback image
          setImageSource(fallback || require('../../../assets/product-placeholder.jpg'));
        }
      } catch (error) {
        setImageSource(fallback || require('../../../assets/product-placeholder.jpg'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadImage();
  }, [uri, imageId, fallback]);
  
  if (isLoading) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }
  
  return <Image source={imageSource} style={style} resizeMode="contain" />;
});

export default function ProductDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { productId } = route.params;
  const { addItem, canAddMore, getItemQuantity } = useCart();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'autokirim' | 'sekali'>('autokirim');
  const [quantity, setQuantity] = useState(1);

  // Fetch real product data from Odoo
  const { data: productData, isLoading, error } = useProduct(productId);
  
  // Fetch related products from same category or all products
  const { data: relatedProductsData, isLoading: relatedLoading } = useProducts({ 
    category_id: productData?.categ_id?.[0],
    limit: 10 
  });
  
  // Prefetch next likely products when this screen loads
  useFocusEffect(
    useCallback(() => {
      // Prefetch related products for smoother navigation
      if (productData?.categ_id?.[0]) {
        queryClient.prefetchQuery({
          queryKey: ['products', 'detail', productData.categ_id[0]],
          queryFn: async () => {
            return productService.getProducts({
              category_id: productData.categ_id[0],
              limit: 10
            });
          },
          staleTime: 5 * 60 * 1000,
        });
      }
    }, [productData?.categ_id])
  );

  // Use Odoo data or fallback
  const product = productData || {
    id: productId,
    name: 'Loading...',
    brand: 'Loading...',
    price: 0,
    originalPrice: 0,
    discount: 0,
    rating: 0,
    sold: 0,
    stock: 0,
    qty_available: 0,
    description: 'Loading product details...',
    description_sale: '',
    default_code: '',
    barcode: '',
    uom_name: '',
    categ_id: null,
    category: '',
    image_1920: '',
  };

  // Create images array from Odoo image or use placeholder
  const productImages = useMemo(() => {
    return product.image_1920 ? 
      [{ uri: `data:image/jpeg;base64,${product.image_1920}` }] : 
      [
        require('../../../assets/product-placeholder.jpg'),
        require('../../../assets/product-placeholder.jpg'),
        require('../../../assets/product-placeholder.jpg'),
        require('../../../assets/product-placeholder.jpg'),
      ];
  }, [product.image_1920]);
  
  // Memoize related products
  const relatedProducts = useMemo(() => {
    if (!relatedProductsData || relatedProductsData.length === 0) {
      return fallbackRelatedProducts;
    }
    // Filter out current product from related
    return relatedProductsData.filter((p: any) => p.id !== productId).slice(0, 6);
  }, [relatedProductsData, productId]);

  const handleBuyNow = useCallback(() => {
    // Check if quantity exceeds available stock
    const currentInCart = getItemQuantity(product.id.toString());
    const maxCanAdd = product.qty_available ? product.qty_available - currentInCart : quantity;
    const actualQuantityToAdd = Math.min(quantity, maxCanAdd);
    
    if (actualQuantityToAdd <= 0) {
      Alert.alert(
        'Stock Limit Reached',
        `You already have the maximum quantity (${product.qty_available}) in your cart.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Add to cart with stock limit
    let addedCount = 0;
    for (let i = 0; i < actualQuantityToAdd; i++) {
      const added = addItem({
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        image: product.image_1920 ? { uri: `data:image/jpeg;base64,${product.image_1920}` } : require('../../../assets/product-placeholder.jpg'),
        discount: product.discount,
        maxQuantity: product.qty_available,
      });
      if (added) addedCount++;
    }
    
    if (addedCount < quantity && product.qty_available) {
      Alert.alert(
        'Partial Quantity Added',
        `Only ${addedCount} items were added due to stock limit (${product.qty_available} available).`,
        [{ text: 'OK', onPress: () => (navigation as any).navigate('Checkout') }]
      );
    } else {
      // Navigate to checkout
      (navigation as any).navigate('Checkout');
    }
  }, [quantity, product, addItem, getItemQuantity, navigation]);

  const handleAddRelatedToCart = useCallback((item: any) => {
    // Add related product to cart with stock limit
    const added = addItem({
      id: item.id.toString(),
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice || item.price,
      image: item.image_1920 ? 
        { uri: `data:image/jpeg;base64,${item.image_1920}` } : 
        (item.image || require('../../../assets/product-placeholder.jpg')),
      discount: item.discount || 0,
      maxQuantity: item.qty_available,
    });
    
    if (!added && item.qty_available) {
      Alert.alert(
        'Stock Limit Reached',
        `You can only add ${item.qty_available} of this item to cart.`,
        [{ text: 'OK' }]
      );
    }
  }, [addItem]);

  const incrementQuantity = useCallback(() => {
    // Check against stock limit
    const currentInCart = getItemQuantity(product.id.toString());
    const maxAvailable = product.qty_available ? product.qty_available - currentInCart : 999;
    
    if (quantity < maxAvailable) {
      setQuantity(quantity + 1);
    } else if (product.qty_available) {
      Alert.alert(
        'Stock Limit',
        `Maximum available quantity is ${product.qty_available}. You have ${currentInCart} in cart.`,
        [{ text: 'OK' }]
      );
    }
  }, [quantity, product, getItemQuantity]);

  const decrementQuantity = useCallback(() => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  }, [quantity]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Produk</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="share" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.main} />
            <Text style={styles.loadingText}>Loading product details...</Text>
          </View>
        ) : null}

        {/* Product Image Gallery */}
        <View style={styles.imageSection}>
          <Image
            source={productImages[selectedImageIndex]}
            style={styles.productMainImage}
            resizeMode="contain"
          />
          
          {/* Rating Badge */}
          <View style={styles.ratingBadge}>
            <MaterialIcons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingBadgeText}>{(product.rating || 4.5).toString()}</Text>
          </View>

          {/* Stock Badge */}
          {product.qty_available !== undefined ? (
            <View style={[styles.stockBadge, product.qty_available > 0 ? styles.inStockBadge : styles.outOfStockBadge]}>
              <Text style={styles.stockBadgeText}>
                {product.qty_available > 0 ? `Stock: ${product.qty_available.toString()}` : 'Out of Stock'}
              </Text>
            </View>
          ) : null}

          {/* Image Counter */}
          <View style={styles.imageCounter}>
            <MaterialIcons name="photo-library" size={16} color={Colors.text.secondary} />
            <Text style={styles.imageCounterText}>1/{productImages.length.toString()}</Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name || product.display_name}</Text>
          <Text style={styles.productBrand}>{product.categ_id?.[1] || product.category || 'Pet Product'}</Text>
          <Text style={styles.soldText}>{(product.sold || 0).toString()} sold</Text>
          {product.default_code ? (
            <Text style={styles.skuText}>SKU: {product.default_code}</Text>
          ) : null}
        </View>

        {/* Description Section */}
        <TouchableOpacity style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Deskripsi Produk</Text>
          <MaterialIcons name="chevron-right" size={24} color={Colors.text.tertiary} />
        </TouchableOpacity>
        <View style={styles.descriptionContainer}>
          <RenderHtml
            contentWidth={width - (Spacing.base * 2)}
            source={{ 
              html: product.description || product.description_sale || '<p>No description available</p>' 
            }}
            tagsStyles={{
              p: {
                fontSize: Typography.fontSize.sm,
                color: Colors.text.secondary,
                lineHeight: 20,
                margin: 0,
                padding: 0,
              },
              br: {
                height: 5,
              },
              div: {
                fontSize: Typography.fontSize.sm,
                color: Colors.text.secondary,
                lineHeight: 20,
              },
            }}
            systemFonts={[]}
          />
        </View>

        {/* Purchase Options */}
        <View style={styles.purchaseSection}>
          <Text style={styles.sectionTitle}>Pilih Proses Pembelian</Text>
          
          {/* AutoKirim Option */}
          <TouchableOpacity 
            style={[styles.purchaseOption, selectedOption === 'autokirim' ? styles.purchaseOptionActive : null]}
            onPress={() => setSelectedOption('autokirim')}
          >
            <View style={styles.optionLeft}>
              <MaterialIcons name="local-shipping" size={20} color="#F39C12" />
              <Text style={styles.optionLabel}>AutoKirim</Text>
            </View>
            <View style={styles.optionRight}>
              <Text style={styles.optionPrice}>Rp {(product.price || 0).toLocaleString('id-ID')}</Text>
              {product.originalPrice && product.originalPrice > product.price ? (
                <Text style={styles.optionOriginalPrice}>/{product.originalPrice.toLocaleString('id-ID')}</Text>
              ) : null}
            </View>
            <View style={[styles.radioButton, selectedOption === 'autokirim' ? styles.radioButtonActive : null]}>
              {selectedOption === 'autokirim' ? <View style={styles.radioButtonInner} /> : null}
            </View>
          </TouchableOpacity>
          <Text style={styles.optionDescription}>
            Otomatis kirim setiap bulannya dengan diskon 5%.
          </Text>

          {/* Sekali Beli Option */}
          <TouchableOpacity 
            style={[styles.purchaseOption, selectedOption === 'sekali' ? styles.purchaseOptionActive : null]}
            onPress={() => setSelectedOption('sekali')}
          >
            <View style={styles.optionLeft}>
              <Text style={styles.optionLabel}>Sekali Beli</Text>
            </View>
            <View style={styles.optionRight}>
              <Text style={styles.optionPrice}>Rp {(product.originalPrice || product.price || 0).toLocaleString('id-ID')}</Text>
            </View>
            <View style={[styles.radioButton, selectedOption === 'sekali' ? styles.radioButtonActive : null]}>
              {selectedOption === 'sekali' ? <View style={styles.radioButtonInner} /> : null}
            </View>
          </TouchableOpacity>
          <Text style={styles.optionDescription}>
            Hemat Rp 5.000, untuk sekali beli.
          </Text>
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Ulasan Terbaru</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllLink}>Lihat Semua Ulasan</Text>
            </TouchableOpacity>
          </View>

          {mockReviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewRating}>
                  {[...Array(5)].map((_, i) => (
                    <MaterialIcons 
                      key={i} 
                      name={i < review.rating ? "star" : "star-border"} 
                      size={14} 
                      color="#FFD700" 
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <View style={styles.reviewFooter}>
                <Text style={styles.reviewerName}>{review.userName}</Text>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Related Products */}
        <View style={styles.relatedSection}>
          <Text style={styles.sectionTitle}>Mungkin kamu suka</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(relatedProductsData || fallbackRelatedProducts)
              .filter(item => item.id !== product.id)
              .slice(0, 6)
              .map((item) => {
                // Get the correct image source
                const imageSource = item.image_1920 ? 
                  { uri: `data:image/jpeg;base64,${item.image_1920}` } : 
                  (item.image || require('../../../assets/product-placeholder.jpg'));
                
                return (
                  <View key={item.id.toString()} style={styles.relatedCard}>
                    <TouchableOpacity 
                      onPress={() => (navigation as any).push('ProductDetail', { productId: item.id.toString() })}
                      style={styles.relatedCardTouchable}
                    >
                      {item.discount && item.discount > 0 ? (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>-{item.discount}%</Text>
                        </View>
                      ) : null}
                      <Image source={imageSource} style={styles.relatedImage} />
                      
                      {/* Stock indicator */}
                      {item.qty_available !== undefined && (
                        <View style={[styles.stockIndicator, item.qty_available > 0 ? styles.inStock : styles.outOfStock]}>
                          <Text style={styles.stockIndicatorText}>
                            {item.qty_available > 0 ? `Stok: ${item.qty_available}` : 'Habis'}
                          </Text>
                        </View>
                      )}
                      
                      <View style={styles.relatedInfo}>
                        <MaterialIcons name="local-shipping" size={14} color="#F39C12" />
                        <Text style={styles.autoKirimLabel}>AutoKirim</Text>
                      </View>
                      <Text style={styles.relatedName} numberOfLines={2}>{item.name || ''}</Text>
                      <View style={styles.relatedRating}>
                        <MaterialIcons name="star" size={14} color="#FFD700" />
                        <Text style={styles.relatedRatingText}>{(item.rating || 0).toString()}</Text>
                        <Text style={styles.relatedSold}> · {(item.sold || 0).toString()} Sold</Text>
                      </View>
                      <View style={styles.relatedPriceContainer}>
                        <Text style={styles.relatedPrice}>Rp{(item.price || 0).toLocaleString('id-ID')}</Text>
                        {item.originalPrice && item.originalPrice > item.price ? (
                          <Text style={styles.relatedOriginalPrice}>Rp{item.originalPrice.toLocaleString('id-ID')}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                    
                    {/* Add to cart button - separate from product navigation */}
                    <TouchableOpacity 
                      style={[
                        styles.addButton, 
                        item.qty_available === 0 ? styles.addButtonDisabled : null,
                        !canAddMore(item.id.toString(), item.qty_available) ? styles.addButtonMaxed : null
                      ]}
                      onPress={() => (item.qty_available > 0 && canAddMore(item.id.toString(), item.qty_available)) ? handleAddRelatedToCart(item) : null}
                      disabled={item.qty_available === 0 || !canAddMore(item.id.toString(), item.qty_available)}
                    >
                      <MaterialIcons 
                        name={item.qty_available === 0 ? "close" : !canAddMore(item.id.toString(), item.qty_available) ? "check" : "add"} 
                        size={20} 
                        color={Colors.text.white} 
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
          </ScrollView>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalPrice}>Rp {((product.price || 0) * quantity).toLocaleString('id-ID')}</Text>
          {product.qty_available === 0 && (
            <Text style={styles.outOfStockText}>Stok Habis</Text>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.buyButton, product.qty_available === 0 ? styles.buyButtonDisabled : null]} 
          onPress={product.qty_available > 0 ? handleBuyNow : null}
          disabled={product.qty_available === 0}
        >
          <Text style={styles.buyButtonText}>
            {product.qty_available === 0 ? 'Stok Habis' : 'Beli Sekarang'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  imageSection: {
    height: 300,
    backgroundColor: Colors.background.secondary,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productMainImage: {
    width: '80%',
    height: '80%',
  },
  ratingBadge: {
    position: 'absolute',
    top: Spacing.base,
    left: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  ratingBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    marginLeft: Spacing.xs,
  },
  stockBadge: {
    position: 'absolute',
    top: Spacing.base,
    right: Spacing.base,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  inStockBadge: {
    backgroundColor: Colors.success.light,
  },
  outOfStockBadge: {
    backgroundColor: Colors.error.light,
  },
  stockBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  skuText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  imageCounter: {
    position: 'absolute',
    bottom: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  imageCounterText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.white,
    marginLeft: Spacing.xs,
  },
  productInfo: {
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  productName: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  productBrand: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    marginBottom: Spacing.xs,
  },
  soldText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  descriptionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  descriptionContainer: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
  },
  purchaseSection: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 8,
    borderTopColor: Colors.background.secondary,
  },
  purchaseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  purchaseOptionActive: {
    borderColor: Colors.primary.main,
    backgroundColor: '#E8F4F8',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionPrice: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary.main,
  },
  optionOriginalPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border.dark,
    marginLeft: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonActive: {
    borderColor: Colors.primary.main,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary.main,
  },
  optionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginLeft: Spacing.base,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  reviewsSection: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 8,
    borderTopColor: Colors.background.secondary,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  seeAllLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
  },
  reviewCard: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  reviewHeader: {
    marginBottom: Spacing.sm,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewerName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  reviewDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  relatedSection: {
    paddingVertical: Spacing.lg,
    borderTopWidth: 8,
    borderTopColor: Colors.background.secondary,
  },
  relatedCard: {
    width: 160,
    marginLeft: Spacing.base,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    position: 'relative',
  },
  relatedCardTouchable: {
    flex: 1,
  },
  stockIndicator: {
    position: 'absolute',
    top: 140,
    right: Spacing.sm,
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
  discountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
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
  relatedImage: {
    width: '100%',
    height: 140,
    resizeMode: 'contain',
  },
  addButton: {
    position: 'absolute',
    top: 100,
    right: Spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  relatedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  autoKirimLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  relatedName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.xs,
  },
  relatedRating: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.xs,
  },
  relatedRatingText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  relatedSold: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  relatedPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.xs,
  },
  relatedPrice: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary.main,
    marginLeft: Spacing.xs,
  },
  relatedOriginalPrice: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  relatedFinalPrice: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    paddingHorizontal: Spacing.sm,
  },
  relatedStrikePrice: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    alignItems: 'center',
  },
  totalContainer: {
    flex: 1,
  },
  totalPrice: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  buyButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  buyButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
  },
  buyButtonDisabled: {
    backgroundColor: Colors.text.tertiary,
    opacity: 0.6,
  },
  outOfStockText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error.main,
    marginTop: 4,
  },
  addButtonDisabled: {
    backgroundColor: Colors.text.tertiary,
    opacity: 0.6,
  },
  addButtonMaxed: {
    backgroundColor: Colors.warning.main,
  },
});