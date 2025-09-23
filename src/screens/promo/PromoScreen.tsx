import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { PromoStackParamList } from '../../navigation/types';
import { useCart } from '../../contexts/CartContext';
import { useProducts } from '../../hooks/useProducts';
import { useDebounce } from '../../hooks/useDebounce';
import { ActivityIndicator, RefreshControl } from 'react-native';
import { Product as OdooProduct } from '../../services/product/productService';
import odooComService from '../../services/odoocom/odooComService';

type NavigationProp = StackNavigationProp<PromoStackParamList, 'PromoScreen'>;

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  rating: number;
  sold: number;
  image: any;
  discount: number;
  isRecommended?: boolean;
  description?: string;
  description_sale?: string;
  category?: string;
  brand?: string;
  default_code?: string;
  barcode?: string;
  qty_available?: number;
}

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
  },
  {
    id: '5',
    name: 'Bolt Tuna Cat Food (500gr)',
    price: 25000,
    originalPrice: 30000,
    rating: 4.5,
    sold: 892,
    image: require('../../../assets/product-placeholder.jpg'),
    discount: 17,
    isRecommended: false,
  },
  {
    id: '6',
    name: 'Meo Persian Adult (7kg)',
    price: 180000,
    originalPrice: 200000,
    rating: 4.9,
    sold: 123,
    image: require('../../../assets/product-placeholder.jpg'),
    discount: 10,
    isRecommended: true,
  },
  {
    id: '7',
    name: 'Cat Treats Salmon (100gr)',
    price: 15000,
    originalPrice: 18000,
    rating: 4.4,
    sold: 345,
    image: require('../../../assets/product-placeholder.jpg'),
    discount: 17,
    isRecommended: false,
  },
  {
    id: '8',
    name: 'Dog Biscuits Chicken (200gr)',
    price: 35000,
    originalPrice: 40000,
    rating: 4.6,
    sold: 678,
    image: require('../../../assets/product-placeholder.jpg'),
    discount: 12,
    isRecommended: false,
  },
];

// Optimized Product Image Component with caching
const OptimizedProductImage = memo(({ 
  uri, 
  style, 
  productId,
  fallbackImage
}: { 
  uri: string | any; 
  style: any; 
  productId: string;
  fallbackImage?: any;
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
          const cachedUri = await AsyncStorage.getItem(`img_${productId}`);
          if (cachedUri && cachedUri !== 'undefined') {
            setImageSource({ uri: cachedUri });
            setIsLoading(false);
            return;
          }
          
          // Load and cache new image
          setImageSource({ uri });
          await AsyncStorage.setItem(`img_${productId}`, uri);
        } else {
          // Use fallback image
          setImageSource(fallbackImage || require('../../../assets/product-placeholder.jpg'));
        }
      } catch (error) {
        setImageSource(fallbackImage || require('../../../assets/product-placeholder.jpg'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadImage();
  }, [uri, productId, fallbackImage]);
  
  if (isLoading) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color={Colors.primary.main} />
      </View>
    );
  }
  
  return <Image source={imageSource} style={style} resizeMode="cover" />;
});

export default function PromoScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { addItem, totalItems, getItemQuantity, canAddMore } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [actualSearchQuery, setActualSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('Terkait');
  const [priceSortOrder, setPriceSortOrder] = useState<'asc' | 'desc'>('asc'); // asc = low to high, desc = high to low
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  
  // Filter states
  const [selectedPetTypes, setSelectedPetTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [selectedDiscount, setSelectedDiscount] = useState<string>('');
  
  // Pet Type options with Indonesian labels
  const petTypes = [
    { name: 'Anjing', id: 'dog', label: 'Anjing' },
    { name: 'Kucing', id: 'cat', label: 'Kucing' },
    { name: 'Burung', id: 'bird', label: 'Burung' },
    { name: 'Ikan', id: 'fish', label: 'Ikan' },
    { name: 'Reptile', id: 'reptile', label: 'Reptile' },
  ];

  const sortOptions = ['Terkait', 'Terlaris', 'Harga'];
  
  // Infinite scroll pagination for large catalogs
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['promo-products', selectedSort, actualSearchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const domain: any[] = [
          ['sale_ok', '=', true],
          ['qty_available', '>', 0],
        ];
        
        // Add search filter if query exists
        if (actualSearchQuery) {
          domain.push(['name', 'ilike', actualSearchQuery]);
        }
        
        // Fetch products with discounts
        const products = await odooComService.searchRead(
          'product.product',
          domain,
          [
            'id', 'name', 'list_price', 'standard_price', 'qty_available',
            'categ_id', 'image_128', 'default_code', 'description_sale',
            'barcode'
          ],
          {
            limit: 20,
            offset: pageParam,
            order: selectedSort === 'Harga' ? 'list_price ASC' : 
                   selectedSort === 'Terlaris' ? 'qty_available DESC' : 'name ASC',
          }
        );
        
        // Transform to match our Product interface
        return products.map((p: any) => {
          // For promo page, simulate discounts for demo purposes
          // In real scenario, you would have a separate field for promotional prices
          const hasPromo = Math.random() > 0.3; // 70% of products have promo
          const discountPercent = hasPromo ? Math.floor(Math.random() * 40) + 5 : 0; // 5-45% discount
          const originalPrice = p.list_price || 0;
          const discountedPrice = hasPromo ? 
            Math.round(originalPrice * (1 - discountPercent / 100)) : 
            originalPrice;
          
          return {
            id: p.id.toString(),
            name: p.name || '',
            price: discountedPrice,
            originalPrice: originalPrice,
            rating: 4.5 + Math.random() * 0.5,
            sold: Math.floor(Math.random() * 1000),
            image: p.image_128 ? `data:image/jpeg;base64,${p.image_128}` : null,
            discount: discountPercent,
            isRecommended: Math.random() > 0.7,
            description_sale: p.description_sale,
            category: p.categ_id?.[1] || 'General',
            brand: '',
            default_code: p.default_code,
            barcode: p.barcode,
            qty_available: p.qty_available || 0,
          };
        });
      } catch (error) {
        // Error fetching Odoo products
        // Return empty array to trigger fallback products
        return [];
      }
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < 20) return undefined;
      return pages.length * 20;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
  
  // Flatten pages and filter for products with discounts
  const odooProducts = useMemo(() => {
    const allProducts = data?.pages.flatMap(page => page) || [];
    // Filter products that have discounts for promo page
    return allProducts.filter(p => p.discount && p.discount > 0);
  }, [data]);
  
  // Alias for compatibility
  const productsWithDiscounts = odooProducts;
  
  // Use Odoo products if available, otherwise use fallback
  const products = productsWithDiscounts.length > 0 ? productsWithDiscounts : fallbackProducts;
  
  // Extract dynamic categories and brands from products
  const getDynamicFilters = () => {
    const categoriesSet = new Set<string>();
    const brandsSet = new Set<string>();
    const discountSet = new Set<number>();
    let minPrice = Infinity;
    let maxPrice = 0;
    
    products.forEach(product => {
      // Extract categories
      if (product.category) {
        categoriesSet.add(product.category);
      }
      
      // Extract brands - use the brand field if available, otherwise extract from name
      if (product.brand) {
        brandsSet.add(product.brand);
      } else {
        // Fallback: Extract brands from product name
        const productName = product.name || '';
        const knownBrands = [
          'Royal Canin', 'Whiskas', 'Pedigree', 'Pro Plan', 
          'Bolt', 'Me-O', 'Meo', 'Friskies', 'Purina',
          'Fancy Feast', 'Sheba', 'Kit Cat', 'Felibite'
        ];
        
        const lowerName = productName.toLowerCase();
        for (const brand of knownBrands) {
          if (lowerName.includes(brand.toLowerCase())) {
            brandsSet.add(brand);
            break; // Only add the first matching brand
          }
        }
      }
      
      // Track price range
      if (product.price) {
        minPrice = Math.min(minPrice, product.price);
        maxPrice = Math.max(maxPrice, product.price);
      }
      
      // Track discount percentages
      if (product.discount) {
        discountSet.add(product.discount);
      }
    });
    
    // Generate discount options based on actual discounts
    const discounts = Array.from(discountSet).sort((a, b) => a - b);
    const discountRanges: string[] = [];
    
    if (discounts.length > 0) {
      // Create smart ranges based on actual data
      if (discounts.some(d => d >= 5 && d < 10)) discountRanges.push('5-10%');
      if (discounts.some(d => d >= 10 && d < 20)) discountRanges.push('10-20%');
      if (discounts.some(d => d >= 20 && d < 30)) discountRanges.push('20-30%');
      if (discounts.some(d => d >= 30 && d < 50)) discountRanges.push('30-50%');
      if (discounts.some(d => d >= 50)) discountRanges.push('50% ke atas');
      
      // If no ranges matched, create basic options
      if (discountRanges.length === 0) {
        const ranges = [10, 20, 30, 40, 50];
        ranges.forEach(range => {
          if (discounts.some(d => d >= range)) {
            discountRanges.push(range === 50 ? '50% ke atas' : `${range}%+`);
          }
        });
      }
    }
    
    return {
      categories: Array.from(categoriesSet).sort(),
      brands: Array.from(brandsSet).sort(),
      priceMin: minPrice === Infinity ? 0 : minPrice,
      priceMax: maxPrice || 1000000,
      discountOptions: discountRanges.length > 0 ? discountRanges : ['10%', '20%', '30%', '40%', '50% ke atas'],
    };
  };
  
  const dynamicFilters = React.useMemo(() => getDynamicFilters(), [products]);
  const categories = dynamicFilters.categories.length > 0 ? dynamicFilters.categories : ['Makanan Kucing', 'Makanan Anjing', 'Makanan Burung', 'Snack & Treats', 'Vitamin'];
  const brands = dynamicFilters.brands.length > 0 ? dynamicFilters.brands : ['Royal Canin', 'Whiskas', 'Pedigree', 'Pro Plan', 'Bolt', 'Me-O'];
  const discountOptions = dynamicFilters.discountOptions;

  // Recent searches management
  const loadRecentSearches = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('recent_searches_promo');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading recent searches:', error);
    }
  }, []);

  const saveRecentSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) return;

    try {
      const trimmedQuery = query.trim();

      setRecentSearches(prev => {
        // Remove the query if it already exists to avoid duplicates
        const filtered = prev.filter(item => item.toLowerCase() !== trimmedQuery.toLowerCase());
        const updatedSearches = [trimmedQuery, ...filtered];

        // Keep only the last 6 searches
        const finalSearches = updatedSearches.slice(0, 6);

        // Save to AsyncStorage
        AsyncStorage.setItem('recent_searches_promo', JSON.stringify(finalSearches));

        return finalSearches;
      });
    } catch (error) {
      console.log('Error saving recent search:', error);
    }
  }, []);

  const removeRecentSearch = useCallback(async (query: string) => {
    try {
      setRecentSearches(prev => {
        const updated = prev.filter(item => item !== query);
        AsyncStorage.setItem('recent_searches_promo', JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.log('Error removing recent search:', error);
    }
  }, []);

  const clearAllRecentSearches = useCallback(async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem('recent_searches_promo');
    } catch (error) {
      console.log('Error clearing recent searches:', error);
    }
  }, []);
  
  // Load recent searches on component mount
  React.useEffect(() => {
    loadRecentSearches();
  }, [loadRecentSearches]);

  // Handle search input focus/blur for showing recent searches
  const handleSearchFocus = useCallback(() => {
    if (recentSearches.length > 0) {
      setShowRecentSearches(true);
    }
  }, [recentSearches.length]);

  const handleSearchBlur = useCallback(() => {
    // Delay hiding to allow clicks on recent search items
    setTimeout(() => setShowRecentSearches(false), 200);
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    // Hide recent searches when user starts typing
    if (text.trim()) {
      setShowRecentSearches(false);
    } else {
      setShowRecentSearches(prev => recentSearches.length > 0);
    }
  }, [recentSearches.length]);

  // Handle search submission (when user presses enter)
  const handleSearchSubmit = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length >= 2) {
      setActualSearchQuery(trimmedQuery);
      saveRecentSearch(trimmedQuery);
      setShowRecentSearches(false);
    }
  }, [searchQuery, saveRecentSearch]);

  // Update price range based on actual products
  React.useEffect(() => {
    if (dynamicFilters.priceMax > 0) {
      setPriceRange(prev => {
        const newMax = Math.ceil(dynamicFilters.priceMax / 10000) * 10000;
        // Only update if actually changed
        if (prev.max !== newMax) {
          return { min: 0, max: newMax };
        }
        return prev;
      });
    }
  }, [dynamicFilters.priceMax]);

  // Memoized filter and sort products
  const getFilteredProducts = useCallback(() => {
    let filtered = products;
    
    // Don't filter by search query here since it's handled in the query
    // Only apply additional filters
    if (actualSearchQuery.trim() && products === fallbackProducts) {
      const query = actualSearchQuery.toLowerCase();
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
    
    // Apply pet type filter (Smart filtering like HomeScreen)
    if (selectedPetTypes.length > 0) {
      filtered = filtered.filter(product => {
        const productText = [
          product.name || '',
          product.description || '',
          product.description_sale || '',
          product.category || '',
          product.brand || '',
          product.default_code || ''
        ].join(' ').toLowerCase();
        
        return selectedPetTypes.some(petType => {
          const petTypeId = petTypes.find(pt => pt.name === petType)?.id;
          
          if (petTypeId === 'cat' || petType === 'Kucing') {
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
                   productText.includes('cf-'); // Cat food code
          }
          
          if (petTypeId === 'dog' || petType === 'Anjing') {
            return productText.includes('dog') ||
                   productText.includes('anjing') ||  // Indonesian for dog  
                   productText.includes('pedigree') || // Dog food brand
                   productText.includes('df-'); // Dog food code
          }
          
          if (petTypeId === 'bird' || petType === 'Burung') {
            return productText.includes('bird') ||
                   productText.includes('burung') ||  // Indonesian for bird
                   productText.includes('canary') ||
                   productText.includes('parrot') ||
                   productText.includes('bf-'); // Bird food code
          }
          
          if (petTypeId === 'fish' || petType === 'Ikan') {
            return productText.includes('fish') ||
                   productText.includes('ikan') ||    // Indonesian for fish
                   productText.includes('aquarium') ||
                   productText.includes('goldfish') ||
                   productText.includes('ff-'); // Fish food code
          }
          
          if (petTypeId === 'reptile' || petType === 'Reptile') {
            return productText.includes('reptile') ||
                   productText.includes('gecko') ||
                   productText.includes('turtle') ||
                   productText.includes('snake') ||
                   productText.includes('rf-'); // Reptile food code
          }
          
          // Fallback to original logic
          return productText.includes(petType.toLowerCase());
        });
      });
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => {
        const productCategory = product.category || '';
        return selectedCategories.some(cat => 
          productCategory.toLowerCase().includes(cat.toLowerCase())
        );
      });
    }
    
    // Apply brand filter
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(product => {
        // Check brand field first, then fallback to name
        if (product.brand) {
          return selectedBrands.some(brand => 
            product.brand.toLowerCase() === brand.toLowerCase()
          );
        } else {
          const productName = product.name || '';
          return selectedBrands.some(brand => 
            productName.toLowerCase().includes(brand.toLowerCase())
          );
        }
      });
    }
    
    // Apply price range filter
    filtered = filtered.filter(product => 
      product.price >= priceRange.min && product.price <= priceRange.max
    );
    
    // Apply discount filter
    if (selectedDiscount) {
      filtered = filtered.filter(product => {
        if (!product.discount) return false;
        
        // Handle different discount formats
        if (selectedDiscount === '50% ke atas') {
          return product.discount >= 50;
        } else if (selectedDiscount.includes('-')) {
          // Handle range format like "10-20%"
          const [min, max] = selectedDiscount.replace('%', '').split('-').map(n => parseInt(n));
          return product.discount >= min && product.discount < max;
        } else if (selectedDiscount.includes('+')) {
          // Handle format like "20%+"
          const min = parseInt(selectedDiscount.replace('%+', ''));
          return product.discount >= min;
        } else {
          // Handle simple percentage like "10%"
          const exact = parseInt(selectedDiscount.replace('%', ''));
          return product.discount >= exact;
        }
      });
    }
    
    // Sort products
    switch (selectedSort) {
      case 'Terlaris':
        return [...filtered].sort((a, b) => b.sold - a.sold);
      case 'Harga':
        // Filter out products with invalid prices first
        const validPriceProducts = [...filtered].filter(product => {
          return !isNaN(product.price) && product.price > 0;
        });
        
        return validPriceProducts.sort((a, b) => {
          return priceSortOrder === 'asc' ? a.price - b.price : b.price - a.price;
        });
      default:
        return filtered;
    }
  }, [products, selectedPetTypes, selectedCategories, selectedBrands, priceRange, selectedDiscount, selectedSort, priceSortOrder, actualSearchQuery]);
  
  const resetFilters = () => {
    setSelectedPetTypes([]);
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceRange({ min: 0, max: 1000000 });
    setSelectedDiscount('');
  };
  
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedPetTypes.length > 0) count++;
    if (selectedCategories.length > 0) count++;
    if (selectedBrands.length > 0) count++;
    if (priceRange.min > 0 || priceRange.max < 1000000) count++;
    if (selectedDiscount) count++;
    return count;
  };

  const handleAddToCart = useCallback((product: Product) => {
    const added = addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image ? 
        (typeof product.image === 'string' ? { uri: product.image } : product.image) : 
        require('../../../assets/product-placeholder.jpg'),
      discount: product.discount,
      maxQuantity: product.qty_available,
    });
    
    if (!added && product.qty_available) {
      Alert.alert(
        'Stock Limit Reached',
        `You can only add ${product.qty_available} of this item to cart.`,
        [{ text: 'OK' }]
      );
    } else {
      // Added to cart successfully
    }
  }, [addItem, totalItems]);

  // Load more handler for infinite scroll
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  // Optimized product card component - removed memo to ensure cart updates work
  const ProductCard = ({ item }: { item: Product }) => {
    const quantity = getItemQuantity(item.id.toString());
    const canAdd = canAddMore(item.id.toString(), item.qty_available);
    
    return (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      {item.discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>Discount {item.discount}%</Text>
        </View>
      )}
      <OptimizedProductImage 
        uri={item.image} 
        style={styles.productImage} 
        productId={item.id}
        fallbackImage={require('../../../assets/product-placeholder.jpg')}
      />
      
      {/* Stock indicator */}
      {item.qty_available !== undefined && (
        <View style={[styles.stockBadge, item.qty_available > 0 ? styles.inStockBadge : styles.outOfStockBadge]}>
          <Text style={styles.stockBadgeText}>
            {item.qty_available > 0 ? `Stok: ${item.qty_available}` : 'Habis'}
          </Text>
        </View>
      )}
      
      {item.isRecommended && (
        <View style={styles.recommendedBadge}>
          <MaterialIcons name="local-fire-department" size={12} color={Colors.text.white} />
          <Text style={styles.recommendedText}>Rekomendasi</Text>
        </View>
      )}
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.ratingContainer}>
          <MaterialIcons name="star" size={14} color="#FFC107" />
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          <Text style={styles.soldText}> · {item.sold} Sold</Text>
        </View>
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <MaterialIcons name="local-shipping" size={14} color={Colors.warning.main} />
            <Text style={styles.currentPrice}> Rp{item.price.toLocaleString('id-ID')}</Text>
            <Text style={styles.originalPrice}>/Rp{item.originalPrice.toLocaleString('id-ID')}</Text>
          </View>
          <Text style={styles.finalPrice}>Rp{item.price.toLocaleString('id-ID')}</Text>
          <Text style={styles.strikethroughPrice}>/Rp{item.originalPrice.toLocaleString('id-ID')}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.addButton, 
          quantity > 0 ? styles.addButtonActive : null,
          item.qty_available === 0 ? styles.addButtonDisabled : null,
          !canAdd ? styles.addButtonMaxed : null
        ]}
        onPress={() => (item.qty_available > 0 && canAdd) ? handleAddToCart(item) : null}
        disabled={item.qty_available === 0 || !canAdd}
      >
        {item.qty_available === 0 ? (
          <Text style={styles.addButtonText}>✕</Text>
        ) : quantity > 0 ? (
          <Text style={styles.addButtonText}>{quantity}</Text>
        ) : (
          <Text style={styles.addButtonText}>+</Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
    );
  };
  
  // Render product item
  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard item={item} />
  );
  
  // Key extractor for list optimization
  const keyExtractor = useCallback((item: Product) => item.id.toString(), []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari Produk"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            placeholderTextColor={Colors.text.tertiary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setActualSearchQuery('');
              if (recentSearches.length > 0) {
                setShowRecentSearches(true);
              }
            }}>
              <Ionicons name="close-circle" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="cart" size={24} color={Colors.text.white} />
          {totalItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {totalItems > 99 ? '99+' : totalItems}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Results Count */}
      {actualSearchQuery.trim() && (
        <View style={styles.searchResultsContainer}>
          <Text style={styles.searchResultsText}>
            {getFilteredProducts().length} produk ditemukan untuk "{actualSearchQuery}"
          </Text>
        </View>
      )}

      {/* Recent Searches */}
      {showRecentSearches && recentSearches.length > 0 && (
        <View style={styles.recentSearchesContainer}>
          <View style={styles.recentSearchesHeader}>
            <Text style={styles.recentSearchesTitle}>Pencarian Terakhir</Text>
          </View>
          <View style={styles.recentSearchesList}>
            {recentSearches.map((search, index) => (
              <View key={index} style={styles.recentSearchItem}>
                <TouchableOpacity
                  style={styles.recentSearchButton}
                  onPress={() => {
                    setSearchQuery(search);
                    setShowRecentSearches(false);
                  }}
                >
                  <Ionicons name="time-outline" size={16} color={Colors.text.tertiary} />
                  <Text style={styles.recentSearchText}>{search}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeSearchButton}
                  onPress={() => removeRecentSearch(search)}
                >
                  <Ionicons name="close" size={16} color={Colors.text.tertiary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortButton,
                selectedSort === option && styles.sortButtonActive,
              ]}
              onPress={() => {
                if (option === 'Harga' && selectedSort === 'Harga') {
                  // Toggle price sort order if already selected
                  setPriceSortOrder(priceSortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSelectedSort(option);
                  if (option === 'Harga') {
                    setPriceSortOrder('asc'); // Reset to ascending when first selecting
                  }
                }
              }}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  selectedSort === option && styles.sortButtonTextActive,
                ]}
              >
                {option}
                {option === 'Harga' && selectedSort === 'Harga' && (priceSortOrder === 'asc' ? ' ↑' : ' ↓')}
                {option === 'Harga' && selectedSort !== 'Harga' && ' ↕'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <MaterialIcons name="filter-list" size={20} color={Colors.text.secondary} />
          <Text style={styles.filterText}>Filter</Text>
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Products Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Loading promo products...</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredProducts()}
          renderItem={renderProduct}
          keyExtractor={keyExtractor}
          numColumns={2}
          contentContainerStyle={styles.productList}
          columnWrapperStyle={styles.productRow}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isLoading && !isFetchingNextPage}
              onRefresh={refetch}
              colors={[Colors.primary.main]}
            />
          }
          ListEmptyComponent={
            actualSearchQuery.trim() ? (
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
              <View style={styles.emptyContainer}>
                <Image 
                  source={require('../../../assets/chart maskot.png')} 
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <Text style={styles.emptyTitle}>Maaf ya!</Text>
                <Text style={styles.emptyText}>Tidak ada promo saat ini</Text>
              </View>
            )
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.primary.main} />
                <Text style={styles.footerLoaderText}>Loading more products...</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Pet Type Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Pet Type</Text>
                <View style={styles.filterOptions}>
                  {petTypes.map((petType) => {
                    // Count products for this pet type using smart filtering
                    const count = products.filter(p => {
                      const productText = [
                        p.name || '',
                        p.description || '',
                        p.description_sale || '',
                        p.category || '',
                        p.brand || '',
                        p.default_code || ''
                      ].join(' ').toLowerCase();
                      
                      if (petType.id === 'cat') {
                        return productText.includes('cat') || 
                               productText.includes('kucing') ||
                               productText.includes('persian') ||
                               productText.includes('chester') ||
                               productText.includes('maxi cat') ||
                               (productText.includes('tuna') && !productText.includes('dog')) ||
                               productText.includes('cf-');
                      }
                      
                      if (petType.id === 'dog') {
                        return productText.includes('dog') ||
                               productText.includes('anjing') ||
                               productText.includes('pedigree') ||
                               productText.includes('df-');
                      }
                      
                      if (petType.id === 'bird') {
                        return productText.includes('bird') ||
                               productText.includes('burung') ||
                               productText.includes('canary') ||
                               productText.includes('parrot') ||
                               productText.includes('bf-');
                      }
                      
                      if (petType.id === 'fish') {
                        return productText.includes('fish') ||
                               productText.includes('ikan') ||
                               productText.includes('aquarium') ||
                               productText.includes('goldfish') ||
                               productText.includes('ff-');
                      }
                      
                      if (petType.id === 'reptile') {
                        return productText.includes('reptile') ||
                               productText.includes('gecko') ||
                               productText.includes('turtle') ||
                               productText.includes('snake') ||
                               productText.includes('rf-');
                      }
                      
                      return false;
                    }).length;
                    
                    return (
                      <TouchableOpacity
                        key={petType.id}
                        style={[
                          styles.filterChip,
                          selectedPetTypes.includes(petType.name) && styles.filterChipActive
                        ]}
                        onPress={() => {
                          if (selectedPetTypes.includes(petType.name)) {
                            setSelectedPetTypes(selectedPetTypes.filter(t => t !== petType.name));
                          } else {
                            setSelectedPetTypes([...selectedPetTypes, petType.name]);
                          }
                        }}
                      >
                        <Text style={[
                          styles.filterChipText,
                          selectedPetTypes.includes(petType.name) && styles.filterChipTextActive
                        ]}>
                          {petType.label} ({count})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              
              {/* Categories Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Kategori</Text>
                <View style={styles.filterOptions}>
                  {categories.map((category) => {
                    // Count products in this category
                    const count = products.filter(p => p.category === category).length;
                    return (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.filterChip,
                          selectedCategories.includes(category) && styles.filterChipActive
                        ]}
                        onPress={() => {
                          if (selectedCategories.includes(category)) {
                            setSelectedCategories(selectedCategories.filter(c => c !== category));
                          } else {
                            setSelectedCategories([...selectedCategories, category]);
                          }
                        }}
                      >
                        <Text style={[
                          styles.filterChipText,
                          selectedCategories.includes(category) && styles.filterChipTextActive
                        ]}>
                          {category} ({count})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              
              {/* Brands Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Brand</Text>
                <View style={styles.filterOptions}>
                  {brands.map((brand) => {
                    // Count products with this brand
                    const count = products.filter(p => {
                      if (p.brand) {
                        return p.brand.toLowerCase() === brand.toLowerCase();
                      } else {
                        return (p.name || '').toLowerCase().includes(brand.toLowerCase());
                      }
                    }).length;
                    return (
                      <TouchableOpacity
                        key={brand}
                        style={[
                          styles.filterChip,
                          selectedBrands.includes(brand) && styles.filterChipActive
                        ]}
                        onPress={() => {
                          if (selectedBrands.includes(brand)) {
                            setSelectedBrands(selectedBrands.filter(b => b !== brand));
                          } else {
                            setSelectedBrands([...selectedBrands, brand]);
                          }
                        }}
                      >
                        <Text style={[
                          styles.filterChipText,
                          selectedBrands.includes(brand) && styles.filterChipTextActive
                        ]}>
                          {brand} ({count})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              
              {/* Price Range Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Rentang Harga</Text>
                <View style={styles.priceRangeContainer}>
                  <View style={styles.priceInput}>
                    <Text style={styles.priceLabel}>Min</Text>
                    <TextInput
                      style={styles.priceTextInput}
                      placeholder="0"
                      value={priceRange.min > 0 ? priceRange.min.toString() : ''}
                      onChangeText={(text) => {
                        const value = parseInt(text) || 0;
                        setPriceRange({ ...priceRange, min: value });
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                  <Text style={styles.priceSeparator}>-</Text>
                  <View style={styles.priceInput}>
                    <Text style={styles.priceLabel}>Max</Text>
                    <TextInput
                      style={styles.priceTextInput}
                      placeholder={dynamicFilters.priceMax.toString()}
                      value={priceRange.max < dynamicFilters.priceMax ? priceRange.max.toString() : ''}
                      onChangeText={(text) => {
                        const value = parseInt(text) || dynamicFilters.priceMax;
                        setPriceRange({ ...priceRange, max: value });
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
              
              {/* Discount Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Diskon</Text>
                <View style={styles.filterOptions}>
                  {discountOptions.map((discount) => {
                    // Count products in this discount range
                    const count = products.filter(p => {
                      if (!p.discount) return false;
                      
                      if (discount === '50% ke atas') {
                        return p.discount >= 50;
                      } else if (discount.includes('-')) {
                        const [min, max] = discount.replace('%', '').split('-').map(n => parseInt(n));
                        return p.discount >= min && p.discount < max;
                      } else if (discount.includes('+')) {
                        const min = parseInt(discount.replace('%+', ''));
                        return p.discount >= min;
                      } else {
                        const exact = parseInt(discount.replace('%', ''));
                        return p.discount >= exact;
                      }
                    }).length;
                    
                    return (
                      <TouchableOpacity
                        key={discount}
                        style={[
                          styles.filterChip,
                          selectedDiscount === discount && styles.filterChipActive
                        ]}
                        onPress={() => {
                          setSelectedDiscount(selectedDiscount === discount ? '' : discount);
                        }}
                      >
                        <Text style={[
                          styles.filterChipText,
                          selectedDiscount === discount && styles.filterChipTextActive
                        ]}>
                          {discount} ({count})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
            
            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Terapkan ({getFilteredProducts().length})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  cartButton: {
    marginLeft: Spacing.md,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.error.main,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    lineHeight: 12,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sortButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary.main,
    marginRight: Spacing.sm,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary.light,
  },
  sortButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  sortButtonTextActive: {
    color: Colors.text.white,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingHorizontal: Spacing.md,
    position: 'relative',
  },
  filterText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: 5,
    backgroundColor: Colors.error.main,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  productList: {
    padding: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.md,
    width: '48%',
    elevation: 2,
    shadowColor: Colors.shadow.main,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  discountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.error.main,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    zIndex: 2,
  },
  discountText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
  recommendedBadge: {
    position: 'absolute',
    top: 140,
    left: Spacing.sm,
    backgroundColor: '#FF6B35',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  recommendedText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    marginLeft: 2,
  },
  productImage: {
    width: '100%',
    height: 160,
  },
  productInfo: {
    padding: Spacing.sm,
  },
  productName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  ratingText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginLeft: 2,
  },
  soldText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  priceContainer: {
    marginTop: Spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  currentPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.semibold,
  },
  originalPrice: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  finalPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error.main,
    fontFamily: Typography.fontFamily.bold,
  },
  strikethroughPrice: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 3,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptySearchImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
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
  searchResultsContainer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
  },
  searchResultsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
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
  stockText: {
    fontSize: Typography.fontSize.xs,
    marginLeft: 4,
  },
  inStock: {
    color: Colors.success.main,
  },
  outOfStock: {
    color: Colors.error.main,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  filterSection: {
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  filterSectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.dark,
    backgroundColor: Colors.background.primary,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  filterChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  filterChipTextActive: {
    color: Colors.text.white,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInput: {
    flex: 1,
  },
  priceLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  priceTextInput: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  priceSeparator: {
    marginHorizontal: Spacing.md,
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  resetButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary.main,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary.main,
  },
  applyButton: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.main,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  footerLoaderText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  // Recent searches styles
  recentSearchesContainer: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  recentSearchesHeader: {
    marginBottom: Spacing.sm,
  },
  recentSearchesTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  recentSearchesList: {
    gap: Spacing.sm,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  recentSearchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  recentSearchText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  removeSearchButton: {
    padding: Spacing.xs,
  },
});