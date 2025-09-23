import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { useCart } from '../../contexts/CartContext';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - Spacing.base * 3) / 2;

interface Product {
  id: number;
  name: string;
  list_price: number;
  standard_price?: number;
  qty_available: number;
  image_128?: string;
  categ_id?: [number, string];
}

interface VirtualProductListProps {
  products: Product[];
  onProductPress: (product: Product) => void;
  onEndReached?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
  ListHeaderComponent?: React.ComponentType<any>;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const ProductItem = React.memo(({ 
  product, 
  onPress, 
  onAddToCart 
}: { 
  product: Product; 
  onPress: () => void;
  onAddToCart: () => void;
}) => {
  const discount = product.standard_price && product.standard_price > product.list_price
    ? Math.round(((product.standard_price - product.list_price) / product.standard_price) * 100)
    : 0;

  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress}>
      {discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discount}%</Text>
        </View>
      )}
      
      {product.image_128 ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${product.image_128}` }}
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.productImage, styles.imagePlaceholder]}>
          <MaterialIcons name="image" size={40} color={Colors.text.tertiary} />
        </View>
      )}
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.productPrice}>
              Rp{product.list_price.toLocaleString('id-ID')}
            </Text>
            {product.standard_price && product.standard_price > product.list_price && (
              <Text style={styles.originalPrice}>
                Rp{product.standard_price.toLocaleString('id-ID')}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.stockInfo}>
          <MaterialIcons 
            name="inventory" 
            size={14} 
            color={product.qty_available > 10 ? Colors.success.main : Colors.warning.main} 
          />
          <Text style={[
            styles.stockText,
            { color: product.qty_available > 10 ? Colors.success.main : Colors.warning.main }
          ]}>
            {product.qty_available > 10 ? 'Stok Tersedia' : `Sisa ${product.qty_available}`}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={onAddToCart}>
          <MaterialIcons name="add" size={20} color={Colors.text.white} />
          <Text style={styles.addButtonText}>Tambah</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

export default function VirtualProductList({
  products,
  onProductPress,
  onEndReached,
  isLoading,
  hasMore,
  ListHeaderComponent,
  refreshing,
  onRefresh,
}: VirtualProductListProps) {
  const { addItem } = useCart();

  const handleAddToCart = useCallback((product: Product) => {
    addItem({
      id: product.id.toString(),
      name: product.name,
      price: product.list_price,
      originalPrice: product.standard_price || product.list_price,
      image: product.image_128 
        ? { uri: `data:image/jpeg;base64,${product.image_128}` }
        : require('../../../assets/product-placeholder.jpg'),
      discount: product.standard_price && product.standard_price > product.list_price
        ? Math.round(((product.standard_price - product.list_price) / product.standard_price) * 100)
        : 0,
      maxQuantity: product.qty_available,
    });
  }, [addItem]);

  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <ProductItem
      product={item}
      onPress={() => onProductPress(item)}
      onAddToCart={() => handleAddToCart(item)}
    />
  ), [onProductPress, handleAddToCart]);

  const keyExtractor = useCallback((item: Product) => item.id.toString(), []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 250, // Approximate height of each item
    offset: 250 * index,
    index,
  }), []);

  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.footer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary.main} />
        ) : (
          <TouchableOpacity style={styles.loadMoreButton} onPress={onEndReached}>
            <Text style={styles.loadMoreText}>Muat Lebih Banyak</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const optimizedProducts = useMemo(() => products, [products]);

  return (
    <FlatList
      data={optimizedProducts}
      renderItem={renderProduct}
      keyExtractor={keyExtractor}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={renderFooter}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshing={refreshing}
      onRefresh={onRefresh}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={6}
      windowSize={10}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  productCard: {
    width: ITEM_WIDTH,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  discountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.error.main,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    zIndex: 1,
  },
  discountText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  productImage: {
    width: '100%',
    height: ITEM_WIDTH,
    backgroundColor: Colors.background.secondary,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: Spacing.sm,
  },
  productName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    height: 36,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  productPrice: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  originalPrice: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stockText: {
    fontSize: Typography.fontSize.xs,
    marginLeft: Spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
  },
  addButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    marginLeft: Spacing.xs,
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  loadMoreButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
  },
  loadMoreText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
});