import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { HomeStackParamList } from '../../navigation/types';
import { useCart } from '../../contexts/CartContext';
import { useProducts, useProductBrands, useProductCategories } from '../../hooks/useProducts';
import { Product } from '../../services';

type NavigationProp = StackNavigationProp<HomeStackParamList, 'HomeScreen'>;

const { width } = Dimensions.get('window');

// Static brands array - these can be fetched from Odoo if brand images are stored there
const staticBrands = [
  { id: '1', name: 'Royal Canin', image: require('../../../assets/brand-royal-canin.png') },
  { id: '2', name: 'Pedigree', image: require('../../../assets/brand-pedigree.png') },
  { id: '3', name: 'Pruina Pro Plan', image: require('../../../assets/brand-proplan.png') },
  { id: '4', name: 'Bolt', image: require('../../../assets/brand-bolt.png') },
  { id: '5', name: 'Me-O', image: require('../../../assets/brand-meo.png') },
  { id: '6', name: 'Whiskas', image: require('../../../assets/brand-pedigree2.png') }, // Temporary use pedigree2 until Whiskas image is added
];

// Fallback products for when API is unavailable
const fallbackProducts: Product[] = [
  {
    id: '1',
    name: 'Royal Canin Persian Adult (500gr)',
    price: 85000,
    originalPrice: 90000,
    rating: 4.9,
    sold: 456,
    image: require('../../../assets/product-placeholder.jpg'),
    discount: 5,
    isRecommended: true,
    brand: 'Royal Canin',
    category: 'Cat Food',
  },
  {
    id: '2',
    name: 'Whiskas Adult Tuna (1kg)',
    price: 45000,
    originalPrice: 50000,
    rating: 4.7,
    sold: 789,
    image: require('../../../assets/product-placeholder.jpg'),
    discount: 10,
    isRecommended: false,
    brand: 'Whiskas',
    category: 'Cat Food',
  },
  {
    id: '3',
    name: 'Pro Plan Cat Food (2kg)',
    price: 120000,
    originalPrice: 140000,
    rating: 4.8,
    sold: 234,
    image: require('../../../assets/product-placeholder.jpg'),
    discount: 14,
    isRecommended: true,
    brand: 'Pro Plan',
    category: 'Cat Food',
  },
  {
    id: '4',
    name: 'Pedigree Adult Dog Food (1.5kg)',
    price: 75000,
    originalPrice: 85000,
    rating: 4.6,
    sold: 567,
    image: require('../../../assets/product-placeholder.jpg'),
    discount: 12,
    isRecommended: false,
    brand: 'Pedigree',
    category: 'Dog Food',
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { addItem, getItemQuantity, totalItems, canAddMore } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  
  // Fetch data from Odoo API - get all products and filter client-side
  const { 
    data: products = fallbackProducts, 
    isLoading: productsLoading, 
    error: productsError,
    refetch: refetchProducts 
  } = useProducts(); // Remove server-side filtering, do it client-side
  
  const { 
    data: brandsData, 
    isLoading: brandsLoading 
  } = useProductBrands();
  
  const { 
    data: categoriesData = [], 
    isLoading: categoriesLoading 
  } = useProductCategories();
  
  // Use API brands if available, otherwise use static
  const brands = brandsData || staticBrands;
  
  // Define categories with icons
  const categories = [
    { 
      name: 'All Products', 
      icon: require('../../../assets/icons/search/pet type - all.png'),
      id: undefined 
    },
    { 
      name: 'Dog', 
      icon: require('../../../assets/icons/search/pet type - dog.png'),
      id: 'dog' 
    },
    { 
      name: 'Cat', 
      icon: require('../../../assets/icons/search/pet type - cat.png'),
      id: 'cat' 
    },
    { 
      name: 'Bird', 
      icon: require('../../../assets/icons/search/pet type - bird.png'),
      id: 'bird' 
    },
    { 
      name: 'Fish', 
      icon: require('../../../assets/icons/search/pet type - fish.png'),
      id: 'fish' 
    },
    { 
      name: 'Reptile', 
      icon: require('../../../assets/icons/search/pet type - Reptile.png'),
      id: 'reptile' 
    },
  ];
  
  // Handle category selection
  const handleCategorySelect = (category: any) => {
    setSelectedCategory(category.name);
    if (category.name === 'All Products') {
      setSelectedCategoryId(undefined);
    } else {
      // Try to find matching category from API, otherwise use the category id
      const apiCategory = categoriesData?.find(c => c.name.toLowerCase() === category.name.toLowerCase());
      setSelectedCategoryId(apiCategory?.id || category.id);
    }
  };
  
  // Filter products based on search query
  const getFilteredProducts = () => {
    // First, deduplicate products based on ID
    const uniqueProducts = products.reduce((acc: Product[], product: Product) => {
      if (!acc.find(p => p.id.toString() === product.id.toString())) {
        acc.push(product);
      }
      return acc;
    }, []);
    
    let filtered = uniqueProducts;
    
    // Apply category filter first (if not All Products)
    if (selectedCategory !== 'All Products') {
      filtered = filtered.filter(product => {
        const productText = [
          product.name || '',
          product.description || '',
          product.description_sale || '',
          product.category || '',
          product.brand || '',
          product.default_code || ''
        ].join(' ').toLowerCase();
        
        const categoryName = selectedCategory.toLowerCase();
        
        // Enhanced smart category matching based on your API data
        if (categoryName === 'cat') {
          // EXCLUDE dog products first (override incorrect API category)
          if (productText.includes('dog') || 
              productText.includes('pedigree') ||
              productText.includes('df-')) {
            return false; // This is definitely a dog product
          }
          
          return productText.includes('cat') || 
                 productText.includes('kucing') ||  // Indonesian for cat
                 productText.includes('persian') ||  // Cat breed
                 productText.includes('chester') ||  // Cat food brand
                 productText.includes('maxi cat') ||
                 (productText.includes('tuna') && !productText.includes('dog')) || // Tuna is typically cat food
                 productText.includes('cf-'); // Cat food code from your data
        }
        
        if (categoryName === 'dog') {
          return productText.includes('dog') ||
                 productText.includes('anjing') ||  // Indonesian for dog  
                 productText.includes('pedigree') || // Dog food brand
                 productText.includes('df-'); // Dog food code from your data
        }
        
        if (categoryName === 'bird') {
          return productText.includes('bird') ||
                 productText.includes('burung') ||  // Indonesian for bird
                 productText.includes('canary') ||
                 productText.includes('parrot') ||
                 productText.includes('bf-'); // Bird food code
        }
        
        if (categoryName === 'fish') {
          return productText.includes('fish') ||
                 productText.includes('ikan') ||    // Indonesian for fish
                 productText.includes('aquarium') ||
                 productText.includes('goldfish') ||
                 productText.includes('ff-'); // Fish food code
        }
        
        if (categoryName === 'reptile') {
          return productText.includes('reptile') ||
                 productText.includes('gecko') ||
                 productText.includes('turtle') ||
                 productText.includes('snake') ||
                 productText.includes('rf-'); // Reptile food code
        }
        
        // Fallback to original logic
        return productText.includes(categoryName);
      });
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => {
        // Search in multiple fields
        const searchableText = [
          product.name || '',
          product.description || '',
          product.description_sale || '',
          product.category || '',
          product.default_code || '',
          product.barcode || ''
        ].join(' ').toLowerCase();
        
        return searchableText.includes(query);
      });
    }
    
    return filtered;
  };
  
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  
  const bannerScrollRef = React.useRef<ScrollView>(null);

  const handleAddToCart = (product: Product) => {
    const added = addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      discount: product.discount,
      maxQuantity: product.qty_available,
    });
    
    if (!added && product.qty_available) {
      // Show alert when max stock reached
      Alert.alert(
        'Stock Limit Reached',
        `You can only add ${product.qty_available} of this item to cart.`,
        [{ text: 'OK' }]
      );
    } else {
    }
  };
  
  const banners = [
    {
      id: '1',
      image: require('../../../assets/banner.png'),
    },
  ];
  
  // Auto-scroll carousel
  React.useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (currentBannerIndex + 1) % banners.length;
      setCurrentBannerIndex(nextIndex);
      bannerScrollRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    }, 3000); // Change slide every 3 seconds
    
    return () => clearInterval(timer);
  }, [currentBannerIndex]);

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id.toString() })}
    >
      {item.discount && item.discount > 0 ? (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{item.discount}%</Text>
        </View>
      ) : null}
      <Image source={item.image} style={styles.productImage} resizeMode="cover" />
      
      {/* Stock indicator */}
      {item.qty_available !== undefined && (
        <View style={[styles.stockBadge, item.qty_available > 0 ? styles.inStockBadge : styles.outOfStockBadge]}>
          <Text style={styles.stockBadgeText}>
            {item.qty_available > 0 ? `Stok: ${item.qty_available}` : 'Habis'}
          </Text>
        </View>
      )}
      
      {item.isRecommended ? (
        <View style={styles.recommendedBadge}>
          <MaterialIcons name="local-fire-department" size={12} color={Colors.text.white} />
          <Text style={styles.recommendedText}>Rekomendasi</Text>
        </View>
      ) : null}
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name || ''}
        </Text>
        <View style={styles.ratingContainer}>
          <MaterialIcons name="star" size={14} color="#FFC107" />
          <Text style={styles.ratingText}>{item.rating || 0}</Text>
          <Text style={styles.soldText}> · {item.sold || 0} Sold</Text>
        </View>
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <MaterialIcons name="local-shipping" size={14} color={Colors.warning.main} />
            <Text style={styles.currentPrice}>Rp{(item.price || 0).toLocaleString('id-ID')}</Text>
            {item.originalPrice && item.originalPrice > item.price ? (
              <Text style={styles.originalPrice}>Rp{item.originalPrice.toLocaleString('id-ID')}</Text>
            ) : null}
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.addButton, 
          getItemQuantity(item.id) > 0 ? styles.addButtonActive : null,
          item.qty_available === 0 ? styles.addButtonDisabled : null,
          !canAddMore(item.id, item.qty_available) ? styles.addButtonMaxed : null
        ]}
        onPress={() => (item.qty_available > 0 && canAddMore(item.id, item.qty_available)) ? handleAddToCart(item) : null}
        disabled={item.qty_available === 0 || !canAddMore(item.id, item.qty_available)}
      >
        <Text style={[styles.addButtonText, item.qty_available === 0 ? styles.addButtonTextDisabled : null]}>
          {item.qty_available === 0 ? '✕' : getItemQuantity(item.id) > 0 ? getItemQuantity(item.id).toString() : '+'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Blue Header Section with Wave */}
      <View style={styles.blueHeaderSection}>
        <SafeAreaView edges={['top']}>
          {/* Search Bar and Icons */}
          <View style={styles.header}>
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Butuh apa hari ini?"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="clear" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <View style={styles.iconWrapper}>
                <MaterialIcons name="shopping-cart" size={22} color="#1976D2" />
                {totalItems > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {totalItems > 99 ? '99+' : totalItems}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('NotificationScreen')}
            >
              <View style={styles.iconWrapper}>
                <MaterialIcons name="notifications" size={22} color="#1976D2" />
                <View style={styles.notificationDot} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Mascot and Welcome Text */}
          <View style={styles.welcomeSection}>
            <Image
              source={require('../../../assets/home/hello.png')}
              style={styles.mascot}
              resizeMode="contain"
            />
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeText}>Waktunya Happy</Text>
              <Text style={styles.welcomeText}>Shopping untuk Paw-mu!</Text>
            </View>

            {/* Paw Print Decorations - White - More scattered throughout */}
            <View style={styles.pawPrint1}>
              <MaterialIcons name="pets" size={24} color="rgba(255, 255, 255, 0.3)" />
            </View>
            <View style={styles.pawPrint2}>
              <MaterialIcons name="pets" size={18} color="rgba(255, 255, 255, 0.25)" />
            </View>
            <View style={styles.pawPrint3}>
              <MaterialIcons name="pets" size={20} color="rgba(255, 255, 255, 0.2)" />
            </View>
            <View style={styles.pawPrint4}>
              <MaterialIcons name="pets" size={16} color="rgba(255, 255, 255, 0.25)" />
            </View>
            <View style={styles.pawPrint5}>
              <MaterialIcons name="pets" size={22} color="rgba(255, 255, 255, 0.2)" />
            </View>
          </View>

          {/* Additional Paw Prints scattered in header area */}
          <View style={styles.pawPrintHeader1}>
            <MaterialIcons name="pets" size={20} color="rgba(255, 255, 255, 0.2)" />
          </View>
          <View style={styles.pawPrintHeader2}>
            <MaterialIcons name="pets" size={16} color="rgba(255, 255, 255, 0.15)" />
          </View>
          <View style={styles.pawPrintHeader3}>
            <MaterialIcons name="pets" size={18} color="rgba(255, 255, 255, 0.25)" />
          </View>
        </SafeAreaView>

        {/* Bottom Wave Effect - Realistic SVG Wave */}
        <View style={styles.waveContainer}>
          <Svg
            height="80"
            width={width}
            viewBox={`0 0 ${width} 80`}
            style={styles.waveSvg}
          >
            <Path
              d={`M0,40 C${width * 0.15},20 ${width * 0.35},20 ${width * 0.5},40 C${width * 0.65},60 ${width * 0.85},60 ${width},40 L${width},80 L0,80 Z`}
              fill="#FFFFFF"
            />
          </Svg>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={productsLoading}
            onRefresh={refetchProducts}
            colors={[Colors.primary.main]}
          />
        }>

        {/* Service Icons Grid - in White Section */}
        <View style={styles.servicesSection}>
          <View style={styles.servicesGrid}>
            {/* First Row */}
            <TouchableOpacity style={styles.serviceItem} onPress={() => {
              // Navigate to Home tab which contains shopping
              navigation.navigate('HomeScreen');
              Alert.alert('Belanja', 'Silakan lihat produk di bawah untuk berbelanja.');
            }}>
              <View style={styles.serviceIconContainer}>
                <Image 
                  source={require('../../../assets/icons/Property 1=mart.png')} 
                  style={styles.serviceIcon}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.serviceItem} onPress={() => {
              // Navigate to Services tab, then to PetDoctor selection screen
              navigation.getParent()?.navigate('Services', {
                screen: 'PetDoctor',
              });
            }}>
              <View style={styles.serviceIconContainer}>
                <Image 
                  source={require('../../../assets/icons/Property 1=doctor.png')} 
                  style={styles.serviceIcon}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.serviceItem} onPress={() => {
              // Navigate to Services tab, then to Grooming selection screen
              navigation.getParent()?.navigate('Services', {
                screen: 'Grooming',
              });
            }}>
              <View style={styles.serviceIconContainer}>
                <Image 
                  source={require('../../../assets/icons/Property 1=grooming.png')} 
                  style={styles.serviceIcon}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.serviceItem} onPress={() => {
              Alert.alert('Forum', 'Fitur Forum akan segera hadir. Stay tuned!');
            }}>
              <View style={styles.serviceIconContainer}>
                <Image 
                  source={require('../../../assets/icons/Property 1=forum.png')} 
                  style={styles.serviceIcon}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.servicesGrid}>
            {/* Second Row */}
            <TouchableOpacity style={styles.serviceItem} onPress={() => {
              Alert.alert('Hotel', 'Fitur Pet Hotel akan segera hadir. Stay tuned!');
            }}>
              <View style={styles.serviceIconContainer}>
                <Image 
                  source={require('../../../assets/icons/Property 1=hotel.png')} 
                  style={styles.serviceIcon}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.serviceItem} onPress={() => {
              Alert.alert('Love', 'Fitur Pet Matchmaking akan segera hadir. Stay tuned!');
            }}>
              <View style={styles.serviceIconContainer}>
                <Image 
                  source={require('../../../assets/icons/Property 1=love.png')} 
                  style={styles.serviceIcon}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.serviceItem} onPress={() => {
              Alert.alert('Pengasuh', 'Fitur Pet Sitter akan segera hadir. Stay tuned!');
            }}>
              <View style={styles.serviceIconContainer}>
                <Image 
                  source={require('../../../assets/icons/Property 1=Pelatih.png')} 
                  style={styles.serviceIcon}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.serviceItem} onPress={() => {
              // Navigate to Services tab
              navigation.getParent()?.navigate('Services');
            }}>
              <View style={styles.serviceIconContainer}>
                <Image 
                  source={require('../../../assets/icons/Property 1=Semua.png')} 
                  style={styles.serviceIcon}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Promo Banner */}
        <View style={styles.promoBannerSection}>
          <View style={styles.promoBanner}>
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>Promo Tahun Baru</Text>
              <Text style={styles.promoDiscount}>Diskon 40%</Text>
              <TouchableOpacity style={styles.promoButton}>
                <Text style={styles.promoButtonText}>Beli Sekarang</Text>
              </TouchableOpacity>
            </View>
            <Image
              source={require('../../../assets/home/dog.png')}
              style={styles.promoImage}
              resizeMode="contain"
            />
            {/* Paw decorations - White */}
            <View style={styles.promoPaw1}>
              <MaterialIcons name="pets" size={24} color="rgba(255, 255, 255, 0.2)" />
            </View>
            <View style={styles.promoPaw2}>
              <MaterialIcons name="pets" size={18} color="rgba(255, 255, 255, 0.15)" />
            </View>
          </View>
        </View>

        {/* Best Selling Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Best Selling Products</Text>
            {searchQuery.trim() && (
              <Text style={styles.searchResultsCount}>
                {getFilteredProducts().length} results
              </Text>
            )}
          </View>
          
          {/* Category Tabs with Icons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryTabs}
          >
            {categories.map((category, index) => (
              <TouchableOpacity
                key={`category-${index}-${category.name}`}
                style={[
                  styles.categoryTab,
                  selectedCategory === category.name && styles.categoryTabActive,
                ]}
                onPress={() => handleCategorySelect(category)}
              >
                <Image 
                  source={category.icon} 
                  style={[
                    styles.categoryIcon,
                    selectedCategory === category.name && styles.categoryIconActive
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Products Grid */}
          {productsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary.main} />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : productsError ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={48} color={Colors.error.main} />
              <Text style={styles.errorText}>Failed to load products</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => refetchProducts()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : getFilteredProducts().length === 0 ? (
            <View style={styles.emptySearchContainer}>
              <Image 
                source={require('../../../assets/chart maskot.png')} 
                style={styles.emptySearchImage}
                resizeMode="contain"
              />
              <Text style={styles.emptySearchTitle}>Maaf ya!</Text>
              <Text style={styles.emptySearchSubtitle}>
                Produk yang anda cari tidak ditemukan
              </Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {getFilteredProducts().map((product, index) => (
                <View key={`product-${product.id}-${index}`} style={styles.productWrapper}>
                  {renderProduct({ item: product })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Blue Header Section
  blueHeaderSection: {
    backgroundColor: '#1C49C2',
    paddingBottom: 0,
    position: 'relative',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text.primary,
    paddingVertical: 0,
    fontFamily: Typography.fontFamily.regular,
  },
  iconButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
  },
  iconWrapper: {
    position: 'relative',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Typography.fontFamily.semibold,
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },

  // Welcome Section
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 70,
    position: 'relative',
  },
  mascot: {
    width: 90,
    height: 90,
    marginRight: 12,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.semibold,
    color: '#FFFFFF',
    lineHeight: 22,
  },

  // Paw Print Decorations - White Icons - More scattered
  pawPrint1: {
    position: 'absolute',
    top: 10,
    right: 30,
  },
  pawPrint2: {
    position: 'absolute',
    top: 50,
    right: 60,
  },
  pawPrint3: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  pawPrint4: {
    position: 'absolute',
    top: 30,
    right: 100,
  },
  pawPrint5: {
    position: 'absolute',
    bottom: 50,
    right: 80,
  },
  // Additional header paw prints
  pawPrintHeader1: {
    position: 'absolute',
    top: 80,
    left: 30,
  },
  pawPrintHeader2: {
    position: 'absolute',
    top: 60,
    left: 120,
  },
  pawPrintHeader3: {
    position: 'absolute',
    top: 100,
    right: 150,
  },

  // Bottom Wave Effect - Realistic SVG Wave
  waveContainer: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 80,
  },
  waveSvg: {
    position: 'absolute',
    bottom: 0,
  },
  // Services Section
  servicesSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  serviceItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  serviceIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 72,
    height: 72,
  },

  // Promo Banner
  promoBannerSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  promoBanner: {
    backgroundColor: '#1976D2',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  promoContent: {
    flex: 1,
    zIndex: 2,
  },
  promoTitle: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.semibold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  promoDiscount: {
    fontSize: 26,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  promoButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.semibold,
    color: '#1976D2',
  },
  promoImage: {
    width: 140,
    height: 140,
    position: 'absolute',
    right: 0,
    bottom: -15,
  },
  promoPaw1: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  promoPaw2: {
    position: 'absolute',
    bottom: 60,
    right: 120,
  },
  // Product Section
  section: {
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  searchResultsCount: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  categoryTabs: {
    marginVertical: Spacing.md,
  },
  categoryTab: {
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTabActive: {
    // No additional styling - the icon itself handles the active state
  },
  categoryIcon: {
    height: 36,
    width: 85,
  },
  categoryIconActive: {
    // No change needed - the icon image itself shows the active state
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  productWrapper: {
    width: '50%',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.base,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    height: 280,
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F8F9FA',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#E53935',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 2,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Typography.fontFamily.semibold,
  },
  recommendedBadge: {
    position: 'absolute',
    top: 135,
    left: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    marginLeft: 2,
  },
  productInfo: {
    padding: 12,
    paddingBottom: 50,
  },
  productName: {
    fontSize: 13,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 4,
    lineHeight: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginLeft: 2,
  },
  soldText: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  priceContainer: {
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  currentPrice: {
    fontSize: 14,
    color: '#1976D2',
    fontFamily: Typography.fontFamily.semibold,
    marginLeft: 4,
  },
  originalPrice: {
    fontSize: 11,
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
    marginLeft: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
  },
  addButtonActive: {
    backgroundColor: Colors.success.main,
  },
  addButtonDisabled: {
    backgroundColor: Colors.text.tertiary,
    opacity: 0.5,
  },
  addButtonTextDisabled: {
    color: Colors.text.white,
  },
  addButtonMaxed: {
    backgroundColor: Colors.warning.main,
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    zIndex: 2,
  },
  inStockBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  outOfStockBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
  },
  stockBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.white,
    fontFamily: Typography.fontFamily.semibold,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  errorText: {
    marginTop: 10,
    fontSize: Typography.fontSize.md,
    color: Colors.error.main,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptySearchImage: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  emptyActionButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  emptyActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    alignItems: 'center',
  },
  emptyActionButtonPrimary: {
    backgroundColor: '#1C49C2',
    borderColor: '#1C49C2',
  },
  emptyActionButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
  },
  emptyActionButtonTextPrimary: {
    color: Colors.text.white,
  },
  emptySearchTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptySearchSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});